/* eslint-disable no-param-reassign */
const httpStatus = require('http-status');
const Domain = require('../models/domain.model');
// const User = require('../models/user.model');
const logger = require('../config/logger');
const PageView = require('../models/pageView.model');
const User = require('../models/user.model');
const APIError = require('../utils/APIError');
const { dnsKey } = require('../config/vars');

/**
 * Get Domain Info
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    logger.info(req);
    const { domainId } = req.params;
    const domain = await Domain.find({ _id: domainId }).exec();

    if (domain) {
      res.status(httpStatus.OK);
      res.json(domain.transform());
    } else {
      res.status(httpStatus.NOT_FOUND);
      res.json({ error: 'Domain cannot be found' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Check domain DNS status
 * @public
 */
exports.checkDNS = async (req, res, next) => {
  try {
    const domain = req.get('Host');
    // See if domain exists in database
    const domainFound = await Domain.find({ uri: domain }).exec();
    const authed = req.headers && req.headers.authorization && req.headers.authorization === dnsKey;
    console.log(domain, domainFound, authed);
    if (domainFound && authed) {
      // Check status
      if (domainFound[0].status === 1) {
        domainFound[0].status = 2;
        const status = await domainFound[0].save();
        console.log('status', status);
        res.status(httpStatus.OK);
        res.json(status);
      } else {
        res.status(httpStatus.OK);
      }
    } else {
      res.status(httpStatus.NOT_FOUND);
      res.json({ error: 'Domain cannot be found' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Archive domain
 * @public
 */
exports.archiveDomain = async (req, res, next) => {
  try {
    const { domainId } = req.body;
    console.log('inside archiveDomain: ', domainId);

    Domain.archive(domainId, req.user)
      .then((_domain) => {
        res.status(httpStatus.OK);
        console.log('inside archiveDomain', _domain.transform());
        res.json(_domain.transform());
      })
      .catch((err) => {
        logger.error(err);
        next(new APIError({
          message: 'Could not archive the domain',
          status: httpStatus.CONFLICT,
          isPublic: true,
        }));
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete domain
 * @public
 */
exports.deleteDomain = async (req, res, next) => {
  try {
    const { domainId } = req.body;
    const domainFound = await Domain.findById(domainId);

    let user;

    const deleted = await Domain.remove({ _id: domainId });

    if (domainFound && deleted) {
      user = await User.findOne({ _id: domainFound.creatorId }).populate('domains');
    }
    res.status(httpStatus.OK);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Check URI uniqueness
 * @public
 */
exports.checkURI = async (req, res, next) => {
  try {
    const { uri } = req.body;
    const checkDup = await Domain.checkDuplicateURI(uri);
    if (!checkDup) {
      res.status(httpStatus.OK);
      res.json({ checkDup: false });
    } else {
      res.status(httpStatus.OK);
      res.json(checkDup);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Create new domain
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    // eslint-disable-next-line prefer-const
    let { uri, domainType } = req.body;
    const { user } = req;

    await Domain.checkDuplicateURI(uri);

    const domain = new Domain({
      creatorId: req.user._id,
      uri,
      domainType,
    });

    const savedDomain = await domain.save();
    user.domains.push(savedDomain._id);
    await user.save();
    const userTransformed = await User.findOne({ _id: user._id }).populate('domains');
    res.status(httpStatus.CREATED);
    res.json(userTransformed);
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing domain
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const {
      uri, domainId, domainType, validated,
    } = req.body;

    await Domain.checkDuplicateURI(uri);

    Domain.findOne({ _id: domainId })
      .then((_domain) => {
        if (uri) _domain.url = uri;
        if (domainType) _domain.domainType = domainType;
        if (validated) _domain.validated = validated;
        return _domain.save();
      })
      .then((_domain) => {
        res.status(httpStatus.OK);
        res.json(_domain.transform());
      })
      .catch((err) => {
        logger.error(err);
        next(new APIError({
          message: 'Domain URI already exists',
          status: httpStatus.CONFLICT,
          isPublic: true,
        }));
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Get domain list of all domains
 * @public
 * {
 *   url,
 *   createdAt,
 *   type,
 *   creatorId,
 *   numClicks,
 *   popLocation,
 *   referrer,
 *   lastClick,
 * }
 */
exports.list = async (req, res, next) => {
  // TODO: Write user check using req.user to see if user is admin or what links or what
  // links the user should have access too
  try {
    const links = await Domain.list(req.query);
    if (!links.length) {
      res.status(httpStatus.NO_CONTENT);
      res.json(links);
    } else {
      const transformedLinks = links.map(link => link.transform());
      // '_id','creatorId', 'url', 'type', 'shortLink', 'pageTitle', 'createdAt', 'updatedAt'
      // eslint-disable-next-line no-restricted-syntax
      Promise.all(transformedLinks.map(async (link) => {
        link.numClicks = await PageView.countDocuments({ linkId: link._id });
        link.lastClick = await PageView.findOne({
          linkId: link._id,
        }, {}, {
          sort: { created_at: -1 },
        });
        return link;
      })).then((ret) => {
        res.status(httpStatus.OK);
        res.json(ret);
      });
    }
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

/**
 * Delete link
 * @public
 */
exports.remove = (req, res, next) => {
  const {
    domainId,
  } = req.body;
  const domain = Domain.find(domainId);

  domain.remove()
    .then(() => res.status(httpStatus.NO_CONTENT).end())
    .catch(e => next(e));
};
