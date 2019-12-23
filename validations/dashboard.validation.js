const Joi = require('joi');

module.exports = {
  // GET /dashboard
  getLinkInfo: {
    params: {
      linkId: Joi.string().required(),
    },
  },
};
