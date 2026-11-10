const express = require('express');
const controller = require('../controllers/shop.controller');
const authenticate = require('../middlewares/authenticate.middleware');
const validate = require('../middlewares/validate.middleware');
const { shopListQuerySchema, shopSlugParamsSchema } = require('../validators/shop.validator');

const router = express.Router();

router.use(authenticate);
/*
router.get('/experiences', validate(shopListQuerySchema, 'query'), controller.getEvents);
router.get(
  '/experiences/:slug/departures',
  validate(shopSlugParamsSchema, 'params'),
  controller.getDeparturesByEventSlug
);
router.get('/experiences/:slug', validate(shopSlugParamsSchema, 'params'), controller.getEventBySlug);
*/

router.get('/events', validate(shopListQuerySchema, 'query'), controller.getEvents);
router.get(
  '/events/:slug/departures',
  validate(shopSlugParamsSchema, 'params'),
  controller.getDeparturesByEventSlug
);
router.get('/events/:slug', validate(shopSlugParamsSchema, 'params'), controller.getEventBySlug);

router.get('/categories', controller.getCategories);
router.get('/hosts', controller.getHosts);
router.get('/locations', controller.getLocations);

module.exports = router;
