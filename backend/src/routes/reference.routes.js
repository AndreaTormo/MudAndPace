const express = require('express');
const controller = require('../controllers/reference.controller');

const router = express.Router();

router.get('/categories', controller.listCategories);
router.get('/locations', controller.listLocations);
router.get('/hosts', controller.listHosts);

module.exports = router;
