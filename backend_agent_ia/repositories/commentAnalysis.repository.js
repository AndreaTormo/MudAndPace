const Comment = require('../models/analysisComment.model');

const FIELDS = 'departureId content contentHash status created_At updated_at';
const SUMMARY_STATUSES = ['visible', 'reported'];

class CommentAnalysisRepository {
  async findForSummary(departureId) {
    return Comment.find({
      departureId,
      deleted_at: null,
      status: { $in: SUMMARY_STATUSES }
    })
      .select(FIELDS)
      .sort({ created_At: 1, _id: 1 })
      .lean();
  }

  async findForSentiment({ departureIds = [], includeDeleted = false } = {}) {
    const query = {};
    if (departureIds.length > 0) query.departureId = { $in: departureIds };
    if (!includeDeleted) query.deleted_at = null;

    return Comment.find(query).select(FIELDS).sort({ created_At: 1, _id: 1 }).lean();
  }
}

module.exports = new CommentAnalysisRepository();
