const Session = require('../models/session.model');

class SessionRepository {
  async create(data) {
    return Session.create(data);
  }

  async findActiveByJti(jti) {
    return Session.findOne({
      jti,
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    });
  }

  async findByJti(jti) {
    return Session.findOne({ jti });
  }

  async findByUserId(userId) {
    return Session.find({ userId }).sort({ created_At: -1 });
  }

  async revokeByJti(jti) {
    return Session.findOneAndUpdate(
      { jti, revokedAt: null },
      { $set: { revokedAt: new Date() } },
      { new: true }
    );
  }

  async revokeAllByUserId(userId) {
    return Session.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }

  async deleteExpired() {
    return Session.deleteMany({ expiresAt: { $lte: new Date() } });
  }
}

module.exports = new SessionRepository();
