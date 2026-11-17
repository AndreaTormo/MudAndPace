const { AppError } = require('../utils/appError');
const { validateService } = require('../utils/validation');
const weatherRepository = require('../repositories/weather.repository');
const { weatherQuerySchema } = require('../validators/weather.validator');

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min
const CACHE_MAX_ENTRIES = 200;
const MAX_FORECAST_DAYS = 16; // límite de Open-Meteo
const cache = new Map();

// Umbrales de los avisos para trail
const THRESHOLDS = { gustsKmh: 60, rainMm: 10, heatC: 30, frostC: 0, uv: 8 };

const WEATHER_CODES = {
  0: 'Despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Niebla',
  48: 'Niebla con escarcha',
  51: 'Llovizna ligera',
  53: 'Llovizna',
  55: 'Llovizna intensa',
  56: 'Llovizna helada ligera',
  57: 'Llovizna helada',
  61: 'Lluvia ligera',
  63: 'Lluvia',
  65: 'Lluvia intensa',
  66: 'Lluvia helada ligera',
  67: 'Lluvia helada',
  71: 'Nieve ligera',
  73: 'Nieve',
  75: 'Nieve intensa',
  77: 'Cristales de nieve',
  80: 'Chubascos ligeros',
  81: 'Chubascos',
  82: 'Chubascos violentos',
  85: 'Chubascos de nieve ligeros',
  86: 'Chubascos de nieve intensos',
  95: 'Tormenta',
  96: 'Tormenta con granizo ligero',
  99: 'Tormenta con granizo fuerte'
};

function buildAlerts(day) {
  const alerts = [];
  if (day.code >= 95) alerts.push('Tormenta');
  if (day.gustsMaxKmh >= THRESHOLDS.gustsKmh) alerts.push('Rachas de viento fuertes');
  if (day.precipitationMm >= THRESHOLDS.rainMm) alerts.push('Lluvia abundante');
  if (day.tempMax >= THRESHOLDS.heatC) alerts.push('Calor');
  if (day.tempMin <= THRESHOLDS.frostC) alerts.push('Riesgo de helada');
  if (day.uvIndexMax >= THRESHOLDS.uv) alerts.push('Índice UV muy alto');
  return alerts;
}

function mapForecast(raw, location) {
  if (!raw?.daily?.time?.length) {
    throw new AppError('El servicio meteorológico devolvió una respuesta inválida', 502, 'WEATHER_PROVIDER_ERROR');
  }

  const daily = raw.daily;
  const days = daily.time.map((date, index) => {
    const day = {
      date,
      code: daily.weather_code[index],
      summary: WEATHER_CODES[daily.weather_code[index]] ?? 'Desconocido',
      tempMax: daily.temperature_2m_max[index],
      tempMin: daily.temperature_2m_min[index],
      precipitationMm: daily.precipitation_sum[index],
      precipitationProbability: daily.precipitation_probability_max[index],
      windMaxKmh: daily.wind_speed_10m_max[index],
      gustsMaxKmh: daily.wind_gusts_10m_max[index],
      uvIndexMax: daily.uv_index_max[index],
      sunrise: daily.sunrise[index],
      sunset: daily.sunset[index]
    };
    day.alerts = buildAlerts(day);
    return day;
  });

  return {
    location: { ...location, elevation: raw.elevation },
    timezone: raw.timezone,
    units: { temperature: '°C', precipitation: 'mm', wind: 'km/h' },
    days
  };
}

function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(key, { at: Date.now(), value });
}

async function getWeather(input = {}) {
  const query = validateService(weatherQuerySchema, input);
  const { place, lat, lon, elevation, date } = query;
  const daysNum = query.days ?? 7;

  // Con fecha concreta se pide el máximo de días y luego se filtra (así se reutiliza la caché)
  const forecastDays = date ? MAX_FORECAST_DAYS : daysNum;
  const where = place
    ? `place:${place.toLowerCase()}`
    : `coords:${lat.toFixed(3)},${lon.toFixed(3)}`;
  const key = `${where}|${elevation ?? ''}|${forecastDays}`;

  let result = cacheGet(key);

  if (!result) {
    let location;
    if (place) {
      const places = await weatherRepository.findPlaces(place);
      const [found] = places;
      if (!found) {
        throw new AppError(`No se encontró el lugar "${place}"`, 404, 'WEATHER_PLACE_NOT_FOUND');
      }
      location = {
        name: found.name,
        country: found.country,
        region: found.admin1,
        latitude: found.latitude,
        longitude: found.longitude
      };
    } else {
      location = { latitude: lat, longitude: lon };
    }

    const raw = await weatherRepository.fetchForecast({
      latitude: location.latitude,
      longitude: location.longitude,
      elevation,
      days: forecastDays
    });
    result = mapForecast(raw, location);
    cacheSet(key, result);
  }

  if (date) {
    const day = result.days.find((item) => item.date === date);
    if (!day) {
      throw new AppError(
        `No hay previsión para ${date}: solo se cubren hoy y los próximos ${MAX_FORECAST_DAYS - 1} días`,
        400,
        'WEATHER_DATE_OUT_OF_RANGE'
      );
    }
    return { ...result, days: [day] };
  }

  return result;
}

module.exports = { getWeather };
