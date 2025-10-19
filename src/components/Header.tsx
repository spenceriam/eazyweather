import { MapPin, Cloud } from 'lucide-react';
import type { ViewMode } from '../types/weather';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  locationName: string;
  onLocationClick: () => void;
}

export function Header({ currentView, onViewChange, locationName, onLocationClick }: HeaderProps) {
  const views: { id: ViewMode; label: string }[] = [
    { id: 'current', label: 'Current' },
    { id: 'forecast', label: '7-Day' },
    { id: 'hourly', label: 'Hourly' },
    { id: 'radar', label: 'Radar' }
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-8 h-8 text-blue-500" strokeWidth={1.5} />
              <h1 className="text-2xl font-light text-gray-800">
                EazyWeather
              </h1>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={onLocationClick}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors group"
            >
              <MapPin className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
              <span className="text-sm font-medium">{locationName}</span>
            </button>

            <nav className="flex gap-2 flex-wrap">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => onViewChange(view.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === view.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
