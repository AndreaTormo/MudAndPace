const express = require('express');
const controller = require('../controllers/event.controller');
const imageController = require('../controllers/eventImage.controller');
const authenticate = require('../middlewares/authenticate.middleware');
const authorize = require('../middlewares/authorize.middleware');
const validate = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');
const {
  idParamsSchema, imageParamsSchema, slugParamsSchema, eventPayloadSchema, updateEventSchema, listQuerySchema
} = require('../validators/event.validator');

const router = express.Router();
const adminOnly = authorize();

router.use(authenticate);

router.get('/deleted', adminOnly, controller.listDeleted);
router.get('/', validate(listQuerySchema, 'query'), controller.list);
router.get('/slug/:slug', validate(slugParamsSchema, 'params'), controller.getBySlug);
router.get('/:id/images', validate(idParamsSchema, 'params'), imageController.list);
router.post(
  '/:id/images',
  adminOnly,
  validate(idParamsSchema, 'params'),
  upload.array('images', 8),
  imageController.add
);
router.patch(
  '/:id/images/:imageId/cover',
  adminOnly,
  validate(imageParamsSchema, 'params'),
  imageController.setCover
);
router.delete(
  '/:id/images/:imageId',
  adminOnly,
  validate(imageParamsSchema, 'params'),
  imageController.remove
);
router.get('/:id', validate(idParamsSchema, 'params'), controller.getById);
router.post('/', adminOnly, validate(eventPayloadSchema, 'body'), controller.create);
router.put('/:id', adminOnly, validate(idParamsSchema, 'params'), validate(updateEventSchema, 'body'), controller.update);
router.patch('/:id/publish', adminOnly, validate(idParamsSchema, 'params'), controller.publish);
router.patch('/:id/unpublish', adminOnly, validate(idParamsSchema, 'params'), controller.unpublish);
router.patch('/:id/soft-delete', adminOnly, validate(idParamsSchema, 'params'), controller.softDelete);
router.patch('/:id/restore', adminOnly, validate(idParamsSchema, 'params'), controller.restore);
router.delete('/:id', adminOnly, validate(idParamsSchema, 'params'), controller.softDelete);
router.delete('/:id/permanent', adminOnly, validate(idParamsSchema, 'params'), controller.hardDelete);

module.exports = router;
