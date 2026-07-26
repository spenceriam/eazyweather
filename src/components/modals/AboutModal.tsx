import { Modal } from "../ui/Modal";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About EazyWeather">
      <div className="space-y-4">
        <p className="text-sm text-ui-body">
          EazyWeather is a lightweight weather web app focused on quick local
          forecasts, hourly conditions, radar, and a clear monthly weather
          view.
        </p>

        <div>
          <h3 className="font-medium text-ink mb-2">What we focus on</h3>
          <ul className="text-sm text-ui-body space-y-1 list-disc list-inside">
            <li>Simple, readable weather data for daily decisions</li>
            <li>Fast location search and local forecast context</li>
            <li>Clean interface that works on desktop and mobile</li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium text-ink mb-2">Data sources</h3>
          <p className="text-sm text-ui-body">
            EazyWeather aggregates official weather data sources, including
            the National Weather Service, and location-based data providers
            used by the app.
          </p>
        </div>
      </div>
    </Modal>
  );
}
