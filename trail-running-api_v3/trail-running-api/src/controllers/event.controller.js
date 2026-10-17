const service = require('../services/event.service');

class EventController {
  async list(req, res, next) {
    try {
      const events = await service.list(req.query);
      return res.status(200).json({ success: true, message: 'Eventos obtenidos correctamente', data: events });
    } catch (error) { return next(error); }
  }

  async getById(req, res, next) {
    try {
      const event = await service.getById(req.params.id);
      return res.status(200).json({ success: true, message: 'Evento obtenido correctamente', data: event });
    } catch (error) { return next(error); }
  }

  async getBySlug(req, res, next) {
    try {
      const event = await service.getBySlug(req.params.slug);
      return res.status(200).json({ success: true, message: 'Evento obtenido correctamente', data: event });
    } catch (error) { return next(error); }
  }

  async create(req, res, next) {
    try {
      const event = await service.create(req.body);
      return res.status(201).json({ success: true, message: 'Evento creado correctamente', data: event });
    } catch (error) { return next(error); }
  }

  async update(req, res, next) {
    try {
      const event = await service.update(req.params.id, req.body);
      return res.status(200).json({ success: true, message: 'Evento actualizado correctamente', data: event });
    } catch (error) { return next(error); }
  }

  async softDelete(req, res, next) {
    try {
      const event = await service.softDelete(req.params.id);
      return res.status(200).json({ success: true, message: 'Evento eliminado correctamente', data: event });
    } catch (error) { return next(error); }
  }

  async restore(req, res, next) {
    try {
      const event = await service.restore(req.params.id);
      return res.status(200).json({ success: true, message: 'Evento restaurado correctamente', data: event });
    } catch (error) { return next(error); }
  }

<<<<<<< HEAD
  async listDeleted(req, res, next) {
    try {
      const events = await service.listDeleted();
      return res.status(200).json({ success: true, message: 'Eventos eliminados obtenidos correctamente', data: events });
    } catch (error) { return next(error); }
  }

  async hardDelete(req, res, next) {
    try {
      await service.hardDelete(req.params.id);
      return res.status(200).json({ success: true, message: 'Evento eliminado definitivamente' });
    } catch (error) { return next(error); }
  }

=======
>>>>>>> e6414492749754c86037fe5b22fe9940d3ddc0ce
  async publish(req, res, next) {
    try {
      const event = await service.publish(req.params.id);
      return res.status(200).json({ success: true, message: 'Evento publicado correctamente', data: event });
    } catch (error) { return next(error); }
  }

  async unpublish(req, res, next) {
    try {
      const event = await service.unpublish(req.params.id);
      return res.status(200).json({ success: true, message: 'Evento pasado a borrador correctamente', data: event });
    } catch (error) { return next(error); }
  }
}

module.exports = new EventController();
