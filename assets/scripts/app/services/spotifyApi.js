/**
 * Wrapper for ng-spotify service that handles auth stuff and abstracts methods
 * we're using a lot.
 */
App.service( 'spotifyApi', [ 'Spotify', 'userConfig', 'localStorageService', '$cookies', '$http', '$q', '$rootScope', function ( Spotify, userConfig, localStorageService, $cookies, $http, $q, $rootScope ) {

  /////////////////////////////////////////////////////////////////////////////
  // Setup ////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  // Bucket we'll dump all Service Stuff into
  var service = {
    apiReady: false
  };

  // Check for new auth cookies
  setAuthCookies();

  // Then check if current auth token is valid
  var authToken = checkAuthToken();

  if ( authToken ) {
    // Great, API is ready to roll then.  Set auth in Spotify service and off
    // we go
    Spotify.setAuthToken( authToken );

    service.apiReady = true;

    // Fire ready event to let everyone know the game is afoot
    $rootScope.$broadcast( 'spotifyApiReady' );
  } else {
    // Crap.  Attempt to refresh auth token then.
    refreshAccessToken()
      .then( function ( authToken ) {
        // Hurray!  Off we go then
        Spotify.setAuthToken( authToken );

        service.apiReady = true;

        // Fire ready event to let everyone know the game is afoot
        $rootScope.$broadcast( 'spotifyApiReady' );
      })
      .catch( function ( error ) {
        // Double crap.  Fine, start over and send user back to request access
        // from the beginning.
        console.error( error );
      });
  }


  /////////////////////////////////////////////////////////////////////////////
  // Functions ////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  service.getLibrary = function () {
    var deferred = $q.defer();

    if ( this.apiReady ) {
      var allTracks = [];

      Spotify
        .getSavedUserTracks({ limit: 50 })
        .then( function ( tracks ) {
          if ( tracks.total ) {
            // Throw tracks on the stack
            allTracks = allTracks.concat( tracks.items );

            if ( allTracks.length < tracks.total ) {
              // Set up requests to get the rest of the tracks if necessary
              var promises = [];

              for ( var i = tracks.limit; i < tracks.total; i += tracks.limit ) {
                promises.push( Spotify.getSavedUserTracks( { offset: i, limit: tracks.limit } ) );
              }

              $q.all( promises ).then( function ( remaining ) {
                if ( remaining && remaining.length ) {
                  allTracks = allTracks.concat.apply( allTracks, remaining.map( function ( item ) {
                    return item.items;
                  }));
                }

                // And back we go
                deferred.resolve( allTracks );
              });
            } else {
              // Guess we're done then, return directly
              deferred.resolve( allTracks );
            }
          } else {
            deferred.reject( 'User library contains no tracks.' );
          }
        })
        .catch( function ( error ) {
          deferred.reject( error );
        });
    } else {
      console.error( 'Spotify API not loaded.' );
    }

    return deferred.promise;
  };

  /**
   * Retrieve user's playlists.
   *
   * @return {Object} Returns deferred object with results on success
   */
  service.getPlaylists = function () {
    if ( this.apiReady ) {
      return Spotify.getUserPlaylists( userConfig.username, { limit: 50 } );
    } else {
      console.error( 'Spotify API not loaded.' );
    }
  };

  /**
   * Pull all tracks for a given playlist.
   *
   * @param  {String} playlistId Spotify Playlist ID string
   * @return {Object}            Returns promise containing tracks on success
   * or error on fail
   */
  service.getPlaylistTracks = function ( playlistId ) {
    var deferred = $q.defer();

    if ( this.apiReady ) {
      var allTracks = [];

      Spotify
        .getPlaylistTracks( userConfig.username, playlistId, { limit: 50 } )
        .then( function ( tracks ) {
          if ( tracks.total ) {
            // Throw tracks on the stack
            allTracks = allTracks.concat( tracks.items );

            if ( allTracks.length < tracks.total ) {
              // Set up requests to get the rest of the tracks if necessary
              var promises = [];

              for ( var i = tracks.limit; i < tracks.total; i += tracks.limit ) {
                promises.push( Spotify.getPlaylistTracks( userConfig.username, playlistId, { offset: i, limit: tracks.limit } ) );
              }

              $q.all( promises ).then( function ( remaining ) {
                if ( remaining && remaining.length ) {
                  allTracks = allTracks.concat.apply( allTracks, remaining.map( function ( item ) {
                    return item.items;
                  }));
                }

                // And back we go
                deferred.resolve( allTracks );
              });
            } else {
              // Guess we're done then, return directly
              deferred.resolve( allTracks );
            }
          } else {
            deferred.reject( 'Playlist contains no tracks.' );
          }
        })
        .catch( function ( error ) {
          deferred.reject( error );
        });
    } else {
      console.error( 'Spotify API not loaded.' );
    }

    return deferred.promise;
  };

  /**
   * Run Spotify search.
   *
   * @param  {String} query Search query
   * @return {Object} Returns deferred object with results on success
   */
  service.search = function ( query ) {
    if ( this.apiReady ) {
      return Spotify.search( query, 'album,artist,track' );
    } else {
      console.error( 'Spotify API not loaded.' );
    }
  };


  // And back we go ///////////////////////////////////////////////////////////

  return service;


  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  /**
   * Check for/save auth tokens passed as cookies.  These will be coming from
   * the server in the event of a new successful auth request.  Delete them
   * after saving them.
   */
  function setAuthCookies () {
    if ( $cookies.access_token ) {
      localStorageService.set( 'access_token', $cookies.access_token );

      $cookies.access_token = '';
    }
    if ( $cookies.refresh_token ) {
      localStorageService.set( 'refresh_token', $cookies.refresh_token );

      $cookies.refresh_token = '';
    }
    if ( $cookies.expires_in ) {
      localStorageService.set( 'expires_in', $cookies.expires_in );

      $cookies.expires_in = '';
    }
    if ( $cookies.issued_at ) {
      localStorageService.set( 'issued_at', $cookies.issued_at );

      $cookies.issued_at = '';
    }
    if ( $cookies.expires_at ) {
      localStorageService.set( 'expires_at', $cookies.expires_at );

      $cookies.expires_at = '';
    }
  }

  /**
   * Check if auth token exists and make sure it hasn't expired yet.
   *
   * @return {String} Returns current token if valid or null if not
   */
  function checkAuthToken () {
    var token     = localStorageService.get( 'access_token' );
    var expiresAt = localStorageService.get( 'expires_at' );

    if ( token && expiresAt ) {
      // Check if token is still valid
      var now   = moment();
      var later = moment( expiresAt );

      if ( now.isBefore( later ) ) {
        // Hurray!
        return token;
      }
    }

    // Well that didn't work out
    return null;
  }

  /**
   * Attempt to refresh access token if refresh token exists.
   *
   * @return {Object} Returns deferred with new token on success or error on
   * failure
   */
  function refreshAccessToken () {
    var deferred = $q.defer();
    var refresh  = localStorageService.get( 'refresh_token' );

    if ( refresh ) {
      $http.jsonp( '/auth/refreshtoken', {
        params: {
          refresh_token: refresh,
          callback: 'JSON_CALLBACK'
        }
      })
      .success( function ( response ) {
        if ( response.success ) {
          // Run over old cookie values if they exist (we could just replace
          // them but better to reserve them for server responses)
          $cookies.access_token = '';
          $cookies.expires_in   = '';
          $cookies.issued_at    = '';
          $cookies.expires_at   = '';

          // And set the new values
          localStorageService.set( 'access_token', response.access_token );
          localStorageService.set( 'expires_in', response.expires_in );
          localStorageService.set( 'issued_at', response.issued_at );
          localStorageService.set( 'expires_at', response.expires_at );

          // And send the token back
          deferred.resolve( response.access_token );
        } else {
          deferred.reject( response.error );
        }
      })
      .error( function ( response, status, headers, config ) {
        deferred.reject( 'Error making refresh request: ', response );
      });
    } else {
      deferred.reject( 'Unable to retrieve refresh token.' );
    }

    return deferred.promise;
  }
}]);
