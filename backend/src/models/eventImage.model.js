const mongoose = require('mongoose');

const eventImageSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    url: { type: String, required: true, trim: true },
    filename: { type: String, required: true, trim: true },
    originalName: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    size: { type: Number, min: 0 },
    alt: { type: String, trim: true, maxlength: 200, default: '' },
    isCover: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0, min: 0 }
  },
  {
    timestamps: { createdAt: 'created_At', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'event_images'
  }
);

eventImageSchema.index({ eventId: 1, order: 1 });
eventImageSchema.index({ eventId: 1, isCover: 1 });

module.exports = mongoose.model('EventImage', eventImageSchema);
