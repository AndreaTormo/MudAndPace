jest.mock('../repositories/rating.repository', () => ({
  findMineByUserAndDeparture: jest.fn(),
  findMineByUserAndEventIds: jest.fn(),
  findMineByUserAndDepartureIds: jest.fn(),
  upsert: jest.fn(),
  softDeleteForUser: jest.fn(),
  findByIdIncludingDeleted: jest.fn(),
  aggregateByDepartureIds: jest.fn(),
  aggregateByEventIds: jest.fn(),
  deleteByDepartureId: jest.fn()
}));

jest.mock('../utils/departureContext', () => ({
  validateObjectId: jest.fn((id) => id),
  loadDepartureContext: jest.fn(),
  findDepartureOrThrow: jest.fn(),
  ensureDepartureCommentable: jest.fn(),
  ensureDepartureFinished: jest.fn()
}));

const ratingRepository = require('../repositories/rating.repository');
const departureContext = require('../utils/departureContext');
const ratingService = require('./rating.service');

const USER_ID = '665a1b2c3d4e5f6071829301';
const OTHER_USER_ID = '665a1b2c3d4e5f6071829302';
const DEPARTURE_ID = '665a1b2c3d4e5f6071829303';
const EVENT_ID = '665a1b2c3d4e5f6071829304';

function ratingDoc(score = 5, userId = USER_ID, review = '') {
  return {
    _id: '665a1b2c3d4e5f6071829310',
    userId,
    departureId: DEPARTURE_ID,
    eventId: EVENT_ID,
    score,
    review,
    created_At: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-02T00:00:00Z')
  };
}

describe('RatingService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    departureContext.validateObjectId.mockImplementation((id) => id);
    departureContext.findDepartureOrThrow.mockResolvedValue({ _id: DEPARTURE_ID });
    departureContext.loadDepartureContext.mockResolvedValue({
      departure: { _id: DEPARTURE_ID, eventId: EVENT_ID },
      event: { _id: EVENT_ID }
    });
    ratingRepository.aggregateByDepartureIds.mockResolvedValue([]);
    ratingRepository.aggregateByEventIds.mockResolvedValue([]);
    ratingRepository.findMineByUserAndDeparture.mockResolvedValue(null);
    ratingRepository.findMineByUserAndEventIds.mockResolvedValue([]);
    ratingRepository.findMineByUserAndDepartureIds.mockResolvedValue([]);
  });

  test('exige usuario autenticado para valorar', async () => {
    await expect(ratingService.upsert(DEPARTURE_ID, { score: 5 }, {})).rejects.toMatchObject({
      statusCode: 401,
      code: 'RATING_UNAUTHENTICATED'
    });
    expect(ratingRepository.upsert).not.toHaveBeenCalled();
  });

  test('rechaza puntuaciones fuera de 1..5', async () => {
    await expect(
      ratingService.upsert(DEPARTURE_ID, { score: 6 }, { userId: USER_ID })
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
    await expect(
      ratingService.upsert(DEPARTURE_ID, { score: 0 }, { userId: USER_ID })
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
    expect(ratingRepository.upsert).not.toHaveBeenCalled();
  });

  test('guarda una valoración por salida y devuelve el resumen agregado', async () => {
    ratingRepository.upsert.mockResolvedValue(ratingDoc(5, USER_ID, 'Muy buena carrera'));
    ratingRepository.aggregateByDepartureIds.mockResolvedValue([
      { _id: DEPARTURE_ID, total: 2, scoreSum: 8 }
    ]);
    ratingRepository.findMineByUserAndDeparture.mockResolvedValue(ratingDoc(5));

    const result = await ratingService.upsert(
      DEPARTURE_ID,
      { score: 5, review: 'Muy buena carrera' },
      { userId: USER_ID, role: 'USER' }
    );

    expect(ratingRepository.upsert).toHaveBeenCalledWith({
      userId: USER_ID,
      departureId: DEPARTURE_ID,
      eventId: EVENT_ID,
      score: 5,
      review: 'Muy buena carrera'
    });
    expect(result.rating.mine).toBe(true);
    expect(result.summary).toEqual({ average: 4, total: 2, mine: 5 });
  });

  test('impide borrar la valoración de otro usuario', async () => {
    ratingRepository.findMineByUserAndDeparture.mockResolvedValue(ratingDoc(5, OTHER_USER_ID));

    await expect(
      ratingService.remove(DEPARTURE_ID, { userId: USER_ID, role: 'USER' })
    ).rejects.toMatchObject({ statusCode: 403, code: 'RATING_FORBIDDEN' });
    expect(ratingRepository.softDeleteForUser).not.toHaveBeenCalled();
  });

  test('agrega resúmenes por evento en una sola consulta por lote', async () => {
    const secondEventId = '665a1b2c3d4e5f6071829305';
    ratingRepository.aggregateByEventIds.mockResolvedValue([
      { _id: EVENT_ID, total: 3, scoreSum: 12 }
    ]);
    ratingRepository.findMineByUserAndEventIds.mockResolvedValue([ratingDoc(4)]);

    const summaries = await ratingService.getSummariesForEvents(
      [EVENT_ID, secondEventId],
      { userId: USER_ID }
    );

    expect(ratingRepository.aggregateByEventIds).toHaveBeenCalledTimes(1);
    expect(ratingRepository.findMineByUserAndEventIds).toHaveBeenCalledTimes(1);
    expect(summaries.get(EVENT_ID)).toEqual({ average: 4, total: 3, mine: 4 });
    expect(summaries.get(secondEventId)).toEqual({ average: null, total: 0, mine: null });
  });
});
