interface CoverageNoticeProps {
  placeName: string;
  previousLocationName: string | null;
  onBack: () => void;
  onChooseUs: () => void;
}

/**
 * Non-US coverage notice (F13). Rendered instead of forecast cards when the
 * selected location is outside NWS coverage; radar remains live elsewhere on
 * the page. Wording stays data-source-agnostic/roadmap-framed, never "US only".
 */
export function CoverageNotice({ placeName, previousLocationName, onBack, onChooseUs }: CoverageNoticeProps) {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="border border-line rounded-card bg-surface shadow-card p-6 text-center">
        <h2 className="text-lg font-semibold text-ink mb-2">
          {placeName} is outside our current forecast coverage
        </h2>
        <p className="text-sm text-ui-body max-w-lg mx-auto leading-relaxed">
          Forecasts currently come from the US National Weather Service. Additional data sources
          are on the roadmap (see Data sources) — live radar already works worldwide, and the
          radar card below still works for this location.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
          {previousLocationName && (
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 min-h-[44px] sm:min-h-[36px] text-sm font-medium border border-line rounded-control text-ink hover:bg-chip transition-colors"
            >
              Back to {previousLocationName}
            </button>
          )}
          <button
            type="button"
            onClick={onChooseUs}
            className="px-4 py-2 min-h-[44px] sm:min-h-[36px] text-sm font-semibold bg-brand text-brandink rounded-control hover:bg-brand2 transition-colors"
          >
            Choose a US location
          </button>
        </div>
      </div>
    </div>
  );
}
