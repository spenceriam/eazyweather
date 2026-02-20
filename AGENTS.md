# AGENTS.md

## Setup commands
- Install dependencies: `npm install`
- Start development server: `npm run dev` (check if already running on ports 5173/5174)
- Build for production: `npm run build`
- Run type checking: `npm run typecheck`
- Run linter: `npm run lint`

## Project overview
EazyWeather is a single-page React + TypeScript weather application that displays comprehensive weather information in a scrollable layout with centered white content and darker sides. The app features advanced location services with reverse geocoding for proper City, State/Province/Country display, location search with 4-location cache history, and all weather data sourced from the National Weather Service API with no third-party weather services required.

## Development workflow discipline
- **CRITICAL**: NEVER commit or push changes without explicit user approval
- **ALWAYS** ask for user confirmation before any git operations
- **DEBUGGING**: Use console logs and testing to verify fixes before committing
- **WORKFLOW**: Make changes → Test → Get user approval → Then (and only then) commit → Push
- **Branch management**: Only commit to the correct issue branch
- **Code quality**: Ensure all changes work and are properly tested before seeking approval

## Version Bumping Protocol

**CRITICAL**: AI agents MUST follow this semantic versioning workflow when creating PRs.

### Semantic Versioning Format

Version numbers follow the format: **MAJOR.MINOR.PATCH** (e.g., 1.2.3)

- **MAJOR** (X.0.0): Breaking changes, API changes, architectural overhauls
  - Example: 1.5.2 → 2.0.0
- **MINOR** (0.X.0): New features, new components, significant enhancements (backwards compatible)
  - Example: 1.5.2 → 1.6.0
- **PATCH** (0.0.X): Bug fixes, typos, minor tweaks, performance improvements (backwards compatible)
  - Example: 1.5.2 → 1.5.3

### AI Agent Workflow for Version Bumping

**Step 1: Analyze Changes**
Before creating a PR, review all changes in your branch and categorize them.

**Step 2: Ask User for Confirmation**
Present your analysis to the user and ask for confirmation:
```
Based on the changes in this branch, I've identified:
- [List key changes]

I recommend a [PATCH/MINOR/MAJOR] version bump because [reasoning].

Current version: X.Y.Z
Proposed version: X.Y.Z

Does this classification seem correct? Should I proceed with this version bump?
```

**Step 3: Update What's New (Changelog)**
Before bumping version, update the changelog at `src/data/changelog.ts`:
- Add new entry at the TOP of the changelog array
- Use current date in format "Month DD, YYYY"
- Set type to "patch", "minor", or "major"
- Write clear, user-friendly title (e.g., "Wider Content Layout for Desktop")
- List changes as bullet points describing what users will see/experience
- Keep descriptions concise and benefit-focused

**Step 4: Apply Version Bump**
After updating changelog, bump the version IN the feature branch BEFORE creating PR:
```bash
npm version patch  # or minor, or major
git push && git push --tags
```

**Step 5: Document in PR**
- Update PR title to include new version (e.g., "Fix loading spinner (v1.5.3)")
- Mention version bump and reasoning in PR description
- List what changed to justify the bump type

### Decision Tree for AI Agents

**MAJOR bump (X.0.0)** - Use when:
- Removing or renaming public components or APIs
- Changing component props in breaking ways
- Restructuring application architecture
- Changing build output or deployment requirements
- Any change that requires users/developers to modify their code

**MINOR bump (0.X.0)** - Use when:
- Adding new feature or component
- Adding new props or options (backwards compatible)
- Significant enhancement to existing feature
- Adding new API endpoints or services
- Adding analytics, logging, or monitoring
- New user-facing functionality

**PATCH bump (0.0.X)** - Use when:
- Fixing bugs or errors
- Correcting typos in UI text
- Improving error messages or logging
- CSS/styling fixes or adjustments
- Performance optimizations (no API changes)
- Accessibility improvements
- Dependency updates (no breaking changes)
- Security patches

**SKIP version bump** - Use when:
- Updating documentation only (README, comments)
- Modifying AGENTS.md or workflow files
- Changing CI/CD configurations
- Updating .gitignore or similar tooling files
- In these cases, label PR with `version:skip` or similar

### Examples

**PATCH: 1.0.2 → 1.0.3**
- "Fix loading screen background color consistency"
- "Correct error handling in location service"
- "Improve responsive layout on mobile devices"

**MINOR: 1.0.3 → 1.1.0**
- "Add ZIP code search functionality"
- "Replace Vercel Analytics with Google Analytics"
- "Add new weather radar visualization component"

**MAJOR: 1.5.2 → 2.0.0**
- "Redesign weather API service with new data structure"
- "Remove deprecated weatherApi.fetchByCity() method"
- "Change from NWS API to OpenWeather API"

### Integration with Existing Workflow

Version bumping happens IN the feature branch, BEFORE creating the PR:

1. Create feature branch: `git checkout -b issue-X-description`
2. Make your changes and test thoroughly
3. **Analyze changes and ask user about version bump type**
4. **Bump version**: `npm version patch/minor/major`
5. Push branch with tags: `git push && git push --tags`
6. Create PR with version noted in title/description
7. User reviews and merges to main

### Verification Commands

```bash
# Check current version
grep '"version"' package.json

# Check if tags exist
git tag -l | tail -5

# View recent version bumps
git log --oneline --grep="version" -10
```

### When You Forget

If a PR was already created without version bump:
1. Checkout the PR branch locally
2. Run `npm version patch/minor/major`
3. Push: `git push && git push --tags`
4. Update PR description to mention version

### Human Override

Users can always override AI agent version decisions:
- Manually edit package.json
- Run `npm version X.Y.Z` to set specific version
- Document reasoning in PR comments
- AI agents should defer to user judgment when corrected

## Architecture
- **Frontend**: React 18 with TypeScript, built with Vite
- **Styling**: Tailwind CSS for responsive design with centered content layout
- **Weather Data**: National Weather Service API (api.weather.gov)
- **Geocoding**: OpenStreetMap Nominatim API for both forward and reverse geocoding
- **State Management**: React hooks (useState, useEffect, useCallback)
- **Icons**: Lucide React
- **Carousel**: Embla Carousel React for weather preview carousel
- **Layout**: Single-page application with smooth scroll navigation and UI distinction

## Key directories
- `src/components/` - React components (Header, Footer, weather displays, calendar, location)
- `src/services/` - API services (weatherApi.ts, locationService.ts)
- `src/types/` - TypeScript interfaces and type definitions

## Single-page layout structure
The application displays all weather information in a single scrollable page with centered white content:
1. **Location Section** - Current location (City, State format) with integrated search and 4-location history
2. **Weather Carousel** - Interactive carousel with current conditions and 3-day forecast preview (replaces static Current Conditions)
3. **Hourly Forecast** - Wide, short cards with complete weather details
4. **7-Day Forecast** - Vertical stacking of daily forecasts
5. **Monthly Forecast** - Calendar grid with temperature averages

## Development workflow
1. **ALWAYS** create a new branch for each issue: `git checkout -b issue-{number}-description`
2. Work on features in the branch, commit changes with descriptive messages
3. Create a Pull Request when work is complete (DO NOT MERGE - user handles merges)
4. Update issue status and priority document to track progress
5. All new components should be TypeScript with proper interfaces
6. Use Tailwind CSS classes for styling, avoid inline styles
7. Weather API calls should go through `weatherApi.ts` service
8. Location handling should use `locationService.ts` service with reverse geocoding
9. Error handling should display user-friendly messages via ErrorMessage component
10. Use semantic HTML5 elements for better accessibility
11. Implement smooth scrolling between sections using anchor links
12. **IMPORTANT**: Always check if dev server is running before starting another one

## Branch and PR workflow
- **Branch naming**: `issue-{number}-brief-description` (e.g., `issue-5-better-initial-loading`)
- **Commit messages**: Include issue number and clear description (e.g., "Fix issue #5: Implement better initial loading experience")
- **PR creation**: Create PR from branch to main, reference issue number in description
- **DO NOT MERGE**: User handles all PR merges
- **Issue tracking**: Close issues and comment when completed
- **Priority document**: Update `priority_enhancements.md` to mark completed issues
- **Local testing**: After completing changes, always offer to run locally to test changes
- **Dev server**: Never forcefully start dev server - provide clear instructions for user to start it

## Progress tracking
- **Phase 1 Complete**: All Quick Wins finished (issues #4, #14, #16)
- **Phase 2 Complete**: All Core UX Improvements finished (issues #5, #3, #6)
- **Phase 3 In Progress**: Essential Features
  - ✅ Issue #46: Weather carousel with current conditions + 3-day preview (v1.6.0)
- **Major milestone**: All high-priority UX issues completed!
- **Documentation**: Always update priority_enhancements.md and close issues with completion comments

## Code style
- TypeScript strict mode enabled
- Functional components with hooks
- Single quotes, trailing commas where appropriate
- Component files use PascalCase naming
- Service files use camelCase naming
- Interfaces exported separately from implementations
- Use semantic section IDs for navigation (location, current, hourly, forecast, monthly)

## Changelog and What's New Modal
- **Changelog Data**: Located at `src/data/changelog.ts` - update this when making releases
- **What's New Modal**: Accessible from Footer, displays changelog entries to users
- **Structure**: Each entry has version, date, type (major/minor/patch), title, and changes array
- **Always update**: When bumping version, add new entry at TOP of changelog array BEFORE running npm version

## Component guidelines
- **Header**: Uses anchor links for section navigation with sticky positioning
  - Section anchor targets (`#current`, `#hourly`, `#forecast`, `#monthly`) must keep sticky-header-safe scroll offsets (`scroll-mt-24 md:scroll-mt-28`) so nav buttons park with section titles/content fully visible
- **LocationSection**: Integrated location display, search, and 4-location history management
- **WeatherCarousel**: Interactive Embla carousel with 5 cards (current conditions + 3-day forecast + navigation card), supports touch/drag, 2 cards visible on desktop, 1 on mobile, hover-visible navigation arrows
  - Cards use shadow-lg with proper padding to prevent clipping
  - Skips first daytime forecast period to avoid duplicate "today"
  - Wind directions abbreviated (N, NNE, SW, etc.)
  - Smooth scroll to 7-day forecast on navigation card click
- **HourlyForecast**: Wide, short cards showing time, icon, temperature, conditions, wind
- **SevenDayForecast**: Vertical stacking layout with centered content
- **MonthlyForecast**: Calendar grid with weather icons and temperature averages
- **RadarModal**: Interactive map-based radar with frame timeline, center/recenter controls, and refresh action
  - Keep a single timeline control (slider) as both progress indicator and manual frame scrubber; do not add a second progress bar.
  - Keep playback control bottom-center with safe padding away from map zoom controls.
  - Keep recenter control top-right and refresh directly underneath for consistent mobile ergonomics.
- All major sections (except LocationSection) include "Back to Top" navigation buttons
- All weather sections use centered white content with darker gray sides (max-w-6xl mx-auto)

## Location services
- **Reverse Geocoding**: Converts GPS coordinates to "City, State" or "City, Country" format
- **Location History**: Stores last 4 searched locations in localStorage
- **Search Functionality**: Forward geocoding with city, state, country, or ZIP code input
- **Browser Location**: Graceful fallback to search when location access is denied
- **Display Format**: 
  - US/Canada: "City, State" (e.g., "New York, NY")
  - International: "City, Country" (e.g., "Paris, France")
  - Fallback: Coordinates if geocoding fails

## Testing
- Current test suite is minimal - expand coverage when adding new features
- Test weather API integration and error states
- Test location services and geocoding functionality (both forward and reverse)
- Test location history management and persistence
- Ensure smooth scrolling and navigation work correctly
- Test responsive design across all viewport sizes
- Test calendar layout and monthly data calculations
- Test search functionality with various location formats

## API considerations
- National Weather Service API requires proper User-Agent headers
- OpenStreetMap Nominatim API requires User-Agent identification
- All API calls include proper error handling and loading states
- Monthly forecast data is calculated from available 7-day forecast data
- No moon phase data - removed due to API limitations
- Weather data is cached per session to reduce API calls
- Location data is cached for 24 hours in localStorage

## Environment variables
No environment variables required - all APIs are free and public.

## Build and deployment
- Production build outputs to `dist/` directory
- Static site suitable for deployment on any hosting platform
- No server-side rendering required
- Single-page application with client-side routing only

## UI/UX patterns
- **Layout**: Centered white content (max-w-6xl) with darker gray sides (#E5E7EB)
- **Cards**: Rounded corners, shadows, hover effects
- **Navigation**: Smooth scrolling with sticky header
- **Search**: Integrated with history, clear button, and recent locations
- **Responsive**: Mobile-first design with appropriate breakpoints
- **Loading States**: Proper loading indicators for all async operations

## Monthly calendar implementation
- Uses 7-day forecast data for current week
- Calculates average temperatures for remaining days of month
- Displays weather conditions with appropriate icons
- Grid layout similar to traditional calendar
- Shows temperature averages (high/low combined)
- Blue highlighting for available forecast data, gray for estimated

## Development server notes
- Default port: 5173, automatically tries 5174 if 5173 is in use
- Always check existing processes before starting: `lsof -ti:5173,5174 | xargs kill -9`
- Hot reload enabled for development
- TypeScript errors shown in browser console
