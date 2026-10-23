const EventImage = require('../models/eventImage.model');

class EventImageRepository {
  async findByEventId(eventId) {
    return EventImage.find({ eventId }).sort({ order: 1, created_At: 1 });
  }

  async countByEventId(eventId) {
    return EventImage.countDocuments({ eventId });
  }

  async getNextOrder(eventId) {
    const last = await EventImage.findOne({ eventId }).sort({ order: -1 }).select('order').lean();
    return last ? last.order + 1 : 1;
  }

  async createMany(documents) {
    return EventImage.insertMany(documents);
  }

  async findByEventAndId(eventId, imageId) {
    return EventImage.findOne({ _id: imageId, eventId });
  }

  async updateById(imageId, data) {
    return EventImage.findByIdAndUpdate(imageId, data, { new: true, runValidators: true });
  }

  async clearCover(eventId, exceptId) {
    return EventImage.updateMany(
      { eventId, isCover: true, _id: { $ne: exceptId } },
      { $set: { isCover: false } }
    );
  }

  async deleteById(imageId) {
    return EventImage.findByIdAndDelete(imageId);
  }

  async deleteByEventId(eventId) {
    return EventImage.deleteMany({ eventId });
  }
}

module.exports = new EventImageRepository();
