const Joi = require('joi');

module.exports = {
  // POST /messages
  saveMessage: {
    body: {
      email: Joi.string(),
      subject: Joi.string(),
      message: Joi.string(),
    },
  },
};
