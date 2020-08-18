const mongoose = require('mongoose');
const { omitBy, isNil } = require('lodash');

/**
 * Subscription Schema
 * @private
 */
const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  active: Boolean,
  subscriptionStatus: String,
  subscriptionId: String,
  subscriptionPrice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPrice',
  },
  currentPeriodEnd: Date,
  subscriptionCancellationDate: Date,
}, {
  timestamps: true,
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
subscriptionSchema.pre('save', async (next) => {
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
subscriptionSchema.statics = {

  /**
   * List all messages in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of messages to be skipped.
   * @param {number} limit - Limit number of messages to be returned.
   * @returns {Promise<ContactMessage[]>}
   */
  list({
    page = 1,
    perPage = 30,
    user,
    subscriptionStatus,
    subscriptionId,
    subscriptionPrice,
    currentPeriodEnd,
  }) {
    const options = omitBy({
      user, subscriptionStatus, subscriptionId, subscriptionPrice, currentPeriodEnd,
    }, isNil);

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },

};

/**
 * @typedef Subscription
 */
const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
