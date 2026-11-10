const mongoose = require('mongoose');

const DEPARTURE_STATUSES = ['scheduled', 'full', 'cancelled', 'completed'];

const departureSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true
    },
    slug: { type: String, required: true, lowercase: true, trim: true },
    startDatetime: { type: Date, required: true, index: true },
    endDatetime: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    bookedParticipants: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: DEPARTURE_STATUSES,
      default: 'scheduled',
      index: true
    },
    isActive: { type: Boolean, default: true, index: true },
    deleted_at: { type: Date, default: null, index: true }
  },
  {
    timestamps: { createdAt: 'created_At', updatedAt: 'updated_at' },
    versionKey: false
  }
);

departureSchema.virtual('event', {
  ref: 'Event',
  localField: 'eventId',
  foreignField: '_id',
  justOne: true
});

departureSchema.set('toJSON', { virtuals: true });
departureSchema.set('toObject', { virtuals: true });

departureSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } }
);
departureSchema.index({ slug: 1, deleted_at: 1 });
departureSchema.index({
  eventId: 1,
  deleted_at: 1,
  status: 1,
  isActive: 1,
  startDatetime: 1
});
departureSchema.index({
  deleted_at: 1,
  status: 1,
  isActive: 1,
  startDatetime: 1
});
departureSchema.index({ eventId: 1, startDatetime: 1 });
departureSchema.index({ price: 1 });

module.exports = mongoose.model('Departure', departureSchema);
