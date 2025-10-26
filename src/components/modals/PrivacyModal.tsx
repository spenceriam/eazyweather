import { Modal } from "../ui/Modal";

export function PrivacyModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy">
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-900 mb-2">
            Information We Collect
          </h3>
          <p className="text-sm text-gray-600">
            EazyWeather collects minimal information necessary to provide
            weather services:
          </p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
            <li>Location data (coordinates) for weather requests</li>
            <li>Location search history (stored locally on your device)</li>
            <li>Basic usage analytics (no personal information)</li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-2">
            How We Use Your Information
          </h3>
          <p className="text-sm text-gray-600">
            Your location information is used solely to:
          </p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
            <li>Provide accurate weather data for your location</li>
            <li>Power location search and save search history locally</li>
            <li>Improve the accuracy of weather forecasts</li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-2">Data Storage</h3>
          <p className="text-sm text-gray-600">
            Location search history is stored locally in your browser's
            localStorage. We do not collect, store, or transmit any personal
            information to our servers.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-2">
            Third-Party Services
          </h3>
          <p className="text-sm text-gray-600">
            EazyWeather uses the following third-party services:
          </p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
            <li>
              <strong>National Weather Service:</strong> Current conditions,
              forecasts, and weather alerts from official US government weather
              service
            </li>
            <li>
              <strong>OpenStreetMap Nominatim:</strong> Location search and
              geocoding
            </li>
            <li>
              <strong>Sunrise-Sunset.org:</strong> Precise sunrise and sunset
              times calculated from geographic coordinates
            </li>
          </ul>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            <strong>Last Updated:</strong> October 2025
            <br />
            For questions about this privacy policy, contact us at:{" "}
            <strong>contact@lionmystic.com</strong>
            <br />
            This privacy policy may be updated periodically. Continued use of
            EazyWeather constitutes acceptance of these terms.
          </p>
        </div>
      </div>
    </Modal>
  );
}
