const service = require('../services/comment.service');

function actorFrom(req) {
  return { userId: req.user.id, role: req.user.role };
}

class CommentController {
  async listByDeparture(req, res, next) {
    try {
      const result = await service.listByDeparture(req.params.departureId, req.query, actorFrom(req));
      return res.status(200).json({
        success: true,
        message: 'Comentarios obtenidos correctamente',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      return next(error);
    }
  }

  async listAll(req, res, next) {
    try {
      const result = await service.listAll(req.query, actorFrom(req));
      return res.status(200).json({
        success: true,
        message: 'Comentarios obtenidos correctamente',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const comment = await service.create(req.params.departureId, req.body, actorFrom(req));
      return res.status(201).json({
        success: true,
        message: 'Comentario creado correctamente',
        data: comment
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const comment = await service.update(req.params.id, req.body, actorFrom(req));
      return res.status(200).json({
        success: true,
        message: 'Comentario actualizado correctamente',
        data: comment
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const comment = await service.remove(req.params.id, actorFrom(req));
      return res.status(200).json({
        success: true,
        message: 'Comentario eliminado correctamente',
        data: comment
      });
    } catch (error) {
      return next(error);
    }
  }

  async setStatus(req, res, next) {
    try {
      const comment = await service.setStatus(req.params.id, req.body, actorFrom(req));
      return res.status(200).json({
        success: true,
        message: 'Estado del comentario actualizado correctamente',
        data: comment
      });
    } catch (error) {
      return next(error);
    }
  }

  async report(req, res, next) {
    try {
      const comment = await service.report(req.params.id, actorFrom(req));
      return res.status(200).json({
        success: true,
        message: 'Comentario reportado correctamente',
        data: comment
      });
    } catch (error) {
      return next(error);
    }
  }

  async listDeleted(req, res, next) {
    try {
      const result = await service.listDeleted(req.query, actorFrom(req));
      return res.status(200).json({
        success: true,
        message: 'Comentarios eliminados obtenidos correctamente',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      return next(error);
    }
  }

  async restore(req, res, next) {
    try {
      const comment = await service.restore(req.params.id, actorFrom(req));
      return res.status(200).json({
        success: true,
        message: 'Comentario restaurado correctamente',
        data: comment
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new CommentController();
