const weatherService = require('../services/weather.service');

class WeatherController {
  async getWeather(req, res, next) {
    try {
      const data = await weatherService.getWeather(req.query);
      return res.status(200).json({
        success: true,
        message: 'Previsión meteorológica obtenida correctamente',
        data
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new WeatherController();
