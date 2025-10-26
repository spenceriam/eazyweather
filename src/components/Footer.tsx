import { useState } from "react";
import { DataSourcesModal } from "./modals/DataSourcesModal";

export function Footer() {
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);

  return (
    <>
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <div className="text-center md:text-left">
              <button
                onClick={() => setIsDataSourcesOpen(true)}
                className="text-blue-500 hover:text-blue-600 underline transition-colors"
              >
                Website Data Sources
              </button>
            </div>
            <div className="text-center md:text-right text-gray-500">
              <p>
                EazyWeather v{import.meta.env.__APP_VERSION__ || "1.0"} •{" "}
                {import.meta.env.__BUILD_DATE__ ||
                  new Date().toISOString().slice(0, 19).replace("T", " ")}
              </p>
            </div>
          </div>
        </div>
      </footer>

      <DataSourcesModal
        isOpen={isDataSourcesOpen}
        onClose={() => setIsDataSourcesOpen(false)}
      />
    </>
  );
}
