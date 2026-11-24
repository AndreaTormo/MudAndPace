const mongoose = require('mongoose');

const aiSentimentAnalysisSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    scope: { type: String, enum: ['global', 'departure', 'event'], required: true, index: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    fingerprint: { type: String, required: true, index: true },
    state: { type: String, enum: ['ready', 'no_data'], default: 'ready', index: true },
    labels: [
      {
        commentId: { type: mongoose.Schema.Types.ObjectId, required: true },
        source: { type: String, enum: ['comment', 'rating'], default: 'comment' },
        contentHash: { type: String, default: '' },
        label: { type: String, enum: ['positive', 'neutral', 'negative'], required: true },
        themes: { type: [String], default: [] },
        variant: { type: String, default: '' },
        ratingScore: { type: Number, default: null },
        classifiedAt: { type: Date, default: Date.now }
      }
    ],
    aggregate: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    model: { type: String, default: '' },
    generatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: 'created_At', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'ai_sentiment_analyses'
  }
);

aiSentimentAnalysisSchema.index({ scope: 1, targetId: 1 });

module.exports = mongoose.models.AiSentimentAnalysis ?? mongoose.model('AiSentimentAnalysis', aiSentimentAnalysisSchema);
