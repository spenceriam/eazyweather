interface CoverageNoticeProps {
  placeName: string;
  previousLocationName: string | null;
  onBack: () => void;
  onChooseUs: () => void;
}

/**
 * Non-US coverage notice per the design: a flat surface card with a globe
 * icon, roadmap-framed copy (never "US only"), and Back / Choose-US actions.
 * Radar stays live elsewhere on the page.
 */
export function CoverageNotice({ placeName, previousLocationName, onBack, onChooseUs }: CoverageNoticeProps) {
  return (
    <div className="bg-surface border border-line rounded-card px-5 py-[18px] flex gap-3.5 items-start">
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="var(--link)" strokeWidth={1.8} className="flex-none mt-0.5">
        <circle cx={12} cy={12} r={9} />
        <path d="M3 12h18M12 3c2.5 2.6 3.9 5.7 3.9 9S14.5 18.4 12 21c-2.5-2.6-3.9-5.7-3.9-9S9.5 5.6 12 3Z" />
      </svg>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-ink">
          {placeName} is outside our current forecast coverage
        </div>
        <div className="text-[12.5px] leading-relaxed text-soft mt-1 max-w-[640px]">
          Forecasts currently come from the US National Weather Service; additional sources for
          international coverage are on the roadmap (see Data sources below). Live radar already
          works worldwide.
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {previousLocationName && (
            <button
              type="button"
              onClick={onBack}
              className="h-[34px] px-3.5 rounded-control bg-brand text-brandink text-[12.5px] font-[650] cursor-pointer hover:bg-brand2 transition-colors"
            >
              Back to {previousLocationName}
            </button>
          )}
          <button
            type="button"
            onClick={onChooseUs}
            className="h-[34px] px-3.5 border border-panelbrd rounded-control bg-surface text-[12.5px] font-semibold text-soft cursor-pointer hover:bg-panel transition-colors"
          >
            Choose a US location
          </button>
        </div>
      </div>
    </div>
  );
}
