export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-gray-600 text-lg">Loading weather data...</p>
    </div>
  );
}
