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
  // PUT /link
  updateLink: {
    body: {
      oldSLink: Joi.string().required(),
      CreatorId: Joi.string(),
      uri: Joi.string().uri(),
      newSLink: Joi.string(),
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
