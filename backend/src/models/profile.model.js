const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    firstName: { type: String, trim: true, maxlength: 80, default: '' },
    lastName: { type: String, trim: true, maxlength: 80, default: '' },
    phone: { type: String, trim: true, maxlength: 40, default: '' },
    avatarUrl: { type: String, trim: true, maxlength: 500, default: '' },
    city: { type: String, trim: true, maxlength: 120, default: '' },
    country: { type: String, trim: true, maxlength: 120, default: '' },
    birthDate: { type: Date, default: null },
    deleted_at: { type: Date, default: null, index: true }
  },
  {
    timestamps: { createdAt: 'created_At', updatedAt: 'updated_at' },
    versionKey: false,
    collection: 'profiles'
  }
);

module.exports = mongoose.model('Profile', profileSchema);
