"use client";

import { useState } from "react";
import type { ContentLocale } from "../lib/content-i18n";
import { getContentT } from "../lib/content-i18n";
import type { ChatMessage } from "../lib/chat-messages-data";
import { moderateText } from "../lib/text-moderation";

export type { ChatMessage } from "../lib/chat-messages-data";
export { generateFakeMessage } from "../lib/chat-messages-data";

type Props = {
  messages: ChatMessage[];
  locale: ContentLocale;
  coins: number;
  onRecharge: () => void;
  onIcebreaker?: () => void;
  canAffordIcebreaker?: boolean;
  icebreakerCost?: number;
  onSendMessage?: (text: string) => void;
  chatBlocked?: boolean;
  chatBlockedMinutes?: number;
};

export default function ChatPanel({
  messages,
  locale,
  onRecharge,
  coins,
  onIcebreaker,
  canAffordIcebreaker = false,
  icebreakerCost = 1,
  onSendMessage,
  chatBlocked = false,
  chatBlockedMinutes = 0,
}: Props) {
  const [input, setInput] = useState("");
  const t = getContentT(locale);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !onSendMessage || chatBlocked) return;
    onSendMessage(trimmed);
    setInput("");
  };

  const renderMessage = (m: ChatMessage) => {
    if (m.isSystem) {
      return (
        <div
          key={m.id}
          className="rounded-lg px-2 py-1.5 text-center text-xs text-white/60"
        >
          <span>{m.text}</span>
          {m.actionLabel && (
            <>
              {" "}
              <button
                type="button"
                onClick={onRecharge}
                className="text-[#8b5cf6] underline hover:opacity-90"
              >
                [{m.actionLabel}]
              </button>
            </>
          )}
        </div>
      );
    }
    if (m.isDonor) return null;
    const safeUser = moderateText(m.user ?? "").filtered.replace(/_/g, " ");
    const safeText = moderateText(m.text).filtered;
    return (
      <div
        key={m.id}
        className="rounded-lg px-2 py-1.5 text-sm text-white/90"
      >
        <span className="font-semibold">{safeUser}</span>
        <span>: </span>
        <span>{safeText}</span>
      </div>
    );
  };

  return (
    <div
      className="flex h-full min-h-[280px] flex-col rounded-xl border border-white/10 bg-black/40 backdrop-blur-md sm:min-h-[320px]"
      style={{ boxShadow: "0 0 30px rgba(0,0,0,0.3)" }}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-xs font-medium text-white/80">
          💰 {(coins ?? 0) > 0 ? (
            <span className="text-white">{coins ?? 0} {t.coinsLabel}</span>
          ) : (
            <>
              <span className="text-white/70">0 {t.coinsLabel}</span>
              <button
                type="button"
                onClick={onRecharge}
                className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#8b5cf6]/50 bg-[#8b5cf6]/20 text-[10px] font-bold text-[#a78bfa] transition-opacity hover:opacity-90"
                aria-label={t.seeOptionsLabel}
              >
                +
              </button>
            </>
          )}
        </span>
        <div className="flex items-center gap-2">
          {onIcebreaker && (
            <button
              type="button"
              onClick={canAffordIcebreaker ? onIcebreaker : onRecharge}
              className="rounded-full border border-amber-500/50 bg-amber-950/40 px-2.5 py-1 text-[10px] font-medium text-amber-400 transition-colors hover:bg-amber-900/40 disabled:opacity-50"
            >
              Icebreaker ({icebreakerCost})
            </button>
          )}
          {(coins ?? 0) > 0 && (
            <button
              type="button"
              onClick={onRecharge}
              className="rounded-full border border-white/20 bg-transparent px-2.5 py-1 text-[10px] font-medium text-white/70 transition-colors hover:border-[#8b5cf6]/40 hover:bg-[#8b5cf6]/10 hover:text-white"
            >
              {t.seeOptionsLabel}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m) => renderMessage(m))}
      </div>
      {onSendMessage && (
        <div className="border-t border-white/10 p-2">
          {chatBlocked ? (
            <p className="text-center text-[10px] text-amber-400">
              Chat blocked for {chatBlockedMinutes} min. Avoid banned words, links, or phone numbers.
            </p>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                maxLength={200}
                className="flex-1 rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#8b5cf6]/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim()}
                className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
