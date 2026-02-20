import { useState } from "react";
import { X, MapPin, Search } from "lucide-react";

interface InitialLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (query: string, useGPS: boolean) => void;
}

export function InitialLocationModal({
  isOpen,
  onClose,
  onLocationSelect,
}: InitialLocationModalProps) {
  const [locationInput, setLocationInput] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locationInput.trim()) {
      onLocationSelect(locationInput.trim(), false);
      setLocationInput("");
    }
  };

  const handleGPS = () => {
    onLocationSelect("", true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Welcome to EazyWeather
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Choose your location to get started
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-brand-lighter border border-brand-light dark:bg-gray-800 dark:border-gray-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-brand-dark dark:text-gray-200">
              <strong>Currently showing:</strong> Chicago, Illinois
            </p>
            <p className="text-xs text-brand dark:text-gray-400 mt-1">
              You can change this anytime using the "Change Location" button
            </p>
          </div>

          <button
            onClick={handleGPS}
            className="w-full flex items-center justify-center gap-3 bg-brand text-white px-4 py-3 rounded-md hover:bg-brand-dark transition-colors mb-6"
          >
            <MapPin className="w-5 h-5" />
            <span className="font-medium">Use My Location</span>
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Or search for a location
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                City, State or Postal Code
              </label>
              <div className="relative">
                <input
                  id="location"
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g., New York, NY or 10001"
                  className="initial-location-input w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  autoFocus
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!locationInput.trim()}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-brand dark:hover:text-gray-200 disabled:cursor-not-allowed disabled:text-gray-300 transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
