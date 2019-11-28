const Joi = require('joi');

module.exports = {
  // GET /
  getLink: {
    params: {
      linkId: Joi.string().required(),
    },
  },
  // GET /link
  getLinkInfo: {
    params: {
      linkId: Joi.string().required(),
    },
  },
  // POST /slink
  checkSlink: {
    body: {
      sLink: Joi.string().required(),
    },
  },
  // POST /link
  createLink: {
    body: {
      CreatorId: Joi.string(),
      uri: Joi.string().required().trim(),
      sLink: Joi.string().trim().allow('', null),
      linkDomain: Joi.string().trim().allow('', null),
    },
    params: {
      userId: Joi.string().regex(/^[a-fA-F0-9]{24}$/),
    },
  },
  // PUT
  updateLink: {
    body: {
      uri: Joi.string().uri().allow('', null),
      linkId: Joi.string().required(),
      sLink: Joi.string().allow('', null),
      domain: Joi.string().allow('', null),
    },
    params: {
      userId: Joi.string().regex(/^[a-fA-F0-9]{24}$/),
    },
  },
  // GET /links
  listLinks: {
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
