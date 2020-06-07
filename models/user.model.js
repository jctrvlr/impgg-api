const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const moment = require('moment-timezone');
const jwt = require('jwt-simple');
const uuidv4 = require('uuid/v4');
const APIError = require('../utils/APIError');

const { env, jwtSecret, jwtExpirationInterval } = require('../config/vars');

/**
* User Roles
*/
const roles = ['user', 'admin'];

/**
 * Subscription Types
 */
const subscriptions = ['personal', 'pro', 'enterprise', 'admin'];

/**
 * User Schema
 * @private
 */
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    match: /^\S+@\S+\.\S+$/,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    minlength: 6,
    maxlength: 128,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },

  profile: {
    firstName: {
      type: String,
      maxlength: 128,
      index: true,
      trim: true,
    },
    lastName: {
      type: String,
      maxlength: 128,
      index: true,
      trim: true,
    },
    picture: {
      type: String,
      trim: true,
    },
  },

  preferences: {
    primaryDomain: {
      type: String,
      trim: true,
      default: env === 'development' ? 'localhost:3001' : 'imp.gg',
    },
  },
  // TODO: SETUP SETTINGS FOR NOTIFCATIONS/ETC
  // TODO: SETUP PAYMENT OPTIONS/SETTINGS

  /**
   * Array of domain IDs
   */
  domains: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
  }],

  subscription: {
    subType: {
      type: String,
      enum: subscriptions,
    },
    status: String,
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      select: false,
    },
    startTimestamp: {
      type: Date,
      default: Date.now,
    },
    endTimestamp: {
      type: Date,
    },
  },

  services: {
    facebook: String,
    google: String,
    twitch: String,
  },
  tokens: Array,
  role: {
    type: String,
    enum: roles,
    default: 'user',
  },
}, {
  timestamps: true,
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
userSchema.pre('save', async function save(next) {
  try {
    if (!this.isModified('password')) return next();

    const rounds = env === 'test' ? 1 : 10;

    const hash = await bcrypt.hash(this.password, rounds);
    this.password = hash;

    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Methods
 */
userSchema.method({
  transform() {
    const transformed = {};
    const fields = ['id', 'email', 'profile', 'role', 'subscription', 'createdAt', 'preferences', 'domains'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },

  token() {
    const playload = {
      exp: moment().add(jwtExpirationInterval, 'minutes').unix(),
      iat: moment().unix(),
      sub: this._id,
    };
    return jwt.encode(playload, jwtSecret);
  },

  async passwordMatches(password) {
    return bcrypt.compare(password, this.password);
  },

  generatePasswordReset() {
    this.passwordResetToken = `${crypto.randomBytes(40).toString('hex')}`;
    this.passwordResetExpires = moment().add(1, 'hour').toDate();
  },
});

/**
 * Statics
 */
userSchema.statics = {

  roles,

  /**
   * Get user
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  async get(id) {
    try {
      let user;

      if (mongoose.Types.ObjectId.isValid(id)) {
        user = await this.findById(id).exec();
      }
      if (user) {
        return user;
      }

      throw new APIError({
        message: 'User does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove domain from array
   *
   * @param {ObjectId} userId - The objectId of user to remove domain from.
   * @param {ObjectId} domainId - The objectId of domain to remove.
   * @returns {Promise<User, APIError>}
   */
  async removeDomain(userId, domainId) {
    try {
      let user;

      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await this.findById(userId).exec();
      }
      if (user) {
        const index = user.domains.indexOf(domainId);
        if (index > -1) {
          user.domains.splice(index, 1);
        }
        user = await user.save();
        return user;
      }

      throw new APIError({
        message: 'User does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Auth user
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  async authUser(options, loggedUser) {
    const { email, password } = options;
    if (!email) throw new APIError({ message: 'An email is required' });

    const user = await this.findOne({ email }).select('+password').exec();
    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (JSON.stringify(user._id) !== JSON.stringify(loggedUser._id)) {
      err.message = 'Incorrect email for the account you are currently logged in with';
      throw new APIError(err);
    }
    if (password) {
      if (user && await user.passwordMatches(password)) {
        return true;
      }
      err.message = 'Incorrect email or password';
    } else {
      err.message = 'Incorrect email';
    }
    throw new APIError(err);
  },

  /**
   * Find user by email and tries to generate a JWT token
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  async findAndGenerateToken(options) {
    const { email, password, refreshObject } = options;
    if (!email) throw new APIError({ message: 'An email is required to generate a token' });

    const user = await this.findOne({ email }).select('+password').exec();
    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (password) {
      if (user && await user.passwordMatches(password)) {
        return { user, accessToken: user.token() };
      }
      err.message = 'Incorrect email or password';
    } else if (refreshObject && refreshObject.userEmail === email) {
      if (moment(refreshObject.expires).isBefore()) {
        err.message = 'Invalid refresh token.';
      } else {
        return { user, accessToken: user.token() };
      }
    } else {
      err.message = 'Incorrect email or refreshToken';
    }
    throw new APIError(err);
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list({
    page = 1, perPage = 30, name, email, role,
  }) {
    const options = omitBy({ name, email, role }, isNil);

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },

  /**
   * Return new validation error
   * if error is a mongoose duplicate key error
   *
   * @param {Error} error
   * @returns {Error|APIError}
   */
  checkDuplicateEmail(error) {
    if (error.name === 'MongoError' && error.code === 11000) {
      return new APIError({
        message: 'Email is taken',
        errors: [{
          field: 'email',
          location: 'body',
          messages: ['"email" already exists'],
        }],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack,
      });
    }
    return error;
  },

  async oAuthLogin({
    service, id, email, name, picture,
  }) {
    const user = await this.findOne({ $or: [{ [`services.${service}`]: id }, { email }] });
    if (user) {
      user.services[service] = id;
      if (!user.name) user.name = name;
      if (!user.picture) user.picture = picture;
      return user.save();
    }
    const password = uuidv4();
    return this.create({
      services: { [service]: id }, email, password, name, picture,
    });
  },
};

/**
 * @typedef User
 */
module.exports = mongoose.model('User', userSchema);
