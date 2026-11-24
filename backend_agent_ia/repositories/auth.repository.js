const Session = require('../models/analysisSession.model');
const User = require('../models/analysisUser.model');

class AuthRepository {
  async findActiveSessionByJti(jti) {
    return Session.findOne({
      jti,
      kind: 'access',
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    }).lean();
  }

  async findUserById(id) {
    return User.findById(id).lean();
  }
}

module.exports = new AuthRepository();
