import { useEffect } from "react";

interface HelpModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function HelpModal({ title, onClose, children }: HelpModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-[#cd7f32]/30 bg-[#16213e] p-6 shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black text-[#d4a853]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#cd7f32]/20 px-3 py-1 text-sm text-[#fffff0]/50 transition-colors hover:border-[#cd7f32]/50 hover:text-[#fffff0]/80"
          >
            Fechar
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm text-[#fffff0]/75 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

interface HelpSectionProps {
  title: string;
  children: React.ReactNode;
}

export function HelpSection({ title, children }: HelpSectionProps) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#cd7f32]">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function HelpItem({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2">
      <span className="mt-0.5 shrink-0 text-[#d4a853]/60">•</span>
      <span>{children}</span>
    </p>
  );
}
