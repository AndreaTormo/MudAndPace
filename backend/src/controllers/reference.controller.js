const service = require('../services/reference.service');

class ReferenceController {
  async listCategories(req, res, next) {
    try {
      const data = await service.listCategories();
      return res.status(200).json({ success: true, message: 'Categorías obtenidas correctamente', data });
    } catch (error) { return next(error); }
  }

  async listLocations(req, res, next) {
    try {
      const data = await service.listLocations();
      return res.status(200).json({ success: true, message: 'Ubicaciones obtenidas correctamente', data });
    } catch (error) { return next(error); }
  }

  async listHosts(req, res, next) {
    try {
      const data = await service.listHosts();
      return res.status(200).json({ success: true, message: 'Organizadores obtenidos correctamente', data });
    } catch (error) { return next(error); }
  }
}

module.exports = new ReferenceController();
