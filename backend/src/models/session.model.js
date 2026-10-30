const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    jti: { type: String, required: true, unique: true, index: true },
    tokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null, index: true },
    ip: { type: String, default: null, trim: true, maxlength: 120 },
    userAgent: { type: String, default: null, trim: true, maxlength: 500 }
  },
  {
    timestamps: { createdAt: 'created_At', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'sessions'
  }
);

sessionSchema.index({ userId: 1, revokedAt: 1 });

module.exports = mongoose.model('Session', sessionSchema);
