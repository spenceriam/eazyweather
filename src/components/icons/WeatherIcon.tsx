interface WeatherIconProps {
  condition: string;
  isDaytime: boolean;
  size?: number;
  className?: string;
}

export function WeatherIcon({ condition, isDaytime, size = 120, className = '' }: WeatherIconProps) {
  const iconType = getIconType(condition);

  const icons: Record<string, JSX.Element> = {
    clear: <ClearIcon isDaytime={isDaytime} size={size} />,
    cloudy: <CloudyIcon size={size} isDaytime={isDaytime} />,
    partlyCloudy: <PartlyCloudyIcon isDaytime={isDaytime} size={size} />,
    rain: <RainIcon size={size} isDaytime={isDaytime} />,
    sleet: <SleetIcon size={size} isDaytime={isDaytime} />,
    snow: <SnowIcon size={size} isDaytime={isDaytime} />,
    thunderstorm: <ThunderstormIcon size={size} isDaytime={isDaytime} />,
    fog: <FogIcon size={size} isDaytime={isDaytime} />,
    wind: <WindIcon size={size} />
  };

  return (
    <div className={className}>
      {icons[iconType] || icons.partlyCloudy}
    </div>
  );
}

function getIconType(condition: string): string {
  const lower = condition.toLowerCase();

  if (lower.includes('thunderstorm') || lower.includes('t-storm')) return 'thunderstorm';
  if (lower.includes('sleet') || lower.includes('freezing rain') || lower.includes('ice')) return 'sleet';
  if (lower.includes('rain') || lower.includes('shower')) return 'rain';
  if (lower.includes('snow') || lower.includes('flurr')) return 'snow';
  if (lower.includes('fog') || lower.includes('mist') || lower.includes('haze')) return 'fog';
  if (lower.includes('wind')) return 'wind';
  if (lower.includes('cloud') && (lower.includes('partly') || lower.includes('few') || lower.includes('scattered'))) return 'partlyCloudy';
  if (lower.includes('cloud') || lower.includes('overcast')) return 'cloudy';
  if (lower.includes('clear') || lower.includes('sunny') || lower.includes('fair')) return 'clear';

  return 'partlyCloudy';
}

function ClearIcon({ isDaytime, size }: { isDaytime: boolean; size: number }) {
  if (isDaytime) {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="25" fill="#FDB813" />
        <g className="weather-spin-slow origin-center">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 60 + Math.cos(rad) * 35;
            const y1 = 60 + Math.sin(rad) * 35;
            const x2 = 60 + Math.cos(rad) * 48;
            const y2 = 60 + Math.sin(rad) * 48;
            return (
              <line
                key={angle}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#FDB813"
                strokeWidth="4"
                strokeLinecap="round"
              />
            );
          })}
        </g>
      </svg>
    );
  } else {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <circle cx="60" cy="60" r="22" fill="#E8E8E8" />
        <circle className="weather-twinkle-1" cx="50" cy="55" r="6" fill="#B0B0B0" opacity="0.3" />
        <circle className="weather-twinkle-2" cx="65" cy="50" r="4" fill="#B0B0B0" opacity="0.2" />
        <circle className="weather-twinkle-3" cx="70" cy="65" r="5" fill="#B0B0B0" opacity="0.25" />
      </svg>
    );
  }
}

function CloudyIcon({ size, isDaytime }: { size: number; isDaytime: boolean }) {
  const cloudA = isDaytime ? "#D0D8E0" : "#6B7280";
  const cloudB = isDaytime ? "#B8C4D0" : "#4B5563";
  const cloudC = isDaytime ? "#E5EBF0" : "#9CA3AF";
  const cloudD = isDaytime ? "#C8D4E0" : "#6B7280";
  const cloudE = isDaytime ? "#D8E0E8" : "#7C8798";
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <g className="weather-drift-slow">
        <ellipse cx="50" cy="50" rx="20" ry="15" fill={cloudA} />
        <ellipse cx="70" cy="50" rx="22" ry="16" fill={cloudB} />
        <ellipse cx="60" cy="40" rx="18" ry="14" fill={cloudC} />
      </g>
      <g className="weather-drift-fast">
        <ellipse cx="45" cy="65" rx="25" ry="18" fill={cloudD} />
        <ellipse cx="70" cy="65" rx="23" ry="17" fill={cloudE} />
      </g>
    </svg>
  );
}

function PartlyCloudyIcon({ isDaytime, size }: { isDaytime: boolean; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {isDaytime ? (
        <>
          <circle cx="40" cy="35" r="15" fill="#FDB813" />
          <g className="weather-spin-medium origin-center">
            {[0, 60, 120, 180, 240, 300].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 40 + Math.cos(rad) * 22;
              const y1 = 35 + Math.sin(rad) * 22;
              const x2 = 40 + Math.cos(rad) * 30;
              const y2 = 35 + Math.sin(rad) * 30;
              return (
                <line
                  key={angle}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FDB813"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        </>
      ) : (
        <circle className="weather-twinkle-1" cx="40" cy="35" r="12" fill="#E8E8E8" />
      )}
      <g className="weather-drift-slow">
        <ellipse cx="55" cy="70" rx="20" ry="15" fill="#D0D8E0" />
        <ellipse cx="75" cy="70" rx="22" ry="16" fill="#B8C4D0" />
        <ellipse cx="65" cy="60" rx="18" ry="14" fill="#E5EBF0" />
      </g>
    </svg>
  );
}

function RainIcon({ size, isDaytime }: { size: number; isDaytime: boolean }) {
  const cloud1 = isDaytime ? "#8090A0" : "#5B6572";
  const cloud2 = isDaytime ? "#6A7A8A" : "#47505A";
  const cloud3 = isDaytime ? "#9AA8B8" : "#6B7280";
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <g className="weather-drift-slow">
        <ellipse cx="50" cy="40" rx="20" ry="15" fill={cloud1} />
        <ellipse cx="70" cy="40" rx="22" ry="16" fill={cloud2} />
        <ellipse cx="60" cy="30" rx="18" ry="14" fill={cloud3} />
        <ellipse cx="45" cy="55" rx="25" ry="18" fill={cloud2} />
        <ellipse cx="70" cy="55" rx="23" ry="17" fill={cloud1} />
      </g>
      {[35, 50, 65, 80].map((x, i) => (
        <g key={i} className={`weather-rain-drop weather-rain-delay-${i + 1}`}>
          <line x1={x} y1="70" x2={x - 3} y2="85" stroke="#4A90E2" strokeWidth="2.5" strokeLinecap="round" />
          <line x1={x + 7} y1="75" x2={x + 4} y2="90" stroke="#4A90E2" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

function SleetIcon({ size, isDaytime }: { size: number; isDaytime: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <RainIcon size={size} isDaytime={isDaytime} />
      <g className="weather-snow-fall weather-snow-delay-2">
        <circle cx="48" cy="84" r="2.8" fill="#EAF4FF" />
      </g>
      <g className="weather-snow-fall weather-snow-delay-4">
        <circle cx="73" cy="86" r="2.8" fill="#EAF4FF" />
      </g>
    </svg>
  );
}

function SnowIcon({ size, isDaytime }: { size: number; isDaytime: boolean }) {
  const cloud1 = isDaytime ? "#C0D0E0" : "#7C8798";
  const cloud2 = isDaytime ? "#B0C0D0" : "#6B7280";
  const cloud3 = isDaytime ? "#D0E0F0" : "#9CA3AF";
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <g className="weather-drift-slow">
        <ellipse cx="50" cy="40" rx="20" ry="15" fill={cloud1} />
        <ellipse cx="70" cy="40" rx="22" ry="16" fill={cloud2} />
        <ellipse cx="60" cy="30" rx="18" ry="14" fill={cloud3} />
        <ellipse cx="45" cy="55" rx="25" ry="18" fill={cloud2} />
        <ellipse cx="70" cy="55" rx="23" ry="17" fill={cloud1} />
      </g>
      {[40, 55, 70, 85].map((x, i) => (
        <g key={i} className={`weather-snow-fall weather-snow-delay-${i + 1}`}>
          <circle cx={x} cy={75 + (i % 2) * 5} r="3.5" fill="#E0F0FF" stroke="#B0D0F0" strokeWidth="1" />
          <circle cx={x + 8} cy={80 + ((i + 1) % 2) * 5} r="3" fill="#E8F4FF" stroke="#C0D8F0" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}

function ThunderstormIcon({ size, isDaytime }: { size: number; isDaytime: boolean }) {
  const cloud1 = isDaytime ? "#5A6A7A" : "#3F4855";
  const cloud2 = isDaytime ? "#4A5A6A" : "#2E3843";
  const cloud3 = isDaytime ? "#6A7A8A" : "#576173";
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <g className="weather-drift-fast">
        <ellipse cx="50" cy="35" rx="20" ry="15" fill={cloud1} />
        <ellipse cx="70" cy="35" rx="22" ry="16" fill={cloud2} />
        <ellipse cx="60" cy="25" rx="18" ry="14" fill={cloud3} />
        <ellipse cx="45" cy="50" rx="25" ry="18" fill={cloud1} />
        <ellipse cx="70" cy="50" rx="23" ry="17" fill={cloud3} />
      </g>
      <path className="weather-lightning-flash" d="M 60 60 L 50 80 L 58 80 L 52 100 L 70 75 L 62 75 Z" fill="#FDB813" stroke="#F0A800" strokeWidth="1.5" />
    </svg>
  );
}

function FogIcon({ size, isDaytime }: { size: number; isDaytime: boolean }) {
  const fog1 = isDaytime ? "#D8E0E8" : "#6B7280";
  const fog2 = isDaytime ? "#C8D4DC" : "#525d6b";
  const fog3 = isDaytime ? "#E8ECF0" : "#9CA3AF";
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <ellipse cx="50" cy="35" rx="20" ry="15" fill={fog1} opacity="0.6" />
      <ellipse cx="70" cy="35" rx="22" ry="16" fill={fog2} opacity="0.6" />
      <ellipse cx="60" cy="25" rx="18" ry="14" fill={fog3} opacity="0.6" />
      {[55, 65, 75, 85].map((y, i) => (
        <line
          className={`weather-fog-drift weather-fog-delay-${i + 1}`}
          key={i}
          x1="30"
          y1={y}
          x2="90"
          y2={y}
          stroke="#B0BCC8"
          strokeWidth="3"
          strokeLinecap="round"
          opacity={0.4 + i * 0.15}
        />
      ))}
    </svg>
  );
}

function WindIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <path
        d="M 20 40 Q 45 35 60 40 Q 70 43 75 35"
        stroke="#4A90E2"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 25 60 Q 50 55 70 60 Q 85 63 95 55"
        stroke="#5AA0F2"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 15 80 Q 40 75 60 80 Q 75 83 85 75"
        stroke="#6AB0FF"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
