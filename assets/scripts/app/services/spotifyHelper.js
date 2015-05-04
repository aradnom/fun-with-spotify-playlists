/**
 * Provides access to the Spotify Web Helper server.  This allows access to the
 * following commands:
 *
 * - Play Spotify resource (track, playlist, etc.)
 * - Pause player
 * - Get player status
 *
 * This requires a valid CSRF token and OAuth Access token.  These are
 * retrieved with a separate service and require the Spotify Web Helper to be
 * active on the browser machine.
 */
App.service( 'spotifyHelper', [ '$http', '$q', 'getTokens', '$rootScope', 'templates', function ( $http, $q, getTokens, $rootScope, templates ) {
  var tokens = {};

  // Attempt to retrieve necessary tokens
  getTokens
    .then( function ( spotifyTokens ) {
      tokens = spotifyTokens;

      // Great, spread the good news
      $rootScope.$broadcast( 'spotifyHelperLoaded' );
    })
    .catch( function ( error ) {
      console.error( error );

      $rootScope.$broadcast( 'spotifyHelperError' );
    });

  return {
    play: function ( resource ) {
      if ( tokens.csrf && tokens.access && resource ) {
        // Build the command URL
        var url = buildSpotifyCommandUrl({
          action: 'play',
          csrf: tokens.csrf,
          oauth: tokens.access,
          suffix: 'uri=' + resource + '&context=' + resource
        });

        // Issue the command - will return a promise containing service
        // response on success or error on fail
        return sendSpotifyCommand( url );
      } else {
        console.error( 'Spotify Helper must be loaded before issuing commands.' );
      }
    },

    pause: function () {
      if ( tokens.csrf && tokens.access ) {
        // Build the command URL
        var url = buildSpotifyCommandUrl({
          action: 'pause',
          csrf: tokens.csrf,
          oauth: tokens.access,
          suffix: 'pause=true'
        });

        // Issue the command - will return a promise containing service
        // response on success or error on fail
        return sendSpotifyCommand( url );
      } else {
        console.error( 'Spotify Helper must be loaded before issuing commands.' );
      }
    },

    status: function () {
      if ( tokens.csrf && tokens.access ) {
        // Build the command URL
        var url = buildSpotifyCommandUrl({
          action: 'status',
          csrf: tokens.csrf,
          oauth: tokens.access,
          suffix: 'returnon=login,logout,play,pause,error,ap&returnafter=60'
        });

        // Issue the command - will return a promise containing service
        // response on success or error on fail
        return sendSpotifyCommand( url );
      } else {
        console.error( 'Spotify Helper must be loaded before issuing commands.' );
      }
    }
  };


  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  function buildSpotifyCommandUrl ( args ) {
    var compiler = _.template( templates.spotifyCommandUrl );

    return encodeURI( compiler( args ) );
  }

  function sendSpotifyCommand ( url ) {
    var deferred = $q.defer();

    $http.get( url, {
        params: { callback: 'JSON_CALLBACK' }
      })
      .success( function ( data, status, headers, config ) {
        deferred.resolve( data );
      })
      .error( function ( data, status, headers, config ) {
        deferred.reject( 'Unable to send Spotify command.' );
      });

    return deferred.promise;
  }

  /**
   * So... commands to the HTTP service return what is basically JSON, but
   * without a few essential bits.  For convenience, this just adds those bits
   * back in so you've got a normal JS object to play with.
   *
   * EDIT: never mind, discovered a JSON route. Tee hee.
   *
   * @param  {String}  data Raw unformatted response string
   * @return {Objects}      Returns parsed JSON if possible or unparsed data if
   * not
   */
  function buildResponseJson ( data ) {
    var parsed = data;

    parsed = parsed.replace( /([a-z|A-Z|\d|'|"|\}])\n/g, '$1,\n' );
    parsed = parsed.replace( /\s\{/g, ': {' );
    parsed = parsed.replace( /([a-z|A-Z|_]+):\s/g, '"$1": ' );
    parsed = parsed.replace( /,\n(\s*\})/g, '$1' );
    parsed = '{\n' + parsed + '\n}';

    try {
      parsed = JSON.parse( parsed );

      return parsed;
    } catch ( e ) {
      return data;
    }
  }
}]);
