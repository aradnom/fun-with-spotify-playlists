'use strict';

/**
 * This guy is simply for any functionality that doesn't fit better
 * somewhere else.
 */

var Passport        = require( 'passport' );
var PassportSpotify = require( 'passport-spotify' ).Strategy;
var Winston         = require( 'winston' );

// Load global config in
var config          = require( './config/config.js' );

/**
 * Configure Passport for use with Express and for handling incoming auth
 * requests.
 *
 * @return {Object}          Returns configured Passport object
 */
exports.configurePassport = function () {
  Passport.use( new PassportSpotify({
      clientID: config.spotify.client_id,
      clientSecret: config.spotify.client_secret,
      callbackURL: 'http://' + config.host + ':' + config.port + '/auth/callback'
    },
    function ( accessToken, refreshToken, profile, done ) {
      if ( accessToken ) {
        return done( null, {
          accessToken: accessToken,
          refreshToken: refreshToken
        });
      } else {
        return done( 'Unable to authenticate with Spotify.' );
      }
    }
  ));

  // Dummy functions for simply passing tokens on to Express
  Passport.serializeUser( function ( tokens, done ) {
    done( null, tokens );
  });

  Passport.deserializeUser( function ( tokens, done ) {
    done( null, tokens );
  });

  return Passport;
};

/**
 * Configure global Winston logger.
 */
exports.SetupLogger = function ( basePath ) {
  return new ( Winston.Logger )({
    transports: [
      new ( Winston.transports.Console )({
        colorize: true,
        timestamp: true
      }),
      new ( Winston.transports.File )({
        filename: basePath + config.log_directory + 'app.log',
        maxsize: 100 * 1024 * 1024,
        maxFiles: 5
      })
    ]
  });
}
