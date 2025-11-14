# Carousel Weather Cards - Implementation Proposal

**Issue #46**: Transform Current Conditions into a Horizontal Carousel
**Date**: 2025-11-10
**Status**: Awaiting Approval

---

## Executive Summary

This proposal outlines the transformation of the Current Conditions section into a horizontal carousel displaying weather cards for:
1. **Current conditions** (Now)
2. **Tomorrow's forecast**
3. **Next 3 days** (Day 2, 3, 4)
4. **"See 7-Day Forecast" card** (navigation card)

**Total**: 6 cards in the carousel

---

## Visual Mockup

### Desktop Layout (2 cards visible)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌──────────────────────────┐   ┌──────────────────────────┐          │
│  │         NOW              │   │       TOMORROW           │  ···  →  │
│  │                          │   │                          │          │
│  │         ☀️              │   │         ⛅               │          │
│  │                          │   │                          │          │
│  │        72°               │   │        68°               │          │
│  │    Partly Cloudy         │   │   Mostly Cloudy          │          │
│  │                          │   │                          │          │
│  │  High/Low:  75° / 62°    │   │  High/Low:  68° / 55°    │          │
│  │  Real feel: 74°          │   │  Real feel: 66°          │          │
│  │  Dew point: 58°          │   │  Dew point: 52°          │          │
│  │  Humidity:  65%          │   │  Humidity:  70%          │          │
│  │  Wind:      8 mph NW     │   │  Wind:      12 mph N     │          │
│  │  Sunrise:   6:42 AM      │   │  Sunrise:   6:43 AM      │          │
│  │  Sunset:    5:28 PM      │   │  Sunset:    5:27 PM      │          │
│  │                          │   │                          │          │
│  └──────────────────────────┘   └──────────────────────────┘          │
│                                                                         │
│                       ○ ● ○ ○ ○ ○                                      │
│                    (carousel indicators)                                │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (1 card visible)

```
┌──────────────────────────┐
│         NOW              │
│                          │
│         ☀️              │
│                          │
│        72°               │
│    Partly Cloudy         │
│                          │
│  High/Low:  75° / 62°    │
│  Real feel: 74°          │
│  Dew point: 58°          │
│  Humidity:  65%          │
│  Wind:      8 mph NW     │
│  Sunrise:   6:42 AM      │
│  Sunset:    5:28 PM      │
│                          │
└──────────────────────────┘
         ● ○ ○ ○ ○ ○
```

### Card 6: "See 7-Day Forecast"

```
┌──────────────────────────┐
│   SEE MORE FORECASTS     │
│                          │
│          📅              │
│                          │
│   Want more than 3       │
│   days ahead?            │
│                          │
│   ┌────────────────────┐ │
│   │ View 7-Day Forecast│ │
│   └────────────────────┘ │
│                          │
│   Click to see detailed  │
│   forecasts below        │
│                          │
└──────────────────────────┘
```

---

## Card Specifications

### Card Dimensions
- **Width**: `~420px` (approximately half of current `max-w-4xl`)
- **Height**: Auto (based on content)
- **Padding**: `p-6` (24px)
- **Border Radius**: `rounded-2xl`
- **Shadow**: `shadow-lg` with hover effect
- **Gap between cards**: `gap-4` (16px)

### Card Content Structure

Each weather card contains:

1. **Header**: Day name (NOW, TOMORROW, WEDNESDAY, etc.)
2. **Weather Icon**: 100px (slightly smaller than current 120px)
3. **Temperature**: Large font (text-5xl)
4. **Short Description**: "Partly Cloudy", etc.
5. **Details Grid**: 2-column layout
   - High / Low
   - Real feel
   - Dew point
   - Humidity
   - Wind (abbreviated direction)
   - Sunrise
   - Sunset

### Content Abbreviations

**Wind Directions** (abbreviated):
- North → N
- Northeast → NE
- East → E
- Southeast → SE
- South → S
- Southwest → SW
- West → W
- Northwest → NW
- North by Northeast → NNE
- East by Northeast → ENE
- East by Southeast → ESE
- South by Southeast → SSE
- South by Southwest → SSW
- West by Southwest → WSW
- West by Northwest → WNW
- North by Northwest → NNW

**Wind Display Example**:
- Before: "8 mph North by Northwest"
- After: "8 mph NNW"

---

## Data Mapping Strategy

### Current Weather Card (Card 1: "NOW")
**Data Source**: `CurrentConditions` interface
- Use existing current conditions data
- Show all current metrics (temp, humidity, wind, etc.)
- Display today's high/low from `todayHigh` and `todayLow`

### Forecast Cards (Cards 2-5: Tomorrow + 3 days)
**Data Source**: `ForecastPeriod[]` array (14 periods from NWS API)

**Mapping Logic**:
```typescript
// Group forecast periods by calendar day
// Period 1: "Tonight" or "This Afternoon"
// Period 2: "Thursday" (daytime)
// Period 3: "Thursday Night"
// Period 4: "Friday" (daytime)
// Period 5: "Friday Night"
// ... etc.

// For each card, combine day + night periods:
// - Use daytime temperature as "High"
// - Use nighttime temperature as "Low"
// - Use daytime icon and description
// - Average wind speeds if needed
// - Use daytime sunrise/sunset
```

**Example Grouping**:
- **Card 2 (Tomorrow)**: Periods 2 + 3
- **Card 3 (Day 2)**: Periods 4 + 5
- **Card 4 (Day 3)**: Periods 6 + 7
- **Card 5 (Day 4)**: Periods 8 + 9
- **Card 6**: Navigation card (no weather data)

### Navigation Card (Card 6: "SEE 7-DAY FORECAST")
- Static content
- Clickable button/card
- Smooth scroll to `#forecast` section (7-Day Forecast)

---

## Technical Implementation

### Technology Stack
**Primary**: Embla Carousel React (`embla-carousel-react`)
- Lightweight: ~8KB gzipped
- Headless (full styling control)
- Native touch support
- Mouse drag support
- Smooth animations
- No infinite loop support ✓ (stops at edges)

**Fallback**: Custom React implementation with hooks
- If Embla proves unstable
- Use `useState`, `useRef`, `useEffect`
- CSS transforms for transitions
- Touch event handlers

### Component Architecture

```
src/components/
├── WeatherCarousel/
│   ├── WeatherCarousel.tsx          (Main carousel container)
│   ├── WeatherCard.tsx               (Individual card component)
│   ├── CurrentWeatherCard.tsx        (Specialized card for "Now")
│   ├── ForecastWeatherCard.tsx       (Specialized card for forecast days)
│   ├── MoreForecastCard.tsx          (Card 6: navigation card)
│   ├── useWeatherCarousel.ts         (Custom hook for carousel logic)
│   └── weatherCarousel.types.ts      (TypeScript interfaces)
```

### New TypeScript Interfaces

```typescript
// src/types/weather.ts additions

export interface DailyForecast {
  date: string;              // "2025-11-11"
  dayName: string;           // "Tomorrow", "Wednesday", etc.
  high: number;              // Daytime high temp
  low: number;               // Nighttime low temp
  icon: string;              // Weather icon URL
  shortForecast: string;     // "Partly Cloudy"
  detailedForecast: string;  // Full description
  windSpeed: string;         // "10 mph"
  windDirection: string;     // "NW"
  humidity?: number;         // If available
  sunriseTime?: string;      // ISO timestamp
  sunsetTime?: string;       // ISO timestamp
  isDaytime: boolean;        // true
}

export interface CarouselCard {
  id: string;                // "now", "day-1", "day-2", etc.
  type: 'current' | 'forecast' | 'navigation';
  data?: CurrentConditions | DailyForecast;
}
```

---

## Animation & Interaction Details

### Swipe Behavior
- **Left swipe**: Move to next card (stop at last card)
- **Right swipe**: Move to previous card (stop at first card)
- **Transition**: Smooth 300ms ease-in-out
- **Resistance**: Slight resistance at edges (no bounce/infinite loop)

### Mouse Drag (Desktop)
- **Click and drag**: Same behavior as touch swipe
- **Cursor**: Changes to `grab` on hover, `grabbing` while dragging
- **Smooth scrolling**: Native scroll-snap behavior

### Press/Click Feedback
- **On press**: Card lifts 3-5px with subtle shadow increase
- **Transition**: 150ms ease-out
- **CSS Transform**: `translateY(-4px)` + `shadow-xl`

```css
/* Example animation */
.weather-card {
  transition: transform 150ms ease-out, box-shadow 150ms ease-out;
}

.weather-card:active {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
```

### Carousel Indicators
- **Position**: Below carousel, centered
- **Style**: Dots (circles)
  - Active: Filled circle (brand-dark color)
  - Inactive: Outlined circle (gray-400)
- **Size**: 10px diameter
- **Spacing**: 8px gap
- **Interactive**: Clickable (jump to card)

---

## Responsive Behavior

### Desktop (≥768px)
- **Cards visible**: 2 at a time
- **Card width**: ~420px each
- **Gap**: 16px
- **Container**: `max-w-7xl mx-auto`
- **Navigation**: Mouse drag + carousel indicators
- **Overflow**: Hidden with smooth scrolling

### Tablet (640px - 767px)
- **Cards visible**: 1.5 (peek effect showing next card)
- **Card width**: ~380px
- **Gap**: 16px
- **Navigation**: Touch swipe + indicators

### Mobile (<640px)
- **Cards visible**: 1 at a time
- **Card width**: Full width minus padding (100% - 32px)
- **Gap**: 16px
- **Navigation**: Touch swipe + indicators

---

## Implementation Phases

### Phase 1: Setup & Infrastructure (1-2 hours)
- [ ] Install `embla-carousel-react` package
- [ ] Create component folder structure
- [ ] Define TypeScript interfaces
- [ ] Create utility functions for data transformation
- [ ] Create wind direction abbreviation helper

### Phase 2: Card Components (2-3 hours)
- [ ] Build `WeatherCard.tsx` base component
- [ ] Build `CurrentWeatherCard.tsx` (Now card)
- [ ] Build `ForecastWeatherCard.tsx` (Forecast cards)
- [ ] Build `MoreForecastCard.tsx` (Navigation card)
- [ ] Implement press animation (active state)
- [ ] Style with Tailwind (match current design system)

### Phase 3: Carousel Integration (2-3 hours)
- [ ] Build `WeatherCarousel.tsx` with Embla
- [ ] Implement swipe/drag functionality
- [ ] Add carousel indicators (dots)
- [ ] Configure stop-at-edges behavior
- [ ] Add smooth transitions (300ms)
- [ ] Test mouse drag on desktop

### Phase 4: Data Integration (1-2 hours)
- [ ] Transform `ForecastPeriod[]` to `DailyForecast[]`
- [ ] Group day/night periods correctly
- [ ] Handle edge cases (missing data)
- [ ] Pass data to carousel cards
- [ ] Test with real API data

### Phase 5: Responsive & Polish (1-2 hours)
- [ ] Implement responsive breakpoints
- [ ] Test 2-card view on desktop
- [ ] Test 1-card view on mobile
- [ ] Test 1.5-card view on tablet (peek effect)
- [ ] Fine-tune spacing and sizing
- [ ] Add loading states

### Phase 6: Navigation Card Functionality (1 hour)
- [ ] Implement smooth scroll to `#forecast`
- [ ] Add click handler
- [ ] Test scroll behavior
- [ ] Add hover effects

### Phase 7: Testing & Bug Fixes (1-2 hours)
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on iOS and Android devices
- [ ] Test edge cases (1 day forecast, missing data)
- [ ] Test accessibility (touch targets, ARIA labels)
- [ ] Performance testing (smooth 60fps)

### Phase 8: Remove Old Component (30 mins)
- [ ] Remove old `CurrentConditions` section header
- [ ] Update App.tsx to use `WeatherCarousel`
- [ ] Clean up unused code
- [ ] Update CSS if needed

**Total Estimated Time**: 9-14 hours

---

## File Changes Summary

### New Files
1. `src/components/WeatherCarousel/WeatherCarousel.tsx`
2. `src/components/WeatherCarousel/WeatherCard.tsx`
3. `src/components/WeatherCarousel/CurrentWeatherCard.tsx`
4. `src/components/WeatherCarousel/ForecastWeatherCard.tsx`
5. `src/components/WeatherCarousel/MoreForecastCard.tsx`
6. `src/components/WeatherCarousel/useWeatherCarousel.ts`
7. `src/components/WeatherCarousel/weatherCarousel.types.ts`
8. `src/components/WeatherCarousel/index.ts` (barrel export)
9. `src/utils/weatherHelpers.ts` (wind abbreviation, data transformation)

### Modified Files
1. `src/App.tsx` - Replace CurrentConditions with WeatherCarousel
2. `src/types/weather.ts` - Add new interfaces
3. `package.json` - Add embla-carousel-react dependency

### Removed Files
- None (keep CurrentConditions.tsx for reference/rollback)

---

## Dependencies to Install

```bash
npm install embla-carousel-react
```

**Package Details**:
- Version: ^8.0.0 (latest stable)
- Size: 8KB gzipped
- License: MIT
- TypeScript: Full support
- React: Compatible with React 18.x

---

## Accessibility Considerations

1. **Keyboard Navigation**: Not implemented per requirements
2. **Touch Targets**: Minimum 44x44px for clickable areas
3. **ARIA Labels**:
   - `aria-label="Weather carousel"`
   - `aria-live="polite"` for card changes
4. **Screen Readers**: Announce current card position
5. **Color Contrast**: Maintain WCAG AA standards (4.5:1)

---

## Performance Considerations

1. **Lazy Loading**: Only render visible + adjacent cards
2. **CSS Transforms**: Use `transform` instead of `left/right` for 60fps
3. **Debouncing**: Throttle resize events
4. **Memoization**: Use `React.memo()` for card components
5. **Bundle Size**: Monitor with Vite build analysis

---

## Testing Checklist

### Functionality
- [ ] Swipe left/right works smoothly
- [ ] Mouse drag works on desktop
- [ ] Stops at first/last card (no infinite loop)
- [ ] Navigation card scrolls to 7-day forecast
- [ ] Indicators reflect current position
- [ ] Clicking indicator jumps to card
- [ ] Press feedback animation works

### Responsive
- [ ] 2 cards visible on desktop (≥768px)
- [ ] 1 card visible on mobile (<640px)
- [ ] Peek effect on tablet (1.5 cards)
- [ ] Cards resize properly on window resize

### Data
- [ ] Current conditions display correctly
- [ ] Forecast data maps to correct days
- [ ] Wind directions abbreviated (NW, SSE, etc.)
- [ ] Temperatures show high/low correctly
- [ ] Missing data handled gracefully

### Cross-Browser
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Performance
- [ ] Smooth 60fps animations
- [ ] No jank during swipe
- [ ] Quick initial render (<1s)
- [ ] No memory leaks

---

## Rollback Plan

If Embla Carousel proves unstable or problematic:

1. **Switch to custom implementation** (Option A)
2. **Keep component structure** (same cards, different carousel)
3. **Estimated rollback time**: 2-3 hours

Custom implementation approach:
```typescript
// Use CSS scroll-snap
.carousel-container {
  scroll-snap-type: x mandatory;
  overflow-x: scroll;
  scroll-behavior: smooth;
}

.carousel-card {
  scroll-snap-align: start;
}
```

---

## Future Enhancements (Out of Scope)

These features are NOT included in this proposal but could be added later:

1. Auto-advance carousel every 5 seconds
2. Keyboard arrow navigation (← →)
3. Pinch-to-zoom on mobile
4. Card flip animation for more details
5. Pull-to-refresh gesture
6. Transition effects (fade, slide, etc.)
7. Preload forecast images

---

## Questions or Concerns?

Please review this proposal and provide feedback on:
- ✅ Visual mockups - do they match your vision?
- ✅ Card content - any missing/extra information?
- ✅ Animations - appropriate for the use case?
- ✅ Implementation plan - any concerns about approach?

Once approved, I'll begin implementation following the phases outlined above.

---

**Status**: ⏳ Awaiting Approval
**Next Step**: User review and approval
**Estimated Development Time**: 9-14 hours (can be done in 2-3 sessions)
