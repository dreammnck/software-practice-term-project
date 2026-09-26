require('dotenv').config();
const { sequelize, User, Restaurant } = require('../models');

const restaurants = [
  { name: 'The Golden Spoon', address: '123 Sukhumvit Rd, Bangkok', telephone: '021234567', openTime: '10:00:00', closeTime: '22:00:00' },
  { name: 'Riverside Grill', address: '45 Charoen Krung Rd, Bangkok', telephone: '022345678', openTime: '11:00:00', closeTime: '23:00:00' },
  { name: 'Sakura Sushi Bar', address: '78 Silom Rd, Bangkok', telephone: '023456789', openTime: '11:30:00', closeTime: '21:30:00' },
  { name: 'Bella Italia', address: '9 Thonglor Soi 5, Bangkok', telephone: '024567890', openTime: '10:30:00', closeTime: '22:30:00' },
  { name: 'Spice Route', address: '210 Rama IV Rd, Bangkok', telephone: '025678901', openTime: '10:00:00', closeTime: '21:00:00' },
];

async function seed() {
  try {
    await sequelize.sync();

    for (const restaurant of restaurants) {
      await Restaurant.findOrCreate({ where: { name: restaurant.name }, defaults: restaurant });
    }
    console.log(`Seeded ${restaurants.length} restaurants (idempotent).`);

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@restaurant.com';
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      await User.create({
        name: process.env.SEED_ADMIN_NAME || 'System Admin',
        telephone: process.env.SEED_ADMIN_TELEPHONE || '0000000000',
        email: adminEmail,
        password: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
        role: 'admin',
      });
      console.log(`Seeded admin account: ${adminEmail}`);
    } else {
      console.log('Admin account already exists, skipping.');
    }
  } catch (err) {
    console.error('Failed to seed database:', err);
  } finally {
    await sequelize.close();
  }
}

seed();
