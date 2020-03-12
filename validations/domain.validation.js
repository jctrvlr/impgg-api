const Joi = require('joi');

module.exports = {
  // POST /domain/uniq
  checkURI: {
    body: {
      uri: Joi.string(),
    },
  },
  // POST /domain/archive
  archiveDomain: {
    body: {
      domainId: Joi.string(),
    },
  },
  // GET /domain/:linkId
  getDomain: {
    params: {
      domainId: Joi.string().required(),
    },
  },
  // POST /domain
  createDomain: {
    body: {
      creatorId: Joi.string(),
      uri: Joi.string().required().trim(),
      domainType: Joi.string().trim(),
    },
    params: {
      userId: Joi.string().regex(/^[a-fA-F0-9]{24}$/),
    },
  },
  // PUT /domain
  updateDomain: {
    body: {
      uri: Joi.string().uri(),
      domainId: Joi.string().required(),
      domainType: Joi.string(),
      validated: Joi.bool(),
    },
    params: {
      userId: Joi.string().regex(/^[a-fA-F0-9]{24}$/),
    },
  },
  // GET /links
  listDomain: {
    query: {
      page: Joi.number().min(1),
      perPage: Joi.number().min(1).max(100),
      creatorId: Joi.string(),
      url: Joi.string(),
      type: Joi.string(),
      shortLink: Joi.string(),
    },
  },
};
