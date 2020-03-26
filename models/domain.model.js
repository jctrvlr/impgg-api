const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const APIError = require('../utils/APIError');

/**
 * Domain Schema
 * @private
 */
const domainSchema = new mongoose.Schema({
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  uri: {
    type: String,
    trim: true,
    unique: true,
  },
  // Domaintype: dom or sub
  domainType: String,
  status: {
    type: Number,
    default: 1,
  },
  validated: {
    type: Boolean,
    default: false,
  },
  dateValidated: Date,
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
domainSchema.pre('save', async (next) => {
  try {
    // TODO: Determine if there is anything that i want to do presave
    return next();
  } catch (error) {
    return next(error);
  }
});

domainSchema.pre('remove', async (next) => {
  try {
    await this.model('Link').remove({ domain: this._id });
    await this.model('User').removeDomain(this.creatorId, this._id);
    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Methods
 */
domainSchema.method({
  transform() {
    const transformed = {};
    const fields = ['_id', 'creatorId', 'uri', 'domainType', 'status', 'validated', 'dateValidated', 'createdAt', 'updatedAt', 'archived', 'archiveEvents'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});

/**
 * Statics
 */
domainSchema.statics = {

  /**
   * Set domain as archived (true/false) and insert an
   * archive event into the array of archive events.
   * @param {String} domainId - ID of domain to archive
   */
  async archive(domainId, user) {
    try {
      if (!domainId) throw new APIError({ message: 'A domain ID is required' });

      const domain = await this.findById(domainId).exec();

      const archiveEvent = {
        archiveType: !domain.archived,
        archivedBy: user._id,
        archivedAt: Date.now(),
      };
      domain.archived = !domain.archived;
      if (!domain.archiveEvents) {
        domain.archiveEvents = [];
      }
      domain.archiveEvents.push(archiveEvent);
      domain.archiveEvents = domain.archiveEvents;
      return domain.save();
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
    page = 1, perPage = 30, creatorId, uri, domainType, status, validated, archived,
  }) {
    const options = omitBy({
      creatorId, uri, domainType, status, validated, archived,
    }, isNil);

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },

  /**
   * Check for duplicate uri and return true/false
   *
   * @param {String} uri - URI of domain
   * @returns {Boolean}
   */
  async checkDuplicateURI(uri) {
    try {
      const domain = await this.findOne({ uri }).exec();
      if (domain !== null) {
        return new APIError({
          message: 'Domain already exists',
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
 * @typedef Domain
 */
const Domain = mongoose.model('Domain', domainSchema);
module.exports = Domain;
