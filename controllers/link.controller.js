/* eslint-disable no-param-reassign */
const httpStatus = require('http-status');
const { Reader } = require('@maxmind/geoip2-node');
const axios = require('axios');
const cheerio = require('cheerio');
const Link = require('../models/link.model');
const Domain = require('../models/domain.model');
// const User = require('../models/user.model');
const logger = require('../config/logger');
const PageView = require('../models/pageView.model');
const APIError = require('../utils/APIError');
const { env } = require('../config/vars');

/**
 * Get Link and redirect + pageview
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    const { linkId } = req.params;
    let { domain } = req.hostname;
    // development hack
    if (env === 'development') domain = 'http://localhost:3001';
    const domainF = await Domain.findOne({ uri: domain });
    const link = await Link.findByShortDomain(linkId, domainF._id);

    if (link) {
      // Redirect to saved URI
      res.redirect(302, link.url);

      // TODO: Parse referer and save what social site it came from
      let device;
      if (req.useragent.isDesktop) {
        device = 'Desktop';
      } else if (req.useragent.isMobile) {
        device = 'Mobile';
      } else {
        device = 'Other';
      }
      const pageview = new PageView({
        linkId: link._id,
        ip: req.ip,
        userAgent: req.useragent,
        device,
        ref: req.headers.referer,
        location: {
          city: 'N/A',
          country: 'N/A',
          postal: 'N/A',
          stateRegion: 'N/A',
          timeZone: 'N/A',
        },
      });
      pageview.save();

      // After redirection get location info and save in pageview
      Reader.open('data/GeoLite2-City.mmdb').then((reader) => {
        const response = reader.city(req.ip);
        pageview.location.city = response.city.names.en;
        pageview.location.country = response.country.isoCode;
        pageview.location.postal = response.postal.code;
        pageview.location.stateRegion = response.subdivisions[0].isoCode;
        pageview.location.timeZone = response.location.timeZone;
        pageview.save();
      }).catch(() => {
        logger.info(`Error reading IP location information: ${req.ip}`);
      });
    } else {
      // TODO: Redirect to link not found page based on domain's settings
      res.redirect(302, 'https://impgg.com/notfound');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get Link Info
 * @public
 */
exports.getLink = async (req, res, next) => {
  try {
    logger.info(req);
    const { linkId } = req.params;
    const link = await Link.findByShort(linkId);

    if (link) {
      res.status(httpStatus.OK);
      res.json(link.transform());
    } else {
      res.status(httpStatus.NOT_FOUND);
      res.json({ error: 'Link cannot be found' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Archive link
 * @public
 */
exports.archiveLink = async (req, res, next) => {
  try {
    const { linkId } = req.body;
    console.log('inside archiveLink: ', linkId);

    Link.archive(linkId, req.user)
      .then((_link) => {
        res.status(httpStatus.OK);
        console.log('inside archiveLink', _link.transform());
        res.json(_link.transform());
      })
      .catch((err) => {
        logger.error(err);
        next(new APIError({
          message: 'Could not archive the link',
          status: httpStatus.CONFLICT,
          isPublic: true,
        }));
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete link
 * @public
 */
exports.deleteLink = async (req, res, next) => {
  try {
    const { linkId } = req.body;
    console.log('inside deleteLink: ', linkId);

    const pageViewCount = await PageView.deleteMany({ linkId });

    const linkRemoveRes = await Link.deleteOne({ _id: linkId });
    res.status(httpStatus.OK);
    res.json({
      pageviewsRemoved: pageViewCount.deletedCount,
      linkRemoved: linkRemoveRes.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check shortLink uniqueness
 * @public
 */
exports.checkShortLink = async (req, res, next) => {
  try {
    const { sLink } = req.body;
    const checkDup = await Link.checkDuplicateShortLink(sLink);
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
 * Create new link no auth
 * @public
 */
exports.createPub = async (req, res, next) => {
  try {
    logger.info(req);
    // eslint-disable-next-line prefer-const
    let { uri, sLink } = req.body; // i instead of l for uri in req.body

    if (!/^https?:\/\//i.test(uri)) {
      uri = `https://${uri}`;
    }

    const siteUrl = uri;
    let pageTitle = '';

    try {
      if (siteUrl) {
        const $ = await fetchData(siteUrl);
        pageTitle = $('head > title').text();
      }
    } catch (err) {
      logger.error(err);
    }

    // TODO: CHECK IF USER HAS CREATED A SHORTLINK FOR URI already
    if (await Link.checkDuplicateShortLink(sLink)) {
      res.status(httpStatus.BAD_REQUEST);
      res.json({ error: 'Short link already exists' });
    } else {
      let shortLink = '';
      if (sLink) {
        shortLink = sLink;
      } else {
        shortLink = await Link.generateShortLink(uri);
      }
      // TODO: Setup if statements to check if youtube, twitter, facebook,
      // video, etc. or default to `website`
      const linkType = 'website';
      const domain = await Domain.findOne({ uri: env === 'development' ? 'http://localhost:3001' : 'https://imp.gg' });

      const link = new Link({
        url: uri,
        type: linkType,
        domain: domain._id,
        shortLink,
        pageTitle,
      });

      const savedLink = await link.save();
      res.status(httpStatus.CREATED);
      res.json(savedLink.transform());
    }
  } catch (error) {
    next(error);
  }
};

const fetchData = async (siteUrl) => {
  const result = await axios.get(siteUrl);
  return cheerio.load(result.data);
};

/**
 * Create new link with auth
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    // eslint-disable-next-line prefer-const
    let { uri, sLink, linkDomain } = req.body; // i instead of l for uri in req.body

    if (!/^https?:\/\//i.test(uri)) {
      uri = `https://${uri}`;
    }
    const domain = await Domain.findOne({ uri: linkDomain });

    // TODO: CHECK IF USER HAS CREATED A SHORTLINK FOR URI already
    await Link.checkUserDuplicate(req.user._id, uri, sLink, domain._id);
    await Link.checkDuplicateShortLink(sLink, domain._id);

    const siteUrl = uri;
    let pageTitle = '';

    try {
      if (siteUrl) {
        const $ = await fetchData(siteUrl);
        pageTitle = $('head > title').text();
      }
    } catch (err) {
      logger.error(err);
    }

    let shortLink = '';
    if (sLink) {
      shortLink = sLink;
    } else {
      shortLink = await Link.generateShortLink(uri);
    }
    // TODO: Setup if statements to check if youtube, twitter, facebook,
    // video, etc. or default to `website`
    const linkType = 'website';

    const link = new Link({
      creatorId: req.user._id,
      url: uri,
      type: linkType,
      domain: domain._id,
      shortLink,
      pageTitle,
    });

    const savedLink = await link.save();
    res.status(httpStatus.CREATED);
    res.json(savedLink.transform());
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Update existing link
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const {
      uri, linkId, sLink, domain,
    } = req.body;

    await Link.checkUserDuplicate(req.user._id, uri, sLink, domain);
    await Link.checkDuplicateShortLink(sLink);

    Link.findOne({ _id: linkId })
      .then((_link) => {
        if (uri) _link.url = uri;
        if (sLink) _link.shortLink = sLink;
        if (domain) _link.domain = domain;
        return _link.save();
      })
      .then((_link) => {
        res.status(httpStatus.OK);
        res.json(_link.transform());
      })
      .catch((err) => {
        logger.error(err);
        next(new APIError({
          message: 'Short link already exists',
          status: httpStatus.CONFLICT,
          isPublic: true,
        }));
      });
  } catch (error) {
    next(error);
  }
};

/**
 * Get link list of all links
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
    const links = await Link.list(req.query);
    if (!links.length) {
      res.status(httpStatus.NO_CONTENT);
      res.json(links);
    } else {
      console.log(links);
      // '_id','creatorId', 'url', 'type', 'shortLink', 'pageTitle', 'createdAt', 'updatedAt'
      // eslint-disable-next-line no-restricted-syntax
      Promise.all(links.map(async (link) => {
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
    linkId,
  } = req.body;
  const link = Link.find(linkId);

  link.remove()
    .then(() => res.status(httpStatus.NO_CONTENT).end())
    .catch(e => next(e));
};
