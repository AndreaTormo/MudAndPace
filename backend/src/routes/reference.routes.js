const express = require('express');
const controller = require('../controllers/reference.controller');
const authenticate = require('../middlewares/authenticate.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/categories', controller.listCategories);
router.get('/locations', controller.listLocations);
router.get('/hosts', controller.listHosts);

module.exports = router;
