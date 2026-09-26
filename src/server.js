require('dotenv').config();
const app = require('./app');
const { connect } = require('./config/db');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await connect();
    console.log('Database connection established.');
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error('Unable to start server:', err);
    process.exit(1);
  }
}

start();
