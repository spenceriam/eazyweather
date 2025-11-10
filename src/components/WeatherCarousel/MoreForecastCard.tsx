import { WeatherCard } from './WeatherCard';
import { Calendar } from 'lucide-react';

interface MoreForecastCardProps {
  onNavigate: () => void;
}

export function MoreForecastCard({ onNavigate }: MoreForecastCardProps) {
  return (
    <WeatherCard
      title="SEE MORE FORECASTS"
      onClick={onNavigate}
      className="cursor-pointer hover:shadow-xl transition-shadow"
    >
      <div className="flex flex-col items-center justify-center text-center h-full py-8">
        <div className="mb-6">
          <Calendar className="w-20 h-20 text-brand-dark" />
        </div>
        <p className="text-gray-600 mb-6 px-4">
          Want more than 3 days ahead?
        </p>
        <button
          className="bg-brand text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-dark transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate();
          }}
        >
          View 7-Day Forecast
        </button>
        <p className="text-sm text-gray-500 mt-4 px-4">
          Click to see detailed forecasts below
        </p>
      </div>
    </WeatherCard>
  );
}
