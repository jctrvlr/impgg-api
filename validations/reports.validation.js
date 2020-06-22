const Joi = require('joi');

module.exports = {

  // GET /v1/reports/click
  clickReport: {
    body: {
      limit: Joi.number().min(1),
      linkFilter: Joi.array(),
    },
  },

};
