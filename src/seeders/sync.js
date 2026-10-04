require('dotenv').config();
const { sequelize } = require('../models');

async function syncSchema() {
  await sequelize.sync();
  console.log('Database schema synced.');
}

if (require.main === module) {
  syncSchema()
    .catch((err) => {
      console.error('Failed to sync database:', err);
      process.exitCode = 1;
    })
    .finally(() => sequelize.close());
}

module.exports = { syncSchema };
