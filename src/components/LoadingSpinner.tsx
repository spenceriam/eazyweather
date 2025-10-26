export function LoadingSpinner() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20"
      style={{ backgroundColor: "#f9f6ee" }}
    >
      <div className="mb-6">
        <img
          src="/assets/logo.png"
          alt="EazyWeather Logo"
          className="h-24 w-auto object-contain"
        />
      </div>
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-lighter rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-brand rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-gray-600 text-lg">Loading</p>
    </div>
  );
}
