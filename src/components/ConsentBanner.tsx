interface ConsentBannerProps {
  onAccept: () => void;
  onDecline: () => void;
  onOpenPrivacy: () => void;
}

function CookieIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--soft)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5Z" />
      <circle cx={8.5} cy={8.5} r={0.8} fill="var(--soft)" stroke="none" />
      <circle cx={16} cy={15.5} r={0.8} fill="var(--soft)" stroke="none" />
      <circle cx={8.5} cy={15} r={0.8} fill="var(--soft)" stroke="none" />
      <circle cx={12} cy={12} r={0.8} fill="var(--soft)" stroke="none" />
    </svg>
  );
}

/**
 * Cookie banner per the design: a slim fixed bar on desktop, a bottom sheet
 * with scrim on mobile. z-[105] sits above the page chrome (Leaflet maps are
 * isolated in their own stacking contexts, so nothing scrolls over this).
 */
export function ConsentBanner({ onAccept, onDecline, onOpenPrivacy }: ConsentBannerProps) {
  return (
    <>
      {/* Desktop banner */}
      <div
        className="hidden md:block fixed left-0 right-0 bottom-0 z-[105] bg-surface border-t border-panelbrd"
        style={{ boxShadow: "0 -6px 24px rgba(0,0,0,.12)" }}
      >
        <div className="max-w-[1264px] mx-auto px-12 py-3 flex items-center gap-3.5">
          <CookieIcon />
          <span className="text-[13px] text-ui-body">
            One cookie remembers your location and settings between visits.{" "}
            <button type="button" onClick={onOpenPrivacy} className="text-link cursor-pointer">
              Details
            </button>
          </span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onDecline}
            className="h-9 px-4 border border-panelbrd rounded-control bg-surface text-[12.5px] font-semibold text-soft cursor-pointer"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="h-9 px-[18px] rounded-control bg-brand text-brandink text-[12.5px] font-[650] cursor-pointer hover:bg-brand2 transition-colors"
          >
            Allow cookies
          </button>
        </div>
      </div>

      {/* Mobile bottom sheet — anchored to the bottom with NO full-screen
          scrim: consent must never block using the page (the design's scrim
          variant traded that away; the slim-sheet keeps the visual without
          trapping the user). */}
      <div className="md:hidden fixed left-0 right-0 bottom-0 z-[105]">
        <div
          className="w-full bg-surface border-t border-panelbrd rounded-t-card px-5 pt-2.5"
          style={{
            paddingBottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
            boxShadow: "0 -6px 24px rgba(0,0,0,.18)",
          }}
        >
          <div className="w-9 h-1 rounded-full bg-barbg mx-auto mb-3.5" />
          <div className="flex items-center gap-2.5">
            <CookieIcon />
            <span className="text-[15px] font-bold text-ink">Remember this device?</span>
          </div>
          <div className="text-[12.5px] leading-relaxed text-soft mt-2 mb-3.5">
            One cookie keeps your location and settings between visits.{" "}
            <button type="button" onClick={onOpenPrivacy} className="text-link cursor-pointer">
              Details
            </button>
          </div>
          <button
            type="button"
            onClick={onAccept}
            className="w-full h-11 rounded-control bg-brand text-brandink text-sm font-[650] cursor-pointer"
          >
            Allow cookies
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="w-full h-10 mt-2 rounded-control bg-transparent text-[13px] font-semibold text-soft cursor-pointer"
          >
            Decline
          </button>
        </div>
      </div>
    </>
  );
}
