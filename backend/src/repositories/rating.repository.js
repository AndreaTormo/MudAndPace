const mongoose = require('mongoose');
const Rating = require('../models/rating.model');

const NOT_DELETED = { deleted_at: null };
const VALID_SCORE = { $gte: 1, $lte: 5 };

function toObjectIds(ids) {
  return [...new Set(ids.map((id) => new mongoose.Types.ObjectId(String(id))))];
}

class RatingRepository {
  async findMineByUserAndDeparture(userId, departureId) {
    return Rating.findOne({ userId, departureId, ...NOT_DELETED });
  }

  async findMineByUserAndEventIds(userId, eventIds) {
    if (!eventIds.length) return [];
    return Rating.find({ userId, eventId: { $in: toObjectIds(eventIds) }, ...NOT_DELETED });
  }

  async findMineByUserAndDepartureIds(userId, departureIds) {
    if (!departureIds.length) return [];
    return Rating.find({ userId, departureId: { $in: toObjectIds(departureIds) }, ...NOT_DELETED });
  }

  async upsert({ userId, departureId, eventId, score, review = '' }) {
    return Rating.findOneAndUpdate(
      { userId, departureId, ...NOT_DELETED },
      {
        $set: { score, review, eventId, deleted_at: null },
        $setOnInsert: { userId, departureId }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  async softDeleteForUser(userId, departureId) {
    return Rating.findOneAndUpdate(
      { userId, departureId, ...NOT_DELETED },
      { $set: { deleted_at: new Date() } },
      { new: true, runValidators: true }
    );
  }

  async findByIdIncludingDeleted(id) {
    return Rating.findById(id);
  }

  async aggregateByDepartureIds(departureIds) {
    if (!departureIds.length) return [];
    return Rating.aggregate([
      {
        $match: {
          departureId: { $in: toObjectIds(departureIds) },
          ...NOT_DELETED,
          score: VALID_SCORE
        }
      },
      {
        $group: {
          _id: '$departureId',
          total: { $sum: 1 },
          scoreSum: { $sum: '$score' }
        }
      }
    ]).exec();
  }

  async aggregateByEventIds(eventIds) {
    if (!eventIds.length) return [];
    return Rating.aggregate([
      {
        $match: {
          eventId: { $in: toObjectIds(eventIds) },
          ...NOT_DELETED,
          score: VALID_SCORE
        }
      },
      {
        $group: {
          _id: '$eventId',
          total: { $sum: 1 },
          scoreSum: { $sum: '$score' }
        }
      }
    ]).exec();
  }

  async deleteByDepartureId(departureId) {
    return Rating.deleteMany({ departureId });
  }
}

module.exports = new RatingRepository();
