const mockCreate = jest.fn();

jest.mock('groq-sdk', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } }
  }))
);

process.env.GROQ_API_KEY = 'test-key';

const agentIaRepository = require('./agent_ia_repository');

describe('agentIaRepository.completeJson', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  test('devuelve el JSON parseado', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{"summary":"Resumen"}' } }]
    });

    await expect(
      agentIaRepository.completeJson({ system: 's', user: 'u', maxTokens: 10 })
    ).resolves.toEqual({ summary: 'Resumen' });
  });

  test('marca como AI_INVALID_RESPONSE una respuesta sin JSON', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: '' } }] });

    await expect(
      agentIaRepository.completeJson({ system: 's', user: 'u', maxTokens: 10 })
    ).rejects.toMatchObject({ code: 'AI_INVALID_RESPONSE', statusCode: 502 });
  });
});
