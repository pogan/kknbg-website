'use strict';

const env = require('./src/config/env');
const { createApp } = require('./src/app');

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`\n  🍺  Nowy Browar Gdański — prototyp`);
  console.log(`  ▸ tryb:   ${env.NODE_ENV}`);
  console.log(`  ▸ adres:  ${env.BASE_URL}`);
  console.log(`  ▸ auth:   ${env.AUTH_MODE}`);
  console.log(`  ▸ port:   ${env.PORT}\n`);
});

function shutdown(signal) {
  console.log(`\n${signal} — zamykanie serwera…`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
