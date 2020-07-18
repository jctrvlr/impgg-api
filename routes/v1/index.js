const express = require('express');

const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const linkRoutes = require('./link.route');
const linksRoutes = require('./links.route');
const dashboardRoutes = require('./dashboard.route');
const domainRoutes = require('./domain.route');
const reportsRoutes = require('./reports.route');
const messagesRoutes = require('./messages.route');

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/link', linkRoutes);
router.use('/links', linksRoutes);
router.use('/domain', domainRoutes);
router.use('/reports', reportsRoutes);
router.use('/messages', messagesRoutes);

module.exports = router;
