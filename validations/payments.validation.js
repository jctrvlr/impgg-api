const Joi = require('joi');

module.exports = {
  // POST /v1/payments/check-price
  checkPrice: {
    body: {
      price: Joi.number(),
    },
  },
  // POST /v1/payments/create-subscription
  createSubscription: {
    body: {
      paymentMethodId: Joi.string(),
      priceId: Joi.string(),
    },
  },
  // POST /v1/payments/retry-invoice
  retryInvoice: {
    body: {
      paymentMethodId: Joi.string(),
      priceId: Joi.string(),
      invoiceId: Joi.string(),
    },
  },
  // POST /v1/payments/retrieve-upcoming-invoice
  retrieveUpcomingInvoice: {
    body: {
      price: Joi.number(),
    },
  },
  // POST /v1/payments/cancel-subscription
  cancelSubscription: {
    body: {
      price: Joi.number(),
    },
  },
  // POST /v1/payments/update-subscription
  updateSubscription: {
    body: {
      price: Joi.number(),
    },
  },
  // POST /v1/paymentsretrieve-customer-payment-method
  retrieveCustomerPaymentMethod: {
    body: {
      price: Joi.number(),
    },
  },
  // POST /v1/payments/stripe-webhook
  stripeWebhook: {
    body: {
      price: Joi.number(),
    },
  },
};
