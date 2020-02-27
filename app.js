// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign
const https = require('https');
const fs = require('fs');
const { port, env } = require('./config/vars');
const logger = require('./config/logger');
const app = require('./config/express');
const mongoose = require('./config/mongoose');


// open mongoose connection
mongoose.connect();

if (env === 'production') {
  const privateKey = fs.readFileSync('/etc/letsencrypt/live/api.impgg.dev/privkey.pem', 'utf8');
  const certificate = fs.readFileSync('/etc/letsencrypt/live/api.impgg.dev/cert.pem', 'utf8');
  const ca = fs.readFileSync('/etc/letsencrypt/live/api.impgg.dev/chain.pem', 'utf8');
  https.createServer({
    key: privateKey,
    cert: certificate,
    ca,
  }, app).listen(port, '0.0.0.0', () => logger.info(`server started on port ${port} (${env})`));
} else {
  // listen to requests
  app.listen(port, '0.0.0.0', () => logger.info(`server started on port ${port} (${env})`));
}

/**
* Exports express
* @public
*/
module.exports = app;
