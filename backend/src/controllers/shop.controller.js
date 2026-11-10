const shopService = require('../services/shop.service');

class ShopController {
  async getCategories(req, res) {
    const data = await shopService.getCategories();
    res.json({ success: true, message: 'Categorías obtenidas correctamente', data });
  }

  async getHosts(req, res) {
    const data = await shopService.getHosts();
    res.json({ success: true, message: 'Hosts obtenidos correctamente', data });
  }

  async getLocations(req, res) {
    const data = await shopService.getLocations();
    res.json({ success: true, message: 'Ubicaciones obtenidas correctamente', data });
  }

  async getEvents(req, res) {
    const { data, pagination } = await shopService.getEvents(req.query);
    res.json({ success: true, message: 'Eventos obtenidos correctamente', data, pagination });
  }

  async getEventBySlug(req, res) {
    const data = await shopService.getEventBySlug(req.params.slug);
    res.json({ success: true, message: 'Evento obtenido correctamente', data });
  }

  async getDeparturesByEventSlug(req, res) {
    const data = await shopService.getDeparturesByEventSlug(req.params.slug);
    res.json({ success: true, message: 'Salidas obtenidas correctamente', data });
  }
}

module.exports = new ShopController();
