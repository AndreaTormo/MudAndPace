const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const userRepository = require('../repositories/user.repository');
const profileRepository = require('../repositories/profile.repository');
const { AppError, normalizeAppError } = require('../utils/appError');
const { toPublicUser } = require('../utils/publicUser');
const { buildUserFilter } = require('../utils/userQuery');
const { validateService } = require('../utils/validation');
const { objectIdSchema, listUserQuerySchema } = require('../validators/user.validator');
const { updateProfileSchema } = require('../validators/profile.validator');

const EMPTY_PROFILE_FIELDS = ['firstName', 'lastName', 'phone', 'avatarUrl', 'city', 'country', 'birthDate'];
const AVATAR_ROOT = path.join(__dirname, '..', '..', 'uploads', 'avatars');

async function removeLocalAvatar(avatarUrl, userId) {
  const prefix = `/uploads/avatars/${userId}/`;
  if (typeof avatarUrl !== 'string' || !avatarUrl.startsWith(prefix)) return;

  const directory = path.join(AVATAR_ROOT, String(userId));
  const filePath = path.join(directory, path.basename(avatarUrl));
  if (!filePath.startsWith(`${directory}${path.sep}`)) return;

  await fs.promises.rm(filePath, { force: true }).catch(() => undefined);
}

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

  async getAllProfiles(query = {}) {
    try {
      const input = validateService(listUserQuerySchema, query);
      const users = await userRepository.findAll(buildUserFilter(input));
      const profiles = await profileRepository.findByUserIds(users.map((user) => user._id));
      const profilesByUserId = new Map(
        profiles.map((profile) => [String(profile.userId), profile])
      );

      return users.map((user) => ({
        user: toPublicUser(user),
        profile: profilesByUserId.get(String(user._id)) || null
      }));
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async upsertProfileByUserId(userId, data) {
    try {
      validateId(userId);
      await findUserOrFail(userId);

      const input = validateService(updateProfileSchema, data);
      const previous = input.avatarUrl !== undefined
        ? await profileRepository.findByUserId(userId)
        : null;
      const profile = await profileRepository.upsertByUserId(userId, input);

      if (input.avatarUrl !== undefined && previous?.avatarUrl !== profile.avatarUrl) {
        await removeLocalAvatar(previous?.avatarUrl, userId);
      }

      return profile;
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async uploadAvatar(userId, file) {
    try {
      validateId(userId);
      await findUserOrFail(userId);

      if (!file?.filename) {
        throw new AppError('Debes seleccionar una imagen', 400, 'AVATAR_REQUIRED');
      }

      const avatarUrl = `/uploads/avatars/${userId}/${path.basename(file.filename)}`;
      const previous = await profileRepository.findByUserId(userId);
      const profile = await profileRepository.upsertByUserId(userId, { avatarUrl });

      if (previous?.avatarUrl !== profile.avatarUrl) {
        await removeLocalAvatar(previous?.avatarUrl, userId);
      }

      return profile;
    } catch (error) {
      if (file?.path) {
        await fs.promises.rm(file.path, { force: true }).catch(() => undefined);
      }
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
