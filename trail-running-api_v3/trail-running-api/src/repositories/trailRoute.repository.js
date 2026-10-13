const TrailRoute = require('../models/trailRoute.model');

const NOT_DELETED = { deleted_at: null };

class TrailRouteRepository {
  async findAll(filters = {}, { includeDeleted = false } = {}) {
    const query = includeDeleted ? filters : { ...NOT_DELETED, ...filters };
    return TrailRoute.find(query).sort({ created_At: -1 });
  }

  async findById(id, { includeDeleted = false } = {}) {
    return includeDeleted
      ? TrailRoute.findById(id)
      : TrailRoute.findOne({ _id: id, ...NOT_DELETED });
  }

  async findBySlug(slug, { includeDeleted = false } = {}) {
    return TrailRoute.findOne(includeDeleted ? { slug } : { slug, ...NOT_DELETED });
  }

  async create(data) { return TrailRoute.create(data); }

  async updateById(id, data) {
    return TrailRoute.findOneAndUpdate({ _id: id, ...NOT_DELETED }, data, { new: true, runValidators: true });
  }

  async softDeleteById(id) {
    return TrailRoute.findOneAndUpdate(
      { _id: id, ...NOT_DELETED, isActive: true },
      { $set: { isActive: false, status: 'inactive', deleted_at: null } },
      { new: true, runValidators: true }
    );
  }

  async restoreById(id) {
    return TrailRoute.findOneAndUpdate(
      { _id: id, isActive: false },
      { $set: { isActive: true, status: 'active', deleted_at: null } },
      { new: true, runValidators: true }
    );
  }

  async activateById(id) {
    return TrailRoute.findOneAndUpdate(
      { _id: id, isActive: false },
      { $set: { isActive: true, status: 'active', deleted_at: null } },
      { new: true, runValidators: true }
    );
  }

  async deactivateById(id) {
    return TrailRoute.findOneAndUpdate(
      { _id: id, ...NOT_DELETED, isActive: true },
      { $set: { isActive: false, status: 'inactive', deleted_at: null } },
      { new: true, runValidators: true }
    );
  }

  async findNearby(longitude, latitude, maxDistanceMeters) {
    return TrailRoute.find({
      ...NOT_DELETED, isActive: true, status: 'active',
      startPoint: { $near: { $geometry: { type: 'Point', coordinates: [longitude, latitude] }, $maxDistance: maxDistanceMeters } }
    });
  }
}

module.exports = new TrailRouteRepository();
