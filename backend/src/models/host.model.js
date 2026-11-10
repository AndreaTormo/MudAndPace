const mongoose = require('mongoose');

const hostSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 3000 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    contactEmail: { type: String, trim: true },
    website: { type: String, trim: true },
    imageUrl: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    isActive: { type: Boolean, default: true, index: true },
    deleted_at: { type: Date, default: null, index: true }
  },
  { timestamps: { createdAt: 'created_At', updatedAt: 'updated_at' }, versionKey: false }
);

hostSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } }
);
hostSchema.index({ deleted_at: 1, isActive: 1, status: 1, name: 1 });
hostSchema.index(
  { name: 'text', description: 'text' },
  { name: 'host_text_search' }
);

module.exports = mongoose.model('Host', hostSchema);
