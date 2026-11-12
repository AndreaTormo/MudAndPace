const agentIaService = require('../agent_ia_services/agent_ia_services');

class AgentIaController {
  async chat(req, res, next) {
    try {
      const { message, history } = req.body ?? {};
      const reply = await agentIaService.chat({ message, history });
      return res.status(200).json({
        success: true,
        message: 'Respuesta generada correctamente',
        data: { reply }
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AgentIaController();
