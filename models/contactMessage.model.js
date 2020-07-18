const mongoose = require('mongoose');
const { omitBy, isNil } = require('lodash');

/**
 * Contact Message Schema
 * @private
 */
const contactMessageSchema = new mongoose.Schema({
  email: String,
  subject: String,
  message: String,
  ip: String,
}, {
  timestamps: true,
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
contactMessageSchema.pre('save', async (next) => {
  try {
    // TODO: Determine if there is anything that i want to do presave
    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Statics
 */
contactMessageSchema.statics = {

  /**
   * List all messages in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of messages to be skipped.
   * @param {number} limit - Limit number of messages to be returned.
   * @returns {Promise<ContactMessage[]>}
   */
  list({
    page = 1, perPage = 30, email, subject, message, ip,
  }) {
    const options = omitBy({
      email, subject, message, ip,
    }, isNil);

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },

};

/**
 * @typedef ContactMessage
 */
const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
module.exports = ContactMessage;
