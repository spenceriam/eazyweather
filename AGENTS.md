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

## Architecture
- **Frontend**: React 18 with TypeScript, built with Vite
- **Styling**: Tailwind CSS for responsive design with centered content layout
- **Weather Data**: National Weather Service API (api.weather.gov)
- **Geocoding**: OpenStreetMap Nominatim API for both forward and reverse geocoding
- **State Management**: React hooks (useState, useEffect, useCallback)
- **Icons**: Lucide React
- **Layout**: Single-page application with smooth scroll navigation and UI distinction

## Key directories
- `src/components/` - React components (Header, Footer, weather displays, calendar, location)
- `src/services/` - API services (weatherApi.ts, locationService.ts)
- `src/types/` - TypeScript interfaces and type definitions

## Single-page layout structure
The application displays all weather information in a single scrollable page with centered white content:
1. **Location Section** - Current location (City, State format) with integrated search and 4-location history
2. **Current Conditions** - Compact card with rounded edges and horizontal layout
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
- **Next phase**: Phase 3 Essential Features (starting with issue #13)
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

## Component guidelines
- **Header**: Uses anchor links for section navigation with sticky positioning
- **LocationSection**: Integrated location display, search, and 4-location history management
- **CurrentConditions**: Compact rounded card with horizontal layout (max-w-4xl)
- **HourlyForecast**: Wide, short cards showing time, icon, temperature, conditions, wind
- **SevenDayForecast**: Vertical stacking layout with centered content
- **MonthlyForecast**: Calendar grid with weather icons and temperature averages
- All major sections (except LocationSection) include "Back to Top" navigation buttons
- All weather sections use centered white content with darker gray sides (max-w-4xl mx-auto)

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
- **Layout**: Centered white content (max-w-4xl) with darker gray sides (#E5E7EB)
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