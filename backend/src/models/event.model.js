const mongoose = require('mongoose');

const MIN_EVENT_VARIANTS = 3;

const eventVariantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    distanceKm: { type: Number, required: true, min: 0.1 },
    elevationGain: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 3000 },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Host', required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    distanceKm: { type: Number, required: true, min: 0.1 },
    elevationGain: { type: Number, required: true, min: 0 },
    elevationLossM: { type: Number, default: 0, min: 0 },
    difficulty: { type: String, enum: ['easy', 'moderate', 'hard', 'expert'], default: 'moderate' },
    surface: [{ type: String, enum: ['trail', 'rock', 'dirt', 'gravel', 'asphalt', 'mixed'] }],
    tags: [{ type: String, trim: true, lowercase: true }],
    gpxUrl: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    variants: {
      type: [eventVariantSchema],
      default: [],
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= MIN_EVENT_VARIANTS,
        message: `El evento debe tener al menos ${MIN_EVENT_VARIANTS} modalidades`
      }
    },
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

eventSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } }
);
eventSchema.index({ slug: 1, deleted_at: 1 });
eventSchema.index({ status: 1, isActive: 1, startDate: 1 });
eventSchema.index({ deleted_at: 1, status: 1, isActive: 1, startDate: 1 });
eventSchema.index({ deleted_at: 1, categoryId: 1, startDate: 1 });
eventSchema.index({ deleted_at: 1, hostId: 1, startDate: 1 });
eventSchema.index({ deleted_at: 1, locationId: 1, startDate: 1 });
eventSchema.index({ deleted_at: 1, distanceKm: 1 });
eventSchema.index({ deleted_at: 1, price: 1 });
eventSchema.index({ deleted_at: 1, difficulty: 1 });
eventSchema.index({ 'variants.distanceKm': 1 });
eventSchema.index({ 'variants.distanceKm': 1, deleted_at: 1 });
eventSchema.index({ 'variants.price': 1, deleted_at: 1 });
eventSchema.index({ 'variants.elevationGain': 1, deleted_at: 1 });
eventSchema.index(
  { name: 'text', description: 'text', tags: 'text' },
  { name: 'event_text_search' }
);

module.exports = mongoose.model('Event', eventSchema);
