const mongoose = require('mongoose');
const { omitBy, isNil } = require('lodash');

/**
 * Subscription Price Schema
 * @private
 */
const subscriptionPriceSchema = new mongoose.Schema({
  priceId: String,
  price: {
    type: String,
    unique: true,
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
subscriptionPriceSchema.pre('save', async (next) => {
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
subscriptionPriceSchema.statics = {

  /**
   * List all messages in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of messages to be skipped.
   * @param {number} limit - Limit number of messages to be returned.
   * @returns {Promise<ContactMessage[]>}
   */
  list({
    page = 1, perPage = 30, priceId, price,
  }) {
    const options = omitBy({
      priceId, price,
    }, isNil);

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },

};

/**
 * @typedef SubscriptionPrice
 */
const SubscriptionPrice = mongoose.model('SubscriptionPrice', subscriptionPriceSchema);
module.exports = SubscriptionPrice;
