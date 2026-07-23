export type AlertSeverityClass = "warning" | "advisory";

export interface WeatherAlert {
  id: string;
  event: string;
  severityClass: AlertSeverityClass;
  headline: string;
  description: string;
  areaDesc: string;
  counties: string[];
  effective: string;
  expires: string;
  senderName: string;
}
