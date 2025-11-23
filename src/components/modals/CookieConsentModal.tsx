import { Modal } from "../ui/Modal";
import { Cookie } from "lucide-react";

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
    <Modal isOpen={isOpen} onClose={handleClose} title="Cookie Settings">
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="bg-brand-cream p-4 rounded-full">
             <Cookie className="h-8 w-8 text-brand" />
          </div>

          <p className="text-gray-600">
            We use cookies to ensure your location preferences are saved reliably and to enhance your experience.
            You can choose to accept or decline these cookies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <button
            onClick={() => onResolve(false)}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span>Decline</span>
          </button>

          <button
            onClick={() => onResolve(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors shadow-sm"
          >
            <span>Accept Cookies</span>
          </button>
        </div>

        <p className="text-xs text-center text-gray-400">
          You can change this preference at any time by clearing your browser data.
        </p>
      </div>
    </Modal>
  );
}
