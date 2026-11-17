const express = require('express');
const { rateLimit } = require('express-rate-limit');

const controller = require('../controllers/activity.controller');
const validate = require('../middlewares/validate.middleware');
const {
  estimateQuerySchema,
  createActivitySchema,
  updateActivitySchema,
  listQuerySchema,
  statsQuerySchema,
  ownerQuerySchema,
  activityIdParamsSchema
} = require('../validators/activity.validator');

const router = express.Router();

const activityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    return res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Demasiadas solicitudes de actividades. Inténtalo de nuevo más tarde.'
      }
    });
  }
});

router.use(activityLimiter);

router.get('/estimate', validate(estimateQuerySchema, 'query'), controller.estimate);
router.get('/stats', validate(statsQuerySchema, 'query'), controller.getStats);
router.get('/', validate(listQuerySchema, 'query'), controller.list);
router.post('/', validate(createActivitySchema), controller.create);
router.get(
  '/:id',
  validate(activityIdParamsSchema, 'params'),
  validate(ownerQuerySchema, 'query'),
  controller.get
);
router.patch(
  '/:id',
  validate(activityIdParamsSchema, 'params'),
  validate(updateActivitySchema),
  controller.update
);
router.delete(
  '/:id',
  validate(activityIdParamsSchema, 'params'),
  validate(ownerQuerySchema, 'query'),
  controller.remove
);

module.exports = router;
