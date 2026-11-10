const Event = require('../models/event.model');
const Category = require('../models/category.model');
const Host = require('../models/host.model');
const Location = require('../models/location.model');
const EventImage = require('../models/eventImage.model');

const ACTIVE_REFERENCE = { deleted_at: null, isActive: true, status: 'active' };
const PUBLISHED_EVENT = { deleted_at: null, isActive: true, status: 'published' };

const POPULATE = [
  { path: 'host', select: 'name slug' },
  { path: 'category', select: 'name slug' },
  { path: 'location', select: 'name slug city coordinates' }
];

class ShopRepository {
  async findActiveCategories() {
    return Category.find(ACTIVE_REFERENCE)
      .select('name slug imageUrl')
      .sort({ name: 1 });
  }

  async findActiveHosts() {
    return Host.find(ACTIVE_REFERENCE)
      .select('name slug imageUrl')
      .sort({ name: 1 });
  }

  async findActiveLocations() {
    return Location.find(ACTIVE_REFERENCE)
      .select('name slug city coordinates imageUrl')
      .sort({ name: 1 });
  }

  async findPublishedEvents(filters = {}, { page = 1, limit = 9 } = {}) {
    const query = { ...PUBLISHED_EVENT, ...filters };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Event.find(query)
        .populate(POPULATE)
        .sort({ startDate: 1, _id: 1 })
        .skip(skip)
        .limit(limit),
      Event.countDocuments(query)
    ]);

    return { data, total };
  }

  async findPublishedEventBySlug(slug) {
    return Event.findOne({ ...PUBLISHED_EVENT, slug }).populate(POPULATE);
  }

  async findImagesByEventIds(eventIds = []) {
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return [];
    }

    return EventImage.find({ eventId: { $in: eventIds } })
      .sort({ order: 1, created_At: 1 })
      .lean();
  }
}

module.exports = new ShopRepository();
