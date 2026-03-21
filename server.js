import env from "@next/env";
import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { allowGlobalPulseServerMessage } from "./global-pulse-server-filter.mjs";
import { MAX_GLOBAL_PULSE_USERNAME_LEN } from "./global-pulse-constants.mjs";
import { getPrisma } from "./server-prisma.mjs";

env.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

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
    return {
      id: row.id,
      userId: row.userId,
      userName: row.userName,
      countryCode: row.countryCode,
      message: row.message,
      neonVip: row.neonVip === true,
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

  // userId -> socketId mapping for peer signaling
  const userSockets = new Map();

  io.on("connection", (socket) => {
    socket.on("register", async (userId) => {
      if (userId) {
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

    socket.on("global_pulse_request_history", async () => {
      try {
        const rows = await prisma.chatMessage.findMany({
          orderBy: { createdAt: "desc" },
          take: 80,
        });
        const chronological = rows.reverse().map(chatRowToWire);
        socket.emit("global_pulse_history", chronological);
      } catch (err) {
        console.error("[global_pulse_request_history]", err);
        socket.emit("global_pulse_history", []);
      }
    });

    socket.on("global_pulse_send", async (payload) => {
      const uid = socket.userId;
      if (!uid || !payload || typeof payload !== "object") return;
      const raw = typeof payload.message === "string" ? payload.message.trim() : "";
      if (!allowGlobalPulseServerMessage(raw)) return;
      const userName =
        typeof payload.userName === "string"
          ? [...payload.userName.trim()].slice(0, MAX_GLOBAL_PULSE_USERNAME_LEN).join("")
          : "User";
      const cc = payload.countryCode;
      const countryCode =
        typeof cc === "string" && cc.length === 2 ? cc.toUpperCase() : null;
      try {
        const sender = await prisma.user.findUnique({
          where: { id: uid },
          select: { isVip: true },
        });
        const row = await prisma.chatMessage.create({
          data: {
            userId: uid,
            userName: userName || "User",
            countryCode,
            message: raw.slice(0, 280),
            neonVip: sender?.isVip === true,
          },
        });
        const entry = chatRowToWire(row);
        io.to("global_pulse").emit("global_pulse_message", entry);
      } catch (err) {
        console.error("[global_pulse_send]", err);
      }
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
