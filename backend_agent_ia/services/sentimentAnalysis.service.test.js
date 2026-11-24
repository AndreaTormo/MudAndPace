jest.mock('../repositories/agent_ia_repository', () => ({
  completeJson: jest.fn(),
  modelName: jest.fn(() => 'test-model'),
  chat: jest.fn()
}));

jest.mock('../repositories/commentAnalysis.repository', () => ({
  findForSentiment: jest.fn(),
  findForSummary: jest.fn()
}));

jest.mock('../repositories/ratingAnalysis.repository', () => ({
  findForSentiment: jest.fn()
}));

jest.mock('../repositories/analysisContext.repository', () => ({
  findDepartureById: jest.fn(),
  findDeparturesByIds: jest.fn(),
  findDeparturesByEventId: jest.fn(),
  findEventById: jest.fn(),
  findEventsByIds: jest.fn()
}));

jest.mock('../repositories/aiAnalysis.repository', () => ({
  findSentiment: jest.fn(),
  upsertSentiment: jest.fn()
}));

const groqRepository = require('../repositories/agent_ia_repository');
const commentaryRepository = require('../repositories/commentAnalysis.repository');
const ratingRepository = require('../repositories/ratingAnalysis.repository');
const contextRepository = require('../repositories/analysisContext.repository');
const aiAnalysisRepository = require('../repositories/aiAnalysis.repository');
const { AppError } = require('../utils/appError');
const sentimentAnalysisService = require('./sentimentAnalysis.service');

const DEPARTURE_ID = '665a1b2c3d4e5f6071829303';
const EVENT_ID = '665a1b2c3d4e5f6071829304';

function comment(index, label, createdAt = '2026-01-01T00:00:00Z') {
  const date = new Date(createdAt);
  return {
    _id: `665a1b2c3d4e5f60718293${String(index).padStart(2, '0')}`,
    departureId: DEPARTURE_ID,
    content: `Comentario ${index}`,
    contentHash: `hash-${index}`,
    status: 'visible',
    created_At: date,
    updated_at: date
  };
}

function rating(index, score, review, departureId = DEPARTURE_ID, createdAt = '2026-01-01T00:00:00Z') {
  const date = new Date(createdAt);
  return {
    _id: `665a1b2c3d4e5f60718294${String(index).padStart(2, '0')}`,
    departureId,
    eventId: EVENT_ID,
    score,
    review,
    created_At: date,
    updated_at: date
  };
}

describe('SentimentAnalysisService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    groqRepository.modelName.mockReturnValue('test-model');
    commentaryRepository.findForSentiment.mockResolvedValue([]);
    ratingRepository.findForSentiment.mockResolvedValue([]);
    aiAnalysisRepository.findSentiment.mockResolvedValue(null);
    aiAnalysisRepository.upsertSentiment.mockImplementation((key, data) =>
      Promise.resolve({ key, ...data, generatedAt: new Date('2026-01-03T00:00:00Z') })
    );
    contextRepository.findDeparturesByIds.mockResolvedValue([
      { _id: DEPARTURE_ID, eventId: EVENT_ID, slug: 'salida-test' }
    ]);
    contextRepository.findEventsByIds.mockResolvedValue([{ _id: EVENT_ID, name: 'Evento test' }]);
  });

  test('devuelve no_data sin clasificar cuando no hay comentarios', async () => {
    const result = await sentimentAnalysisService.getReport({ scope: 'global' });

    expect(result.state).toBe('no_data');
    expect(result.total).toBe(0);
    expect(groqRepository.completeJson).not.toHaveBeenCalled();
  });

  test('clasifica comentarios y calcula distribución y tendencia', async () => {
    const comments = [
      comment(1, 'positive', '2026-01-01T00:00:00Z'),
      comment(2, 'neutral', '2026-01-02T00:00:00Z'),
      comment(3, 'negative', '2026-02-01T00:00:00Z')
    ];
    commentaryRepository.findForSentiment.mockResolvedValue(comments);
    groqRepository.completeJson.mockImplementation(({ system }) => {
      if (system.includes('Clasifica CADA comentario')) {
        return Promise.resolve({
          labels: [
            { id: String(comments[0]._id), label: 'positive', themes: ['ambiente'] },
            { id: String(comments[1]._id), label: 'neutral', themes: [] },
            { id: String(comments[2]._id), label: 'negative', themes: ['cartel'] }
          ]
        });
      }
      return Promise.resolve({ summary: 'El sentimiento mejora.' });
    });

    const result = await sentimentAnalysisService.getReport({ scope: 'global' });

    expect(result.total).toBe(3);
    expect(result.distribution.positive.count).toBe(1);
    expect(result.distribution.neutral.count).toBe(1);
    expect(result.distribution.negative.count).toBe(1);
    expect(result.score).toBe(50);
    expect(result.topThemes).toEqual([
      { theme: 'ambiente', count: 1 },
      { theme: 'cartel', count: 1 }
    ]);
    expect(result.trend).toHaveLength(2);
    expect(result.trendSummary).toBe('El sentimiento mejora.');
    expect(aiAnalysisRepository.upsertSentiment).toHaveBeenCalledTimes(1);
  });

  test('valida los filtros de ámbito', async () => {
    await expect(sentimentAnalysisService.getReport({ scope: 'departure' })).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR'
    });
  });

  test('normaliza includeDeleted desde query string y desde boolean', async () => {
    await sentimentAnalysisService.getReport({ scope: 'global', includeDeleted: 'true' });
    await sentimentAnalysisService.getReport({ scope: 'global', includeDeleted: true });

    expect(commentaryRepository.findForSentiment).toHaveBeenCalledTimes(2);
    expect(commentaryRepository.findForSentiment).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ includeDeleted: true })
    );
    expect(commentaryRepository.findForSentiment).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ includeDeleted: true })
    );
  });

  test('normaliza includeDeleted=false y conserva el valor false', async () => {
    await sentimentAnalysisService.getReport({ scope: 'global', includeDeleted: 'false' });
    await sentimentAnalysisService.getReport({ scope: 'global', includeDeleted: false });

    expect(commentaryRepository.findForSentiment).toHaveBeenCalledTimes(2);
    expect(commentaryRepository.findForSentiment).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ includeDeleted: false })
    );
    expect(commentaryRepository.findForSentiment).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ includeDeleted: false })
    );
  });

  test('rechaza un includeDeleted inválido', async () => {
    await expect(
      sentimentAnalysisService.getReport({ scope: 'global', includeDeleted: 'yes' })
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Filtros de análisis inválidos',
      details: expect.arrayContaining([expect.objectContaining({ path: 'includeDeleted' })])
    });
  });

  test('clasifica opiniones de valoraciones por separado y por modalidad', async () => {
    const secondDepartureId = '665a1b2c3d4e5f6071829305';
    const comments = [comment(1, 'positive')];
    const ratings = [
      rating(1, 5, 'Muy buena carrera', DEPARTURE_ID),
      rating(2, 2, 'Señalización regular', secondDepartureId)
    ];
    const event = {
      _id: EVENT_ID,
      name: 'Evento test',
      slug: 'evento-test',
      variants: [
        { name: 'OCC', distanceKm: 50, elevationGain: 2500, price: 120 },
        { name: 'CCC', distanceKm: 100, elevationGain: 5500, price: 200 }
      ]
    };
    const departures = [
      {
        _id: DEPARTURE_ID,
        eventId: EVENT_ID,
        slug: 'evento-test-occ-2026-08-01',
        price: 120
      },
      {
        _id: secondDepartureId,
        eventId: EVENT_ID,
        slug: 'evento-test-ccc-2026-08-01',
        price: 200
      }
    ];

    commentaryRepository.findForSentiment.mockResolvedValue(comments);
    ratingRepository.findForSentiment.mockResolvedValue(ratings);
    contextRepository.findDeparturesByIds.mockResolvedValue(departures);
    contextRepository.findEventsByIds.mockResolvedValue([event]);
    groqRepository.completeJson.mockImplementation(({ system }) => {
      if (system.includes('Clasifica CADA comentario')) {
        return Promise.resolve({
          labels: [
            { id: String(comments[0]._id), label: 'positive', themes: ['ambiente'] },
            { id: String(ratings[0]._id), label: 'positive', themes: ['organización'] },
            { id: String(ratings[1]._id), label: 'negative', themes: ['cartel'] }
          ]
        });
      }
      return Promise.resolve({ summary: '' });
    });

    const result = await sentimentAnalysisService.getReport({ scope: 'global' });

    expect(ratingRepository.findForSentiment).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(1);
    expect(result.ratings.total).toBe(2);
    expect(result.ratings.average).toBe(3.5);
    expect(result.ratings.reviewCount).toBe(2);
    expect(result.ratings.sentiment.distribution.positive.count).toBe(1);
    expect(result.ratings.sentiment.distribution.negative.count).toBe(1);
    expect(result.ratings.byVariant).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'OCC', total: 1, average: 5, reviewCount: 1 }),
        expect.objectContaining({ name: 'CCC', total: 1, average: 2, reviewCount: 1 })
      ])
    );
    expect(result.rankings.variants).toEqual([]);
  });

  test('includeRatings=false excluye las valoraciones', async () => {
    ratingRepository.findForSentiment.mockResolvedValue([rating(1, 5, 'Muy bien')]);

    const result = await sentimentAnalysisService.getReport({
      scope: 'global',
      includeRatings: 'false'
    });

    expect(ratingRepository.findForSentiment).not.toHaveBeenCalled();
    expect(result.state).toBe('no_data');
    expect(result.ratings.total).toBe(0);
    expect(groqRepository.completeJson).not.toHaveBeenCalled();
  });

  test('propaga AI_INVALID_RESPONSE sin convertirlo en AI_UNAVAILABLE', async () => {
    commentaryRepository.findForSentiment.mockResolvedValue([comment(1, 'positive')]);
    groqRepository.completeJson.mockRejectedValue(
      new AppError('La respuesta de Groq no es JSON válido', 502, 'AI_INVALID_RESPONSE')
    );

    await expect(sentimentAnalysisService.getReport({ scope: 'global' })).rejects.toMatchObject({
      statusCode: 502,
      code: 'AI_INVALID_RESPONSE'
    });
  });
});
