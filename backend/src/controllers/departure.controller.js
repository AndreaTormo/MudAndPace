const service = require('../services/departure.service');

class DepartureController {
  async list(req, res, next) {
    try {
      const departures = await service.getAll(req.query);
      return res.status(200).json({
        success: true,
        message: 'Salidas obtenidas correctamente',
        data: departures
      });
    } catch (error) { return next(error); }
  }

  async listByEvent(req, res, next) {
    try {
      const departures = await service.getByEvent(req.params.eventId, req.query);
      return res.status(200).json({
        success: true,
        message: 'Salidas obtenidas correctamente',
        data: departures
      });
    } catch (error) { return next(error); }
  }

  async getById(req, res, next) {
    try {
      const departure = await service.getById(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Salida obtenida correctamente',
        data: departure
      });
    } catch (error) { return next(error); }
  }

  async create(req, res, next) {
    try {
      const departure = await service.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Salida creada correctamente',
        data: departure
      });
    } catch (error) { return next(error); }
  }

  async createForEvent(req, res, next) {
    try {
      const departure = await service.create(req.body, { eventId: req.params.eventId });
      return res.status(201).json({
        success: true,
        message: 'Salida creada correctamente',
        data: departure
      });
    } catch (error) { return next(error); }
  }

  async update(req, res, next) {
    try {
      const departure = await service.update(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Salida actualizada correctamente',
        data: departure
      });
    } catch (error) { return next(error); }
  }

  async setActivation(req, res, next) {
    try {
      const departure = await service.setActivation(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Estado de la salida actualizado correctamente',
        data: departure
      });
    } catch (error) { return next(error); }
  }

  async softDelete(req, res, next) {
    try {
      const departure = await service.softDelete(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Salida eliminada correctamente',
        data: departure
      });
    } catch (error) { return next(error); }
  }

  async restore(req, res, next) {
    try {
      const departure = await service.restore(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Salida restaurada correctamente',
        data: departure
      });
    } catch (error) { return next(error); }
  }

  async listDeleted(req, res, next) {
    try {
      const departures = await service.getDeleted();
      return res.status(200).json({
        success: true,
        message: 'Salidas eliminadas obtenidas correctamente',
        data: departures
      });
    } catch (error) { return next(error); }
  }

  async hardDelete(req, res, next) {
    try {
      await service.hardDelete(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Salida eliminada definitivamente'
      });
    } catch (error) { return next(error); }
  }
}

module.exports = new DepartureController();
