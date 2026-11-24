const mongoose = require('mongoose');

const aiCommentSummarySchema = new mongoose.Schema(
  {
    departureId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true
    },
    fingerprint: { type: String, required: true, index: true },
    state: { type: String, enum: ['ready', 'no_data'], default: 'ready', index: true },
    summary: { type: String, default: '' },
    highlights: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
    commentCount: { type: Number, default: 0 },
    model: { type: String, default: '' },
    generatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: { createdAt: 'created_At', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'ai_comment_summaries'
  }
);

module.exports = mongoose.models.AiCommentSummary ?? mongoose.model('AiCommentSummary', aiCommentSummarySchema);
