import { Modal } from "../ui/Modal";
import type { ReleaseNote } from "../../types/whatsNew";

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseNotes: ReleaseNote;
}

// Category icons and labels
const categoryConfig = {
  feature: { icon: "🗺️", label: "New Features" },
  improvement: { icon: "🔄", label: "Improvements" },
  fix: { icon: "🔧", label: "Bug Fixes" },
  visual: { icon: "🎨", label: "Visual Updates" },
  analytics: { icon: "📊", label: "Analytics" },
} as const;

export function WhatsNewModal({
  isOpen,
  onClose,
  releaseNotes,
}: WhatsNewModalProps) {
  // Group changes by category
  const changesByCategory = releaseNotes.changes.reduce(
    (acc, change) => {
      const category = change.category || "improvement";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(change);
      return acc;
    },
    {} as Record<string, typeof releaseNotes.changes>,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`What's New in EazyWeather v${releaseNotes.version}`}
    >
      <div className="space-y-6">
        {/* Introduction */}
        <div className="text-sm text-gray-700">
          <p>
            We've been busy improving EazyWeather! Here's what's new in this
            release:
          </p>
        </div>

        {/* Changes grouped by category */}
        <div className="space-y-5">
          {Object.entries(changesByCategory).map(([category, changes]) => {
            const config =
              categoryConfig[category as keyof typeof categoryConfig];
            if (!config) return null;

            return (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span>{config.label}</span>
                </h3>
                <ul className="space-y-2.5">
                  {changes.map((change, idx) => (
                    <li key={idx} className="text-sm text-gray-600 pl-7">
                      <div className="flex flex-col gap-1">
                        <div>
                          <span className="font-medium text-gray-900">
                            {change.title}:
                          </span>{" "}
                          {change.description}
                        </div>
                        {change.prUrl && (
                          <a
                            href={change.prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand hover:text-brand-dark hover:underline"
                          >
                            #{change.prNumber}
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer with date and link */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <p className="text-xs text-gray-500">
              {releaseNotes.date && (
                <>
                  <strong>Released:</strong> {releaseNotes.date}
                </>
              )}
            </p>
            <a
              href="https://github.com/spenceriam/eazyweather/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand hover:text-brand-dark hover:underline font-medium"
            >
              View all releases on GitHub →
            </a>
          </div>
        </div>

        {/* Dismiss note */}
        <div className="bg-brand-lighter p-3 rounded-md">
          <p className="text-xs text-gray-600 text-center">
            This message will only be shown once per version update.
          </p>
        </div>
      </div>
    </Modal>
  );
}
