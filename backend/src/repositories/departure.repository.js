const Departure = require('../models/departure.model');

const NOT_DELETED = { deleted_at: null };

const POPULATE = [
  { path: 'event', select: 'name slug startDate endDate status isActive' }
];

class DepartureRepository {
  populate(query) {
    return query.populate(POPULATE);
  }

  async findAll(filters = {}) {
    return this.populate(
      Departure.find({ ...NOT_DELETED, ...filters }).sort({ startDatetime: 1, _id: 1 })
    );
  }

  async findById(id) {
    return this.populate(Departure.findOne({ _id: id, ...NOT_DELETED }));
  }

  async findByIdIncludingDeleted(id) {
    return Departure.findById(id);
  }

  async findBySlug(slug) {
    return this.populate(Departure.findOne({ slug, ...NOT_DELETED }));
  }

  async findByEventId(eventId) {
    return this.populate(
      Departure.find({ eventId, ...NOT_DELETED }).sort({ startDatetime: 1, _id: 1 })
    );
  }

  async findUpcomingByEventId(eventId, now = new Date()) {
    return this.populate(
      Departure.find({
        eventId,
        ...NOT_DELETED,
        isActive: true,
        status: { $in: ['scheduled', 'full'] },
        endDatetime: { $gte: now }
      }).sort({ startDatetime: 1, _id: 1 })
    );
  }

  async existsBySlug(slug, excludeId) {
    const query = { slug, ...NOT_DELETED };
    if (excludeId) query._id = { $ne: excludeId };
    return Boolean(await Departure.exists(query));
  }

  async create(data) {
    const created = await Departure.create(data);
    return this.findById(created._id);
  }

  async updateById(id, data) {
    return this.populate(
      Departure.findOneAndUpdate({ _id: id, ...NOT_DELETED }, data, {
        new: true,
        runValidators: true
      })
    );
  }

  async setActivation(id, isActive) {
    return this.populate(
      Departure.findOneAndUpdate(
        { _id: id, ...NOT_DELETED },
        { $set: { isActive } },
        { new: true, runValidators: true }
      )
    );
  }

  async softDeleteById(id) {
    return this.populate(
      Departure.findOneAndUpdate(
        { _id: id, ...NOT_DELETED },
        { $set: { isActive: false, deleted_at: new Date() } },
        { new: true, runValidators: true }
      )
    );
  }

  async restoreById(id) {
    return this.populate(
      Departure.findOneAndUpdate(
        { _id: id, deleted_at: { $ne: null } },
        { $set: { isActive: false, deleted_at: null } },
        { new: true, runValidators: true }
      )
    );
  }

  async findAllDeleted() {
    return this.populate(
      Departure.find({ deleted_at: { $ne: null } }).sort({ deleted_at: -1 })
    );
  }

  async hardDeleteById(id) {
    return Departure.findOneAndDelete({ _id: id, deleted_at: { $ne: null } });
  }
}

module.exports = new DepartureRepository();
