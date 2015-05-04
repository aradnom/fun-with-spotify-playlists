/******************************************************************************
* BASIC EXPRESS APP ***********************************************************
******************************************************************************/


///////////////////////////////////////////////////////////////////////////////
// Requires ///////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


var Express         = require( 'express' );
var CookieParser    = require( 'cookie-parser' );
var BodyParser      = require( 'body-parser' );
var Compression     = require( 'compression' );
var Path            = require( 'path' );
var Winston         = require( 'winston' );
var Args            = require( 'yargs' ).argv;
var App             = Express();


////////////////////////////////////////////////////////////////////////
// Setup ///////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////


var config  = require( './lib/config/config.js' );
var utility = require( './lib/utility.js' );
var logger  = utility.SetupLogger( __dirname );

// Figure out if this is a production or dev environment
var env     = Args.env ? Args.env : config.environment;

// Route controllers //////////////////////////////////////////////////////////
var api     = require( './lib/controllers/api.js' );
var auth    = require( './lib/controllers/auth.js' );
var pages   = require( './lib/controllers/pages.js' );


///////////////////////////////////////////////////////////////////////////////
// Express configuration //////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


// Set up configuration for production vs. dev - dev is assumed if
// production isn't set
if ( env == 'production' ) {
  App.locals.pretty = false;
  App.use( Compression() );
} else {
  App.use( require( 'connect-livereload' )({ port: 35729 }));
}

// Global app config params
App.use( CookieParser( config.cookie_secret ));
App.use( BodyParser.urlencoded({ extended: true }));
App.use( BodyParser.json() );
App.use( '/assets', Express.static( Path.join( __dirname, 'assets' ) ));
App.set( 'views', __dirname + '/' + config.templates_dir );
App.engine( 'html', require('ejs').renderFile );

// Configure app for Passport
var Passport = utility.configurePassport();

App.use( Passport.initialize() );


///////////////////////////////////////////////////////////////////////////////
// Routes /////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


// Home
App.get( '/', pages.home );

// Auth routes
App.get( '/auth/getplaytokens', api.getTokens );
App.get( '/auth/requestauth', Passport.authenticate( 'spotify', {
  scope: [
    'playlist-read-private',
    'playlist-modify-private',
    'user-library-read',
    'user-library-modify'
  ]
}));
App.get(
  '/auth/callback',
  Passport.authenticate( 'spotify', { failureRedirect: '/' }),
  auth.successfulAuth
);
App.get( '/auth/refreshtoken', auth.refreshAccessToken );

// FOUR OH FOUR
App.get( '*', function( req, res ) {
  res.send( "Nothin' there, chief.", 404 );
});

// Away we go /////////////////////////////////////////////////////////////////
var port = Args.port ? Args.port : config.port,
  server = App.listen( port, function() {
  logger.info( 'Server active', { port: port } );
});
