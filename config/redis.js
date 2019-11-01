const redisC = require('redis');
const logger = require('./logger');
const { redis, env } = require('./vars');

exports.client = redisC.createClient(redis.host, redis.port);


// print mongoose logs in dev env
if (env === 'development') {
  this.client.set('debug', true);
}

this.client.on('connect', () => {
  logger.debug(`Redis client connected on ${redis.host} ${redis.port}.`);
});

this.client.on('error', (err) => {
  logger.error(`Redis connection error: ${err}`);
  process.exit(-1);
});
