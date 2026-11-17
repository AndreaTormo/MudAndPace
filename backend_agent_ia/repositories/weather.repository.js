const { AppError } = require('../utils/appError');

// Acceso a Open-Meteo (gratis, sin API key): geocodificación y previsión diaria.
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const DAILY_VARIABLES = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
  'uv_index_max',
  'sunrise',
  'sunset'
];

async function getJson(url) {
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch (cause) {
    const error = new AppError('No se pudo contactar con el servicio meteorológico', 504, 'WEATHER_UNAVAILABLE');
    error.cause = cause;
    throw error;
  }

  if (!response.ok) {
    throw new AppError(`El servicio meteorológico respondió ${response.status}`, 502, 'WEATHER_PROVIDER_ERROR');
  }

  try {
    return await response.json();
  } catch (cause) {
    const error = new AppError('El servicio meteorológico devolvió una respuesta inválida', 502, 'WEATHER_PROVIDER_ERROR');
    error.cause = cause;
    throw error;
  }
}

async function findPlaces(name, count = 1) {
  const params = new URLSearchParams({ name, count, language: 'es', format: 'json' });
  const data = await getJson(`${GEOCODING_URL}?${params}`);
  return data.results ?? [];
}

async function fetchForecast({ latitude, longitude, elevation, days }) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    daily: DAILY_VARIABLES.join(','),
    timezone: 'auto',
    forecast_days: days,
    wind_speed_unit: 'kmh'
  });
  // Altitud de la salida/meta: Open-Meteo ajusta la temperatura a esa cota
  if (elevation !== undefined) params.set('elevation', elevation);
  return getJson(`${FORECAST_URL}?${params}`);
}

module.exports = { findPlaces, fetchForecast };
