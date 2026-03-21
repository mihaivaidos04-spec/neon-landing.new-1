"use client";

import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";

const MAX_FILE_BYTES = 400_000;

type Props = {
  slots: (string | null)[];
  onSlotsChange: (next: (string | null)[]) => void;
  labels: {
    title: string;
    hint: string;
    upload: string;
  };
};

function isLikelyImageUrl(s: string): boolean {
  return s.startsWith("https://") || /^data:image\/(jpeg|png|webp);base64,/i.test(s);
}

export default function CharacterGallerySection({ slots, onSlotsChange, labels }: Props) {
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const inputs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const applySlot = useCallback(
    async (slot: number, imageUrl: string | null) => {
      setBusySlot(slot);
      try {
        const res = await fetch("/api/profile/gallery", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slot, imageUrl }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(typeof data.error === "string" ? data.error : "Upload failed");
          return;
        }
        if (Array.isArray(data.slots) && data.slots.length === 3) {
          onSlotsChange(data.slots as (string | null)[]);
        }
        toast.success(imageUrl ? "Photo saved" : "Photo removed");
      } catch {
        toast.error("Network error");
      } finally {
        setBusySlot(null);
      }
    },
    [onSlotsChange]
  );

  const onFile = (slot: number, file: File | null) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("Image too large (max ~400KB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl || !isLikelyImageUrl(dataUrl)) {
        toast.error("Could not read image");
        return;
      }
      void applySlot(slot, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-300/90">{labels.title}</h3>
      <p className="mb-4 text-[11px] text-white/45">{labels.hint}</p>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[0, 1, 2].map((slot) => {
          const url = slots[slot];
          const busy = busySlot === slot;
          return (
            <div key={slot} className="flex flex-col items-stretch gap-2">
              <div
                className={`relative aspect-square w-full overflow-hidden rounded-xl border-2 bg-black/50 shadow-[0_0_20px_rgba(139,92,246,0.2),inset_0_0_0_1px_rgba(34,211,238,0.15)] ${
                  url
                    ? "border-fuchsia-500/50 ring-1 ring-cyan-400/30"
                    : "border-dashed border-violet-500/35 border-white/20"
                }`}
              >
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <button
                    type="button"
                    onClick={() => inputs[slot].current?.click()}
                    disabled={busy}
                    className="flex h-full w-full flex-col items-center justify-center gap-1 text-violet-300/80 transition hover:bg-white/5 hover:text-fuchsia-200"
                  >
                    <span className="text-2xl font-light leading-none text-fuchsia-400/90">+</span>
                  </button>
                )}
                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-fuchsia-400 border-t-transparent" />
                  </div>
                )}
              </div>
              <input
                ref={inputs[slot]}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  onFile(slot, e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => (url ? void applySlot(slot, null) : inputs[slot].current?.click())}
                disabled={busy}
                className="rounded-lg border border-violet-500/35 bg-violet-950/40 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200 transition hover:border-fuchsia-500/45 hover:text-fuchsia-100 disabled:opacity-50"
              >
                {url ? "Remove" : labels.upload}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
