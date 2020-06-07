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
  mongo: {
    uri: process.env.NODE_ENV === 'test' ? process.env.MONGO_URI_TESTS : process.env.MONGO_URI,
  },
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
};
