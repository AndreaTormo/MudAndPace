const express = require('express');
const { rateLimit } = require('express-rate-limit');
const controller = require('../controllers/comment.controller');
const authenticate = require('../middlewares/authenticate.middleware');
const authorize = require('../middlewares/authorize.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  commentIdParamsSchema,
  departureIdParamsSchema,
  createCommentSchema,
  updateCommentSchema,
  commentStatusSchema,
  reportCommentSchema,
  commentListQuerySchema,
  commentAdminListQuerySchema,
  commentDeletedListQuerySchema
} = require('../validators/comment.validator');

const router = express.Router();
const departureRouter = express.Router({ mergeParams: true });
const adminOnly = authorize();

function tooManyRequests(req, res) {
  return res.status(429).json({
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas peticiones. Inténtalo de nuevo más tarde.'
    }
  });
}

const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: (req) => req.user?.id ?? req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequests
});

const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: (req) => req.user?.id ?? req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequests
});

departureRouter.use(authenticate);
departureRouter.get(
  '/',
  validate(departureIdParamsSchema, 'params'),
  validate(commentListQuerySchema, 'query'),
  controller.listByDeparture
);
departureRouter.post(
  '/',
  commentLimiter,
  validate(departureIdParamsSchema, 'params'),
  validate(createCommentSchema, 'body'),
  controller.create
);

router.use(authenticate);
router.get(
  '/',
  adminOnly,
  validate(commentAdminListQuerySchema, 'query'),
  controller.listAll
);
router.get(
  '/deleted',
  adminOnly,
  validate(commentDeletedListQuerySchema, 'query'),
  controller.listDeleted
);
router.patch(
  '/:id/status',
  adminOnly,
  validate(commentIdParamsSchema, 'params'),
  validate(commentStatusSchema, 'body'),
  controller.setStatus
);
router.patch(
  '/:id/restore',
  adminOnly,
  validate(commentIdParamsSchema, 'params'),
  controller.restore
);
router.post(
  '/:id/report',
  reportLimiter,
  validate(commentIdParamsSchema, 'params'),
  validate(reportCommentSchema, 'body'),
  controller.report
);
router.patch(
  '/:id',
  validate(commentIdParamsSchema, 'params'),
  validate(updateCommentSchema, 'body'),
  controller.update
);
router.delete('/:id', validate(commentIdParamsSchema, 'params'), controller.remove);

module.exports = { router, departureRouter };
