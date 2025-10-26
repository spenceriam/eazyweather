import { useRef } from "react";

interface HeaderProps {
  locationName: string;
}

export function Header({ locationName }: HeaderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  const navItems = [
    { id: "current", label: "Current" },
    { id: "hourly", label: "Hourly" },
    { id: "forecast", label: "7-Day" },
    { id: "monthly", label: "Monthly" },
  ];

  const handleLogoClick = () => {
    // Prevent spam - only play if not currently playing
    if (isPlayingRef.current) {
      return;
    }

    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio("/assets/quack.mp3");
      audioRef.current.volume = 0.5; // Set volume to 50%
    }

    // Reset audio to beginning if it was played before
    audioRef.current.currentTime = 0;

    // Mark as playing
    isPlayingRef.current = true;

    // Play the sound
    audioRef.current
      .play()
      .then(() => {
        // Successfully started playing
      })
      .catch((error) => {
        // Handle error silently (e.g., user hasn't interacted with page yet)
        console.log("Audio play prevented:", error);
        isPlayingRef.current = false;
      });

    // Reset playing flag when audio ends
    audioRef.current.onended = () => {
      isPlayingRef.current = false;
    };
  };

  return (
    <header
      className="shadow-sm border-b border-gray-200 sticky top-0 z-10"
      style={{ backgroundColor: "#f9f6ee" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo - 40% bigger on mobile (h-14 vs h-10) */}
          <div className="flex items-center justify-center md:justify-start">
            <img
              src="/assets/logo.png"
              alt="EazyWeather Logo"
              className="h-14 md:h-12 lg:h-14 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handleLogoClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleLogoClick();
                }
              }}
            />
          </div>

          {/* Desktop: Nav only (location removed - redundant) */}
          <div className="hidden md:flex items-center gap-4">
            <nav className="flex gap-2">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="px-4 py-2 bg-brand text-white rounded-md text-sm font-medium hover:bg-brand-dark transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Mobile: Nav buttons only (no location) - spanning horizontally */}
          <nav className="md:hidden grid grid-cols-4 gap-2">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="px-2 py-2 bg-brand text-white rounded-md text-xs font-medium hover:bg-brand-dark transition-colors text-center"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
