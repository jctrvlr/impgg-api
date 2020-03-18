/* eslint-disable no-param-reassign */
const httpStatus = require('http-status');
const Link = require('../models/link.model');
// const User = require('../models/user.model');
const logger = require('../config/logger');
const PageView = require('../models/pageView.model');

/**
 * Get link extended info for dashboard dialog
 * @public
 * {
 *   url,
 *   createdAt,
 *   type,
 *   creatorId,
 *   platform,
 *   devices,
 *   browser,
 *   popLocation,
 *   referrer,
 * }
 */
exports.getLinkInfo = async (req, res, next) => {
  // TODO: Write user check using req.user to see if user is admin or what links or what
  // links the user should have access too
  try {
    const links = await Link.find({ _id: req.params.linkId }).populate('domain').limit(1);
    if (!links.length) {
      logger.debug(`Link not found - query: ${req.query}`);
      res.status(httpStatus.NO_CONTENT);
      res.json(links);
    } else {
      // '_id','creatorId', 'url', 'type', 'shortLink', 'pageTitle', 'createdAt', 'updatedAt'

      // TODO: Fix popLocation query so that it returns the region not count
      // eslint-disable-next-line no-restricted-syntax
      Promise.all(links.map(async (link) => {
        link = link.toJSON();
        link.countries = await PageView.aggregate([{
          $match: { linkId: link._id },
        }, {
          $unwind: '$location',
        }, {
          $group: { _id: '$location.country', count: { $sum: 1 } },
        }, {
          $sort: { count: -1 },
        }]);

        if (link.countries.some(el => el._id === 'US')) {
          if (link.countries.some(el => el._id !== 'US')) {
            link.justUSA = false;
          } else {
            link.justUSA = true;
          }
          link.states = await PageView.aggregate([{
            $match: { linkId: link._id, 'location.country': 'US' },
          }, {
            $unwind: '$location',
          }, {
            $group: { _id: '$location.stateRegion', count: { $sum: 1 } },
          }, {
            $sort: { count: -1 },
          }]);
        }

        link.referrer = await PageView.aggregate([{
          $match: { linkId: link._id },
        }, {
          $group: { _id: '$ref', count: { $sum: 1 } },
        }, {
          $sort: { count: -1 },
        }]);

        link.platform = await PageView.aggregate([{
          $match: { linkId: link._id },
        }, {
          $unwind: '$userAgent',
        }, {
          $group: { _id: '$userAgent.platform', count: { $sum: 1 } },
        }, {
          $sort: { count: -1 },
        }]);

        link.devices = await PageView.aggregate([{
          $match: { linkId: link._id },
        }, {
          $group: { _id: '$device', count: { $sum: 1 } },
        }, {
          $sort: { count: -1 },
        }]);

        link.browser = await PageView.aggregate([{
          $match: { linkId: link._id },
        }, {
          $unwind: '$userAgent',
        }, {
          $group: { _id: '$userAgent.browser', count: { $sum: 1 } },
        }, {
          $sort: { count: -1 },
        }]);
        // get link.social --- fill with parsed social - referrer
        return link;
      })).then((ret) => {
        res.status(httpStatus.OK);
        res.json(ret);
      });
    }
  } catch (error) {
    next(error);
  }
};
