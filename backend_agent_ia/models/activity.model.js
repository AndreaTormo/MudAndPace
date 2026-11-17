const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, trim: true, maxlength: 64 },
    eventId: { type: String, trim: true, maxlength: 64 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    date: { type: Date, required: true },
    status: { type: String, enum: ['planned', 'completed'], default: 'completed' },

    distanceKm: { type: Number, required: true, min: 0.1, max: 1000 },
    elevationGainM: { type: Number, default: 0, min: 0, max: 50000 },
    durationSec: { type: Number, required: true, min: 1 },
    calories: { type: Number, required: true, min: 0 },

    estimated: {
      time: { type: Boolean, default: false },
      calories: { type: Boolean, default: false }
    },

    notes: { type: String, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

activitySchema.index({ userId: 1, date: -1 });
activitySchema.index({ eventId: 1 });

module.exports = mongoose.models.Activity ?? mongoose.model('Activity', activitySchema);
