import { Modal } from "../ui/Modal";
import type { ThemeMode } from "../../utils/themeUtils";

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}

export function ThemeSettingsModal({
  isOpen,
  onClose,
  themeMode,
  onThemeChange,
}: ThemeSettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Theme Settings">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Choose how EazyWeather should look.
        </p>

        <label className="block">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 block">
            Theme mode
          </span>
          <select
            value={themeMode}
            onChange={(e) => onThemeChange(e.target.value as ThemeMode)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>
    </Modal>
  );
}
