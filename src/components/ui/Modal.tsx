import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Escape closes; initial focus lands on the close button so keyboard and
  // screen-reader users start inside the dialog; body scroll locks while open.
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // z-[120] keeps dialogs above the consent banner (z-105) and welcome card
    // (z-110), so e.g. the banner's "Details" link can actually show Privacy.
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative bg-surface rounded-card shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-line"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-line">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 text-mut hover:text-ink transition-colors rounded-control hover:bg-chip"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
