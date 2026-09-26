require('dotenv').config();
const { sequelize } = require('../models');

async function sync() {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database schema synced.');
  } catch (err) {
    console.error('Failed to sync database:', err);
  } finally {
    await sequelize.close();
  }
}

sync();
