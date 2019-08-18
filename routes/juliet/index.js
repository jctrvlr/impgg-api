const express = require('express');
const linkRoutes = require('./link.route');

const router = express.Router();

/**
 * GET juliet/status
 */
router.get('/status', (req, res) => res.send('OK'));

router.use('/link', linkRoutes);

module.exports = router;
