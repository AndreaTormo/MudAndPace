const express = require('express');
const controller = require('../controllers/event.controller');
const imageController = require('../controllers/eventImage.controller');
const validate = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');
const {
  idParamsSchema, imageParamsSchema, slugParamsSchema, eventPayloadSchema, updateEventSchema, listQuerySchema
} = require('../validators/event.validator');

const router = express.Router();

router.get('/deleted', controller.listDeleted);
router.get('/', validate(listQuerySchema, 'query'), controller.list);
router.get('/slug/:slug', validate(slugParamsSchema, 'params'), controller.getBySlug);
router.get('/:id/images', validate(idParamsSchema, 'params'), imageController.list);
router.post(
  '/:id/images',
  validate(idParamsSchema, 'params'),
  upload.array('images', 8),
  imageController.add
);
router.patch(
  '/:id/images/:imageId/cover',
  validate(imageParamsSchema, 'params'),
  imageController.setCover
);
router.delete(
  '/:id/images/:imageId',
  validate(imageParamsSchema, 'params'),
  imageController.remove
);
router.get('/:id', validate(idParamsSchema, 'params'), controller.getById);
router.post('/', validate(eventPayloadSchema, 'body'), controller.create);
router.put('/:id', validate(idParamsSchema, 'params'), validate(updateEventSchema, 'body'), controller.update);
router.patch('/:id/publish', validate(idParamsSchema, 'params'), controller.publish);
router.patch('/:id/unpublish', validate(idParamsSchema, 'params'), controller.unpublish);
router.patch('/:id/soft-delete', validate(idParamsSchema, 'params'), controller.softDelete);
router.patch('/:id/restore', validate(idParamsSchema, 'params'), controller.restore);
router.delete('/:id', validate(idParamsSchema, 'params'), controller.softDelete);
router.delete('/:id/permanent', validate(idParamsSchema, 'params'), controller.hardDelete);

module.exports = router;
