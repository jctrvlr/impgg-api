const Domain = require('../models/domain.model');
const { env } = require('../config/vars');

Domain.countDocuments({}, (err, count) => {
  if (err) throw err;
  console.log('Seeding - Number of domains: ', count);

  if (count <= 0) {
    const defaultDomain = {
      uri: env === 'development' ? 'http://localhost:3001' : 'https://imp.gg',
      domainType: 'dom',
      status: 2,
      validated: true,
    };

    Domain.create(defaultDomain, (e) => {
      if (e) throw e;
    });
  }
});
