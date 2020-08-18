const path = require('path');

require('dotenv-safe').load({
  path: path.join(__dirname, '../.env'),
  sample: path.join(__dirname, '../.env.example'),
});

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpirationInterval: process.env.JWT_EXPIRATION_MINUTES,
  dnsKey: process.env.DNS_KEY,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.FROM_EMAIL,
  baseUrl: process.env.BASE_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET,
  stripeSecret: process.env.STRIPE_SECRET,
  stripePublic: process.env.STRIPE_PUBLIC,
  stripeProductId: process.env.STRIPE_PRODUCT_ID,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  mongo: {
    uri: process.env.NODE_ENV === 'test' ? process.env.MONGO_URI_TESTS : process.env.MONGO_URI,
  },
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
};
