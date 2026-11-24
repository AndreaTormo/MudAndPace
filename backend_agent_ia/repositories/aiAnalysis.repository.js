const AiCommentSummary = require('../models/aiCommentSummary.model');
const AiSentimentAnalysis = require('../models/aiSentimentAnalysis.model');

class AiAnalysisRepository {
  async findSummary(departureId) {
    return AiCommentSummary.findOne({ departureId }).lean();
  }

  async upsertSummary(departureId, data) {
    return AiCommentSummary.findOneAndUpdate(
      { departureId },
      { $set: { ...data, departureId, generatedAt: new Date() } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();
  }

  async findSentiment(key) {
    return AiSentimentAnalysis.findOne({ key }).lean();
  }

  async upsertSentiment(key, data) {
    return AiSentimentAnalysis.findOneAndUpdate(
      { key },
      { $set: { ...data, key, generatedAt: new Date() } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();
  }
}

module.exports = new AiAnalysisRepository();
