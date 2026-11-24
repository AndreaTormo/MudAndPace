const Rating = require('../models/analysisRating.model');

const FIELDS = 'userId departureId eventId score review created_At updated_at';

class RatingAnalysisRepository {
  async findForSentiment({ departureIds = [], includeDeleted = false } = {}) {
    const query = {};
    if (departureIds.length > 0) query.departureId = { $in: departureIds };
    if (!includeDeleted) query.deleted_at = null;

    return Rating.find(query).select(FIELDS).sort({ created_At: 1, _id: 1 }).lean();
  }
}

module.exports = new RatingAnalysisRepository();
