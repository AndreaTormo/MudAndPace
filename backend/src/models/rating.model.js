const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    departureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Departure',
      required: true,
      index: true
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: (value) => Number.isInteger(value),
        message: 'La valoración debe ser un número entero'
      }
    },
    review: { type: String, trim: true, default: '', maxlength: 600 },
    deleted_at: { type: Date, default: null, index: true }
  },
  {
    timestamps: { createdAt: 'created_At', updatedAt: 'updated_at' },
    versionKey: false
  }
);

ratingSchema.index(
  { userId: 1, departureId: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } }
);
ratingSchema.index({ departureId: 1, deleted_at: 1, created_At: -1 });
ratingSchema.index({ eventId: 1, deleted_at: 1 });
ratingSchema.index({ userId: 1, created_At: -1 });

module.exports = mongoose.model('Rating', ratingSchema);
