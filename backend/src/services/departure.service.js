const mongoose = require('mongoose');
const repository = require('../repositories/departure.repository');
const eventRepository = require('../repositories/event.repository');
const { AppError, normalizeAppError } = require('../utils/appError');
const { validateService } = require('../utils/validation');
const { buildMongoFilter } = require('../utils/queryBuilder');
const { slugify } = require('../utils/slugify');
const {
  objectIdSchema,
  slugSchema,
  departurePayloadSchema,
  updateDepartureSchema,
  activationSchema,
  listQuerySchema
} = require('../validators/departure.validator');

const DEPARTURE_FILTERS = [
  { param: 'eventId', build: (value) => ({ eventId: value }) },
  { param: 'status', build: (value) => ({ status: value }) },
  { param: 'isActive', build: (value) => ({ isActive: value }) },
  { param: 'fromDate', build: (value) => ({ startDatetime: { $gte: value } }) },
  { param: 'toDate', build: (value) => ({ startDatetime: { $lte: value } }) }
];

function normalizeQuery(input) {
  return {
    ...input,
    isActive: input.isActive !== undefined ? input.isActive : input.is_active
  };
}

function validateId(id, message = 'ID de salida inválido') {
  const parsed = objectIdSchema.safeParse(id);
  if (!parsed.success || !mongoose.isValidObjectId(id)) {
    throw new AppError(message, 400, 'INVALID_ID');
  }
  return parsed.data;
}

function serializeDeparture(departure) {
  const plain = typeof departure.toObject === 'function'
    ? departure.toObject({ virtuals: true })
    : departure;

  return {
    ...plain,
    spotsLeft: Math.max(0, plain.capacity - plain.bookedParticipants)
  };
}

function validateBusinessRules(payload, current = {}) {
  const details = [];
  const start = payload.startDatetime ?? current.startDatetime;
  const end = payload.endDatetime ?? current.endDatetime;
  const capacity = payload.capacity ?? current.capacity;
  const price = payload.price ?? current.price;
  const booked = payload.bookedParticipants ?? current.bookedParticipants ?? 0;

  if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
    details.push({ path: 'startDatetime', message: 'startDatetime debe ser una fecha válida' });
  }
  if (!(end instanceof Date) || Number.isNaN(end.getTime())) {
    details.push({ path: 'endDatetime', message: 'endDatetime debe ser una fecha válida' });
  }
  if (start instanceof Date && end instanceof Date && start.getTime() >= end.getTime()) {
    details.push({ path: 'endDatetime', message: 'endDatetime debe ser posterior a startDatetime' });
  }
  if (typeof capacity !== 'number' || !Number.isFinite(capacity) || capacity < 1) {
    details.push({ path: 'capacity', message: 'capacity debe ser un número mayor o igual que 1' });
  }
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
    details.push({ path: 'price', message: 'price debe ser un número mayor o igual que 0' });
  }
  if (typeof booked !== 'number' || !Number.isInteger(booked) || booked < 0) {
    details.push({
      path: 'bookedParticipants',
      message: 'bookedParticipants debe ser un entero mayor o igual que 0'
    });
  }
  if (typeof booked === 'number' && typeof capacity === 'number' && booked > capacity) {
    details.push({
      path: 'bookedParticipants',
      message: 'bookedParticipants no puede superar capacity'
    });
  }

  if (details.length > 0) {
    throw new AppError('Datos de entrada inválidos', 400, 'VALIDATION_ERROR', details);
  }
}

async function findEventOrThrow(eventId) {
  validateId(eventId, 'ID de evento inválido');
  const event = await eventRepository.findById(eventId);
  if (!event) {
    throw new AppError('Evento no encontrado', 404, 'EVENT_NOT_FOUND');
  }
  return event;
}

function formatDatePart(date) {
  const iso = new Date(date).toISOString();
  return `${iso.slice(0, 10)}-${iso.slice(11, 13)}${iso.slice(14, 16)}`;
}

async function buildUniqueSlug(event, startDatetime, excludeId) {
  const datePart = formatDatePart(startDatetime);
  const base = slugify(`${event.slug}-${datePart}`).slice(0, 120).replace(/-+$/g, '')
    || `departure-${datePart}`;

  let candidate = base;
  let suffix = 2;

  while (await repository.existsBySlug(candidate, excludeId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

class DepartureService {
  async getAll(rawQuery = {}) {
    try {
      const input = normalizeQuery(validateService(listQuerySchema, rawQuery));

      if (input.fromDate && input.toDate && input.fromDate.getTime() > input.toDate.getTime()) {
        throw new AppError('Datos de entrada inválidos', 400, 'VALIDATION_ERROR', [
          { path: 'toDate', message: 'toDate debe ser posterior o igual a fromDate' }
        ]);
      }

      const filters = buildMongoFilter(input, DEPARTURE_FILTERS);
      const departures = await repository.findAll(filters);
      return departures.map(serializeDeparture);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async getById(id) {
    try {
      validateId(id);
      const departure = await repository.findById(id);
      if (!departure) {
        throw new AppError('Salida no encontrada', 404, 'DEPARTURE_NOT_FOUND');
      }
      return serializeDeparture(departure);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async getByEvent(eventId, rawQuery = {}) {
    try {
      validateId(eventId, 'ID de evento inválido');
      await findEventOrThrow(eventId);
      return this.getAll({ ...rawQuery, eventId });
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async getShopDeparturesByEventSlug(rawSlug) {
    try {
      const slug = validateService(slugSchema, rawSlug);
      const event = await eventRepository.findBySlug(slug);

      if (!event || event.status !== 'published' || !event.isActive) {
        throw new AppError('Evento no encontrado', 404, 'EVENT_NOT_FOUND');
      }

      const departures = await repository.findUpcomingByEventId(event._id);
      return departures.map(serializeDeparture);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async create(rawPayload, { eventId } = {}) {
    try {
      const payload = validateService(departurePayloadSchema, rawPayload);

      if (eventId && payload.eventId && String(eventId) !== String(payload.eventId)) {
        throw new AppError('Datos de entrada inválidos', 400, 'VALIDATION_ERROR', [
          { path: 'eventId', message: 'eventId no coincide con el evento de la ruta' }
        ]);
      }

      const effectiveEventId = eventId ?? payload.eventId;
      if (!effectiveEventId) {
        throw new AppError('Datos de entrada inválidos', 400, 'VALIDATION_ERROR', [
          { path: 'eventId', message: 'eventId es obligatorio' }
        ]);
      }

      const event = await findEventOrThrow(effectiveEventId);
      validateBusinessRules(payload);

      const bookedParticipants = payload.bookedParticipants ?? 0;
      const slug = await buildUniqueSlug(event, payload.startDatetime);
      const status = payload.status ?? (bookedParticipants >= payload.capacity ? 'full' : 'scheduled');

      const created = await repository.create({
        ...payload,
        eventId: effectiveEventId,
        slug,
        status,
        bookedParticipants,
        isActive: payload.isActive ?? true
      });

      return serializeDeparture(created);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async update(id, rawPayload) {
    try {
      validateId(id);
      const payload = validateService(updateDepartureSchema, rawPayload);
      const current = await repository.findById(id);
      if (!current) {
        throw new AppError('Salida no encontrada', 404, 'DEPARTURE_NOT_FOUND');
      }

      const effectiveEventId = payload.eventId ?? current.eventId;
      const eventChanged = Boolean(
        payload.eventId && String(payload.eventId) !== String(current.eventId)
      );
      const startChanged = Boolean(
        payload.startDatetime &&
        new Date(payload.startDatetime).getTime() !== new Date(current.startDatetime).getTime()
      );

      validateBusinessRules(payload, current);

      const data = { ...payload };

      if (eventChanged || startChanged) {
        const event = await findEventOrThrow(effectiveEventId);
        data.slug = await buildUniqueSlug(
          event,
          payload.startDatetime ?? current.startDatetime,
          id
        );
      }

      const updated = await repository.updateById(id, data);
      if (!updated) {
        throw new AppError('Salida no encontrada', 404, 'DEPARTURE_NOT_FOUND');
      }

      return serializeDeparture(updated);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async setActivation(id, rawPayload) {
    try {
      validateId(id);
      const payload = validateService(activationSchema, rawPayload);
      const updated = await repository.setActivation(id, payload.isActive);
      if (!updated) {
        throw new AppError('Salida no encontrada', 404, 'DEPARTURE_NOT_FOUND');
      }
      return serializeDeparture(updated);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async softDelete(id) {
    try {
      validateId(id);
      const current = await repository.findByIdIncludingDeleted(id);
      if (!current) {
        throw new AppError('Salida no encontrada', 404, 'DEPARTURE_NOT_FOUND');
      }
      if (current.deleted_at) {
        throw new AppError('La salida ya está eliminada', 409, 'DEPARTURE_ALREADY_DELETED');
      }

      const deleted = await repository.softDeleteById(id);
      if (!deleted) {
        throw new AppError('Salida no encontrada', 404, 'DEPARTURE_NOT_FOUND');
      }
      return serializeDeparture(deleted);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async restore(id) {
    try {
      validateId(id);
      const current = await repository.findByIdIncludingDeleted(id);
      if (!current) {
        throw new AppError('Salida no encontrada', 404, 'DEPARTURE_NOT_FOUND');
      }
      if (!current.deleted_at) {
        throw new AppError('La salida no está eliminada', 409, 'DEPARTURE_NOT_DELETED');
      }

      const restored = await repository.restoreById(id);
      if (!restored) {
        throw new AppError('Salida no encontrada', 404, 'DEPARTURE_NOT_FOUND');
      }
      return serializeDeparture(restored);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async hardDelete(id) {
    try {
      validateId(id);
      const current = await repository.findByIdIncludingDeleted(id);
      if (!current) {
        throw new AppError('Salida no encontrada', 404, 'DEPARTURE_NOT_FOUND');
      }
      if (!current.deleted_at) {
        throw new AppError('La salida no está eliminada', 409, 'DEPARTURE_NOT_DELETED');
      }

      await repository.hardDeleteById(id);
      return { deleted: true };
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async getDeleted() {
    try {
      const departures = await repository.findAllDeleted();
      return departures.map(serializeDeparture);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }
}

module.exports = new DepartureService();
