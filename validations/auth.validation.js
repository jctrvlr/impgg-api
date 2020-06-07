const Joi = require('joi');

module.exports = {
  // POST /v1/auth/register
  register: {
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().required().min(6).max(128),
    },
  },

  // POST /v1/auth/login && /v1/auth
  login: {
    body: {
      email: Joi.string().email().required(),
      password: Joi.string().required().max(128),
    },
  },

  // POST /v1/auth/facebook
  // POST /v1/auth/google
  oAuth: {
    body: {
      access_token: Joi.string().required(),
    },
  },

  // POST /v1/auth/refresh
  refresh: {
    body: {
      email: Joi.string().email().required(),
      refreshToken: Joi.string().required(),
    },
  },

  // POST /v1/auth/recover
  recover: {
    body: {
      email: Joi.string().email().required(),
    },
  },

  // POST /v1/auth/reset
  reset: {
    params: {
      token: Joi.string().required(),
    },
  },

  // POST /v1/auth/reset-password
  resetPassword: {
    body: {
      token: Joi.string().required(),
      password: Joi.string().required(),
    },
  },
};
