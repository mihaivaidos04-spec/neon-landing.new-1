import type { Server } from "socket.io";

export type PrivateDmSocketPayload = {
  id: string;
  senderId: string;
  receiverId: string;
  body: string;
  createdAt: string;
};

/** Push DM to recipient’s Socket.io room (`user:${id}`). */
export function emitPrivateDmToUser(userId: string, payload: PrivateDmSocketPayload): void {
  const io = (globalThis as unknown as { __neonSocketIo?: Server }).__neonSocketIo;
  io?.to(`user:${userId}`).emit("private_dm", payload);
}
