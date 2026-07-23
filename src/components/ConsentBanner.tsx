interface ConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
  onOpenPrivacy: () => void;
}

function BittenCookieIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" aria-hidden="true" className="flex-shrink-0">
      <path
        d="M12 2c5.2 0 9.4 3.9 9.9 8.9a2 2 0 0 1-2.5 2.1 2.4 2.4 0 0 0-2.9 2.6 2 2 0 0 1-2.7 2.1A10 10 0 0 1 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2Z"
        fill="#D9A066"
        stroke="#8C5A2B"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <circle cx={9} cy={9} r={1} fill="#6B3F1D" />
      <circle cx={13.5} cy={7.5} r={1} fill="#6B3F1D" />
      <circle cx={8.5} cy={14} r={1} fill="#6B3F1D" />
      <circle cx={11.5} cy={16.5} r={1} fill="#6B3F1D" />
      <circle cx={15.5} cy={12.5} r={1} fill="#6B3F1D" />
    </svg>
  );
}

/**
 * Non-blocking consent surface (F12): slim banner on desktop, bottom sheet
 * on mobile. Appears alongside/after the WelcomeCard and never blocks
 * interaction with the page behind it.
 */
export function ConsentBanner({ onAccept, onDecline, onOpenPrivacy }: ConsentBannerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-surface shadow-card">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-3 flex-1 text-center sm:text-left">
          <BittenCookieIcon />
          <p className="text-sm text-ink">
            Your location stays on this device.{" "}
            <button type="button" onClick={onOpenPrivacy} className="text-link hover:underline">
              Details
            </button>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 sm:flex-none px-4 py-2 min-h-[44px] sm:min-h-[36px] text-sm font-medium border border-line rounded-control text-ink hover:bg-chip transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 sm:flex-none px-4 py-2 min-h-[44px] sm:min-h-[36px] text-sm font-semibold bg-brand text-brandink rounded-control hover:bg-brand2 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
