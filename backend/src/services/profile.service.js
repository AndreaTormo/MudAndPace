const mongoose = require('mongoose');
const userRepository = require('../repositories/user.repository');
const profileRepository = require('../repositories/profile.repository');
const { AppError, normalizeAppError } = require('../utils/appError');
const { validateService } = require('../utils/validation');
const { objectIdSchema } = require('../validators/user.validator');
const { updateProfileSchema } = require('../validators/profile.validator');

const EMPTY_PROFILE_FIELDS = ['firstName', 'lastName', 'phone', 'avatarUrl', 'city', 'country', 'birthDate'];

function validateId(id) {
  const parsed = objectIdSchema.safeParse(id);
  if (!parsed.success || !mongoose.isValidObjectId(id)) {
    throw new AppError('ID de usuario inválido', 400, 'INVALID_ID');
  }
  return id;
}

async function findUserOrFail(id) {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  return user;
}

function emptyProfile(userId) {
  const profile = { userId: String(userId) };
  for (const field of EMPTY_PROFILE_FIELDS) {
    profile[field] = null;
  }
  return profile;
}

class ProfileService {
  async getProfileByUserId(userId) {
    try {
      validateId(userId);
      const user = await findUserOrFail(userId);

      const profile = await profileRepository.findByUserId(user._id);
      return profile || emptyProfile(user._id);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async upsertProfileByUserId(userId, data) {
    try {
      validateId(userId);
      await findUserOrFail(userId);

      const input = validateService(updateProfileSchema, data);
      return await profileRepository.upsertByUserId(userId, input);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async createProfileForUser(userId, data = {}) {
    return profileRepository.upsertByUserId(userId, data);
  }

  async softDeleteByUserId(userId) {
    return profileRepository.softDeleteByUserId(userId);
  }

  async hardDeleteByUserId(userId) {
    return profileRepository.deleteByUserId(userId);
  }
}

module.exports = new ProfileService();
