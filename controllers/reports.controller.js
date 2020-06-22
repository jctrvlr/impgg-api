/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
const httpStatus = require('http-status');
const sgMail = require('@sendgrid/mail');
const json2csv = require('json2csv').parse;
const moment = require('moment');

const logger = require('../config/logger');
const PageView = require('../models/pageView.model');

const {
  env, SENDGRID_API_KEY, fromEmail, baseUrl,
} = require('../config/vars');

sgMail.setApiKey(SENDGRID_API_KEY);

/**
 * Get click report and send to users email
 * @public
 */
exports.clickReport = async (req, res, next) => {
  try {
    const { user } = req;
    const { limit, linkFilter } = req.body;

    // TODO: Send this to a report worker
    // Get pageViews
    const data = await PageView.find({ linkId: { $in: linkFilter } }, {}, {
      sort: { created_at: -1 },
    }).populate({
      path: 'linkId',
      populate: {
        path: 'creatorId',
      },
    }).limit(limit).lean();

    // Convert JSON to CSV data
    // Header/fields
    const fields = [{ label: 'Link Name', value: 'linkId.url' }, { label: 'Referral', value: 'ref' }, { label: 'IP Address', value: 'ip' }, { label: 'Device', value: 'device' }, { label: 'Platform', value: 'userAgent.platform' }, { label: 'Browser', value: 'userAgent.browser' }, { label: 'Country', value: 'location.country' }, { label: 'Region', value: 'location.stateRegion' }, { label: 'Link Creator Email', value: 'linkId.creatorId.email' }, { label: 'User Agent', value: 'userAgent' }];
    const fieldnames = ['Link Name', 'Referral', 'IP Address', 'Device', 'Country', 'Region', 'Link Creator Email', 'User Agent'];
    const csvData = json2csv(data, { fields, fieldnames });

    const mailOptions = {
      to: user.email,
      from: fromEmail,
      subject: 'ImpGG - Click Report Request',
      text: `Hi ${user.profile.firstName} \n \n
    You will find your click report attached to this email! \n \n
    Thanks, \n
    ImpGG Team`,
      attachments: [
        {
          content: Buffer.from(csvData).toString('base64'),
          filename: `clickReport-${moment().toISOString()}.csv`,
          type: 'text/csv',
          disposition: 'attachment',
        },
      ],
    };

    return sgMail.send(mailOptions, (error, _result) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
      }
      logger.info(`Sent click report to ${user.email}`);
      return res.status(httpStatus.OK).json({ message: 'Request received.' });
    });
  } catch (error) {
    return next(error);
  }
};
