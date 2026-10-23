const service = require('../services/eventImage.service');

class EventImageController {
  async list(req, res, next) {
    try {
      const images = await service.list(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Imágenes del evento obtenidas correctamente',
        data: images
      });
    } catch (error) {
      return next(error);
    }
  }

  async add(req, res, next) {
    try {
      const images = await service.add(req.params.id, Array.isArray(req.files) ? req.files : []);
      return res.status(201).json({
        success: true,
        message: 'Imágenes añadidas correctamente',
        data: images
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const images = await service.remove(req.params.id, req.params.imageId);
      return res.status(200).json({
        success: true,
        message: 'Imagen eliminada correctamente',
        data: images
      });
    } catch (error) {
      return next(error);
    }
  }

  async setCover(req, res, next) {
    try {
      const images = await service.setCover(req.params.id, req.params.imageId);
      return res.status(200).json({
        success: true,
        message: 'Portada actualizada correctamente',
        data: images
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new EventImageController();
