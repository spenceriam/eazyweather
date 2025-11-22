import { Modal } from "../ui/Modal";
import { Cookie, HardDrive } from "lucide-react";

interface CookieConsentModalProps {
  isOpen: boolean;
  onResolve: (granted: boolean) => void;
}

export function CookieConsentModal({ isOpen, onResolve }: CookieConsentModalProps) {
  // If the user closes the modal via X or backdrop, we treat it as denying cookies
  const handleClose = () => {
    onResolve(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Location Persistence">
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="bg-brand-cream p-4 rounded-full">
             <Cookie className="h-8 w-8 text-brand" />
          </div>

          <p className="text-gray-600">
            To ensure your location is remembered reliably across all browsers (including Home Assistant and embedded views),
            EazyWeather uses a hybrid storage approach.
          </p>

          <div className="bg-blue-50 p-4 rounded-lg text-left w-full text-sm text-blue-800 border border-blue-100">
            <p className="font-semibold mb-1">Why Cookies?</p>
            <p>
              Some browsers clear local storage frequently. allowing cookies enables your location settings to persist for up to 6 months.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <button
            onClick={() => onResolve(false)}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <HardDrive className="h-4 w-4" />
            <span>Use Local Storage Only</span>
          </button>

          <button
            onClick={() => onResolve(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors shadow-sm"
          >
            <Cookie className="h-4 w-4" />
            <span>Allow Cookies (Recommended)</span>
          </button>
        </div>

        <p className="text-xs text-center text-gray-400">
          You can change this preference at any time by clearing your browser data.
        </p>
      </div>
    </Modal>
  );
}
