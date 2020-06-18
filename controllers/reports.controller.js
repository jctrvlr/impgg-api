/* eslint-disable no-param-reassign */
const httpStatus = require('http-status');
const sgMail = require('@sendgrid/mail');
const json2csv = require('json2csv');

const logger = require('../config/logger');
const PageView = require('../models/pageView.model');

const {
  env, SENDGRID_API_KEY, fromEmail, baseUrl,
} = require('../config/vars');

sgMail.setApiKey(SENDGRID_API_KEY);
/**
 * Get click report and send to users email
 * @public
 * {
 *   linkName,
 *   referral,
 *   ip,
 *   userAgent,
 *   device,
 *   country,
 *   region,
 *   linkCreator,
 * }
 */
exports.clickReport = async (req, res, next) => {
  try {
    const { user } = req;
    const { limit, linkFilter } = req.body;

    // Get pageViews
    const data = await PageView.find({ linkId: { $in: linkFilter } }, {}, {
      sort: { created_at: -1 },
    }).populate({
      path: 'linkId',
      populate: {
        path: 'creatorId',
      },
    }).limit(limit);

    // Convert JSON to CSV data
    // Header/fields
    const fields = ['linkId.url', 'referral', 'ip', 'userAgent', 'device', 'location.country', 'location.stateRegion', 'linkId.creatorId.email'];
    const fieldnames = ['Link Name', 'Referral', 'IP Address', 'User Agent', 'Device', 'Country', 'Region', 'Link Creator Email'];

    const csvData = json2csv({ data, fields, fieldnames });
    const timestamp = Date.now();
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
          content: csvData,
          filename: `clickReport-${timestamp}.csv`,
          type: 'text/csv',
          disposition: 'attachment',
        },
      ],
    };
    sgMail.send(mailOptions, (error, _result) => {
      if (error) return res.status(500).json({ message: error.message });
    });
  } catch (error) {
    next(error);
  }
};
