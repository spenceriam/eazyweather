# DETAILED CODE EXAMPLES & CURRENT LAYOUT

## A. CURRENT CONDITIONS COMPONENT - CURRENT LAYOUT

```
┌─────────────────────────────────────────────────────────────┐
│ CURRENT CONDITIONS SECTION                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │                   WHITE CARD                       │   │
│  │              (bg-white rounded-2xl)                │   │
│  ├────────────────────────────────────────────────────┤   │
│  │                                                    │   │
│  │            ☀️ [120px WEATHER ICON]                │   │
│  │                                                    │   │
│  │               72°F                                 │   │
│  │          (text-5xl font-light)                     │   │
│  │                                                    │   │
│  │          Partly Cloudy                             │   │
│  │          (text-lg text-gray-600)                   │   │
│  │                                                    │   │
│  │  [Optional Trend Lines]                           │   │
│  │                                                    │   │
│  ├────────────────────────────────────────────────────┤   │
│  │ ┌──────────────────┬──────────────────┐          │   │
│  │ │ LEFT COLUMN      │ RIGHT COLUMN     │          │   │
│  │ ├──────────────────┼──────────────────┤          │   │
│  │ │ High / Low: 75/60│ Real feel: 70°   │          │   │
│  │ │ Dew point: 55°   │ Wind: 5 mph E    │          │   │
│  │ │ Humidity: 65%    │ Wind gust: 10mph │          │   │
│  │ │ Sunrise: 6:30 AM │ Sunset: 8:15 PM  │          │   │
│  │ └──────────────────┴──────────────────┘          │   │
│  │                                                    │   │
│  │ [OPTIONAL: Snow depth row if applicable]          │   │
│  │                                                    │   │
│  │        Updated 2:30 PM EDT   🔄 (refresh)        │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## B. CURRENT CONDITIONS - KEY CODE SECTIONS

### Main Component Props
```typescript
interface CurrentConditionsProps {
  conditions: CurrentConditionsType;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: string;
  hourlyForecast?: HourlyForecastType[];
  timezone?: string;
}
```

### Main Section Rendering
```jsx
return (
  <section id="current" className="bg-gray-100">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Current Conditions
          </h2>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Weather Display Section */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-4">
              <WeatherIcon
                condition={conditions.textDescription}
                isDaytime={isDaytime}
                size={120}
                className="drop-shadow-lg"
              />
            </div>
            
            <div className="text-5xl font-light text-gray-800 mb-2">
              {tempF}°
            </div>
            
            <div className="text-lg text-gray-600 capitalize mb-2">
              {conditions.textDescription}
            </div>

            {/* Trends Section */}
            {trends.length > 0 && (
              <div className="text-sm text-gray-500 space-y-1">
                {trends.map((trend, index) => (
                  <div key={index}>{trend}</div>
                ))}
              </div>
            )}
          </div>

          {/* Two-Column Grid Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* LEFT COLUMN */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">High / Low</span>
                <span className="font-medium text-gray-800">
                  {conditions.todayHigh && conditions.todayLow
                    ? `${Math.round(conditions.todayHigh)}° / ${Math.round(conditions.todayLow)}°`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dew point</span>
                <span className="font-medium text-gray-800">
                  {getDewPoint()}°
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Humidity</span>
                <span className="font-medium text-gray-800">
                  {Math.round(conditions.relativeHumidity)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sunrise</span>
                <span className="font-medium text-gray-800">
                  {getSunrise()}
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Real feel</span>
                <span className="font-medium text-gray-800">
                  {getRealFeel()}°
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Wind</span>
                <span className="font-medium text-gray-800 text-right">
                  {getWindDisplay()}
                </span>
              </div>
              {windGust && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Wind gust</span>
                  <span className="font-medium text-gray-800">
                    {windGust}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Sunset</span>
                <span className="font-medium text-gray-800">
                  {getSunset()}
                </span>
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-center items-center gap-2 text-sm mt-4">
            <span className="text-gray-500">Updated</span>
            <button
              onClick={toggleTimeFormat}
              className="font-sans text-gray-500 hover:text-gray-700"
            >
              {lastUpdated ? formatTime(lastUpdated, true) : "N/A"}
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-1 text-gray-400 hover:text-brand-dark transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </section>
);
```

---

## C. 7-DAY FORECAST - CURRENT LAYOUT

```
┌──────────────────────────────────────────────────────────────┐
│ 7-DAY FORECAST SECTION                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ FORECAST CARD 1 (Tonight)                          │    │
│  │ ┌──────────────────────────────────────────────┐   │    │
│  │ │ Left: "Tonight"           │ Right: [Icon]    │   │    │
│  │ │        68°                │ 80px Weather     │   │    │
│  │ │        Mostly Cloudy      │ Icon             │   │    │
│  │ │        Wind: 5 mph East   │                  │   │    │
│  │ │                           │                  │   │    │
│  │ │ Detailed forecast text... │                  │   │    │
│  │ └──────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ FORECAST CARD 2 (Thursday)                         │    │
│  │ ┌──────────────────────────────────────────────┐   │    │
│  │ │ Left: "Thursday"          │ Right: [Icon]    │   │    │
│  │ │        75°                │ 80px Weather     │   │    │
│  │ │        Partly Cloudy      │ Icon             │   │    │
│  │ │        Wind: 8 mph East   │                  │   │    │
│  │ │                           │                  │   │    │
│  │ │ Detailed forecast text... │                  │   │    │
│  │ └──────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [14 cards total, space-y-4 vertical stack]                │
│                                                              │
│          [Back to Top button]                              │
└──────────────────────────────────────────────────────────────┘
```

### 7-Day Forecast Component Code
```jsx
export function SevenDayForecast({ forecast }: SevenDayForecastProps) {
  return (
    <section id="forecast" className="bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            7-Day Forecast
          </h2>

          <div className="space-y-4">
            {forecast.map((period) => (
              <div
                key={period.number}
                className="bg-gray-50 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* LEFT SECTION */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {period.name}
                    </h3>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-3xl font-light text-gray-800">
                        {period.temperature}°
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        {period.shortForecast}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <ArrowRightIcon className="w-4 h-4" />
                        {period.windSpeed}
                      </span>
                      <span>{period.windDirection}</span>
                    </div>
                  </div>

                  {/* RIGHT SECTION - ICON */}
                  <div className="flex items-center">
                    <WeatherIcon
                      condition={period.shortForecast}
                      isDaytime={period.isDaytime}
                      size={80}
                    />
                  </div>
                </div>

                {/* DETAILED FORECAST */}
                <p className="text-sm text-gray-600 mt-4 leading-relaxed">
                  {period.detailedForecast}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={scrollToTop}
            className="mt-8 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Back to Top
          </button>
        </div>
      </div>
    </section>
  );
}
```

---

## D. TAILWIND GRID & LAYOUT PATTERNS USED

### Max Width Container Pattern
```jsx
<div className="max-w-7xl mx-auto px-4 py-8">
  <div className="max-w-4xl mx-auto">
    {/* Content constrained to 896px max */}
  </div>
</div>
```

### Responsive Flex Direction
```jsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  {/* Mobile: column layout */}
  {/* Tablet+: row layout with centered items and space between */}
</div>
```

### Two-Column Grid
```jsx
<div className="grid grid-cols-2 gap-4 text-sm">
  {/* Auto creates 2 equal columns with 16px gap */}
</div>
```

### Vertical Stack with Space
```jsx
<div className="space-y-4">
  {/* Adds 16px vertical margin between children */}
</div>

<div className="space-y-3">
  {/* Adds 12px vertical margin between children */}
</div>
```

---

## E. WEATHER DATA FLOW IN CURRENT CONDITIONS

```typescript
// Data received from API
const currentConditions: CurrentConditions = {
  temperature: 72,
  temperatureUnit: "F",
  relativeHumidity: 65,
  windSpeedValue: 8.7,
  windDirection: 90, // degrees (East)
  textDescription: "Partly Cloudy",
  icon: "https://...",
  timestamp: "2025-11-10T14:30:00Z",
  heatIndex: undefined,
  windChill: -5,
  dewpoint: 55,
  windGust: 15,
  sunriseTime: "2025-11-10T06:30:00Z",
  sunsetTime: "2025-11-10T20:15:00Z",
  todayHigh: 75,
  todayLow: 60,
  timezone: "America/Chicago"
};

// Component processes and displays:
1. Temperature with unit conversion (C <-> F)
2. Icon selection based on textDescription
3. Trend analysis from hourly forecast
4. Calculated values (Real feel, Dew point)
5. Formatted times with timezone abbreviations
6. Wind direction conversion (degrees -> "East by Northeast")
```

---

## F. RESPONSIVE DESIGN PATTERNS

### Current Conditions Responsive
- **Mobile** (`default`):
  - Full width with padding
  - Centered column layout
  - Single column grid metrics

- **Tablet+** (`sm:` / `md:`):
  - Max-width 896px centered
  - Two-column grid for metrics
  - Same card styling

### Forecast Cards Responsive
```jsx
className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
```
- **Mobile**: Vertical stack of all content
- **Tablet+**: Left content flex-1, Right icon aligned right

---

## G. TAILWIND CUSTOM COLORS (BRAND PALETTE)

```javascript
// From tailwind.config.js
colors: {
  brand: {
    DEFAULT: "#364247",    // Dark teal (primary)
    dark: "#2a3337",       // Darker teal (hover state)
    light: "#4a5459",      // Lighter teal
    lighter: "#e8eaeb",    // Very light teal (backgrounds)
    cream: "#f9f6ee",      // Off-white/cream
  }
}

// Usage in components
className="bg-brand"              // Dark teal buttons
className="text-white"            // On dark backgrounds
className="hover:bg-brand-dark"   // Interactive states
className="bg-brand-lighter"      // Alternate background
className="text-brand"            // Teal text color
```

