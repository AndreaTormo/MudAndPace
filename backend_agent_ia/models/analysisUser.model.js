const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
    status: { type: String, enum: ['active', 'inactive', 'blocked'], default: 'active' },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    deleted_at: { type: Date, default: null }
  },
  {
    versionKey: false,
    collection: 'users'
  }
);

module.exports = mongoose.models.AnalysisUser ?? mongoose.model('AnalysisUser', userSchema);
