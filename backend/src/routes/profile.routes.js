const express = require('express');
const { z } = require('zod');
const controller = require('../controllers/profile.controller');
const authenticate = require('../middlewares/authenticate.middleware');
const authorize = require('../middlewares/authorize.middleware');
const validate = require('../middlewares/validate.middleware');
const avatarUpload = require('../middlewares/avatarUpload.middleware');
const { objectIdSchema, listUserQuerySchema } = require('../validators/user.validator');
const { updateProfileSchema } = require('../validators/profile.validator');

const userIdParamsSchema = z.object({ userId: objectIdSchema });

const router = express.Router();

router.use(authenticate);

router.get('/', authorize(), validate(listUserQuerySchema, 'query'), controller.getAll);
router.get('/me', controller.getMe);
router.patch('/me', validate(updateProfileSchema), controller.upsertMe);
router.post('/me/avatar', avatarUpload.single('avatar'), controller.uploadAvatar);

router.get(
  '/:userId',
  validate(userIdParamsSchema, 'params'),
  authorize('userId'),
  controller.getByUserId
);
router.patch(
  '/:userId',
  validate(userIdParamsSchema, 'params'),
  authorize('userId'),
  validate(updateProfileSchema),
  controller.upsertByUserId
);

module.exports = router;
