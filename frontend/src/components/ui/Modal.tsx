import React, { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/80 p-4">
      <div className="w-full max-w-4xl border border-border no-round bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <div className="font-mono text-xs uppercase tracking-wider text-slate">{title ?? "Preview"}</div>
          <button type="button" onClick={onClose} className="no-round border border-border px-3 py-2 text-paper hover:border-amber">
            Close
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

