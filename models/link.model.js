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
  },
  url: {
    type: String,
    match: /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www\.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\\w]*))?)/,
  },
  domain: {
    type: String,
    default: 'https://imp.gg',
  },
  pageTitle: { type: String },
  type: {
    type: String,
    default: 'website',
  },
  shortLink: {
    type: String,
    unique: true,
  },
  archived: {
    type: Boolean,
    default: false,
  },
  archiveEvents: [{
    archiveType: {
      type: Boolean,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    archivedAt: {
      type: Date,
    },
  }],
}, {
  timestamps: true,
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
linkSchema.pre('save', async (next) => {
  try {
    // TODO: Determine if there is anything that i want to do presave
    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Methods
 */
linkSchema.method({
  transform() {
    const transformed = {};
    const fields = ['_id', 'creatorId', 'url', 'domain', 'type', 'shortLink', 'pageTitle', 'createdAt', 'updatedAt', 'archived', 'archiveEvents'];

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
   * Set link as archived (true/false) and insert an archive event into the array of archive events.
   * @param {String} linkId - ID of link to archive
   */
  async archive(linkId, user) {
    try {
      if (!linkId) throw new APIError({ message: 'A link ID is required' });

      const link = await this.findById(linkId).exec();

      const archiveEvent = {
        archiveType: !link.archived,
        archivedBy: user._id,
        archivedAt: Date.now(),
      };
      link.archived = !link.archived;
      if (!link.archiveEvents) {
        link.archiveEvents = [];
      }
      link.archiveEvents.push(archiveEvent);
      link.archiveEvents = link.archiveEvents;
      return link.save();
    } catch (error) {
      throw error;
    }
  },

  /**
   * Find link by shortLink
   *
   * @param {String} shortLink - The short link of a link
   * @returns {Promise<User, APIError>}
   */
  async findByShort(sLink) {
    try {
      if (!sLink) throw new APIError({ message: 'An shortLink is required' });

      const link = await this.findOne({ shortLink: sLink }).exec();

      if (link) return link;

      return null;
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
  async generateShortLink() {
    try {
      // TODO: Generate link using url
      const sLink = Math.random()
        .toString(36)
        .substr(7, 10);
      const checkDup = await this.checkDuplicateShortLink(sLink);
      if (checkDup) {
        this.generateShortLink();
      }
      return sLink;
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
  async checkDuplicateShortLink(sLink) {
    try {
      const link = await this.findOne({ shortLink: sLink }).exec();
      if (link !== null) {
        return new APIError({
          message: 'Short link already exists',
          status: httpStatus.CONFLICT,
          isPublic: true,
        });
      }
      return false;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Check for duplicate link for same user with same domain
   *
   * @param {String} userId - User ID of user creating link
   * @param {String} uri - URI of link to be created for
   * @param {String} sLink - Given shortLink for link
   * @param {String} domain - Given domain for link
   * @returns {Boolean} True if link exists false if it doesn't
   */
  async checkUserDuplicate(userId, uri, sLink, domain) {
    try {
      const link = await this.findOne({
        creatorId: userId,
        url: uri,
        $or: [{ shortLink: sLink }, { domain }],
      }).exec();
      if (link !== null) {
        throw new APIError({
          message: 'Shortened link for this URL exists for user',
          status: httpStatus.CONFLICT,
          isPublic: true,
        });
      }
      return false;
    } catch (error) {
      throw error;
    }
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
          field: 'shortLink',
          location: 'body',
          messages: ['"shortLink" already exists'],
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
