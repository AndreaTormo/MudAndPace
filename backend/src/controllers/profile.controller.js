const profileService = require('../services/profile.service');

class ProfileController {
  async getAll(req, res, next) {
    try {
      const profiles = await profileService.getAllProfiles(req.query);
      return res.status(200).json({
        success: true,
        message: 'Perfiles obtenidos correctamente',
        data: profiles
      });
    } catch (error) {
      return next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const profile = await profileService.getProfileByUserId(req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Perfil obtenido correctamente',
        data: profile
      });
    } catch (error) {
      return next(error);
    }
  }

  async upsertMe(req, res, next) {
    try {
      const profile = await profileService.upsertProfileByUserId(req.user.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Perfil actualizado correctamente',
        data: profile
      });
    } catch (error) {
      return next(error);
    }
  }

  async uploadAvatar(req, res, next) {
    try {
      const profile = await profileService.uploadAvatar(req.user.id, req.file);
      return res.status(200).json({
        success: true,
        message: 'Avatar actualizado correctamente',
        data: profile
      });
    } catch (error) {
      return next(error);
    }
  }

  async getByUserId(req, res, next) {
    try {
      const profile = await profileService.getProfileByUserId(req.params.userId);
      return res.status(200).json({
        success: true,
        message: 'Perfil obtenido correctamente',
        data: profile
      });
    } catch (error) {
      return next(error);
    }
  }

  async upsertByUserId(req, res, next) {
    try {
      const profile = await profileService.upsertProfileByUserId(req.params.userId, req.body);
      return res.status(200).json({
        success: true,
        message: 'Perfil actualizado correctamente',
        data: profile
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ProfileController();
