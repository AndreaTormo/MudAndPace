const { AppError } = require('../../backend/src/utils/appError');
const agentIaRepository = require('../agent_ia_repository/agent_ia_repository');

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY = 10;

const SYSTEM_PROMPT = `Eres el asistente virtual de MudAndPace, una aplicación web de eventos y rutas de trail running.
Ayudas a los usuarios con: elegir eventos o rutas según nivel, distancia y desnivel, modalidades, material y calzado, preparación física, alimentación e hidratación, seguridad en montaña, alojamiento y transporte.
Normas:
- Responde siempre en el idioma del usuario, de forma clara y breve (máximo 6-8 líneas).
- Si no sabes un dato concreto (horarios, precios, estado de un sendero o disponibilidad), dilo; no inventes.
- Si te preguntan algo que no tiene relación con el trail running o la app, indica amablemente que solo puedes ayudar con ese tema.
- Ante dudas médicas o de seguridad graves, recomienda consultar a un profesional o a los servicios de emergencia.`;

const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim() !== ''
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));
};

const agentIaService = {
  async chat({ message, history } = {}) {
    if (typeof message !== 'string' || message.trim() === '') {
      throw new AppError('Message is required', 400, 'VALIDATION_ERROR');
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new AppError(`Message must not exceed ${MAX_MESSAGE_LENGTH} characters`, 400, 'VALIDATION_ERROR');
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...sanitizeHistory(history),
      { role: 'user', content: message.trim() }
    ];

    try {
      return await agentIaRepository.chat(messages);
    } catch (error) {
      console.error('Error calling Groq:', error.message);
      if (error instanceof AppError) throw error;
      throw new AppError('Assistant is currently unavailable', 502, 'ASSISTANT_UNAVAILABLE');
    }
  }
};

module.exports = agentIaService;
