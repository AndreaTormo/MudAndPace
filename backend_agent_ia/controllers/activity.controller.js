const activityService = require('../services/activity.service');

class ActivityController {
  async estimate(req, res, next) {
    try {
      const data = activityService.estimate(req.query);
      return res.status(200).json({
        success: true,
        message: 'Estimación calculada correctamente',
        data
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data = await activityService.createActivity(req.body);
      return res.status(201).json({
        success: true,
        message: 'Actividad creada correctamente',
        data
      });
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    try {
      const data = await activityService.listActivities(req.query);
      return res.status(200).json({
        success: true,
        message: 'Actividades obtenidas correctamente',
        data
      });
    } catch (error) {
      return next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const data = await activityService.getStats(req.query);
      return res.status(200).json({
        success: true,
        message: 'Totales obtenidos correctamente',
        data
      });
    } catch (error) {
      return next(error);
    }
  }

  async get(req, res, next) {
    try {
      const data = await activityService.getActivity(req.params.id, req.query.userId);
      return res.status(200).json({
        success: true,
        message: 'Actividad obtenida correctamente',
        data
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = await activityService.updateActivity(req.params.id, req.body.userId, req.body);
      return res.status(200).json({
        success: true,
        message: 'Actividad actualizada correctamente',
        data
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      await activityService.deleteActivity(req.params.id, req.query.userId);
      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ActivityController();
