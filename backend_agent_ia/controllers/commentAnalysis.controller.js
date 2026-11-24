const commentSummaryService = require('../services/commentSummary.service');
const sentimentAnalysisService = require('../services/sentimentAnalysis.service');

class CommentAnalysisController {
  async getSummary(req, res, next) {
    try {
      const data = await commentSummaryService.getForDeparture(req.params.departureId);
      return res.status(200).json({
        success: true,
        message: 'Resumen de comentarios obtenido correctamente',
        data
      });
    } catch (error) {
      return next(error);
    }
  }

  async getSentiment(req, res, next) {
    try {
      const data = await sentimentAnalysisService.getReport(req.query);
      return res.status(200).json({
        success: true,
        message: 'Análisis de sentimiento obtenido correctamente',
        data
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new CommentAnalysisController();
