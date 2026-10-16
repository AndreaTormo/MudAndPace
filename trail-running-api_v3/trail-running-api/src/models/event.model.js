const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true, maxlength: 3000 },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Host', required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    distanceKm: { type: Number, required: true, min: 0.1 },
    elevationGain: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['published', 'draft'], default: 'draft', index: true },
    isActive: { type: Boolean, default: true, index: true },
    deleted_at: { type: Date, default: null, index: true }
  },
  { timestamps: { createdAt: 'created_At', updatedAt: 'updated_at' }, versionKey: false }
);

eventSchema.virtual('host', { ref: 'Host', localField: 'hostId', foreignField: '_id', justOne: true });
eventSchema.virtual('category', { ref: 'Category', localField: 'categoryId', foreignField: '_id', justOne: true });
eventSchema.virtual('location', { ref: 'Location', localField: 'locationId', foreignField: '_id', justOne: true });

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

eventSchema.index({ slug: 1, deleted_at: 1 });
eventSchema.index({ status: 1, isActive: 1, startDate: 1 });

module.exports = mongoose.model('Event', eventSchema);
