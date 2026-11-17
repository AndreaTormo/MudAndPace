const mongoose = require('mongoose');
const { AppError } = require('../utils/appError');
const repo = require('../repositories/activity.repository');

const DEFAULTS = {
  paceSecPerKm: 6.5 * 60,
  weightKg: 70,
  metersPerKmEffort: 100,
  kcalPerKgPerKmEffort: 1.0,
  rangePct: 0.15
};
const MAX_DURATION_SEC = 7 * 24 * 3600;
const STATUSES = ['planned', 'completed'];
const MAX_LIMIT = 100;

function httpError(message, status, code = 'ACTIVITY_ERROR') {
  return new AppError(message, status, code);
}

function ensureDatabase() {
  if (mongoose.connection.readyState !== 1) {
    throw httpError('La base de datos no está disponible', 503, 'DATABASE_UNAVAILABLE');
  }
}

function requireString(value, name, max = 120) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw httpError(`"${name}" es obligatorio (texto de hasta ${max} caracteres)`, 400, 'VALIDATION_ERROR');
  }
  return value.trim();
}

function optionalString(value, name, max) {
  return value === '' ? '' : requireString(value, name, max);
}

function parseNumber(value, name, min, max) {
  const n = Number(value);
  if (value === undefined || value === null || value === '' || Number.isNaN(n) || n < min || n > max) {
    throw httpError(`"${name}" debe ser un número entre ${min} y ${max}`, 400, 'VALIDATION_ERROR');
  }
  return n;
}

function parseInteger(value, name, min, max) {
  const n = parseNumber(value, name, min, max);
  if (!Number.isInteger(n)) {
    throw httpError(`"${name}" debe ser un entero`, 400, 'VALIDATION_ERROR');
  }
  return n;
}

function parseDate(value, name) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw httpError(`"${name}" debe ser una fecha válida (YYYY-MM-DD o ISO 8601)`, 400, 'VALIDATION_ERROR');
  }
  return new Date(value);
}

function parseStatus(value) {
  if (!STATUSES.includes(value)) {
    throw httpError(`"status" debe ser uno de: ${STATUSES.join(', ')}`, 400, 'VALIDATION_ERROR');
  }
  return value;
}

function parseDuration(value, name) {
  if (typeof value === 'string' && value.includes(':')) {
    const parts = value.split(':').map(Number);
    if (parts.length > 3 || parts.some((part) => !Number.isFinite(part) || part < 0)) {
      throw httpError(`"${name}" debe tener formato h:mm:ss, mm:ss o ser un número de segundos`, 400, 'VALIDATION_ERROR');
    }
    const [seconds, minutes, hours = 0] = parts.reverse();
    return parseNumber(hours * 3600 + minutes * 60 + seconds, name, 1, MAX_DURATION_SEC);
  }
  return parseNumber(value, name, 1, MAX_DURATION_SEC);
}

function parsePace(value) {
  if (typeof value === 'string' && value.includes(':')) {
    const [minutes, seconds] = value.split(':').map(Number);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds < 0 || seconds >= 60) {
      throw httpError('"paceMinPerKm" debe tener formato m:ss o ser minutos (ej. 6.5)', 400, 'VALIDATION_ERROR');
    }
    return parseNumber(minutes * 60 + seconds, 'paceMinPerKm', 120, 1800);
  }
  return parseNumber(Number(value) * 60, 'paceMinPerKm', 120, 1800);
}

const pad = (value) => String(value).padStart(2, '0');

function formatDuration(seconds) {
  const total = Math.round(seconds);
  return `${Math.floor(total / 3600)}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

function formatPace(secondsPerKm) {
  const total = Math.round(secondsPerKm);
  return `${Math.floor(total / 60)}:${pad(total % 60)}`;
}

function checkId(id) {
  if (!/^[a-f\d]{24}$/i.test(String(id))) {
    throw httpError('El id no es válido', 400, 'INVALID_ID');
  }
  return String(id);
}

function readEstimationParams(source) {
  return {
    paceSecPerKm: source.paceMinPerKm === undefined ? DEFAULTS.paceSecPerKm : parsePace(source.paceMinPerKm),
    weightKg: source.weightKg === undefined ? DEFAULTS.weightKg : parseNumber(source.weightKg, 'weightKg', 30, 250)
  };
}

function computeEstimate({ distanceKm, elevationGainM, paceSecPerKm, weightKg }) {
  const kmEffort = distanceKm + elevationGainM / DEFAULTS.metersPerKmEffort;
  return {
    kmEffort: Math.round(kmEffort * 10) / 10,
    durationSec: Math.max(1, Math.round(kmEffort * paceSecPerKm)),
    calories: Math.round(weightKg * kmEffort * DEFAULTS.kcalPerKgPerKmEffort)
  };
}

function estimate(input = {}) {
  const distanceKm = parseNumber(input.distanceKm, 'distanceKm', 0.1, 1000);
  const elevationGainM =
    input.elevationGainM === undefined ? 0 : parseNumber(input.elevationGainM, 'elevationGainM', 0, 50000);
  const params = readEstimationParams(input);
  const result = computeEstimate({ distanceKm, elevationGainM, ...params });
  const min = Math.round(result.durationSec * (1 - DEFAULTS.rangePct));
  const max = Math.round(result.durationSec * (1 + DEFAULTS.rangePct));

  return {
    distanceKm,
    elevationGainM,
    kmEffort: result.kmEffort,
    durationSec: result.durationSec,
    duration: formatDuration(result.durationSec),
    durationRange: {
      minSec: min,
      maxSec: max,
      min: formatDuration(min),
      max: formatDuration(max)
    },
    calories: result.calories,
    assumptions: {
      paceMinPerKm: formatPace(params.paceSecPerKm),
      weightKg: params.weightKg
    }
  };
}

function present(activity) {
  return {
    id: String(activity._id),
    userId: activity.userId,
    eventId: activity.eventId,
    title: activity.title,
    date: activity.date.toISOString(),
    status: activity.status,
    distanceKm: activity.distanceKm,
    elevationGainM: activity.elevationGainM,
    durationSec: activity.durationSec,
    duration: formatDuration(activity.durationSec),
    paceMinPerKm: formatPace(activity.durationSec / activity.distanceKm),
    calories: activity.calories,
    estimated: {
      time: Boolean(activity.estimated?.time),
      calories: Boolean(activity.estimated?.calories)
    },
    notes: activity.notes,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt
  };
}

function readTimeAndCalories(body) {
  const out = {};
  if (body.durationSec !== undefined) {
    out.durationSec = parseDuration(body.durationSec, 'durationSec');
  } else if (body.duration !== undefined) {
    out.durationSec = parseDuration(body.duration, 'duration');
  }
  if (body.calories !== undefined) {
    out.calories = Math.round(parseNumber(body.calories, 'calories', 0, 50000));
  }
  return out;
}

async function createActivity(body = {}) {
  ensureDatabase();

  const userId = requireString(body.userId, 'userId', 64);
  const title = requireString(body.title, 'title', 120);
  const date = parseDate(body.date, 'date');
  const status = body.status === undefined ? 'completed' : parseStatus(body.status);
  const distanceKm = parseNumber(body.distanceKm, 'distanceKm', 0.1, 1000);
  const elevationGainM =
    body.elevationGainM === undefined ? 0 : parseNumber(body.elevationGainM, 'elevationGainM', 0, 50000);

  const given = readTimeAndCalories(body);
  const estimated = computeEstimate({ distanceKm, elevationGainM, ...readEstimationParams(body) });

  const data = {
    userId,
    title,
    date,
    status,
    distanceKm,
    elevationGainM,
    durationSec: given.durationSec ?? estimated.durationSec,
    calories: given.calories ?? estimated.calories,
    estimated: {
      time: given.durationSec === undefined,
      calories: given.calories === undefined
    }
  };
  if (body.eventId !== undefined) data.eventId = requireString(body.eventId, 'eventId', 64);
  if (body.notes !== undefined) data.notes = optionalString(body.notes, 'notes', 1000);

  return present(await repo.create(data));
}

async function getActivity(id, userId) {
  ensureDatabase();

  const found = await repo.findOne(checkId(id), requireString(userId, 'userId', 64));
  if (!found) {
    throw httpError('Actividad no encontrada', 404, 'ACTIVITY_NOT_FOUND');
  }
  return present(found);
}

function dateRange({ from, to }) {
  if (from === undefined && to === undefined) {
    return undefined;
  }

  const range = {};
  if (from !== undefined) {
    range.$gte = parseDate(from, 'from');
  }
  if (to !== undefined) {
    range.$lte = /^\d{4}-\d{2}-\d{2}$/.test(to) ? parseDate(`${to}T23:59:59.999Z`, 'to') : parseDate(to, 'to');
  }
  return range;
}

async function listActivities(query = {}) {
  ensureDatabase();

  const filter = { userId: requireString(query.userId, 'userId', 64) };
  if (query.eventId !== undefined) {
    filter.eventId = requireString(query.eventId, 'eventId', 64);
  }
  if (query.status !== undefined) {
    filter.status = parseStatus(query.status);
  }
  const range = dateRange(query);
  if (range) {
    filter.date = range;
  }

  const page = query.page === undefined ? 1 : parseInteger(query.page, 'page', 1, 100000);
  const limit = query.limit === undefined ? 20 : parseInteger(query.limit, 'limit', 1, MAX_LIMIT);

  const { items, total } = await repo.list(filter, { skip: (page - 1) * limit, limit });
  return { items: items.map(present), page, limit, total };
}

async function updateActivity(id, userId, body = {}) {
  ensureDatabase();

  const uid = requireString(userId, 'userId', 64);
  const existing = await repo.findOne(checkId(id), uid);
  if (!existing) {
    throw httpError('Actividad no encontrada', 404, 'ACTIVITY_NOT_FOUND');
  }

  const set = {};
  if (body.title !== undefined) set.title = requireString(body.title, 'title', 120);
  if (body.date !== undefined) set.date = parseDate(body.date, 'date');
  if (body.status !== undefined) set.status = parseStatus(body.status);
  if (body.eventId !== undefined) set.eventId = requireString(body.eventId, 'eventId', 64);
  if (body.notes !== undefined) set.notes = optionalString(body.notes, 'notes', 1000);
  if (body.distanceKm !== undefined) set.distanceKm = parseNumber(body.distanceKm, 'distanceKm', 0.1, 1000);
  if (body.elevationGainM !== undefined) {
    set.elevationGainM = parseNumber(body.elevationGainM, 'elevationGainM', 0, 50000);
  }

  const given = readTimeAndCalories(body);
  if (given.durationSec !== undefined) {
    set.durationSec = given.durationSec;
    set['estimated.time'] = false;
  }
  if (given.calories !== undefined) {
    set.calories = given.calories;
    set['estimated.calories'] = false;
  }

  const affectsEstimate = ['distanceKm', 'elevationGainM', 'paceMinPerKm', 'weightKg'].some(
    (key) => body[key] !== undefined
  );
  if (affectsEstimate) {
    const estimated = computeEstimate({
      distanceKm: set.distanceKm ?? existing.distanceKm,
      elevationGainM: set.elevationGainM ?? existing.elevationGainM,
      ...readEstimationParams(body)
    });
    if (given.durationSec === undefined && existing.estimated?.time) {
      set.durationSec = estimated.durationSec;
    }
    if (given.calories === undefined && existing.estimated?.calories) {
      set.calories = estimated.calories;
    }
  }

  if (Object.keys(set).length === 0) {
    throw httpError('No hay ningún campo que actualizar', 400, 'VALIDATION_ERROR');
  }

  const updated = await repo.update(existing._id, uid, set);
  return present(updated);
}

async function deleteActivity(id, userId) {
  ensureDatabase();

  const removed = await repo.remove(checkId(id), requireString(userId, 'userId', 64));
  if (!removed) {
    throw httpError('Actividad no encontrada', 404, 'ACTIVITY_NOT_FOUND');
  }
}

async function getStats(query = {}) {
  ensureDatabase();

  const filter = { userId: requireString(query.userId, 'userId', 64), status: 'completed' };
  if (query.eventId !== undefined) {
    filter.eventId = requireString(query.eventId, 'eventId', 64);
  }
  const range = dateRange(query);
  if (range) {
    filter.date = range;
  }

  const totals = await repo.totals(filter);
  return {
    activities: totals.activities,
    totalDistanceKm: Math.round(totals.distanceKm * 100) / 100,
    totalElevationGainM: Math.round(totals.elevationGainM),
    totalDurationSec: totals.durationSec,
    totalDuration: formatDuration(totals.durationSec),
    totalCalories: Math.round(totals.calories),
    avgPaceMinPerKm: totals.distanceKm > 0 ? formatPace(totals.durationSec / totals.distanceKm) : null
  };
}

module.exports = {
  estimate,
  createActivity,
  getActivity,
  listActivities,
  updateActivity,
  deleteActivity,
  getStats
};
