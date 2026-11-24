const Groq = require('groq-sdk');
const { AppError } = require('../utils/appError');
const { parseJson } = require('../utils/json.util');

let client = null;

const getClient = () => {
  if (!client) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
};

const getModel = () => process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

const agentIaRepository = {
  async chat(messages) {
    const completion = await getClient().chat.completions.create({
      model: getModel(),
      messages,
      temperature: 0.5,
      max_tokens: 600
    });

    return completion.choices[0]?.message?.content ?? '';
  },

  async completeJson({ system, user, maxTokens = 300 }) {
    const completion = await getClient().chat.completions.create({
      model: getModel(),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.2,
      max_tokens: maxTokens
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const parsed = parseJson(content);
    if (!parsed) {
      throw new AppError('La respuesta de Groq no es JSON válido', 502, 'AI_INVALID_RESPONSE');
    }
    return parsed;
  },

  modelName: getModel
};

module.exports = agentIaRepository;
