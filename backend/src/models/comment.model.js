const mongoose = require('mongoose');

const COMMENT_STATUSES = ['visible', 'hidden', 'reported'];

const commentSchema = new mongoose.Schema(
  {
    departureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Departure',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    content: { type: String, required: true, trim: true, minlength: 3, maxlength: 1500 },
    status: {
      type: String,
      enum: COMMENT_STATUSES,
      default: 'visible',
      index: true
    },
    contentHash: { type: String, default: '' },
    reportedBy: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],
    deleted_at: { type: Date, default: null, index: true }
  },
  {
    timestamps: { createdAt: 'created_At', updatedAt: 'updated_at' },
    versionKey: false
  }
);

commentSchema.index({ departureId: 1, deleted_at: 1, created_At: -1 });
commentSchema.index({ userId: 1, created_At: -1 });
commentSchema.index({ userId: 1, contentHash: 1, created_At: -1 });

module.exports = mongoose.model('Comment', commentSchema);
