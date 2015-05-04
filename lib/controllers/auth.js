'use strict';

/**
 * This controller handles all auth-related routes.
 */

var Moment  = require( 'moment' );
var Request = require( 'request' );

// Global config
var config  = require( '../config/config.js' );

/**
 * Handle a successful auth request from Spotify.
 *
 * @param  {Object} req Express request object
 * @param  {Object} res Express response object
 * @return {Object}     Returns cookie containing auth tokens on success
 */
exports.successfulAuth = function ( req, res ) {
  // Set necessary cookies and go back home
  if ( req.user && req.user.accessToken && req.user.refreshToken ) {
    res.cookie( 'access_token', req.user.accessToken );
    res.cookie( 'refresh_token', req.user.refreshToken );

    // TODO: this value shouldn't change very often, but we'd have to dig it
    // out of the raw return in Passport.  Meh.
    var now     = Moment();
    var expires = config.spotify.token_expires;

    res.cookie( 'expires_in', expires );
    res.cookie( 'issued_at', now.toISOString() );
    res.cookie( 'expires_at', now.add( expires, 's' ).toISOString() );
  }

  // And back we go
  res.redirect( '/' );
};

/**
 * Attempt to retrieve a new access token using a refresh token.
 *
 * @param  {Object} req Express request object
 * @param  {Object} res Express response object
 * @return {Object}     Returns object containing refreshed tokens or error
 * on refresh failure
 */
exports.refreshAccessToken = function ( req, res ) {
  var refreshToken = req.query.refresh_token;

  if ( ! refreshToken ) {
    return res.jsonp({ error: 'Must send valid refresh token.' });
  }

  // Pull everything else we need for this
  var clientId     = config.spotify.client_id;
  var clientSecret = config.spotify.client_secret;

  if ( clientId && clientSecret ) {
    // And send the request
    Request.post( 'https://accounts.spotify.com/api/token', {
      form: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      },
      headers: {
        'Authorization': 'Basic ' + new Buffer( clientId + ':' + clientSecret ).toString( 'base64' )
      },
      json: true
    }, function ( error, response, body ) {
      if ( body && body.access_token ) {
        var now     = Moment();
        var expires = config.spotify.token_expires;

        // Calculation next expiration time and return everything
        return res.jsonp({
          success: true,
          access_token: body.access_token,
          expires_in: expires,
          issued_at: now.toISOString(),
          expires_at: now.add( expires, 's' ).toISOString()
        });
      } else {
        return res.jsonp({ error: 'Unable to refresh access token.', details: error });
      }
    });
  } else {
    return res.jsonp({ error: 'Unable to fetch necessary tokens for request.' });
  }
};
