import type { ReleaseNote } from '../types/whatsNew';

/**
 * Release notes for EazyWeather
 *
 * Instructions for adding new release notes:
 * 1. Add a new ReleaseNote object to the array below
 * 2. Set the version to match package.json
 * 3. Group changes by category: 'feature', 'improvement', 'fix', 'visual', 'analytics'
 * 4. Include PR numbers and URLs for reference
 * 5. Write user-friendly descriptions (focus on benefits, not technical details)
 *
 * See AGENTS.md for detailed instructions on maintaining this file.
 */
export const releaseNotes: ReleaseNote[] = [
  {
    version: '1.3.1',
    date: 'January 2025',
    changes: [
      // Location Features
      {
        title: 'Pin my location',
        description: 'New modal with draggable map to manually pin your exact location; persists and overrides auto-location.',
        prNumber: 44,
        prUrl: 'https://github.com/spenceriam/eazyweather/pull/44',
        category: 'feature',
      },
      {
        title: 'First-run experience',
        description: 'App now shows Chicago weather immediately with an initial location modal guiding GPS or search.',
        prNumber: 25,
        prUrl: 'https://github.com/spenceriam/eazyweather/pull/25',
        category: 'feature',
      },
      {
        title: 'Better search',
        description: 'Multiple matching locations with full context, plus ZIP and ZIP+4 support with smoother loading and clearer errors.',
        prNumber: 27,
        prUrl: 'https://github.com/spenceriam/eazyweather/pull/27',
        category: 'improvement',
      },
      {
        title: 'Better search (continued)',
        description: 'Enhanced search experience with improved location context.',
        prNumber: 39,
        prUrl: 'https://github.com/spenceriam/eazyweather/pull/39',
        category: 'improvement',
      },

      // Auto-refresh & Performance
      {
        title: 'Auto-refresh improvements',
        description: 'No background refresh while hidden; instantly refreshes when you return if data is stale. Also added a full auto-refresh system with rate limiting.',
        prNumber: 38,
        prUrl: 'https://github.com/spenceriam/eazyweather/pull/38',
        category: 'improvement',
      },
      {
        title: 'Auto-refresh system',
        description: 'Comprehensive auto-refresh with intelligent rate limiting.',
        prNumber: 28,
        prUrl: 'https://github.com/spenceriam/eazyweather/pull/28',
        category: 'improvement',
      },

      // Weather Display Improvements
      {
        title: 'Clearer condition messages',
        description: 'Weather trend messages include temporal context (e.g., "tomorrow at …") with better start/end detection.',
        prNumber: 48,
        prUrl: 'https://github.com/spenceriam/eazyweather/pull/48',
        category: 'improvement',
      },
      {
        title: 'Current conditions UI',
        description: 'Removed non-functional UV Index; added conditional Wind Gust display when applicable; layout alignment fixes.',
        prNumber: 52,
        prUrl: 'https://github.com/spenceriam/eazyweather/pull/52',
        category: 'fix',
      },

      // Visual Updates
      {
        title: 'New duck logo and warm brand colors',
        description: 'Fresh branding with a friendly duck logo and warm color palette.',
        prNumber: 36,
        prUrl: 'https://github.com/spenceriam/eazyweather/pull/36',
        category: 'visual',
      },
      {
        title: 'Compact header',
        description: 'Streamlined header design for better space utilization.',
        prNumber: 24,
        prUrl: 'https://github.com/spenceriam/eazyweather/pull/24',
        category: 'visual',
      },
      {
        title: 'Branded loading screen',
        description: 'Consistent cream background and branded loading experience.',
        prNumber: 42,
        prUrl: 'https://github.com/spenceriam/eazyweather/pull/42',
        category: 'visual',
      },
      {
        title: 'Anchored footer',
        description: 'New footer with Data Sources, Privacy, and Terms links.',
        prNumber: 33,
        prUrl: 'https://github.com/spenceriam/eazyweather/pull/33',
        category: 'visual',
      },

      // Analytics
      {
        title: 'Analytics change',
        description: 'Switched from Vercel Analytics to Google Analytics for cost efficiency.',
        prNumber: 40,
        prUrl: 'https://github.com/spenceriam/eazyweather/pull/40',
        category: 'analytics',
      },
    ],
  },
  // Future releases should be added here
  // Example:
  // {
  //   version: '1.4.0',
  //   date: 'February 2025',
  //   changes: [
  //     {
  //       title: 'Dark mode',
  //       description: 'Toggle between light and dark themes for comfortable viewing.',
  //       prNumber: 123,
  //       prUrl: 'https://github.com/spenceriam/eazyweather/pull/123',
  //       category: 'feature',
  //     },
  //   ],
  // },
];

/**
 * Get the release notes for a specific version
 */
export function getReleaseNotesForVersion(version: string): ReleaseNote | undefined {
  return releaseNotes.find(note => note.version === version);
}

/**
 * Get the latest release notes
 */
export function getLatestReleaseNotes(): ReleaseNote | undefined {
  return releaseNotes[0];
}
