const userService = require('../services/user.service');

class UserController {
  async register(req, res, next) {
    try {
      const result = await userService.registerUser(req.body);
      return res.status(201).json({
        success: true,
        message: result.message,
        data: result.user
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      return res.status(201).json({
        success: true,
        message: 'Usuario creado correctamente',
        data: user
      });
    } catch (error) {
      return next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const filters = {};

      if (typeof req.query.is_active !== 'undefined') {
        filters.isActive = req.query.is_active === 'true';
      }

      if (typeof req.query.isActive !== 'undefined') {
        filters.isActive = req.query.isActive === 'true';
      }

      if (req.query.status) {
        filters.status = req.query.status;
      }

      if (req.query.role) {
        filters.role = req.query.role;
      }

      const users = await userService.getAllUsers(filters);

      return res.status(200).json({
        success: true,
        message: 'Usuarios obtenidos correctamente',
        data: users
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Usuario obtenido correctamente',
        data: user
      });
    } catch (error) {
      return next(error);
    }
  }

  async patch(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body, req.user);
      return res.status(200).json({
        success: true,
        message: 'Usuario actualizado correctamente',
        data: user
      });
    } catch (error) {
      return next(error);
    }
  }

  async setActivation(req, res, next) {
    try {
      const isActive = req.body.isActive ?? req.body.is_active;
      const user = await userService.setActivation(req.params.id, isActive);
      return res.status(200).json({
        success: true,
        message: `Usuario ${isActive ? 'activado' : 'desactivado'} correctamente`,
        data: user
      });
    } catch (error) {
      return next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      await userService.softDeleteUser(req.params.id);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new UserController();
