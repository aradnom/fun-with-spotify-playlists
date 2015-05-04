'use strict';

// Basic things you'll probably want to use
var Q       = require('q');
var Request = require('request');


///////////////////////////////////////////////////////////////////////////////
// Routes /////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


/**
 * Get the necessary OAuth and CSRF tokens to send commands to the Spotify
 * web helper.  We're not actually going through the OAuth flow here, we're
 * cheating using Spotify's own widget page.
 *
 * @param  {Object}  req Express request object
 * @param  {Object}  res Express response object
 * @return {Object}      Returns object containing necessary tokens on success
 * or error on fail
 */
exports.getTokens = function ( req, res ) {
    var tokens = {};

    // Attempt to pull CSRF token first
    getCsrfToken()
      .then( function ( csrfToken ) {
        tokens.csrf = csrfToken;

        return getAccessToken();
      })
      .then( function ( accessToken ) {
        tokens.access = accessToken;

        // Groovy, return both tokens
        return res.jsonp({ success: true, tokens: tokens });
      })
      .catch( function ( error ) {
        return res.jsonp({ error: 'Unable to retrieve tokens: ' + error });
      });
};


///////////////////////////////////////////////////////////////////////////////
// Functions //////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


function getCsrfToken () {
  var deferred = Q.defer();

  Request({
    url: 'https://tpcaahshvs.spotilocal.com:4371/simplecsrf/token.json',
    qs: { ref: '', cors: '' },
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, sdch',
      'Accept-Language': 'en-US,en;q=0.8,da;q=0.6,nb;q=0.4',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Host': 'embed.spotify.com',
      'Origin': 'https://embed.spotify.com',
      'Pragma': 'no-cache',
      'Referer': 'https://embed.spotify.com/?uri=spotify:track:4th1RQAelzqgY7wL53UGQt',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36'
    },
    gzip: true,
    json: true,
    rejectUnauthorized: false // This is generally bad but in this case we don't care
  }, function ( error, response, body ) {
    if ( error ) {
      deferred.reject( error );
    } else if ( body && body.token ) {
      deferred.resolve( body.token );
    } else {
      deferred.reject( 'Unable to retrieve CSRF token.' );
    }
  });

  return deferred.promise;
}

function getAccessToken () {
  var deferred = Q.defer();

  Request({
    url: 'https://embed.spotify.com',
    qs: { uri: 'spotify:track:4th1RQAelzqgY7wL53UGQt' },
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, sdch',
      'Accept-Language': 'en-US,en;q=0.8,da;q=0.6,nb;q=0.4',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Host': 'embed.spotify.com',
      'Pragma': 'no-cache',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36'
    },
    gzip: true
  }, function ( error, response, body ) {
    if ( error ) {
      deferred.reject( error );
    } else if ( body ) {
      // Attempt to regex the token out of there
      var matches = /tokenData\s?=\s?['|"](.+)['|"]/.exec( body );

      if ( matches ) {
        deferred.resolve( matches[ 1 ] );
      } else {
        deferred.reject( 'Unable to parse access token out of page source.' );
      }
    } else {
      deferred.reject( 'Unable to retrieve access token.' );
    }
  });

  return deferred.promise;
}
