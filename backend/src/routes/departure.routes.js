const express = require('express');
const controller = require('../controllers/departure.controller');
const authenticate = require('../middlewares/authenticate.middleware');
const authorize = require('../middlewares/authorize.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  idParamsSchema,
  eventIdParamsSchema,
  departurePayloadSchema,
  updateDepartureSchema,
  activationSchema,
  listQuerySchema,
  eventDepartureListQuerySchema
} = require('../validators/departure.validator');

const router = express.Router();
const eventRouter = express.Router({ mergeParams: true });
const adminOnly = authorize();

router.use(authenticate, adminOnly);

router.get('/deleted', controller.listDeleted);
router.get('/', validate(listQuerySchema, 'query'), controller.list);
router.get('/:id', validate(idParamsSchema, 'params'), controller.getById);
router.post('/', validate(departurePayloadSchema, 'body'), controller.create);
router.patch(
  '/:id',
  validate(idParamsSchema, 'params'),
  validate(updateDepartureSchema, 'body'),
  controller.update
);
router.patch(
  '/:id/activation',
  validate(idParamsSchema, 'params'),
  validate(activationSchema, 'body'),
  controller.setActivation
);
router.patch('/:id/restore', validate(idParamsSchema, 'params'), controller.restore);
router.delete('/:id', validate(idParamsSchema, 'params'), controller.softDelete);
router.delete('/:id/permanent', validate(idParamsSchema, 'params'), controller.hardDelete);

eventRouter.use(authenticate, adminOnly);

eventRouter.get(
  '/',
  validate(eventIdParamsSchema, 'params'),
  validate(eventDepartureListQuerySchema, 'query'),
  controller.listByEvent
);
eventRouter.post(
  '/',
  validate(eventIdParamsSchema, 'params'),
  validate(departurePayloadSchema, 'body'),
  controller.createForEvent
);

module.exports = { router, eventRouter };
