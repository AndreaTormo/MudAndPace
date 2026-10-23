const fs = require('fs/promises');
const path = require('path');
const repository = require('../repositories/eventImage.repository');
const eventRepository = require('../repositories/event.repository');
const { AppError, normalizeAppError } = require('../utils/appError');
const { objectIdSchema } = require('../validators/event.validator');

const MAX_IMAGES = 8;
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads', 'events');

function validateId(id, message = 'ID no válido', code = 'INVALID_ID') {
  const parsed = objectIdSchema.safeParse(id);
  if (!parsed.success) throw new AppError(message, 400, code);
  return id;
}

function filePath(eventId, filename) {
  return path.join(UPLOAD_ROOT, eventId, path.basename(filename));
}

async function unlinkSafe(target) {
  try {
    await fs.unlink(target);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function assertEventExists(eventId) {
  const event = await eventRepository.findById(eventId);
  if (!event) throw new AppError('Evento no encontrado', 404, 'EVENT_NOT_FOUND');
  return event;
}

class EventImageService {
  async list(eventId) {
    try {
      validateId(eventId, 'ID de evento inválido');
      await assertEventExists(eventId);
      return await repository.findByEventId(eventId);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async add(eventId, files = []) {
    let stored = false;

    try {
      validateId(eventId, 'ID de evento inválido');
      await assertEventExists(eventId);

      if (!files.length) {
        throw new AppError('No se ha enviado ninguna imagen', 400, 'NO_IMAGES');
      }

      const currentCount = await repository.countByEventId(eventId);
      if (currentCount + files.length > MAX_IMAGES) {
        throw new AppError(
          `Un evento puede tener como máximo ${MAX_IMAGES} fotos`,
          409,
          'IMAGE_LIMIT_REACHED'
        );
      }

      const nextOrder = await repository.getNextOrder(eventId);
      const documents = files.map((file, index) => ({
        eventId,
        url: `/uploads/events/${eventId}/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        alt: '',
        isCover: currentCount === 0 && index === 0,
        order: nextOrder + index
      }));

      await repository.createMany(documents);
      stored = true;

      return await repository.findByEventId(eventId);
    } catch (error) {
      if (!stored) {
        await Promise.all(files.map((file) => unlinkSafe(file.path)));
      }
      throw normalizeAppError(error);
    }
  }

  async remove(eventId, imageId) {
    try {
      validateId(eventId, 'ID de evento inválido');
      validateId(imageId, 'ID de imagen inválido', 'INVALID_IMAGE_ID');
      await assertEventExists(eventId);

      const image = await repository.findByEventAndId(eventId, imageId);
      if (!image) throw new AppError('Imagen no encontrada', 404, 'IMAGE_NOT_FOUND');

      await repository.deleteById(imageId);
      if (image.filename) {
        await unlinkSafe(filePath(eventId, image.filename));
      }

      if (image.isCover) {
        const remaining = await repository.findByEventId(eventId);
        if (remaining.length) {
          await repository.updateById(remaining[0]._id, { isCover: true });
        }
      }

      return await repository.findByEventId(eventId);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async setCover(eventId, imageId) {
    try {
      validateId(eventId, 'ID de evento inválido');
      validateId(imageId, 'ID de imagen inválido', 'INVALID_IMAGE_ID');
      await assertEventExists(eventId);

      const image = await repository.findByEventAndId(eventId, imageId);
      if (!image) throw new AppError('Imagen no encontrada', 404, 'IMAGE_NOT_FOUND');

      await repository.clearCover(eventId, imageId);
      await repository.updateById(imageId, { isCover: true });
      return await repository.findByEventId(eventId);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async removeAllForEvent(eventId) {
    validateId(eventId, 'ID de evento inválido');
    const images = await repository.findByEventId(eventId);
    await repository.deleteByEventId(eventId);
    await Promise.all(
      images
        .filter((image) => image.filename)
        .map((image) => unlinkSafe(filePath(eventId, image.filename)))
    );
    await fs.rm(path.join(UPLOAD_ROOT, eventId), { recursive: true, force: true });
  }
}

module.exports = new EventImageService();
