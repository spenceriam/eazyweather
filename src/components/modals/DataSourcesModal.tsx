import { Modal } from "../ui/Modal";

export function DataSourcesModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const dataSources = [
    {
      type: "Weather data",
      source: "National Weather Service",
      url: "https://www.weather.gov",
      description:
        "Current conditions, forecasts, and weather alerts from official US government weather service",
    },
    {
      type: "Sunrise & sunset data",
      source: "Sunrise-Sunset.org",
      url: "https://sunrise-sunset.org",
      description:
        "Precise sunrise and sunset times calculated from geographic coordinates",
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Website Data Sources">
      <div className="space-y-4">
        {dataSources.map((source, index) => (
          <div key={index} className="space-y-2">
            <h3 className="font-medium text-gray-900">{source.type}:</h3>
            <div className="space-y-1">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:text-brand-dark underline text-sm"
              >
                {source.source}
              </a>
              <p className="text-sm text-gray-600">{source.description}</p>
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Data is aggregated from multiple official sources to provide
            comprehensive weather information.
          </p>
        </div>
      </div>
    </Modal>
  );
}
