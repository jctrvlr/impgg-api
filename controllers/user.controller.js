const httpStatus = require('http-status');
const { omit } = require('lodash');
const User = require('../models/user.model');
const Domain = require('../models/domain.model');
const { env } = require('../config/vars');

/**
 * Load user and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
  try {
    const user = await User.get(id);
    req.locals = { user };
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Get user
 * @public
 */
exports.get = (req, res) => res.json(req.locals.user.transform());

/**
 * Get logged in user info
 * @public
 */
exports.loggedIn = (req, res) => res.json(req.user.transform());

/**
 * Create new user
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const user = new User(req.body);
    // Add default domain
    const domain = await Domain.findOne({ uri: env === 'development' ? 'http://localhost:3001' : 'https://imp.gg' });
    user.preferences.primaryDomain = domain._id;
    user.domains.push(domain._id);

    const savedUser = await user.save();
    const userTransformed = await User.findOne({ _id: savedUser._id }).populate('domains');

    res.status(httpStatus.CREATED);
    res.json(userTransformed);
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

/**
 * Replace existing user
 * @public
 */
exports.replace = async (req, res, next) => {
  try {
    const { user } = req.locals;
    const newUser = new User(req.body);
    const ommitRole = user.role !== 'admin' ? 'role' : '';
    const newUserObject = omit(newUser.toObject(), '_id', ommitRole);

    await user.update(newUserObject, { override: true, upsert: true });
    const savedUser = await User.findById(user._id);

    res.json(savedUser.transform());
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

/**
 * Update existing user
 * @public
 */
exports.update = async (req, res, next) => {
  const omitThings = ['domains', 'subscription', 'services', 'tokens'];
  if (req.locals.user.role !== 'admin') omitThings.push('role');
  const updatedUser = omit(req.body, omitThings);
  const userToUpdate = await User.findById(req.params.userId);
  const user = Object.assign(userToUpdate, updatedUser);

  user.save()
    .then(savedUser => res.json(savedUser.transform()))
    .catch(e => next(User.checkDuplicateEmail(e)));
};

/**
 * Change existing user's password
 * @public
 */
exports.changePassword = async (req, res, next) => {
  const { user } = req;
  const { password } = req.body;
  user.password = password;
  user.save()
    .then(() => res.json(true))
    .catch(e => next(User.checkDuplicateEmail(e)));
};

/**
 * Get user list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const users = await User.list(req.query);
    const transformedUsers = users.map(user => user.transform());
    res.json(transformedUsers);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @public
 */
exports.remove = (req, res, next) => {
  const { user } = req.locals;

  user.remove()
    .then(() => res.status(httpStatus.NO_CONTENT).end())
    .catch(e => next(e));
};

/**
 * Delete user's profile picture
 * @public
 */
exports.removePicture = (req, res, next) => {
  const { user } = req.locals;

  user.profile.picture = '';
  user.save()
    .then((savedUser) => {
      res.status(httpStatus.OK);
      res.json(savedUser.transform());
    })
    .catch(e => next(e));
};
