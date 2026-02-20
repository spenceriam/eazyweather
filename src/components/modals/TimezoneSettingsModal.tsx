import { useMemo } from "react";
import { Modal } from "../ui/Modal";
import {
  detectDeviceTimezone,
  getCentralFallbackTimezone,
  getTimezoneOptions,
} from "../../utils/timezoneUtils";

interface TimezoneSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTimezone: string;
  onTimezoneChange: (timezone: string) => void;
}

export function TimezoneSettingsModal({
  isOpen,
  onClose,
  selectedTimezone,
  onTimezoneChange,
}: TimezoneSettingsModalProps) {
  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);
  const deviceTimezone = detectDeviceTimezone();
  const fallbackTimezone = getCentralFallbackTimezone();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Time Settings">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Times across the app use this timezone setting.
        </p>

        <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700 space-y-1">
          <div>
            <strong>Device timezone:</strong> {deviceTimezone || "Not detected"}
          </div>
          <div>
            <strong>Fallback timezone:</strong> {fallbackTimezone}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-gray-700 mb-2 block">
            Select timezone
          </span>
          <select
            value={selectedTimezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800"
          >
            {timezoneOptions.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Modal>
  );
}
