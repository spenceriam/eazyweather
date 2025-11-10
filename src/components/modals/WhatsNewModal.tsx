import { Modal } from "../ui/Modal";
import { changelog } from "../../data/changelog";
import { Sparkles } from "lucide-react";

export function WhatsNewModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="What's New">
      <div className="space-y-6">
        {/* Latest version highlight */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-brand" />
            <h3 className="text-lg font-semibold text-brand">
              Version {changelog[0].version} - {changelog[0].title}
            </h3>
          </div>
          <ul className="space-y-2">
            {changelog[0].changes.map((change, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-brand mt-1">•</span>
                <span className="text-sm text-gray-700">{change}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-3">{changelog[0].date}</p>
        </div>

        {/* Previous versions */}
        {changelog.length > 1 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Previous Updates
            </h4>
            {changelog.slice(1).map((entry) => (
              <div
                key={entry.version}
                className="border-l-2 border-gray-200 pl-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    v{entry.version}
                  </span>
                  <span className="text-xs text-gray-500">• {entry.date}</span>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {entry.title}
                </p>
                <ul className="space-y-1">
                  {entry.changes.map((change, idx) => (
                    <li key={idx} className="text-sm text-gray-600">
                      • {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

      </div>
    </Modal>
  );
}
