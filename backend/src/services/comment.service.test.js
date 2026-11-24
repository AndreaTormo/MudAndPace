jest.mock('../repositories/comment.repository', () => ({
  findByDepartureId: jest.fn(),
  findAll: jest.fn(),
  findLatestByUser: jest.fn(),
  findRecentByHash: jest.fn(),
  findById: jest.fn(),
  findByIdIncludingDeleted: jest.fn(),
  create: jest.fn(),
  updateContent: jest.fn(),
  setStatus: jest.fn(),
  addReport: jest.fn(),
  softDeleteById: jest.fn(),
  restoreById: jest.fn(),
  findAllDeleted: jest.fn(),
  deleteByDepartureId: jest.fn()
}));

jest.mock('../repositories/departure.repository', () => ({
  findById: jest.fn(),
  findByIdsIncludingDeleted: jest.fn()
}));

jest.mock('../repositories/event.repository', () => ({
  findById: jest.fn(),
  findByIds: jest.fn()
}));

jest.mock('../repositories/user.repository', () => ({
  findByIdsIncludingDeleted: jest.fn()
}));

jest.mock('../repositories/profile.repository', () => ({
  findByUserIds: jest.fn()
}));

jest.mock('../utils/departureContext', () => ({
  validateObjectId: jest.fn((id) => id),
  loadDepartureContext: jest.fn(),
  findDepartureOrThrow: jest.fn(),
  ensureDepartureCommentable: jest.fn(),
  ensureDepartureFinished: jest.fn()
}));

const commentRepository = require('../repositories/comment.repository');
const userRepository = require('../repositories/user.repository');
const profileRepository = require('../repositories/profile.repository');
const departureContext = require('../utils/departureContext');
const { AppError } = require('../utils/appError');
const commentService = require('./comment.service');

const USER_ID = '665a1b2c3d4e5f6071829301';
const REPORTER_ID = '665a1b2c3d4e5f6071829302';
const ADMIN_ID = '665a1b2c3d4e5f6071829303';
const DEPARTURE_ID = '665a1b2c3d4e5f6071829304';
const COMMENT_ID = '665a1b2c3d4e5f6071829305';
const EVENT_ID = '665a1b2c3d4e5f6071829306';

function commentDoc(overrides = {}) {
  return {
    _id: COMMENT_ID,
    userId: USER_ID,
    departureId: DEPARTURE_ID,
    eventId: EVENT_ID,
    content: 'Comentario de prueba válido',
    status: 'visible',
    reportedBy: [],
    deleted_at: null,
    created_At: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
    ...overrides
  };
}

describe('CommentService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    departureContext.validateObjectId.mockImplementation((id) => id);
    departureContext.findDepartureOrThrow.mockResolvedValue({ _id: DEPARTURE_ID });
    departureContext.loadDepartureContext.mockResolvedValue({
      departure: { _id: DEPARTURE_ID, endDatetime: new Date('2020-01-01T00:00:00Z') },
      event: { _id: EVENT_ID }
    });
    userRepository.findByIdsIncludingDeleted.mockResolvedValue([
      { _id: USER_ID, name: 'Ana' }
    ]);
    profileRepository.findByUserIds.mockResolvedValue([
      { userId: USER_ID, firstName: 'Ana', lastName: 'García', avatarUrl: null }
    ]);
    commentRepository.findLatestByUser.mockResolvedValue(null);
    commentRepository.findRecentByHash.mockResolvedValue(null);
  });

  test('rechaza HTML en el contenido', async () => {
    await expect(
      commentService.create(DEPARTURE_ID, { content: '<b>hola</b>' }, { userId: USER_ID })
    ).rejects.toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
    expect(commentRepository.create).not.toHaveBeenCalled();
  });

  test('no publica comentarios antes de que finalice la salida', async () => {
    departureContext.ensureDepartureFinished.mockImplementation(() => {
      throw new AppError('Comments are only allowed after the departure ends', 409, 'DEPARTURE_NOT_COMPLETED');
    });

    await expect(
      commentService.create(
        DEPARTURE_ID,
        { content: 'Comentario de prueba válido' },
        { userId: USER_ID }
      )
    ).rejects.toMatchObject({ statusCode: 409, code: 'DEPARTURE_NOT_COMPLETED' });
    expect(commentRepository.create).not.toHaveBeenCalled();
  });

  test('editar un comentario no lo detecta como duplicado de sí mismo', async () => {
    commentRepository.findById.mockResolvedValue(commentDoc());
    commentRepository.updateContent.mockResolvedValue(
      commentDoc({ content: 'Contenido editado correctamente' })
    );

    const result = await commentService.update(
      COMMENT_ID,
      { content: 'Contenido editado correctamente' },
      { userId: USER_ID }
    );

    expect(commentRepository.findRecentByHash).toHaveBeenCalledWith(
      USER_ID,
      expect.any(String),
      expect.any(Date),
      { excludeId: COMMENT_ID }
    );
    expect(commentRepository.updateContent).toHaveBeenCalledTimes(1);
    expect(result.reportedByMe).toBe(false);
  });

  test('reportar distingue comentario inexistente de ya reportado', async () => {
    commentRepository.findById.mockResolvedValueOnce(null);
    await expect(
      commentService.report(COMMENT_ID, { userId: REPORTER_ID })
    ).rejects.toMatchObject({ statusCode: 404, code: 'COMMENT_NOT_FOUND' });

    commentRepository.findById.mockResolvedValue(commentDoc());
    commentRepository.addReport.mockResolvedValue(null);
    commentRepository.findByIdIncludingDeleted.mockResolvedValue(commentDoc());
    await expect(
      commentService.report(COMMENT_ID, { userId: REPORTER_ID })
    ).rejects.toMatchObject({ statusCode: 409, code: 'COMMENT_ALREADY_REPORTED' });
  });

  test('listDeleted es solo para admin y respeta paginación', async () => {
    await expect(
      commentService.listDeleted({}, { userId: USER_ID, role: 'USER' })
    ).rejects.toMatchObject({ statusCode: 403, code: 'COMMENT_FORBIDDEN' });

    commentRepository.findAllDeleted.mockResolvedValue({ data: [], total: 0 });
    const result = await commentService.listDeleted(
      { page: 2, pageSize: 5 },
      { userId: ADMIN_ID, role: 'ADMIN' }
    );

    expect(commentRepository.findAllDeleted).toHaveBeenCalledWith({ page: 2, pageSize: 5 });
    expect(result.pagination).toEqual({ total: 0, page: 2, pageSize: 5, totalPages: 0 });
  });
});
