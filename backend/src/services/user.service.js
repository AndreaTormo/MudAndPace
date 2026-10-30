const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');
const profileService = require('./profile.service');
const { AppError, normalizeAppError } = require('../utils/appError');
const { toPublicUser } = require('../utils/publicUser');
const { validateService } = require('../utils/validation');
const { registerSchema } = require('../validators/auth.validator');
const { createUserSchema, updateUserSchema, objectIdSchema, roleValues } = require('../validators/user.validator');
const { profileFieldKeys } = require('../validators/profile.validator');

const BCRYPT_ROUNDS = 12;

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

function pickProfileFields(input) {
  return profileFieldKeys.reduce((profile, key) => {
    if (input[key] !== undefined) profile[key] = input[key];
    return profile;
  }, {});
}

class UserService {
  async #rollbackUser(user) {
    if (!user) return;

    try {
      await profileService.hardDeleteByUserId(user._id);
      await userRepository.hardDeleteById(user._id);
    } catch (cleanupError) {
      console.error('No se pudo revertir la creación del usuario', cleanupError);
    }
  }

  async registerUser(payload) {
    let user;

    try {
      const input = validateService(registerSchema, payload);

      if (await userRepository.existsByEmail(input.email)) {
        throw new AppError('Ya existe una cuenta con ese email', 409, 'EMAIL_ALREADY_EXISTS');
      }

      const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

      user = await userRepository.create({
        name: input.name,
        email: input.email,
        passwordHash,
        role: 'USER',
        status: 'active',
        isActive: true,
        emailVerified: true,
        tokenVersion: 0,
        deleted_at: null
      });

      const profile = await profileService.createProfileForUser(user._id, pickProfileFields(input));

      return {
        user: toPublicUser(user, profile),
        message: 'Cuenta creada correctamente.'
      };
    } catch (error) {
      await this.#rollbackUser(user);
      throw normalizeAppError(error);
    }
  }

  async createUser(payload) {
    let user;

    try {
      const input = validateService(createUserSchema, payload);

      if (await userRepository.existsByEmail(input.email)) {
        throw new AppError('Ya existe un usuario con ese email', 409, 'EMAIL_ALREADY_EXISTS');
      }

      const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

      user = await userRepository.create({
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role || 'USER',
        status: input.status || 'active',
        isActive: input.isActive ?? true,
        emailVerified: true,
        tokenVersion: 0,
        deleted_at: null
      });

      const profile = await profileService.createProfileForUser(user._id, pickProfileFields(input));
      return toPublicUser(user, profile);
    } catch (error) {
      await this.#rollbackUser(user);
      throw normalizeAppError(error);
    }
  }

  async getAllUsers(filters = {}) {
    try {
      if (filters.role && !roleValues.includes(filters.role)) {
        throw new AppError('Rol inválido', 400, 'INVALID_ROLE');
      }

      const users = await userRepository.findAll(filters);
      return users.map((user) => toPublicUser(user));
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async getUserById(id) {
    try {
      validateId(id);
      const user = await findUserOrFail(id);
      return toPublicUser(user);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async updateUser(id, payload, actor = null) {
    try {
      validateId(id);
      const current = await findUserOrFail(id);
      const input = validateService(updateUserSchema, payload);

      if (actor && actor.role !== 'ADMIN') {
        delete input.role;
        delete input.status;
        delete input.isActive;
      }

      if (input.email && input.email !== current.email) {
        if (await userRepository.emailExists(input.email, id)) {
          throw new AppError('Ya existe un usuario con ese email', 409, 'EMAIL_ALREADY_EXISTS');
        }
      }

      const data = { ...input };

      if (data.password) {
        data.passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
        delete data.password;
      }

      const updated = await userRepository.updateById(id, data);
      if (!updated) {
        throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
      }

      return toPublicUser(updated);
    } catch (error) {
      throw normalizeAppError(error);
    }
  }

  async setActivation(id, isActive) {
    return this.updateUser(id, { isActive });
  }

  async softDeleteUser(id) {
    try {
      validateId(id);

      const existing = await userRepository.findByIdIncludingDeleted(id);
      if (!existing) {
        throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
      }

      if (existing.deleted_at) {
        return { alreadyDeleted: true };
      }

      await userRepository.softDeleteById(id);
      await profileService.softDeleteByUserId(id);
      await sessionRepository.revokeAllByUserId(id);

      return { alreadyDeleted: false };
    } catch (error) {
      throw normalizeAppError(error);
    }
  }
}

module.exports = new UserService();
