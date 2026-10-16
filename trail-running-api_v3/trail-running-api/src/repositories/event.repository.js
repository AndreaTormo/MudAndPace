const Event = require('../models/event.model');

const NOT_DELETED = { deleted_at: null };

const POPULATE = [
  { path: 'host', select: 'name slug' },
  { path: 'category', select: 'name slug' },
  { path: 'location', select: 'name slug city' }
];

class EventRepository {
  async findAll(filters = {}, { includeDeleted = false } = {}) {
    const query = includeDeleted ? filters : { ...NOT_DELETED, ...filters };
    return Event.find(query).populate(POPULATE).sort({ startDate: 1 });
  }

  async findById(id, { includeDeleted = false } = {}) {
    const query = includeDeleted ? { _id: id } : { _id: id, ...NOT_DELETED };
    return Event.findOne(query).populate(POPULATE);
  }

  async findBySlug(slug, { includeDeleted = false } = {}) {
    const query = includeDeleted ? { slug } : { slug, ...NOT_DELETED };
    return Event.findOne(query).populate(POPULATE);
  }

  async create(data) {
    return Event.create(data);
  }

  async updateById(id, data) {
    return Event.findOneAndUpdate({ _id: id, ...NOT_DELETED }, data, { new: true, runValidators: true }).populate(POPULATE);
  }

  async softDeleteById(id) {
    return Event.findOneAndUpdate(
      { _id: id, ...NOT_DELETED, isActive: true },
      { $set: { isActive: false, deleted_at: null } },
      { new: true, runValidators: true }
    );
  }

  async restoreById(id) {
    return Event.findOneAndUpdate(
      { _id: id, isActive: false },
      { $set: { isActive: true, deleted_at: null } },
      { new: true, runValidators: true }
    );
  }

  async publishById(id) {
    return Event.findOneAndUpdate(
      { _id: id, ...NOT_DELETED, status: 'draft' },
      { $set: { status: 'published' } },
      { new: true, runValidators: true }
    );
  }

  async unpublishById(id) {
    return Event.findOneAndUpdate(
      { _id: id, ...NOT_DELETED, status: 'published' },
      { $set: { status: 'draft' } },
      { new: true, runValidators: true }
    );
  }
}

module.exports = new EventRepository();
