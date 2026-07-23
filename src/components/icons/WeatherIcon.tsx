import type { ReactElement } from "react";
import { useIsDarkTheme } from "../../hooks/useIsDarkTheme";

/**
 * Line-icon set ported verbatim from the ui-refresh prototype's icon()
 * builder: 24x24 viewBox, 1.6 stroke, shared cloud path, composable
 * ray/flake/drop primitives. "sleet" has no distinct glyph in the
 * prototype and renders as "snow" there too.
 */
export type WeatherIconType =
  | "sun"
  | "moon"
  | "partly"
  | "partlyN"
  | "cloudy"
  | "rain"
  | "tstorm"
  | "snow"
  | "sleet"
  | "fog"
  | "wind";

interface WeatherIconProps {
  condition: string;
  isDaytime: boolean;
  size?: number;
  className?: string;
}

interface IconPalette {
  ink: string;
  cloud: string;
  cloud2: string;
  sun: string;
  rain: string;
  snow: string;
  moon: string;
}

const LIGHT_PALETTE: IconPalette = {
  ink: "#4A5960",
  cloud: "#DFE8ED",
  cloud2: "#FFFFFF",
  sun: "#F0A81C",
  rain: "#4A7BA6",
  snow: "#7FA8C9",
  moon: "#CDD9E2",
};

const DARK_PALETTE: IconPalette = {
  ink: "#A2B4C0",
  cloud: "#2E3B44",
  cloud2: "#3A4954",
  sun: "#F6C445",
  rain: "#7FB2D9",
  snow: "#A8CCE6",
  moon: "#E2EAF1",
};

const STROKE = 1.6;
const CLOUD_PATH = "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z";
const CLOUD_UP_TRANSFORM = "scale(0.86) translate(2,-1.6)";

function getIconType(condition: string, isDaytime: boolean): WeatherIconType {
  const lower = condition.toLowerCase();

  if (lower.includes("thunderstorm") || lower.includes("t-storm")) return "tstorm";
  if (lower.includes("sleet") || lower.includes("freezing rain") || lower.includes("ice")) {
    return "sleet";
  }
  if (lower.includes("rain") || lower.includes("shower")) return "rain";
  if (lower.includes("snow") || lower.includes("flurr")) return "snow";
  if (lower.includes("fog") || lower.includes("mist") || lower.includes("haze")) return "fog";
  if (lower.includes("wind")) return "wind";
  if (
    lower.includes("cloud") &&
    (lower.includes("partly") || lower.includes("few") || lower.includes("scattered"))
  ) {
    return isDaytime ? "partly" : "partlyN";
  }
  if (lower.includes("cloud") || lower.includes("overcast")) return "cloudy";
  if (lower.includes("clear") || lower.includes("sunny") || lower.includes("fair")) {
    return isDaytime ? "sun" : "moon";
  }

  return isDaytime ? "partly" : "partlyN";
}

function rays(
  cx: number,
  cy: number,
  r1: number,
  r2: number,
  n: number,
  color: string,
  width: number,
): ReactElement[] {
  const lines: ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.PI / 8;
    lines.push(
      <line
        key={`r${i}`}
        x1={cx + Math.cos(a) * r1}
        y1={cy + Math.sin(a) * r1}
        x2={cx + Math.cos(a) * r2}
        y2={cy + Math.sin(a) * r2}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />,
    );
  }
  return lines;
}

function flake(x: number, y: number, r: number, color: string): ReactElement {
  const lines: ReactElement[] = [];
  for (let i = 0; i < 3; i++) {
    const a = (Math.PI * i) / 3 + Math.PI / 6;
    lines.push(
      <line
        key={`f${i}`}
        x1={x - Math.cos(a) * r}
        y1={y - Math.sin(a) * r}
        x2={x + Math.cos(a) * r}
        y2={y + Math.sin(a) * r}
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
      />,
    );
  }
  return <g key={`flake${x}-${y}`}>{lines}</g>;
}

function cloud(fill: string, ink: string, transform?: string): ReactElement {
  return (
    <g key={`cloud-${transform ?? "base"}`} transform={transform}>
      <path d={CLOUD_PATH} fill={fill} stroke={ink} strokeWidth={STROKE} strokeLinejoin="round" />
    </g>
  );
}

function drop(x: number, color: string): ReactElement {
  return (
    <line
      key={`drop${x}`}
      x1={x}
      y1={16.4}
      x2={x - 1.3}
      y2={20.2}
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
  );
}

function buildIconBody(type: WeatherIconType, palette: IconPalette): ReactElement[] {
  const { ink, cloud: cloudColor, cloud2, sun, rain, snow, moon } = palette;

  switch (type) {
    case "sun":
      return [
        <circle key="s" cx={12} cy={12} r={4.1} fill={sun} />,
        <g key="r">{rays(12, 12, 6, 8.2, 8, sun, STROKE)}</g>,
      ];
    case "moon":
      return [
        <path
          key="m"
          d="M19.4 13.2A7.5 7.5 0 1 1 10.8 4.6a6 6 0 0 0 8.6 8.6Z"
          fill={moon}
          stroke={ink}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />,
      ];
    case "partly":
      return [
        <circle key="s" cx={8} cy={7.4} r={2.7} fill={sun} />,
        <g key="r">{rays(8, 7.4, 4.2, 5.8, 6, sun, 1.4)}</g>,
        cloud(cloud2, ink, "scale(0.78) translate(6.6,7.8)"),
      ];
    case "partlyN":
      return [
        <path
          key="m"
          d="M14.6 8.8A5 5 0 1 1 8.8 3a4 4 0 0 0 5.8 5.8Z"
          fill={moon}
          stroke={ink}
          strokeWidth={1.3}
          strokeLinejoin="round"
        />,
        cloud(cloud2, ink, "scale(0.78) translate(6.6,7.8)"),
      ];
    case "cloudy":
      return [cloud(cloudColor, ink)];
    case "rain":
      return [
        cloud(cloudColor, ink, CLOUD_UP_TRANSFORM),
        drop(8.6, rain),
        drop(12.6, rain),
        drop(16.6, rain),
      ];
    case "tstorm":
      return [
        cloud(cloudColor, ink, CLOUD_UP_TRANSFORM),
        <path
          key="b"
          d="M12.7 12.6 9.7 17.4h2.4L10.9 21.2l4.6-5.7h-2.5l1.7-2.9Z"
          fill={sun}
        />,
      ];
    case "snow":
    case "sleet":
      return [
        cloud(cloudColor, ink, CLOUD_UP_TRANSFORM),
        flake(8.4, 17.8, 1.7, snow),
        flake(12.6, 19.4, 1.7, snow),
        flake(16.6, 17.4, 1.7, snow),
      ];
    case "fog":
      return [
        cloud(cloudColor, ink, "scale(0.8) translate(3,-2.4)"),
        <line key="f1" x1={5} y1={17.6} x2={19} y2={17.6} stroke={ink} strokeWidth={1.5} strokeLinecap="round" />,
        <line key="f2" x1={7} y1={20.4} x2={17} y2={20.4} stroke={ink} strokeWidth={1.5} strokeLinecap="round" />,
      ];
    case "wind":
      return [
        <path key="w1" d="M3.5 8.4h8.7a2.4 2.4 0 1 0-2.4-2.4" fill="none" stroke={ink} strokeWidth={STROKE} strokeLinecap="round" />,
        <path key="w2" d="M3.5 12.4h13.6a2.6 2.6 0 1 1-2.6 2.6" fill="none" stroke={ink} strokeWidth={STROKE} strokeLinecap="round" />,
        <path key="w3" d="M3.5 16.4h6.2" fill="none" stroke={ink} strokeWidth={STROKE} strokeLinecap="round" />,
      ];
    default:
      return [cloud(cloudColor, ink)];
  }
}

export function WeatherIcon({
  condition,
  isDaytime,
  size = 120,
  className = "",
}: WeatherIconProps) {
  const isDark = useIsDarkTheme();
  const iconType = getIconType(condition, isDaytime);
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const body = buildIconBody(iconType, palette);

  return (
    <div className={className}>
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flex: "none" }}>
        {body}
      </svg>
    </div>
  );
}
