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
  mongo: {
    uri: process.env.NODE_ENV === 'test' ? process.env.MONGO_URI_TESTS : process.env.MONGO_URI,
  },
  redis: {
    host: process.env.NODE_ENV === 'test' ? process.env.REDIS_URI_TESTS : process.env.REDIS_URI,
    port: process.env.NODE_ENV === 'test' ? process.env.REDIS_PORT_TESTS : process.env.REDIS_PORT,
  },
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
};
