const express = require('express');
const controller = require('../controllers/event.controller');
const validate = require('../middlewares/validate.middleware');
const {
  idParamsSchema, slugParamsSchema, eventPayloadSchema, updateEventSchema, listQuerySchema
} = require('../validators/event.validator');

const router = express.Router();

<<<<<<< HEAD
router.get('/deleted', controller.listDeleted);
=======
>>>>>>> e6414492749754c86037fe5b22fe9940d3ddc0ce
router.get('/', validate(listQuerySchema, 'query'), controller.list);
router.get('/slug/:slug', validate(slugParamsSchema, 'params'), controller.getBySlug);
router.get('/:id', validate(idParamsSchema, 'params'), controller.getById);
router.post('/', validate(eventPayloadSchema, 'body'), controller.create);
router.put('/:id', validate(idParamsSchema, 'params'), validate(updateEventSchema, 'body'), controller.update);
router.patch('/:id/publish', validate(idParamsSchema, 'params'), controller.publish);
router.patch('/:id/unpublish', validate(idParamsSchema, 'params'), controller.unpublish);
router.patch('/:id/soft-delete', validate(idParamsSchema, 'params'), controller.softDelete);
router.patch('/:id/restore', validate(idParamsSchema, 'params'), controller.restore);
router.delete('/:id', validate(idParamsSchema, 'params'), controller.softDelete);
<<<<<<< HEAD
router.delete('/:id/permanent', validate(idParamsSchema, 'params'), controller.hardDelete);
=======
>>>>>>> e6414492749754c86037fe5b22fe9940d3ddc0ce

module.exports = router;
