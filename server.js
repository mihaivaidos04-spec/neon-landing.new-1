import env from "@next/env";
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

env.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

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
  "https://neonlive.chat",
  "https://www.neonlive.chat",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    nextHandler(req, res);
  });
  const io = new Server(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: CORS_ORIGINS,
      methods: ["GET", "POST"],
    },
  });

  // userId -> socketId mapping for peer signaling
  const userSockets = new Map();

  io.on("connection", (socket) => {
    socket.on("register", (userId) => {
      if (userId) {
        userSockets.set(userId, socket.id);
        socket.userId = userId;
        socket.join(`user:${userId}`);
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
      if (roomId) socket.join(`room:${roomId}`);
    });

    socket.on("whale_entered_chat", ({ toUserId }) => {
      if (toUserId) {
        io.to(`user:${toUserId}`).emit("partner_is_premium");
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        userSockets.delete(socket.userId);
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

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, "0.0.0.0", () => {
      console.log(`> Ready on http://0.0.0.0:${port}`);
    });
});
