const { normalizeRole } = require('./jwt');

function toPublicUser(user, profile = null) {
  if (!user) return null;

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    canManage: normalizeRole(user.role) === 'ADMIN',
    status: user.status,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    created_At: user.created_At,
    updated_at: user.updated_at,
    profile: profile || undefined
  };
}

module.exports = { toPublicUser };
