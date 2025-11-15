export interface ChangelogEntry {
  version: string;
  date: string;
  type: "major" | "minor" | "patch";
  title: string;
  changes: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: "1.6.1",
    date: "November 15, 2025",
    type: "patch",
    title: "Wider Content Layout for Desktop",
    changes: [
      "Increased content width from 896px to 1152px for better use of desktop screen space",
      "Aligned carousel width with all weather sections for consistent visual layout",
      "All weather sections (Carousel, Hourly, 7-Day, Monthly) now use unified max-w-6xl width",
      "Mobile and tablet views remain unchanged",
    ],
  },
  {
    version: "1.6.0",
    date: "November 14, 2025",
    type: "minor",
    title: "Interactive Weather Carousel",
    changes: [
      "Replaced static Current Conditions with interactive carousel featuring current weather + 3-day forecast preview",
      "Added touch/drag navigation with smooth scrolling animations",
      "Desktop shows 2 cards side-by-side, mobile shows 1 card at a time",
      "Hover-activated navigation arrows on desktop for easy browsing",
      "Abbreviated wind directions (N, NNE, SW, etc.) for cleaner display",
      "Added navigation card to quickly jump to full 7-day forecast",
      "Detailed forecast descriptions included on each day card",
    ],
  },
  {
    version: "1.5.0",
    date: "November 9, 2025",
    type: "minor",
    title: "Location Controls Redesign",
    changes: [
      "Moved location display to header with convenient gear icon dropdown",
      "Improved gear icon toggle behavior for smoother interaction",
    ],
  },
  {
    version: "1.4.0",
    date: "November 9, 2025",
    type: "minor",
    title: "Visual Enhancements",
    changes: [
      "Added beautiful glassmorphism effects to all modal backdrops",
      "Enhanced location permission overlay with blur effect for better focus",
      "Added opaque overlay during location permission requests",
    ],
  },
  {
    version: "1.3.x",
    date: "October 31 - November 9, 2025",
    type: "patch",
    title: "Weather Display & UX Improvements",
    changes: [
      "Fixed wind display and alignment issues for cleaner weather cards",
      "Corrected calm wind display and wind gust positioning",
      "Increased font size on hourly forecast cards for better readability",
      "Improved 7-day forecast card details and layout",
      "Fixed critical infinite loop in refresh service",
      "Reduced console logs to essential errors and warnings only",
      "Fixed pin modal map height for smaller laptop screens",
      "Removed UV Index and replaced with conditional Wind Gust display",
    ],
  },
  {
    version: "1.2.0",
    date: "October 31, 2025",
    type: "minor",
    title: "Interactive Location Pin Feature",
    changes: [
      "Added interactive map for precise location refinement",
      "Introduced location pinning to save preferred locations",
      "Improved location search with pin confirmation workflow",
    ],
  },
  {
    version: "1.1.x",
    date: "October 31, 2025",
    type: "minor",
    title: "Analytics & UI Polish",
    changes: [
      "Replaced Vercel Analytics with Google Analytics",
      "Fixed loading screen background color consistency",
      "Improved footer formatting and layout",
    ],
  },
  {
    version: "1.0.x",
    date: "October 21-25, 2025",
    type: "major",
    title: "Initial Release - Core Features",
    changes: [
      "Real-time weather data from National Weather Service",
      "Current conditions with temperature, wind, and humidity",
      "Hourly, 7-day, and monthly forecasts",
      "Weather trend comments for better context",
      "Sunrise and sunset times integration",
      "Auto-refresh with rate limiting",
      "Enhanced location search with disambiguation",
      "Mobile-responsive hourly forecast layout",
      "Branded loading experience with duck logo",
      "Initial location modal for better onboarding",
      "Custom brand color scheme with warm cream backgrounds",
    ],
  },
];
