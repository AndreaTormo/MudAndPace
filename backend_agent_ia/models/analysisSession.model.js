const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    jti: { type: String, required: true, unique: true, index: true },
    kind: { type: String, enum: ['access', 'refresh'], default: 'access' },
    familyId: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null }
  },
  {
    versionKey: false,
    collection: 'sessions'
  }
);

module.exports = mongoose.models.AnalysisSession ?? mongoose.model('AnalysisSession', sessionSchema);
