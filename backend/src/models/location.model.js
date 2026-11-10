const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    city: { type: String, trim: true, maxlength: 120 },
    country: { type: String, trim: true, maxlength: 120 },
    coordinates: { type: [Number], index: '2dsphere' },
    imageUrl: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    isActive: { type: Boolean, default: true, index: true },
    deleted_at: { type: Date, default: null, index: true }
  },
  { timestamps: { createdAt: 'created_At', updatedAt: 'updated_at' }, versionKey: false }
);

locationSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } }
);
locationSchema.index({ deleted_at: 1, isActive: 1, status: 1, name: 1 });
locationSchema.index({ country: 1, city: 1, deleted_at: 1 });
locationSchema.index(
  { name: 'text', city: 'text', country: 'text' },
  { name: 'location_text_search' }
);

module.exports = mongoose.model('Location', locationSchema);
