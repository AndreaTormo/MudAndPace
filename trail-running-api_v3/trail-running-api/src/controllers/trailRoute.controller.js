const service = require('../services/trailRoute.service');

class TrailRouteController {
  async list(req, res, next) {
    try {
      const routes = await service.list(req.query);
      return res.status(200).json({ success: true, message: 'Rutas obtenidas correctamente', data: routes });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const route = await service.getById(req.params.id);
      return res.status(200).json({ success: true, message: 'Ruta obtenida correctamente', data: route });
    } catch (error) {
      return next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const route = await service.getBySlug(req.params.slug);
      return res.status(200).json({ success: true, message: 'Ruta obtenida correctamente', data: route });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const route = await service.create(req.body);
      return res.status(201).json({ success: true, message: 'Ruta creada correctamente', data: route });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const route = await service.update(req.params.id, req.body);
      return res.status(200).json({ success: true, message: 'Ruta actualizada correctamente', data: route });
    } catch (error) {
      return next(error);
    }
  }

  async softDelete(req, res, next) {
    try {
      const route = await service.softDelete(req.params.id);
      return res.status(200).json({ success: true, message: 'Ruta eliminada correctamente', data: route });
    } catch (error) {
      return next(error);
    }
  }

  async restore(req, res, next) {
    try {
      const route = await service.restore(req.params.id);
      return res.status(200).json({ success: true, message: 'Ruta restaurada correctamente', data: route });
    } catch (error) {
      return next(error);
    }
  }

  async listDeleted(req, res, next) {
    try {
      const routes = await service.listDeleted();
      return res.status(200).json({ success: true, message: 'Rutas eliminadas obtenidas correctamente', data: routes });
    } catch (error) {
      return next(error);
    }
  }

  async hardDelete(req, res, next) {
    try {
      await service.hardDelete(req.params.id);
      return res.status(200).json({ success: true, message: 'Ruta eliminada definitivamente' });
    } catch (error) {
      return next(error);
    }
  }

  async activate(req, res, next) {
    try {
      const route = await service.activate(req.params.id);
      return res.status(200).json({ success: true, message: 'Ruta activada correctamente', data: route });
    } catch (error) {
      return next(error);
    }
  }

  async deactivate(req, res, next) {
    try {
      const route = await service.deactivate(req.params.id);
      return res.status(200).json({ success: true, message: 'Ruta desactivada correctamente', data: route });
    } catch (error) {
      return next(error);
    }
  }

  async nearby(req, res, next) {
    try {
      const routes = await service.nearby(req.query);
      return res.status(200).json({ success: true, message: 'Rutas cercanas obtenidas correctamente', data: routes });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new TrailRouteController();
