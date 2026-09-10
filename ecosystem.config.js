// PM2 — konfiguracja procesu produkcyjnego.
// Użycie:  pm2 start ecosystem.config.js --env production
//          pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: 'kknbg',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,               // SQLite -> jeden proces (fork). Skalowanie: 'max' po migracji na Postgres.
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '350M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      out_file: 'logs/pm2-out.log',
      error_file: 'logs/pm2-err.log',
      merge_logs: true,
      time: true,
    },
  ],
};
