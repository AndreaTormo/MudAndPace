const mongoose = require('mongoose');

const departureSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    slug: { type: String, required: true },
    price: { type: Number, default: 0 },
    deleted_at: { type: Date, default: null, index: true }
  },
  {
    versionKey: false,
    collection: 'departures'
  }
);

module.exports = mongoose.models.AnalysisDeparture ?? mongoose.model('AnalysisDeparture', departureSchema);
