const Profile = require('../models/profile.model');

class ProfileRepository {
  async findByUserId(userId) {
    return Profile.findOne({ userId, deleted_at: null });
  }

  async create(data) {
    return Profile.create(data);
  }

  async upsertByUserId(userId, data) {
    return Profile.findOneAndUpdate(
      { userId },
      { $set: { ...data, deleted_at: null }, $setOnInsert: { userId } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }

  async softDeleteByUserId(userId) {
    return Profile.findOneAndUpdate(
      { userId, deleted_at: null },
      { $set: { deleted_at: new Date() } },
      { new: true, runValidators: true }
    );
  }

  async deleteByUserId(userId) {
    return Profile.deleteOne({ userId });
  }
}

module.exports = new ProfileRepository();
