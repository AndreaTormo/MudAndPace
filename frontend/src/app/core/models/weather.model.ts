export interface WeatherLocation {
  name?: string;
  country?: string;
  region?: string;
  latitude: number;
  longitude: number;
  elevation?: number;
}

export interface WeatherUnits {
  temperature: string;
  precipitation: string;
  wind: string;
}

export interface WeatherDay {
  date: string;
  code: number;
  summary: string;
  tempMax: number;
  tempMin: number;
  precipitationMm: number;
  precipitationProbability: number | null;
  windMaxKmh: number;
  gustsMaxKmh: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
  alerts: string[];
}

export interface WeatherForecast {
  location: WeatherLocation;
  timezone: string;
  units: WeatherUnits;
  days: WeatherDay[];
}

export type WeatherMode = 'event-date' | 'current';

export interface WeatherQuery {
  latitude: number;
  longitude: number;
  date?: string;
  days?: number;
}
