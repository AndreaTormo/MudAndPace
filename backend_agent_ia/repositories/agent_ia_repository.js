const Groq = require('groq-sdk');

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

const agentIaRepository = {
  async chat(messages) {
    const completion = await getClient().chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages,
      temperature: 0.5,
      max_tokens: 600
    });

    return completion.choices[0]?.message?.content ?? '';
  }
};

module.exports = agentIaRepository;
