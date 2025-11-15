import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Transform forecast data to daily forecasts
  // Use conditions timestamp to determine "today" in the location's timezone
  const dailyForecasts = transformToDailyForecasts(forecast, conditions.timestamp);

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
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
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

  // Navigation button handlers
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Total cards: 1 (current) + 3 daily forecasts + 1 (navigation) = 5 cards
  const totalCards = 1 + dailyForecasts.length + 1;

  return (
    <section id="current" className="bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Carousel container with navigation arrows */}
          <div className="relative group">
            {/* Left arrow - hidden on mobile, shown on hover */}
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className={`hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg transition-all ${
                canScrollPrev
                  ? 'opacity-0 group-hover:opacity-100 hover:bg-gray-50 cursor-pointer'
                  : 'opacity-0 cursor-not-allowed'
              }`}
              aria-label="Previous card"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>

            {/* Carousel - add padding to prevent shadow clipping */}
            <div className="overflow-hidden py-4 -my-4" ref={emblaRef}>
              <div className="flex gap-4 items-stretch px-4 -mx-4">
                {/* Card 1: Current Conditions */}
                <div className="flex-shrink-0 w-full md:w-[calc(50%-0.5rem)] flex">
                  <CurrentWeatherCard conditions={conditions} timezone={timezone} />
                </div>

                {/* Cards 2-4: Daily Forecasts (Tomorrow + 2 days) */}
                {dailyForecasts.map((dailyForecast, index) => (
                  <div
                    key={`forecast-${index}`}
                    className="flex-shrink-0 w-full md:w-[calc(50%-0.5rem)] flex"
                  >
                    <ForecastWeatherCard forecast={dailyForecast} />
                  </div>
                ))}

                {/* Card 5: Navigation to 7-Day Forecast */}
                <div className="flex-shrink-0 w-full md:w-[calc(50%-0.5rem)] flex">
                  <MoreForecastCard onNavigate={scrollToForecast} />
                </div>
              </div>
            </div>

            {/* Right arrow - hidden on mobile, shown on hover */}
            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className={`hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg transition-all ${
                canScrollNext
                  ? 'opacity-0 group-hover:opacity-100 hover:bg-gray-50 cursor-pointer'
                  : 'opacity-0 cursor-not-allowed'
              }`}
              aria-label="Next card"
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>
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
      </div>
    </section>
  );
}
