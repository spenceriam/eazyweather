# AGENTS.md

## Setup commands
- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Build for production: `npm run build`
- Run type checking: `npm run typecheck`
- Run linter: `npm run lint`

## Project overview
EazyWeather is a single-page React + TypeScript weather application that displays comprehensive weather information in a scrollable layout. The app features location-based weather updates with GPS support, current conditions as a hero section, vertical forecasts, and a monthly calendar view. All weather data is sourced from the National Weather Service API with no third-party weather services required.

## Architecture
- **Frontend**: React 18 with TypeScript, built with Vite
- **Styling**: Tailwind CSS for responsive design
- **Weather Data**: National Weather Service API (api.weather.gov)
- **Geocoding**: OpenStreetMap Nominatim API
- **State Management**: React hooks (useState, useEffect)
- **Icons**: Lucide React
- **Layout**: Single-page application with smooth scroll navigation

## Key directories
- `src/components/` - React components (Header, Footer, weather displays, calendar)
- `src/services/` - API services (weatherApi.ts, locationService.ts)
- `src/types/` - TypeScript interfaces and type definitions

## Single-page layout structure
The application displays all weather information in a single scrollable page:
1. **Location Section** - Current location with change option
2. **Current Conditions** - Hero section with prominent display
3. **Hourly Forecast** - Vertical layout with 24-hour toggle
4. **7-Day Forecast** - Vertical stacking of daily forecasts
5. **Monthly Forecast** - Calendar grid with temperature averages

## Development workflow
1. All new components should be TypeScript with proper interfaces
2. Use Tailwind CSS classes for styling, avoid inline styles
3. Weather API calls should go through `weatherApi.ts` service
4. Location handling should use `locationService.ts` service
5. Error handling should display user-friendly messages via ErrorMessage component
6. Use semantic HTML5 elements for better accessibility
7. Implement smooth scrolling between sections using anchor links

## Code style
- TypeScript strict mode enabled
- Functional components with hooks
- Single quotes, trailing commas where appropriate
- Component files use PascalCase naming
- Service files use camelCase naming
- Interfaces exported separately from implementations
- Use semantic section IDs for navigation (location, current, hourly, forecast, monthly)

## Component guidelines
- **Header**: Uses anchor links for section navigation
- **CurrentConditions**: Prominent hero section styling
- **HourlyForecast**: Vertical card layout with toggle functionality
- **SevenDayForecast**: Vertical stacking layout
- **MonthlyForecast**: Calendar grid with weather icons and temperature averages
- **LocationSection**: Integrated location display and change functionality
- All major sections include "Back to Top" navigation buttons

## Testing
- Current test suite is minimal - expand coverage when adding new features
- Test weather API integration and error states
- Test location services and geocoding functionality
- Ensure smooth scrolling and navigation work correctly
- Test responsive design across all viewport sizes
- Test calendar layout and monthly data calculations

## API considerations
- National Weather Service API requires proper User-Agent headers
- Geocoding API calls include user agent identification
- All API calls include proper error handling and loading states
- Monthly forecast data is calculated from available 7-day forecast data
- No moon phase data - removed due to API limitations
- Weather data is cached per session to reduce API calls

## Environment variables
No environment variables required - all APIs are free and public.

## Build and deployment
- Production build outputs to `dist/` directory
- Static site suitable for deployment on any hosting platform
- No server-side rendering required
- Single-page application with client-side routing only

## Monthly calendar implementation
- Uses 7-day forecast data for current week
- Calculates average temperatures for remaining days of month
- Displays weather conditions with appropriate icons
- Grid layout similar to traditional calendar
- Shows temperature averages (high/low combined)