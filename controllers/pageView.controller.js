/* eslint-disable no-param-reassign */
const httpStatus = require('http-status');
// const axios = require('axios');
const PageView = require('../models/pageView.model');
// const User = require('../models/user.model');
const logger = require('../config/logger');

/**
 * Get count of pageViews for specific Link
 * @public
 */
exports.getCountSpecific = async (req, res, next) => {
  try {
    const { linkId } = req.params;
    logger.info('Get count for: ', linkId);
    const count = await PageView.count({ linkId });
    res.status(httpStatus.OK);
    res.json(count);
  } catch (error) {
    res.status(httpStatus.NOT_FOUND);
    next(error);
  }
};
