"use client";

import { useEffect } from "react";

export function Toast({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onClose, 1600);
    return () => window.clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className="rounded-2xl border border-white/10 bg-neutral-950/80 px-4 py-3 text-sm text-white shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)] backdrop-blur">
        {message}
      </div>
    </div>
  );
}