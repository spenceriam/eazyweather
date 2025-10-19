import { Radio } from 'lucide-react';

export function RadarPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <Radio className="w-20 h-20 text-gray-300 mb-6" />
      <h3 className="text-2xl font-semibold text-gray-800 mb-3">Radar Coming Soon</h3>
      <p className="text-gray-600 text-center max-w-md leading-relaxed">
        Interactive weather radar functionality is currently in development.
        Check back soon for live radar imagery and precipitation tracking.
      </p>
    </div>
  );
}
