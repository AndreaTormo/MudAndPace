const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    departureId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    content: { type: String, required: true },
    contentHash: { type: String, default: '' },
    status: { type: String, enum: ['visible', 'hidden', 'reported'], default: 'visible', index: true },
    deleted_at: { type: Date, default: null, index: true }
  },
  {
    timestamps: { createdAt: 'created_At', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'comments'
  }
);

module.exports = mongoose.models.AnalysisComment ?? mongoose.model('AnalysisComment', commentSchema);
