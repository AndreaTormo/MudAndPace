const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    variants: [
      {
        name: { type: String, required: true },
        distanceKm: { type: Number, required: true },
        elevationGain: { type: Number, required: true },
        price: { type: Number, required: true }
      }
    ],
    deleted_at: { type: Date, default: null, index: true }
  },
  {
    versionKey: false,
    collection: 'events'
  }
);

module.exports = mongoose.models.AnalysisEvent ?? mongoose.model('AnalysisEvent', eventSchema);
