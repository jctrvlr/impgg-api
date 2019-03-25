/* eslint-disable no-param-reassign */
const httpStatus = require('http-status');
const Link = require('../models/link.model');
// const User = require('../models/user.model');
const PageView = require('../models/pageView.model');
const APIError = require('../utils/APIError');

/**
 * Get Link and redirect + pageview
 * @public
 */
exports.get = (req, res, next) => {
  try {
    const { linkId } = req.params;
    const link = Link.findByShort(linkId);
    if (!link) throw new APIError({ message: 'Link cannot be found' });
    // eslint-disable-next-line no-unused-vars
    const pageview = new PageView({
      linkId: link._id,
      ip: req.ip,
      userAgent: req.userAgent,
    }).save();

    // TODO: Get location data about user and save in pageview --
    // Do we save location data with initial pageview object or add information on to object.

    // Redirect to saved URI
    res.redirect(301, link.url);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Link Info
 * @public
 */
exports.getLink = (req, res, next) => {
  try {
    const { linkId } = req.params;
    const link = Link.findByShort(linkId);
    if (!link) throw new APIError({ message: 'Link cannot be found' });

    res.json(link.transform());
  } catch (error) {
    next(error);
  }
};

/**
 * Create new link
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const { CreatorId, uri, sLink } = req.body; // i instead of l for uri in req.body
    // TODO: Setup if statements to check if youtube, twitter, facebook,
    // video, etc. or default to `website`
    // TODO: Setup shortlink generation -- separate function?
    let shortLink = '';
    if (!sLink) {
      shortLink = await Link.generateShortLink(uri);
    } else {
      shortLink = sLink;
    }
    const linkType = 'website';

    const link = new Link({
      creatorId: CreatorId,
      url: uri,
      type: linkType,
      short_link: shortLink,
    });

    const savedLink = await link.save();
    res.status(httpStatus.CREATED);
    res.json(savedLink.transform());
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing link
 * @public
 */
exports.update = (req, res, next) => {
  const {
    CreatorId, uri, oldSLink, newSLink,
  } = req.body;
  const link = Link.findByShort(oldSLink)
    .then((_link) => {
      _link.creatorId = CreatorId;
      _link.url = uri;
      _link.shortLink = newSLink;
      return _link.save();
    });

  res.json(link.transform());
};

/**
 * Get link list of all links
 * @public
 */
exports.list = async (req, res, next) => {
  // TODO: Write user check using req.user to see if user is admin or what links or what
  // links the user should have access too
  try {
    const links = await Link.list(req.query);
    const transformedLinks = links.map(link => link.transform());
    res.json(transformedLinks);
  } catch (error) {
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
