const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },
    imageUrl: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    isActive: { type: Boolean, default: true, index: true },
    deleted_at: { type: Date, default: null, index: true }
  },
  { timestamps: { createdAt: 'created_At', updatedAt: 'updated_at' }, versionKey: false }
);

categorySchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } }
);
categorySchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { deleted_at: null } }
);
categorySchema.index({ deleted_at: 1, isActive: 1, status: 1, name: 1 });
categorySchema.index(
  { name: 'text', description: 'text' },
  { name: 'category_text_search' }
);

module.exports = mongoose.model('Category', categorySchema);
