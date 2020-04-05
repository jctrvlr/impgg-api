const Domain = require('../models/domain.model');
const { env } = require('../config/vars');
const logger = require('../config/logger');

Domain.countDocuments({}, (err, count) => {
  if (err) throw err;
  logger.info('Seeding - Number of domains: ', count);

  if (count <= 0) {
    const defaultDomain = {
      uri: env === 'development' ? 'localhost:3001' : 'imp.gg',
      domainType: 'dom',
      status: 2,
      validated: true,
    };

    Domain.create(defaultDomain, (e) => {
      if (e) throw e;
    });
  }
});
