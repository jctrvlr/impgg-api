const Joi = require('joi');

module.exports = {

  // GET /v1/reports/click
  clickReport: {
    query: {
      limit: Joi.number().min(1),
    },
  },

};
