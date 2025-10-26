import { Modal } from "../ui/Modal";

export function TermsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Terms of Use">
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-900 mb-2">
            Acceptance of Terms
          </h3>
          <p className="text-sm text-gray-600">
            By using EazyWeather, you agree to these terms of use. If you do not
            agree to these terms, please do not use this service.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-2">
            Service Description
          </h3>
          <p className="text-sm text-gray-600">
            EazyWeather is a free weather information service that provides:
          </p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
            <li>Current weather conditions and forecasts</li>
            <li>Location-based weather information</li>
            <li>Historical weather patterns and predictions</li>
            <li>Weather radar and maps (where available)</li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-2">
            Data Sources and Accuracy
          </h3>
          <p className="text-sm text-gray-600">
            Weather data is provided by the National Weather Service and other
            meteorological sources. While we strive for accuracy, weather data
            may contain errors or be subject to change. EazyWeather is not
            responsible for any decisions made based on weather information.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-2">
            User Responsibilities
          </h3>
          <p className="text-sm text-gray-600">
            As a user of EazyWeather, you agree to:
          </p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
            <li>Use the service for lawful purposes only</li>
            <li>Not attempt to misuse or overload the weather APIs</li>
            <li>Respect the terms of third-party data providers</li>
            <li>
              Not reproduce or redistribute data without proper attribution
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-2">
            Disclaimer of Warranty
          </h3>
          <p className="text-sm text-gray-600">
            EazyWeather is provided "as is" without any warranties, express or
            implied. We do not guarantee uninterrupted or error-free service,
            nor do we warrant the accuracy of weather information provided.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-2">
            Limitation of Liability
          </h3>
          <p className="text-sm text-gray-600">
            In no event shall EazyWeather or its creators be liable for any
            damages arising from the use or inability to use this service,
            including but not limited to damages resulting from reliance on
            weather information.
          </p>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-2">
            Service Modifications
          </h3>
          <p className="text-sm text-gray-600">
            EazyWeather reserves the right to modify, suspend, or discontinue
            the service at any time without notice. We may also update these
            terms of use periodically.
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            <strong>Last Updated:</strong> October 2025
            <br />
            For questions about these terms, contact us at:{" "}
            <strong>contact@lionmystic.com</strong>
          </p>
        </div>
      </div>
    </Modal>
  );
}
