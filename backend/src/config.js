const path = require('path');

module.exports = {
  APP_NAME: 'Smart Home Gardening and Decoration System',
  PORT: Number(process.env.PORT) || 4000,
  JWT_SECRET: process.env.JWT_SECRET || 'shgds-dev-secret-change-me',
  JWT_EXPIRES_IN: '30d',
  DB_FILE: process.env.DB_FILE || path.join(__dirname, '..', 'data', 'db.json'),
  PUBLIC_DIR: path.join(__dirname, '..', 'public'),
  // There is no email provider in this project, so recovery codes are returned
  // in the API response (and logged) while DEMO_MODE is on.
  DEMO_MODE: process.env.DEMO_MODE !== 'false',
  RESET_CODE_TTL_MS: 10 * 60 * 1000,
};
