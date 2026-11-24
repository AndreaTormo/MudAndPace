const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    departureId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, default: '', trim: true, maxlength: 600 },
    deleted_at: { type: Date, default: null, index: true }
  },
  {
    timestamps: { createdAt: 'created_At', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'ratings'
  }
);

module.exports = mongoose.models.AnalysisRating ?? mongoose.model('AnalysisRating', ratingSchema);
