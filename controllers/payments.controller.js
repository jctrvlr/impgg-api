/* eslint-disable consistent-return */
/* eslint-disable no-case-declarations */
/* eslint-disable no-param-reassign */
const httpStatus = require('http-status');
const moment = require('moment-timezone');

const logger = require('../config/logger');

const User = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');
const SubscriptionPrice = require('../models/subscriptionPrice.model');
const Subscription = require('../models/subscription.model');

const {
  stripeSecret, stripeProductId, stripeWebhookSecret, jwtExpirationInterval,
} = require('../config/vars');
// eslint-disable-next-line import/order
const stripe = require('stripe')(stripeSecret);

/**
* Returns a formated object with tokens
* @private
*/
function generateTokenResponse(user, accessToken) {
  const tokenType = 'Bearer';
  const refreshToken = RefreshToken.generate(user).token;
  const expiresIn = moment().add(jwtExpirationInterval, 'minutes');
  return {
    tokenType, accessToken, refreshToken, expiresIn,
  };
}

/**
 * Create subscription
 * @public
 */
exports.createSubscription = async (req, res, next) => {
  try {
    let { user } = req;
    const { paymentMethodId, priceId } = req.body;
    const customerId = user.stripeCustomerId;
    user = await user.populate('subscription');

    const today = moment();

    if (user.susbcription && user.subscription.subscriptionStatus === 'active' && user.subscription.currentPeriodEnd < today) {
      return res.status('400').json({ error: { message: 'Account already has a active susbcription' } });
    }
    // Set the default payment method on the customer
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } catch (error) {
      return res.status('402').json({ error: { message: error.message } });
    }

    await stripe.customers.update(
      customerId,
      {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      },
    );

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
    });

    const price = await SubscriptionPrice.findOne({ priceId });
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

    const dbSubscription = new Subscription();
    dbSubscription.active = true;
    dbSubscription.user = user._id;
    dbSubscription.subscriptionStatus = subscription.status;
    dbSubscription.subscriptionId = subscription.id;
    dbSubscription.subscriptionPrice = price._id;
    dbSubscription.currentPeriodEnd = currentPeriodEnd;

    const savedSubscription = await dbSubscription.save();

    user.subscription = savedSubscription._id;
    user.stripePaymentMethodId = paymentMethodId;

    const savedUser = await user.save();

    const userTransformed = await User.findOne({ _id: savedUser._id }).populate('domains').populate('subscription').populate({
      path: 'subscription',
      populate: [{
        path: 'subscriptionPrice',
      }],
    });

    const token = generateTokenResponse(savedUser, savedUser.token());

    return res.json({ subscription, userData: { user: userTransformed, token } });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get billing information for billing settings page
 * @public
 */
exports.billingInfo = async (req, res, next) => {
  try {
    const { user } = req;

    const paymentMethod = await stripe.paymentMethods.retrieve(
      user.stripePaymentMethodId,
    );

    const invoice = await stripe.invoices.retrieveUpcoming({
      customer: user.stripeCustomerId,
    });

    return res.json({ paymentMethod, invoice });
  } catch (error) {
    return next(error);
  }
};

/**
 * Check price -- If exists returns priceId, if doesn't exist create new
 * @public
 */
exports.checkPrice = async (req, res, next) => {
  try {
    const { price } = req.body;
    const foundPrice = await SubscriptionPrice.find({ price });

    // If found send back priceId
    if (foundPrice.length) {
      res.status(httpStatus.OK);
      return res.json({ priceId: foundPrice[0].priceId });
    }
    // If not found create new price
    const newPrice = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: price * 100,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    logger.info(`Created new price: ${price}`);
    // Store created price in database so don't need to query stripe next time
    const dataPrice = await new SubscriptionPrice({ price, priceId: newPrice.id }).save();
    res.status(httpStatus.OK);
    return res.json({ priceId: dataPrice.priceId });
  } catch (error) {
    return next(error);
  }
};

/**
 * Retry invoice with new paymentMethod
 * @public
 */
exports.retryInvoice = async (req, res, next) => {
  try {
    let { user } = req;
    const { paymentMethodId, priceId, invoiceId } = req.body;
    const customerId = user.stripeCustomerId;
    user = await user.populate('subscription');

    const today = moment();

    if (user.subscription.subscriptionStatus === 'active' && user.subscription.currentPeriodEnd < today) {
      return res.status('400').json({ error: { message: 'Account already has a active susbcription' } });
    }
    // Set the default payment method on the customer
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      await stripe.customers.update(
        customerId,
        {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        },
      );
    } catch (error) {
      return res.status('402').send({ error: { message: error.message } });
    }

    // Retrieve the invoice
    const invoice = await stripe.invoices.retrieve(invoiceId, {
      expand: ['payment_intent'],
    });

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);

    const price = await SubscriptionPrice.find({ priceId });

    const currentPeriodEnd = moment(subscription.current_period_end);

    const dbSubscription = new Subscription();
    subscription.user = user;
    subscription.active = true;
    subscription.subscriptionStatus = subscription.status;
    subscription.subscriptionId = subscription.id;
    subscription.subscriptionPrice = price;
    subscription.currentPeriodEnd = currentPeriodEnd;

    const savedSubscription = await dbSubscription.save();

    user.subscription = savedSubscription;
    user.stripePaymentMethodId = paymentMethodId;

    const savedUser = await user.save();
    const userTransformed = await User.findOne({ _id: savedUser._id }).populate('domains').populate('subscription').populate({
      path: 'subscription',
      populate: [{
        path: 'subscriptionPrice',
      }],
    });

    const token = generateTokenResponse(savedUser, savedUser.token());

    return res.json({ subscription, userData: { user: userTransformed, token } });
  } catch (error) {
    return next(error);
  }
};

/**
 * Retrieve an upcoming invoice
 * @public
 */
exports.retrieveUpcomingInvoice = async (req, res, next) => {
  try {
    const { user } = req;
    const { subscriptionId, priceId } = req.body;
    const subscription = await stripe.subscriptions.retrieve(
      subscriptionId,
    );

    const customerId = user.stripeCustomerId;

    const invoice = await stripe.invoices.retrieveUpcoming({
      subscription_prorate: true,
      customer: customerId,
      subscription: subscriptionId,
      subscription_items: [
        {
          id: subscription.items.data[0].id,
          deleted: true,
        },
        {
          price: priceId,
          deleted: false,
        },
      ],
    });

    return res.json({ invoice });
  } catch (error) {
    return next(error);
  }
};

/**
 * Cancel a subscription
 * @public
 */
exports.cancelSubscription = async (req, res, next) => {
  try {
    let { user } = req;
    user = await User.findOne({ _id: user._id }).populate('subscription');
    console.log(user);
    // Delete the subscription
    const deletedSubscription = await stripe.subscriptions.del(
      user.subscription.subscriptionId,
    );

    const subscription = await Subscription.findOne({
      subscriptionId: user.subscription.subscriptionId,
    });
    subscription.subscriptionStatus = 'canceled';
    subscription.active = false;
    subscription.subscriptionCancellationDate = new Date();

    user.subscription = null;
    const savedUser = await user.save();
    const userTransformed = await User.findOne({ _id: savedUser._id }).populate('domains').populate('subscription').populate({
      path: 'subscription',
      populate: [{
        path: 'subscriptionPrice',
      }],
    });

    const token = generateTokenResponse(savedUser, savedUser.token());
    // Remove subscription from user.
    return res.json({
      subscription: deletedSubscription,
      userData: { user: userTransformed, token },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update an already active subscription
 * @public
 */
exports.updateSubscription = async (req, res, next) => {
  try {
    const { priceId, paymentMethodId } = req.body;

    let { user } = req;
    user = await User.findOne({ _id: user._id }).populate('subscription');
    const customerId = user.stripeCustomerId;

    // Set the default payment method on the customer
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      await stripe.customers.update(
        customerId,
        {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        },
      );
    } catch (error) {
      return res.status('402').send({ error: { message: error.message } });
    }

    const subscription = await stripe.subscriptions.retrieve(
      user.subscription.subscriptionId,
    );
    const updatedSubscription = await stripe.subscriptions.update(
      user.subscription.subscriptionId,
      {
        cancel_at_period_end: false,
        items: [
          {
            id: subscription.items.data[0].id,
            price: priceId,
          },
        ],
      },
    );

    res.send(updatedSubscription);
  } catch (error) {
    return next(error);
  }
};

/**
 * Retrieve a users current payment method
 * @public
 */
exports.retrieveCustomerPaymentMethod = async (req, res, next) => {
  try {
    const { price } = req.body;
    const foundPrice = await SubscriptionPrice.find({ price });
    console.log('foundprice', foundPrice);
    // If found send back priceId
    if (foundPrice) {
      res.status(httpStatus.OK);
      return res.send(foundPrice.priceId);
    }
    // If not found create new price
    const newPrice = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: price * 100,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    logger.info(`Created new price: ${price}`);
    // Store created price in database so don't need to query stripe next time
    const dataPrice = await new SubscriptionPrice({ price, priceId: newPrice.id }).save();
    res.status(httpStatus.OK);
    return res.send(dataPrice.priceId);
  } catch (error) {
    return next(error);
  }
};

/**
 * Stripe webhooks
 * @public
 */
exports.stripeWebhook = async (req, res, next) => {
  try {
  // Retrieve the event by verifying the signature using the raw body and secret.
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        stripeWebhookSecret,
      );
    } catch (err) {
      console.log(err);
      console.log('⚠️  Webhook signature verification failed.');
      console.log(
        '⚠️  Check the env file and enter the correct webhook secret.',
      );
      return res.sendStatus(400);
    }
    // Extract the object from the event.
    const dataObject = event.data.object;

    const updateUsersSubscription = async (dObj) => {
      const subscription = await stripe.subscriptions.retrieve(dObj.subscription);
      const user = await User.findOne({ stripeCustomerId: dObj.customer });
      const price = await SubscriptionPrice.findOne({
        priceId: subscription.items.data[0].price.id,
      });
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

      const dbSubscription = new Subscription();
      dbSubscription.active = true;
      dbSubscription.user = user._id;
      dbSubscription.subscriptionStatus = subscription.status;
      dbSubscription.subscriptionId = subscription.id;
      dbSubscription.subscriptionPrice = price._id;
      dbSubscription.currentPeriodEnd = currentPeriodEnd;

      const savedSubscription = await dbSubscription.save();

      user.subscription = savedSubscription._id;

      return user.save();
    };

    // Handle the event
    switch (event.type) {
      case 'invoice.paid':
        logger.info('Event: invoice.paid');

        res.sendStatus(200);
        await updateUsersSubscription(dataObject);

        break;
      case 'invoice.payment_failed':
        logger.info('Event: invoice.payment_failed');

        res.sendStatus(200);
        await updateUsersSubscription(dataObject);

        break;
      case 'invoice.finalized':
        logger.info('Event: invoice.finalized');

        res.sendStatus(200);
        await updateUsersSubscription(dataObject);

        break;
      case 'customer.subscription.deleted':
        logger.info('Event: customer.subscription.deleted');

        if (event.request != null) {
          res.sendStatus(200);
        } else {
          res.sendStatus(200);
          const user = await User.findOne({ stripeCustomerId: dataObject.customer }).populate('subscription');

          const subscription = await Subscription.findOne({
            subscriptionId: user.subscription.subscriptionId,
          });
          subscription.subscriptionStatus = 'canceled';
          subscription.active = false;
          subscription.subscriptionCancellationDate = new Date();

          user.subscription = null;
          await user.save();
        }
        break;
      default:
      // Unexpected event type
        return res.sendStatus(200);
    }
  } catch (error) {
    return next(error);
  }
};
