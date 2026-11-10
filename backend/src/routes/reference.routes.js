const express = require('express');
const controller = require('../controllers/reference.controller');
const authenticate = require('../middlewares/authenticate.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  listCategoryQuerySchema,
  listHostQuerySchema,
  listLocationQuerySchema
} = require('../validators/reference.validator');

const router = express.Router();

router.use(authenticate);

router.get('/categories', validate(listCategoryQuerySchema, 'query'), controller.listCategories);
router.get('/locations', validate(listLocationQuerySchema, 'query'), controller.listLocations);
router.get('/hosts', validate(listHostQuerySchema, 'query'), controller.listHosts);

module.exports = router;
