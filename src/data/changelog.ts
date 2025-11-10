export interface ChangelogEntry {
  version: string;
  date: string;
  type: "major" | "minor" | "patch";
  title: string;
  changes: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: "1.5.0",
    date: "January 2025",
    type: "minor",
    title: "Location Controls Redesign",
    changes: [
      "Moved location display to header with convenient gear icon dropdown",
      "Improved gear icon toggle behavior for smoother interaction",
    ],
  },
  {
    version: "1.4.0",
    date: "January 2025",
    type: "minor",
    title: "Visual Enhancements",
    changes: [
      "Added beautiful glassmorphism effects to all modal backdrops",
      "Enhanced location permission overlay with blur effect for better focus",
    ],
  },
  {
    version: "1.3.x",
    date: "January 2025",
    type: "patch",
    title: "Weather Display Improvements",
    changes: [
      "Fixed wind display and alignment issues for cleaner weather cards",
      "Corrected calm wind display and wind gust positioning",
      "Increased font size on hourly forecast cards for better readability",
    ],
  },
];
