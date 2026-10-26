const Category = require('../models/category.model');
const Location = require('../models/location.model');
const Host = require('../models/host.model');
const Event = require('../models/event.model');
const { AppError } = require('../utils/appError');
const mongoose = require('mongoose');

const ACTIVE = { deleted_at: null, isActive: true };

function validateId(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError('ID inválido', 400, 'INVALID_ID');
  return id;
}

async function ensureNoActiveEvents(refField, id) {
  validateId(id);
  const count = await Event.countDocuments({ [refField]: id, deleted_at: null });
  if (count > 0) {
    throw new AppError('No se puede desactivar/eliminar: existen eventos asociados', 409, 'HAS_ASSOCIATED_EVENTS');
  }
}

class ReferenceService {
  async listCategories() {
    return Category.find(ACTIVE).select('name slug').sort({ name: 1 });
  }

  async listLocations() {
    return Location.find(ACTIVE).select('name slug city coordinates').sort({ name: 1 });
  }

  async listHosts() {
    return Host.find(ACTIVE).select('name slug').sort({ name: 1 });
  }

  async softDeleteHost(id) {
    await ensureNoActiveEvents('hostId', id);
    const host = await Host.findByIdAndUpdate(
      id,
      { $set: { isActive: false, status: 'inactive', deleted_at: new Date() } },
      { new: true }
    );
    if (!host) throw new AppError('Organizador no encontrado', 404, 'HOST_NOT_FOUND');
    return host;
  }

  async deactivateHost(id) {
    return this.softDeleteHost(id);
  }

  async softDeleteCategory(id) {
    await ensureNoActiveEvents('categoryId', id);
    const category = await Category.findByIdAndUpdate(
      id,
      { $set: { isActive: false, status: 'inactive', deleted_at: new Date() } },
      { new: true }
    );
    if (!category) throw new AppError('Categoría no encontrada', 404, 'CATEGORY_NOT_FOUND');
    return category;
  }

  async deactivateCategory(id) {
    return this.softDeleteCategory(id);
  }

  async softDeleteLocation(id) {
    await ensureNoActiveEvents('locationId', id);
    const location = await Location.findByIdAndUpdate(
      id,
      { $set: { isActive: false, status: 'inactive', deleted_at: new Date() } },
      { new: true }
    );
    if (!location) throw new AppError('Ubicación no encontrada', 404, 'LOCATION_NOT_FOUND');
    return location;
  }

  async deactivateLocation(id) {
    return this.softDeleteLocation(id);
  }
}

module.exports = new ReferenceService();
