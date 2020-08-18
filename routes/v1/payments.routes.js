const express = require('express');
const validate = require('express-validation');
const bodyParser = require('body-parser');

const controller = require('../../controllers/payments.controller');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');
const {
  createSubscription,
  checkPrice,
  retryInvoice,
  retrieveUpcomingInvoice,
  cancelSubscription,
  updateSubscription,
  retrieveCustomerPaymentMethod,
} = require('../../validations/payments.validation');

const router = express.Router();

router
  .route('/check-price')
  /**
   * @api {post} v1/payments/check-price Check that subscription price exists
   * @apiDescription Check that subscription price exists
   * @apiVersion 1.0.0
   * @apiName Check that subscription price exists
   * @apiGroup Payments
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [price]    price
   *
   * @apiSuccess (OK 200) {String} priceId
   *
   * @apiError (Bad Request 400)  ValidationError Some parameters may contain invalid values
   */
  .post(authorize(LOGGED_USER), validate(checkPrice), controller.checkPrice);

router
  .route('/billing-info')
  /**
   * @api {get} v1/payments/billing-info Retrieve billing information for billing settings page
   * @apiDescription Billing Info
   * @apiVersion 1.0.0
   * @apiName Billing Info
   * @apiGroup Payments
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiSuccess (OK 200) {Boolean} checkDup
   */
  .get(authorize(LOGGED_USER), controller.billingInfo);

router
  .route('/create-subscription')
  /**
   * @api {post} v1/payments/create-subscription Create subscription
   * @apiDescription Create a subscription
   * @apiVersion 1.0.0
   * @apiName Create subscription
   * @apiGroup Payments
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [paymentMethodId]    paymentMethodId
   * @apiParam {String}    [priceId]    priceId
   *
   * @apiSuccess (OK 200) {Object} userData
   * @apiSuccess (OK 200) {Object} subscription
   *
   * @apiError (Bad Request 400)  ValidationError Some parameters may contain invalid values
   */
  .post(authorize(LOGGED_USER), validate(createSubscription), controller.createSubscription);

router
  .route('/retry-invoice')
  /**
   * @api {post} v1/payments/retry-invoice Retry invoice (brother to createSubscription)
   * @apiDescription Retry invoice (brother to createSubscription)
   * @apiVersion 1.0.0
   * @apiName Retry invoice
   * @apiGroup Payments
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [paymentMethodId]    paymentMethodId
   * @apiParam {String}    [priceId]    priceId
   * @apiParam {String}    [invoiceId]    invoiceId
   *
   * @apiSuccess (OK 200) {Boolean} checkDup
   */
  .post(authorize(LOGGED_USER), validate(retryInvoice), controller.retryInvoice);

router
  .route('/retrieve-upcoming-invoice')
  /**
   * @api {post} v1/payments/retrieve-upcoming-invoice Retrieve upcoming invoice
   * @apiDescription Retrieve upcoming invoice
   * @apiVersion 1.0.0
   * @apiName Retrieve upcoming invoice
   * @apiGroup Payments
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [linkId]    linkId
   *
   * @apiSuccess (OK 200) {Object} User
   */
  .post(
    authorize(LOGGED_USER),
    validate(retrieveUpcomingInvoice),
    controller.retrieveUpcomingInvoice,
  );

router
  .route('/cancel-subscription')
  /**
   * @api {post} v1/payments/cancel-subscription Cancel subscription
   * @apiDescription Cancel subscription
   * @apiVersion 1.0.0
   * @apiName Cancel subscription
   * @apiGroup Payments
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiSuccess (OK 200) {Object} User
   */
  .post(authorize(LOGGED_USER), validate(cancelSubscription), controller.cancelSubscription);

router
  .route('/update-subscription')
  /**
   * @api {post} v1/payments/update-subscription Update subscription
   * @apiDescription Update subscription
   * @apiVersion 1.0.0
   * @apiName Update subscription
   * @apiGroup Payments
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [linkId]    linkId
   *
   * @apiSuccess (OK 200) {Object} User
   */
  .post(authorize(LOGGED_USER), validate(updateSubscription), controller.updateSubscription);

router
  .route('/retrieve-customer-payment-method')
  /**
   * @api {post} v1/payments/retrieve-customer-payment-method Retrieve customer payment method
   * @apiDescription Retrieve customer payment method
   * @apiVersion 1.0.0
   * @apiName Retrieve customer payment method
   * @apiGroup Payments
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [linkId]    linkId
   *
   * @apiSuccess (OK 200) {Object} User
   */
  .post(
    authorize(LOGGED_USER),
    validate(retrieveCustomerPaymentMethod),
    controller.retrieveCustomerPaymentMethod,
  );

router
  .route('/stripe-webhook')
  /**
   * @api {post} v1/payments/stripe-webhook Stripe webhook handler
   * @apiDescription Stripe webhook handler
   * @apiVersion 1.0.0
   * @apiName Stripe webhook handler
   * @apiGroup Payments
   * @apiPermission public
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam {String}    [linkId]    linkId
   *
   * @apiSuccess (OK 200) {Object} User
   */
  .post(
    bodyParser.raw({ type: 'application/json' }),
    controller.stripeWebhook,
  );

module.exports = router;
