const express = require('express');
const controller = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate.middleware');
const authorize = require('../middlewares/authorize.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  idParamsSchema,
  updateUserSchema,
  createUserSchema,
  activationSchema
} = require('../validators/user.validator');
const { registerSchema } = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', validate(registerSchema), controller.register);

router.use(authenticate);

router.post('/', authorize(), validate(createUserSchema), controller.create);
router.get('/', authorize(), controller.getAll);
router.get('/:id', validate(idParamsSchema, 'params'), authorize('id'), controller.getById);
router.patch(
  '/:id',
  validate(idParamsSchema, 'params'),
  authorize('id'),
  validate(updateUserSchema),
  controller.patch
);
router.patch(
  '/:id/activation',
  validate(idParamsSchema, 'params'),
  authorize(),
  validate(activationSchema),
  controller.setActivation
);
router.delete('/:id', validate(idParamsSchema, 'params'), authorize(), controller.softDelete);

module.exports = router;
