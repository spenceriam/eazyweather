export function LoadingSpinner() {
  const lightLogoSrc = "/Eazy_Weather_Logo_Black-trans.png";
  const darkLogoSrc = "/Eazy_Weather_Logo_White-trans.png";

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-6">
        <img
          src={lightLogoSrc}
          alt="EazyWeather Logo"
          className="h-24 w-auto object-contain dark:hidden"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/assets/logo.png";
          }}
        />
        <img
          src={darkLogoSrc}
          alt="EazyWeather Logo"
          className="h-24 w-auto object-contain hidden dark:block"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/assets/logo.png";
          }}
        />
      </div>
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-lighter dark:border-gray-600 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-brand rounded-full border-t-transparent dark:border-transparent dark:border-t-gray-100 dark:border-r-gray-300 animate-spin"></div>
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-lg">Loading weather data...</p>
      <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
        This may take a moment for new locations
      </p>
    </div>
  );
}
