import type { Server } from "socket.io";

export type LegendPurchasePayload = {
  userId: string;
  userName: string;
  coinsAdded: number;
};

/**
 * Global notification: Whale Pack (NEON LEGEND) confirmed via Stripe.
 * `io.emit` → every connected client shows the top banner; buyer gets extra confetti.
 * Custom Node server only; without `globalThis.__neonSocketIo`, this is a no-op.
 */
export function broadcastLegendPurchase(payload: LegendPurchasePayload): void {
  const io = (globalThis as unknown as { __neonSocketIo?: Server }).__neonSocketIo;
  if (!io) {
    if (process.env.NODE_ENV === "development") {
      console.info("[neon-legend] no Socket.IO server attached — skip broadcast");
    }
    return;
  }
  io.emit("legend_purchase_broadcast", payload);
}
