const mongoose = require('mongoose');
const departureRepository = require('../repositories/departure.repository');
const eventRepository = require('../repositories/event.repository');
const { AppError } = require('./appError');
const { objectIdSchema } = require('../validators/departure.validator');

function validateObjectId(id, message = 'ID inválido') {
  const parsed = objectIdSchema.safeParse(id);
  if (!parsed.success || !mongoose.isValidObjectId(id)) {
    throw new AppError(message, 400, 'INVALID_ID');
  }
  return parsed.data;
}

async function loadDepartureContext(departureId) {
  const departure = await departureRepository.findById(departureId);
  if (!departure) {
    throw new AppError('Departure not found', 404, 'DEPARTURE_NOT_FOUND');
  }

  const event = await eventRepository.findById(departure.eventId);
  if (!event) {
    throw new AppError('Departure not found', 404, 'DEPARTURE_NOT_FOUND');
  }

  return { departure, event };
}

async function findDepartureOrThrow(departureId) {
  return (await loadDepartureContext(departureId)).departure;
}

function ensureDepartureCommentable({ departure, event }) {
  if (!departure.isActive || departure.status === 'cancelled') {
    throw new AppError('La salida no admite comentarios en este momento', 409, 'DEPARTURE_NOT_COMMENTABLE');
  }
  if (!event.isActive || event.status !== 'published') {
    throw new AppError('El evento no admite comentarios en este momento', 409, 'EVENT_NOT_COMMENTABLE');
  }
}

function ensureDepartureFinished(departure) {
  const end = new Date(departure.endDatetime).getTime();
  if (!Number.isFinite(end) || end >= Date.now()) {
    throw new AppError(
      'Comments are only allowed after the departure ends',
      409,
      'DEPARTURE_NOT_COMPLETED'
    );
  }
}

module.exports = {
  validateObjectId,
  loadDepartureContext,
  findDepartureOrThrow,
  ensureDepartureCommentable,
  ensureDepartureFinished
};
