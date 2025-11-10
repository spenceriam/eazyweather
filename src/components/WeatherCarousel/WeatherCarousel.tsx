import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { CurrentWeatherCard } from './CurrentWeatherCard';
import { ForecastWeatherCard } from './ForecastWeatherCard';
import { MoreForecastCard } from './MoreForecastCard';
import { transformToDailyForecasts } from '../../utils/weatherHelpers';
import type {
  CurrentConditions,
  ForecastPeriod,
} from '../../types/weather';

interface WeatherCarouselProps {
  conditions: CurrentConditions;
  forecast: ForecastPeriod[];
  timezone?: string;
}

export function WeatherCarousel({
  conditions,
  forecast,
  timezone,
}: WeatherCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    slidesToScroll: 1,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  // Transform forecast data to daily forecasts
  const dailyForecasts = transformToDailyForecasts(forecast);

  // Handle scroll to 7-day forecast section
  const scrollToForecast = useCallback(() => {
    const forecastSection = document.getElementById('forecast');
    if (forecastSection) {
      forecastSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Update selected index when carousel scrolls
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Setup Embla event listeners
  useEffect(() => {
    if (!emblaApi) return;

    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Scroll to specific index when indicator is clicked
  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  // Total cards: 1 (current) + daily forecasts + 1 (navigation)
  const totalCards = 1 + dailyForecasts.length + 1;

  return (
    <section id="current" className="bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Carousel container */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {/* Card 1: Current Conditions */}
            <div className="flex-shrink-0 w-full md:w-[calc(50%-0.5rem)]">
              <CurrentWeatherCard conditions={conditions} timezone={timezone} />
            </div>

            {/* Cards 2-5: Daily Forecasts */}
            {dailyForecasts.map((dailyForecast, index) => (
              <div
                key={`forecast-${index}`}
                className="flex-shrink-0 w-full md:w-[calc(50%-0.5rem)]"
              >
                <ForecastWeatherCard forecast={dailyForecast} />
              </div>
            ))}

            {/* Card 6: Navigation to 7-Day Forecast */}
            <div className="flex-shrink-0 w-full md:w-[calc(50%-0.5rem)]">
              <MoreForecastCard onNavigate={scrollToForecast} />
            </div>
          </div>
        </div>

        {/* Carousel indicators */}
        <div className="flex justify-center items-center gap-2 mt-6">
          {Array.from({ length: totalCards }).map((_, index) => (
            <button
              key={index}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                index === selectedIndex
                  ? 'bg-brand-dark w-3 h-3'
                  : 'bg-gray-400 hover:bg-gray-500'
              }`}
              onClick={() => scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
