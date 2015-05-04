// Global app config //////////////////////////////////////////////////////////

module.exports = {
  host: 'localhost',
	port: 8080,
  templates_dir: 'views',
  cookie_secret: 'SECRET',

  // Environment vars
  debug: true,
  environment: 'dev',
  log_directory: '/logs/',

  // Spotify config
  spotify: {
    client_id: 'Client ID',
    client_secret: 'Client Secret',
    token_expires: 3600 // Seconds
  }
}
