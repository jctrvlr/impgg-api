const express = require('express');
const linkRoutes = require('./link.route');

const router = express.Router();

router.use('/', linkRoutes);

module.exports = router;
