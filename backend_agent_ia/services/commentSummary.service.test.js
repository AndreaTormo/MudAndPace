jest.mock('../repositories/agent_ia_repository', () => ({
  completeJson: jest.fn(),
  modelName: jest.fn(() => 'test-model'),
  chat: jest.fn()
}));

jest.mock('../repositories/commentAnalysis.repository', () => ({
  findForSummary: jest.fn()
}));

jest.mock('../repositories/analysisContext.repository', () => ({
  findDepartureById: jest.fn(),
  findEventById: jest.fn()
}));

jest.mock('../repositories/aiAnalysis.repository', () => ({
  findSummary: jest.fn(),
  upsertSummary: jest.fn()
}));

const groqRepository = require('../repositories/agent_ia_repository');
const commentaryRepository = require('../repositories/commentAnalysis.repository');
const contextRepository = require('../repositories/analysisContext.repository');
const aiAnalysisRepository = require('../repositories/aiAnalysis.repository');
const { AppError } = require('../utils/appError');
const commentSummaryService = require('./commentSummary.service');

const DEPARTURE_ID = '665a1b2c3d4e5f6071829303';
const EVENT_ID = '665a1b2c3d4e5f6071829304';

function comment(index = 1, content = 'Muy buena carrera', status = 'visible') {
  return {
    _id: `665a1b2c3d4e5f60718293${String(index).padStart(2, '0')}`,
    content,
    contentHash: `hash-${index}`,
    status,
    created_At: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z')
  };
}

describe('CommentSummaryService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    groqRepository.modelName.mockReturnValue('test-model');
    contextRepository.findDepartureById.mockResolvedValue({
      _id: DEPARTURE_ID,
      eventId: EVENT_ID,
      slug: 'salida-test'
    });
    contextRepository.findEventById.mockResolvedValue({ name: 'Evento test' });
    commentaryRepository.findForSummary.mockResolvedValue([]);
    aiAnalysisRepository.findSummary.mockResolvedValue(null);
    aiAnalysisRepository.upsertSummary.mockImplementation((departureId, data) =>
      Promise.resolve({ departureId, ...data, generatedAt: new Date('2026-01-02T00:00:00Z') })
    );
  });

  test('devuelve no_data sin llamar a Groq cuando no hay comentarios', async () => {
    const result = await commentSummaryService.getForDeparture(DEPARTURE_ID);

    expect(result.state).toBe('no_data');
    expect(result.commentCount).toBe(0);
    expect(groqRepository.completeJson).not.toHaveBeenCalled();
  });

  test('reutiliza el resumen guardado cuando el fingerprint coincide', async () => {
    const comments = [comment()];
    commentaryRepository.findForSummary.mockResolvedValue(comments);
    aiAnalysisRepository.findSummary.mockResolvedValue({
      fingerprint: require('../utils/analysis.util').buildFingerprint(`summary:${DEPARTURE_ID}`, comments),
      state: 'ready',
      summary: 'Resumen guardado',
      highlights: ['Punto fuerte'],
      improvements: [],
      commentCount: 1,
      model: 'test-model',
      generatedAt: new Date('2026-01-02T00:00:00Z')
    });

    const result = await commentSummaryService.getForDeparture(DEPARTURE_ID);

    expect(result.summary).toBe('Resumen guardado');
    expect(groqRepository.completeJson).not.toHaveBeenCalled();
  });

  test('genera y persiste un resumen nuevo', async () => {
    commentaryRepository.findForSummary.mockResolvedValue([comment(1, 'Buen ambiente'), comment(2, 'Cartel mejorable')]);
    groqRepository.completeJson.mockResolvedValue({
      summary: 'La salida gustó mucho.',
      highlights: ['Ambiente', 'Organización'],
      improvements: ['Cartel', 'Avituallamiento', 'Señales', 'Extra']
    });

    const result = await commentSummaryService.getForDeparture(DEPARTURE_ID);

    expect(groqRepository.completeJson).toHaveBeenCalledTimes(1);
    expect(result.summary).toBe('La salida gustó mucho.');
    expect(result.highlights).toHaveLength(2);
    expect(result.improvements).toHaveLength(3);
    expect(result.model).toBe('test-model');
    expect(aiAnalysisRepository.upsertSummary).toHaveBeenCalledTimes(1);
  });

  test('usa un presupuesto amplio para generar resúmenes parciales', async () => {
    commentaryRepository.findForSummary.mockResolvedValue([comment(1, 'Buen ambiente')]);
    groqRepository.completeJson.mockResolvedValue({
      summary: 'La salida gustó mucho.',
      highlights: [],
      improvements: []
    });

    await commentSummaryService.getForDeparture(DEPARTURE_ID);

    expect(groqRepository.completeJson).toHaveBeenCalledTimes(1);
    expect(groqRepository.completeJson.mock.calls[0][0].maxTokens).toBe(1200);
  });

  test('usa un presupuesto amplio para combinar varios resúmenes parciales', async () => {
    commentaryRepository.findForSummary.mockResolvedValue(
      Array.from({ length: 31 }, (_, index) => comment(index + 1, 'Comentario de prueba'))
    );
    groqRepository.completeJson.mockResolvedValue({
      summary: 'Resumen parcial.',
      highlights: [],
      improvements: []
    });

    await commentSummaryService.getForDeparture(DEPARTURE_ID);

    expect(groqRepository.completeJson).toHaveBeenCalledTimes(3);
    expect(groqRepository.completeJson.mock.calls[0][0].maxTokens).toBe(1200);
    expect(groqRepository.completeJson.mock.calls[1][0].maxTokens).toBe(1200);
    expect(groqRepository.completeJson.mock.calls[2][0].maxTokens).toBe(1600);
  });

  test('propaga AI_INVALID_RESPONSE sin convertirlo en AI_UNAVAILABLE', async () => {
    commentaryRepository.findForSummary.mockResolvedValue([comment(1, 'Buen ambiente')]);
    groqRepository.completeJson.mockRejectedValue(
      new AppError('La respuesta de Groq no es JSON válido', 502, 'AI_INVALID_RESPONSE')
    );

    await expect(commentSummaryService.getForDeparture(DEPARTURE_ID)).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_INVALID_RESPONSE'
    });
  });

  test('valida el identificador de salida', async () => {
    await expect(commentSummaryService.getForDeparture('no-valido')).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR'
    });
  });
});
