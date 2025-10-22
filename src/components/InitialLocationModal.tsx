import { useState } from 'react';
import { X, MapPin, Search } from 'lucide-react';

interface InitialLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (query: string, useGPS: boolean) => void;
}

export function InitialLocationModal({ isOpen, onClose, onLocationSelect }: InitialLocationModalProps) {
  const [locationInput, setLocationInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locationInput.trim()) {
      onLocationSelect(locationInput.trim(), false);
      setLocationInput('');
    }
  };

  const handleGPS = () => {
    onLocationSelect('', true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Welcome to EazyWeather</h2>
            <p className="text-sm text-gray-600 mt-1">Choose your location to get started</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Currently showing:</strong> Chicago, Illinois
            </p>
            <p className="text-xs text-blue-600 mt-1">
              You can change this anytime using the "Change Location" button
            </p>
          </div>

          <button
            onClick={handleGPS}
            className="w-full flex items-center justify-center gap-3 bg-blue-500 text-white px-4 py-3 rounded-md hover:bg-blue-600 transition-colors mb-6"
          >
            <MapPin className="w-5 h-5" />
            <span className="font-medium">Use My Current Location</span>
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or search for a location</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                City, State or Postal Code
              </label>
              <div className="relative">
                <input
                  id="location"
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g., New York, NY or 10001"
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="text-xs text-gray-500 mb-4 space-y-1">
              <p>Examples:</p>
              <ul className="list-disc list-inside pl-2 space-y-1">
                <li>Seattle, WA</li>
                <li>Miami, Florida</li>
                <li>90210</li>
                <li>Austin, TX, USA</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Use Chicago
              </button>
              <button
                type="submit"
                disabled={!locationInput.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
