const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const APIError = require('../utils/APIError');

/**
 * Link Schema
 * @private
 */
const linkSchema = new mongoose.Schema({
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  url: {
    type: String,
    required: true,
    match: /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/,
  },
  type: {
    type: String,
    required: true,
    default: 'website',
  },
  shortLink: {
    type: String,
    required: true,
    unique: true,
  },
}, {
  timestamps: true,
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 *//*
linkSchema.pre('save', async function save(next) {
  try {
    // TODO: Generate short link if not given here -- Or not in save but somewhere else
    return next();
  } catch (error) {
    return next(error);
  }
});
*/

/**
 * Methods
 */
linkSchema.method({
  transform() {
    const transformed = {};
    const fields = ['creatorId', 'url', 'type', 'shortLink'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});

/**
 * Statics
 */
linkSchema.statics = {

  /**
   * Find link by short_link
   *
   * @param {String} shortLink - The short link of a link
   * @returns {Promise<User, APIError>}
   */
  async findByShort(shortLink) {
    try {
      if (!shortLink) throw new APIError({ message: 'An shortLink is required' });

      const link = await this.findOne({ short_link: shortLink }).exec();

      if (link) return link;

      throw new APIError({
        message: ' does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Generated a unique short link
   *
   * @param {String} url - url of website it will link too
   * @returns {ShortLink}
   */
  async generateShortLink(url) {
    try {
      const shortLink = Math.random().toString(36).substr(2);
      if (this.checkDuplicateShortLink(shortLink)) {
        this.generateShortLink(url);
      }
      return shortLink;
    } catch (error) {
      throw error;
    }
  },

  /**
   * List all links in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of links to be skipped.
   * @param {number} limit - Limit number of links to be returned.
   * @returns {Promise<Link[]>}
   */
  list({
    page = 1, perPage = 30, creatorId, url, type, shortLink,
  }) {
    const options = omitBy({
      creatorId, url, type, shortLink,
    }, isNil);

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },

  /**
   * Check for duplicate shortlink and return true/false
   *
   * @param {String} shortLink - Shortlink generated for a link
   * @returns {Boolean}
   */
  async checkDuplicateShortLink(shortLink) {
    const link = await this.findOne({ short_link: shortLink }).exec();
    if (link) return true;
    return false;
  },

  /**
   * Return new validation error
   * if error is a mongoose duplicate key error
   *
   * @param {Error} error
   * @returns {Error|APIError}
   */
  duplicateShortLink(error) {
    if (error.name === 'MongoError' && error.code === 11000) {
      return new APIError({
        message: 'Validation Error',
        errors: [{
          field: 'short_link',
          location: 'body',
          messages: ['"short_link" already exists'],
        }],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack,
      });
    }
    return error;
  },

};

/**
 * @typedef Link
 */
const Link = mongoose.model('Link', linkSchema);
module.exports = Link;
