const express = require('express');
const controller = require('../controllers/rating.controller');
const authenticate = require('../middlewares/authenticate.middleware');
const validate = require('../middlewares/validate.middleware');
const { createRatingSchema, departureIdParamsSchema } = require('../validators/rating.validator');

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.get('/', validate(departureIdParamsSchema, 'params'), controller.getForDeparture);
router.put(
  '/',
  validate(departureIdParamsSchema, 'params'),
  validate(createRatingSchema, 'body'),
  controller.upsert
);
router.delete('/', validate(departureIdParamsSchema, 'params'), controller.remove);

module.exports = router;
