/**
 * EazyWeather - Simple, ad-free weather
 * Copyright (c) 2025 Spencer Francisco
 * Licensed under MIT License
 * Contact: https://x.com/spencer_i_am
 */

import { Loader2 } from "lucide-react";

export function LocationPermissionOverlay() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 px-4">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
        <div className="text-center">
          <p className="text-white text-lg font-medium">
            Requesting location access...
          </p>
          <p className="text-white/80 text-sm mt-2">
            Please allow location permissions to continue
          </p>
        </div>
      </div>
    </div>
  );
}
