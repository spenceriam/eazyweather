export interface ChangelogEntry {
  version: string;
  date: string;
  type: "major" | "minor" | "patch";
  title: string;
  changes: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: "1.9.2",
    date: "December 7, 2025",
    type: "patch",
    title: "Routing Fixes",
    changes: [
      "Fixed issue where accessing direct location URLs (like /60050) would cause a 404 error.",
    ],
  },
  {
    version: "1.9.1",
    date: "December 7, 2025",
    type: "patch",
    title: "URL Location Fixes",
    changes: [
      "Fixed issue with trailing slashes in URL locations",
      "Improved routing configuration for better deep link support",
    ],
  },
  {
    version: "1.9.0",
    date: "December 7, 2025",
    type: "minor",
    title: "Direct URL Location Loading",
    changes: [
      "Added support for loading a specific location by appending a ZIP code to the URL (e.g., eazyweather.com/60050)",
      "URL locations temporarily override saved preferences without overwriting them, perfect for bookmarking",
      "Automatically resolves ZIP codes to display city and state names",
    ],
  },
  {
    version: "1.8.3",
    date: "November 27, 2025",
    type: "patch",
    title: "Fix Sunrise/Sunset Timezone Display",
    changes: [
      "Fixed incorrect sunrise/sunset times on mobile and when viewing different timezones",
      "Ensure all times are displayed in the location's timezone rather than the device's timezone",
      "Improved day/night icon logic to use actual location sunrise/sunset times",
    ],
  },
  {
    version: "1.8.2",
    date: "November 23, 2025",
    type: "patch",
    title: "Fix Forecast Timezone Issue",
    changes: [
      "Fixed an issue where forecasts were skipped in late evening due to timezone differences",
      "Ensure current time is correctly converted to local time for date comparisons",
    ],
  },
  {
    version: "1.8.1",
    date: "November 23, 2025",
    type: "patch",
    title: "Fix Evening Forecast Gap",
    changes: [
      "Fixed a bug where the next day's forecast was missing during evening hours",
      "Ensure tomorrow's forecast is always displayed correctly regardless of time of day",
    ],
  },
  {
    version: "1.8.0",
    date: "November 22, 2025",
    type: "minor",
    title: "Enhanced Location Persistence",
    changes: [
      "Added hybrid storage system using cookies to ensure location is remembered reliably across all browsers and sessions",
      "Extended location memory duration to 6 months (optional)",
      "Added consent modal for location persistence choices",
      "Updated privacy policy to reflect new storage options",
    ],
  },
  {
    version: "1.7.1",
    date: "November 22, 2025",
    type: "patch",
    title: "Performance Fix for Initial Load",
    changes: [
      "Fixed a critical issue causing a 30-second delay on initial page load",
      "Optimized API caching strategy for weather location metadata",
      "Improved reliability of monthly forecast loading",
    ],
  },
  {
    version: "1.7.0",
    date: "November 15, 2025",
    type: "minor",
    title: "Enhanced Monthly Calendar with Real Weather History",
    changes: [
      "Monthly calendar now shows actual past weather instead of estimates",
      "See what the weather was really like on earlier days this month",
      "More accurate predictions for remaining days based on historical weather patterns",
      "Clearer labels showing which days are actual data vs predictions",
      "Faster loading with smart caching of historical weather information",
    ],
  },
  {
    version: "1.6.1",
    date: "November 15, 2025",
    type: "patch",
    title: "Wider Content Layout for Desktop",
    changes: [
      "Weather sections now use more of your screen on desktop and laptop computers",
      "Weather carousel width now matches the sections below for a cleaner, more aligned look",
      "Mobile and tablet experience remains the same",
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
