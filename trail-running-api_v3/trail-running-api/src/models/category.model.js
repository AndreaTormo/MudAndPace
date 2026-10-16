const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
    isActive: { type: Boolean, default: true, index: true },
    deleted_at: { type: Date, default: null, index: true }
  },
  { timestamps: { createdAt: 'created_At', updatedAt: 'updated_at' }, versionKey: false }
);

module.exports = mongoose.model('Category', categorySchema);
