const express = require('express');
const controller = require('../controllers/trailRoute.controller');
const validate = require('../middlewares/validate.middleware');
const {
  idParamsSchema, slugParamsSchema, routePayloadSchema, updateRouteSchema, listQuerySchema, nearbyQuerySchema
} = require('../validators/trailRoute.validator');

const router = express.Router();

router.get('/nearby', validate(nearbyQuerySchema, 'query'), controller.nearby);
router.get('/slug/:slug', validate(slugParamsSchema, 'params'), controller.getBySlug);
router.get('/', validate(listQuerySchema, 'query'), controller.list);
router.get('/:id', validate(idParamsSchema, 'params'), controller.getById);
router.post('/', validate(routePayloadSchema, 'body'), controller.create);
router.put('/:id', validate(idParamsSchema, 'params'), validate(updateRouteSchema, 'body'), controller.update);
router.patch('/:id/activate', validate(idParamsSchema, 'params'), controller.activate);
router.patch('/:id/deactivate', validate(idParamsSchema, 'params'), controller.deactivate);
router.patch('/:id/soft-delete', validate(idParamsSchema, 'params'), controller.softDelete);
router.patch('/:id/restore', validate(idParamsSchema, 'params'), controller.restore);
router.delete('/:id', validate(idParamsSchema, 'params'), controller.softDelete);

module.exports = router;
