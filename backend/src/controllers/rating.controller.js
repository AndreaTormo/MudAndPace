const service = require('../services/rating.service');

function actorFrom(req) {
  return { userId: req.user.id, role: req.user.role };
}

class RatingController {
  async getForDeparture(req, res, next) {
    try {
      const data = await service.getForDeparture(req.params.departureId, actorFrom(req));
      return res.status(200).json({
        success: true,
        message: 'Valoración obtenida correctamente',
        data
      });
    } catch (error) {
      return next(error);
    }
  }

  async upsert(req, res, next) {
    try {
      const data = await service.upsert(req.params.departureId, req.body, actorFrom(req));
      return res.status(200).json({
        success: true,
        message: 'Valoración guardada correctamente',
        data
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const data = await service.remove(req.params.departureId, actorFrom(req));
      return res.status(200).json({
        success: true,
        message: 'Valoración eliminada correctamente',
        data
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new RatingController();
