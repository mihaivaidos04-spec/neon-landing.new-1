import env from "@next/env";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { allowGlobalPulseServerMessage } from "./global-pulse-server-filter.mjs";
import {
  MAX_GLOBAL_PULSE_USERNAME_LEN,
  GLOBAL_PULSE_HISTORY_LIMIT,
} from "./global-pulse-constants.mjs";
import { getPrisma } from "./server-prisma.mjs";
import { vipTierFromUser } from "./src/lib/vip-tier.ts";

env.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

/** Lazy-load TS moderation helpers (requires `node --import tsx` in package.json scripts). */
let moderationBundlePromise;
async function getModerationBundle() {
  if (!moderationBundlePromise) {
    moderationBundlePromise = (async () => {
      const [{ moderateText }, { recordModerationLog }] = await Promise.all([
        import("./src/lib/moderation.ts"),
        import("./src/lib/moderation-log.ts"),
      ]);
      return { moderateText, recordModerationLog };
    })();
  }
  return moderationBundlePromise;
}

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const preferredPort = parseInt(process.env.PORT || "3000", 10);

/**
 * If default port is busy (e.g. old `node server.js` still running), pick the next free one in dev.
 * Set PORT_STRICT=1 to fail instead of auto-bumping.
 */
function probePortFree(p) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => {
      srv.close(() => resolve(true));
    });
    srv.listen(p, "0.0.0.0");
  });
}

async function resolveListenPort() {
  if (!dev || process.env.PORT_STRICT === "1") return preferredPort;
  const max = preferredPort + 25;
  for (let p = preferredPort; p < max; p++) {
    // eslint-disable-next-line no-await-in-loop
    if (await probePortFree(p)) {
      if (p !== preferredPort) {
        console.warn(
          `[dev] Port ${preferredPort} is in use — starting on http://localhost:${p} instead (close the other process or set PORT=${preferredPort}).`
        );
      }
      return p;
    }
  }
  return preferredPort;
}

const port = await resolveListenPort();

// Clear stale Turbopack/Next dev lock (crash or duplicate run leaves it behind)
if (dev) {
  try {
    fs.unlinkSync(path.join(process.cwd(), ".next", "dev", "lock"));
  } catch {
    /* ENOENT or permission — ignore */
  }
}

const app = next({ dev, hostname, port });

/**
 * getRequestHandler() servește automat:
 * - Fișiere statice din .next/static (/_next/static/*)
 * - Fișiere din public/ la rădăcină (ex: /favicon.ico, /og-image.png)
 * - Toate rutele aplicației (pages, API)
 * - Catch-all: rute necunoscute → app/not-found.tsx (redirect la /)
 */
const nextHandler = app.getRequestHandler();

const CORS_ORIGINS = [
  "https://neonchat.live",
  "https://www.neonchat.live",
  "https://neonlive.chat",
  "https://www.neonlive.chat",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

/** Extra origins from env (e.g. staging URL or LAN IP), comma-separated */
const EXTRA_SOCKET_ORIGINS = (process.env.SOCKET_IO_EXTRA_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const productionSocketOrigins = [...CORS_ORIGINS, ...EXTRA_SOCKET_ORIGINS];

app.prepare().then(() => {
  const prisma = getPrisma();

  function chatRowToWire(row) {
    let vipTier = row.vipTier || "free";
    if (vipTier === "free" && row.neonVip === true) vipTier = "gold";
    return {
      id: row.id,
      userId: row.userId,
      userName: row.userName,
      countryCode: row.countryCode,
      message: row.message,
      kind: row.kind === "reaction" ? "reaction" : "text",
      neonVip: row.neonVip === true,
      vipTier,
      pulseChannel: row.pulseChannel || "world",
      ts: row.createdAt.getTime(),
    };
  }

  const httpServer = createServer((req, res) => {
    nextHandler(req, res);
  });
  const io = new Server(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      // Dev: any LAN hostname (192.168.x.x, PC name, etc.) must work for Global Pulse + matching
      origin: dev
        ? true
        : (origin, callback) => {
            if (!origin || productionSocketOrigins.includes(origin)) {
              callback(null, true);
            } else {
              callback(null, false);
            }
          },
      methods: ["GET", "POST"],
    },
  });

  /** Exposed for Stripe webhook → global Whale Pack celebration (see `broadcast-legend-purchase.ts`) */
  globalThis.__neonSocketIo = io;

  /** Global Pulse floating emoji — must match `GLOBAL_PULSE_FLOATING_REACTION_EMOJIS` in src/lib/global-pulse-floating-reactions.ts */
  const FLOATING_REACTION_EMOJI = new Set([
    "❤️",
    "🔥",
    "😂",
    "😍",
    "😮",
    "👏",
    "🎉",
    "✨",
  ]);
  const FLOATING_REACTION_WINDOW_MS = 2500;
  const FLOATING_REACTION_MAX_PER_WINDOW = 14;
  const floatingReactionTimestamps = new Map();

  function allowFloatingReactionBurst(userId) {
    const now = Date.now();
    const arr = floatingReactionTimestamps.get(userId) ?? [];
    const recent = arr.filter((t) => now - t < FLOATING_REACTION_WINDOW_MS);
    if (recent.length >= FLOATING_REACTION_MAX_PER_WINDOW) return false;
    recent.push(now);
    floatingReactionTimestamps.set(userId, recent);
    return true;
  }

  // userId -> socketId mapping for peer signaling
  const userSockets = new Map();

  io.on("connection", (socket) => {
    socket.on("register", async (userId) => {
      if (!userId || typeof userId !== "string") return;
      try {
        const u = await prisma.user.findUnique({
          where: { id: userId },
          select: { bannedUntil: true, tier: true },
        });
        const timedBan = u?.bannedUntil && u.bannedUntil > new Date();
        if (u?.tier === "BANNED" || timedBan) {
          socket.emit("banned", {
            reason: u.tier === "BANNED" ? "Account suspended" : "Temporary ban",
            until: timedBan ? u.bannedUntil.toISOString() : null,
          });
          socket.disconnect();
          return;
        }
      } catch (e) {
        console.warn("[socket register] ban check", e);
      }

      userSockets.set(userId, socket.id);
      socket.userId = userId;
      socket.join(`user:${userId}`);
      socket.join("global_pulse");
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { lastSeenAt: new Date() },
        });
      } catch (e) {
        console.warn("[socket register] lastSeenAt update", e);
      }
    });

    /** Batch presence for friends list / profile (online = active socket). */
    socket.on("presence_query", async (payload) => {
      if (!payload || typeof payload !== "object") return;
      const raw = payload.userIds;
      if (!Array.isArray(raw)) return;
      const userIds = raw.filter((x) => typeof x === "string").slice(0, 200);
      if (userIds.length === 0) {
        socket.emit("presence_result", { map: {} });
        return;
      }
      try {
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, lastSeenAt: true },
        });
        const map = {};
        for (const u of users) {
          map[u.id] = {
            online: userSockets.has(u.id),
            lastSeenAt: u.lastSeenAt?.toISOString() ?? null,
          };
        }
        socket.emit("presence_result", { map });
      } catch (e) {
        console.error("[presence_query]", e);
        socket.emit("presence_result", { map: {} });
      }
    });

    socket.on("global_pulse_request_history", async (payload) => {
      try {
        const wantGold =
          payload && typeof payload === "object" && payload.channel === "gold";
        if (wantGold) {
          const uid = socket.userId;
          if (!uid) {
            socket.emit("global_pulse_gold_history", []);
            return;
          }
          const u = await prisma.user.findUnique({
            where: { id: uid },
            select: { isVip: true, totalSpent: true },
          });
          const tier = u
            ? vipTierFromUser({
                isVip: u.isVip === true,
                totalSpent: u.totalSpent ?? 0,
              })
            : "free";
          if (tier !== "gold") {
            socket.emit("global_pulse_gold_history", []);
            return;
          }
        }
        const rows = await prisma.chatMessage.findMany({
          where: { pulseChannel: wantGold ? "gold" : "world" },
          orderBy: { createdAt: "desc" },
          take: GLOBAL_PULSE_HISTORY_LIMIT,
        });
        const chronological = rows.reverse().map(chatRowToWire);
        if (wantGold) {
          socket.emit("global_pulse_gold_history", chronological);
        } else {
          socket.emit("global_pulse_history", chronological);
        }
      } catch (err) {
        console.error("[global_pulse_request_history]", err);
        const wantGold =
          payload && typeof payload === "object" && payload.channel === "gold";
        socket.emit(wantGold ? "global_pulse_gold_history" : "global_pulse_history", []);
      }
    });

    socket.on("global_pulse_gold_join", async () => {
      const uid = socket.userId;
      if (!uid) return;
      try {
        const u = await prisma.user.findUnique({
          where: { id: uid },
          select: { isVip: true, totalSpent: true },
        });
        const tier = u
          ? vipTierFromUser({
              isVip: u.isVip === true,
              totalSpent: u.totalSpent ?? 0,
            })
          : "free";
        if (tier !== "gold") {
          socket.emit("global_pulse_gold_forbidden");
          return;
        }
        socket.join("global_pulse_gold");
      } catch (e) {
        console.error("[global_pulse_gold_join]", e);
        socket.emit("global_pulse_gold_forbidden");
      }
    });

    socket.on("global_pulse_gold_leave", () => {
      socket.leave("global_pulse_gold");
    });

    socket.on("global_pulse_send", async (payload) => {
      const uid = socket.userId;
      if (!uid || !payload || typeof payload !== "object") return;
      const isReaction = payload.type === "reaction";
      const raw = typeof payload.message === "string" ? payload.message.trim() : "";
      if (isReaction) {
        if (!FLOATING_REACTION_EMOJI.has(raw)) return;
      } else if (!allowGlobalPulseServerMessage(raw)) {
        return;
      }

      if (!isReaction && process.env.ANTHROPIC_API_KEY?.trim()) {
        try {
          const bundle = await getModerationBundle();
          const mod = await bundle.moderateText(raw, uid, { context: "global_chat" });
          if (!mod.allowed) {
            const severity = mod.severity ?? "medium";
            const reason = typeof mod.reason === "string" ? mod.reason : "Policy violation";
            if (severity === "high") {
              const until = new Date(Date.now() + 24 * 60 * 60 * 1000);
              await prisma.user.update({
                where: { id: uid },
                data: { bannedUntil: until, autoFlagged: true },
              });
              await bundle.recordModerationLog(prisma, {
                userId: uid,
                content: raw.slice(0, 500),
                reason,
                severity,
                action: "banned",
              });
              socket.emit("banned", { reason, until: until.toISOString() });
              socket.disconnect();
              return;
            }
            if (severity === "medium") {
              await prisma.user.update({
                where: { id: uid },
                data: { warnings: { increment: 1 }, autoFlagged: true },
              });
              await bundle.recordModerationLog(prisma, {
                userId: uid,
                content: raw.slice(0, 500),
                reason,
                severity,
                action: "warned",
              });
              socket.emit("message-blocked", { reason });
              return;
            }
            await bundle.recordModerationLog(prisma, {
              userId: uid,
              content: raw.slice(0, 500),
              reason,
              severity,
              action: "blocked",
            });
            return;
          }
        } catch (e) {
          console.error("[global_pulse_send] AI moderation", e);
        }
      }

      const userName =
        typeof payload.userName === "string"
          ? [...payload.userName.trim()].slice(0, MAX_GLOBAL_PULSE_USERNAME_LEN).join("")
          : "User";
      const cc = payload.countryCode;
      const countryCode =
        typeof cc === "string" && cc.length === 2 ? cc.toUpperCase() : null;
      const pulseChannel = payload.channel === "gold" ? "gold" : "world";
      try {
        const sender = await prisma.user.findUnique({
          where: { id: uid },
          select: { isVip: true, totalSpent: true },
        });
        const tier = sender
          ? vipTierFromUser({
              isVip: sender.isVip === true,
              totalSpent: sender.totalSpent ?? 0,
            })
          : "free";
        if (pulseChannel === "gold" && tier !== "gold") {
          socket.emit("global_pulse_gold_forbidden");
          return;
        }
        const row = await prisma.chatMessage.create({
          data: {
            userId: uid,
            userName: userName || "User",
            countryCode,
            message: raw.slice(0, 280),
            kind: isReaction ? "reaction" : "text",
            neonVip: sender?.isVip === true,
            vipTier: tier,
            pulseChannel,
          },
        });
        const entry = chatRowToWire(row);
        if (pulseChannel === "gold") {
          io.to("global_pulse_gold").emit("global_pulse_gold_message", entry);
        } else {
          io.to("global_pulse").emit("global_pulse_message", entry);
        }
      } catch (err) {
        console.error("[global_pulse_send]", err);
      }
    });

    /** TikTok-style floating emoji burst for everyone in Global Pulse */
    socket.on("global_pulse_floating_reaction", (payload) => {
      const uid = socket.userId;
      if (!uid || !payload || typeof payload !== "object") return;
      const raw = typeof payload.emoji === "string" ? payload.emoji.trim() : "";
      if (!FLOATING_REACTION_EMOJI.has(raw)) return;
      if (!allowFloatingReactionBurst(uid)) return;
      io.to("global_pulse").emit("global_pulse_floating_reaction", {
        emoji: raw,
        fromUserId: uid,
        ts: Date.now(),
      });
    });

    /** Typing indicator — relay to others in Pulse (excludes sender). */
    socket.on("global_pulse_typing", (payload) => {
      const uid = socket.userId;
      if (!uid || !payload || typeof payload !== "object") return;
      const active = payload.active === true;
      const rawName = typeof payload.userName === "string" ? payload.userName.trim() : "";
      const userName = [...rawName].slice(0, 40).join("") || "Someone";
      socket.to("global_pulse").emit("global_pulse_typing_update", {
        userId: uid,
        userName,
        active,
        ts: Date.now(),
      });
    });

    socket.on("private_invite", ({ toUserId, roomId }) => {
      io.to(`user:${toUserId}`).emit("private_invite", {
        fromUserId: socket.userId,
        roomId,
      });
    });

    socket.on("private_accept", ({ roomId, fromUserId }) => {
      io.to(`user:${fromUserId}`).emit("private_room_ready", { roomId });
      socket.emit("private_room_ready", { roomId });
    });

    socket.on("private_decline", ({ roomId, fromUserId }) => {
      io.to(`user:${fromUserId}`).emit("private_invite_declined", { roomId });
    });

    socket.on("join_room", (roomId) => {
      if (!roomId) return;
      socket.join(`room:${roomId}`);
      // Notify others in the private room so WebRTC caller can send an offer
      socket.to(`room:${roomId}`).emit("webrtc_room_peer_joined", {
        roomId,
        userId: socket.userId ?? null,
      });
    });

    /** WebRTC signaling (Socket.io) — relay to the other peer in the same room */
    socket.on("webrtc_offer", ({ roomId, sdp }) => {
      if (!roomId || !sdp || typeof sdp !== "object") return;
      socket.to(`room:${roomId}`).emit("webrtc_offer", {
        roomId,
        sdp,
        fromUserId: socket.userId ?? null,
      });
    });
    socket.on("webrtc_answer", ({ roomId, sdp }) => {
      if (!roomId || !sdp || typeof sdp !== "object") return;
      socket.to(`room:${roomId}`).emit("webrtc_answer", {
        roomId,
        sdp,
        fromUserId: socket.userId ?? null,
      });
    });
    socket.on("webrtc_ice_candidate", ({ roomId, candidate }) => {
      if (!roomId || candidate == null || typeof candidate !== "object") return;
      socket.to(`room:${roomId}`).emit("webrtc_ice_candidate", {
        roomId,
        candidate,
        fromUserId: socket.userId ?? null,
      });
    });

    socket.on("whale_entered_chat", ({ toUserId }) => {
      if (toUserId) {
        io.to(`user:${toUserId}`).emit("partner_is_premium");
      }
    });

    /**
     * Theater: Fire / Rocket gifts — overlay animation on the recipient’s main (partner) video.
     * Relays to peer’s user room (same pattern as private_invite).
     */
    socket.on("theater_gift_overlay", (payload) => {
      if (!payload || typeof payload !== "object") return;
      const toUserId = typeof payload.toUserId === "string" ? payload.toUserId : null;
      const giftType = payload.giftType === "fire" || payload.giftType === "rocket" ? payload.giftType : null;
      if (!toUserId || !giftType) return;
      const senderLabel =
        typeof payload.senderLabel === "string"
          ? [...String(payload.senderLabel).trim()].slice(0, 64).join("")
          : "Someone";
      const giftLabel =
        typeof payload.giftLabel === "string"
          ? [...String(payload.giftLabel).trim()].slice(0, 64).join("")
          : giftType === "fire"
            ? "Fire"
            : "Rocket";
      io.to(`user:${toUserId}`).emit("theater_gift_overlay", {
        giftType,
        senderLabel: senderLabel || "Someone",
        giftLabel,
        fromUserId: socket.userId ?? null,
      });
    });

    socket.on("disconnect", async () => {
      const uid = socket.userId;
      if (uid) {
        userSockets.delete(uid);
        try {
          await prisma.user.update({
            where: { id: uid },
            data: { lastSeenAt: new Date() },
          });
        } catch (e) {
          console.warn("[socket disconnect] lastSeenAt update", e);
        }
      }
    });
  });

  // Leaderboard: broadcast top 3 every 15s via WebSocket
  const LEADERBOARD_INTERVAL_MS = 15 * 1000;
  setInterval(async () => {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/leaderboard`);
      const data = await res.json().catch(() => ({}));
      if (data.leaderboard) {
        io.emit("leaderboard_update", { leaderboard: data.leaderboard });
      }
    } catch (err) {
      console.error("[leaderboard broadcast]", err);
    }
  }, LEADERBOARD_INTERVAL_MS);

  // Server-side timer: trigger room check every 60s via API
  const ROOM_CHECK_INTERVAL_MS = 60 * 1000;
  setInterval(async () => {
    try {
      const headers = {};
      if (process.env.CRON_SECRET) {
        headers["Authorization"] = `Bearer ${process.env.CRON_SECRET}`;
      }
      const res = await fetch(
        `http://127.0.0.1:${port}/api/cron/private-rooms-check`,
        { method: "POST", headers }
      );
      const data = await res.json().catch(() => ({}));
      const closedIds = data.closedIds || [];
      for (const roomId of closedIds) {
        io.to(`room:${roomId}`).emit("private_room_closed", { roomId });
      }
    } catch (err) {
      console.error("[private-room timer]", err);
    }
  }, ROOM_CHECK_INTERVAL_MS);

  // Global Pulse: purge DB rows older than 5 minutes every minute; API emits Socket.io removal
  const CHAT_CLEANUP_INTERVAL_MS = 60 * 1000;
  async function runChatMessagesCleanupOnce() {
    try {
      const headers = {};
      if (process.env.CRON_SECRET) {
        headers["Authorization"] = `Bearer ${process.env.CRON_SECRET}`;
      }
      const res = await fetch(
        `http://127.0.0.1:${port}/api/cron/chat-messages-cleanup`,
        { method: "POST", headers }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[chat-messages-cleanup]", res.status, text);
      }
    } catch (err) {
      console.error("[chat-messages-cleanup timer]", err);
    }
  }
  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, "0.0.0.0", () => {
      console.log(`> Ready on http://0.0.0.0:${port}`);
      void runChatMessagesCleanupOnce();
      setInterval(runChatMessagesCleanupOnce, CHAT_CLEANUP_INTERVAL_MS);
    });
});
