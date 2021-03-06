'use strict';

// Declare app level module which depends on filters, and services
var App = angular.module('App', [ 'ngSanitize', 'ngResource', 'spotify', 'LocalStorageModule', 'ngCookies', 'debounce', 'angular-cache', 'ngDragDrop' ]);

/**
 * Service for handling simple button-related tasks that are used in multiple
 * controllers/directives.
 */
App.service( 'buttons', [ '$http', '$q', '$timeout', function ( $http, $q, $timeout ) {
  return {
    /**
     * 'Flash' a button - display the button's highlight state for a period
     * before fading back to the default state.
     *
     * @param  {Object} $button Button selector to be flashed
     */
    flash: function ( $button ) {
      $button.addClass( '--active' );

      $timeout( function () {
        $button.removeClass( '--active' );
      }, 250 );
    }
  };
}]);

/**
 * App-wide config(s).
 */

// Spotify config
App.value( 'spotifyConfig', {
  spotifyHelperUrl: 'https://pnmxtktyhx.spotilocal.com:4371/remote/',
  cachePeriod: 60 // Minutes
});

// User config data (temporary in theory)
App.value( 'userConfig', {
  username: 'aradnom'
});

/**
 * Simple service for keeping track of drag-and-drop-related stuff app-wide.
 */
App.value( 'dragAndDrop', {
  currentTrack: null
});

/**
 * Retrieve necessary tokens to talk to the Spotify web helper (CSRF and OAuth
 * Access tokens)
 */
App.service( 'getTokens', [ '$http', '$q', function ( $http, $q ) {
  var deferred = $q.defer();

  $http.jsonp( '/auth/getplaytokens', {
      params: { callback: 'JSON_CALLBACK' }
    })
    .success( function ( data, status, headers, config ) {
      if ( data && data.success ) {
        // And back we go
        deferred.resolve( data.tokens );
      } else {
        deferred.reject( data.error );
      }
    })
    .error( function ( data, status, headers, config ) {
      deferred.reject( 'Unable to fetch Spotify tokens.' );
    });

  return deferred.promise;
}]);

/**
 * Service for loading all the stuff we'll need and caching it for use later.
 */
App.service( 'resources', [ '$rootScope', 'spotifyConfig', 'spotifyApi', 'spotifyUtility', 'CacheFactory', '$q', function ( $rootScope, spotifyConfig, spotifyApi, spotifyUtility, CacheFactory, $q ) {
  // Top-level object for all resource types
  $rootScope.resources = {
    playlists: null,
    library: null
  };

  // Create basic cache factory for Stuff
  var cache = CacheFactory( 'spotify', {
    maxAge: spotifyConfig.cachePeriod * 60 * 1000,
    deleteOnExpire: 'passive',
    storageMode: 'localStorage',
    onExpire: refreshCache
  });

  // Watch resources collection so we can fire event when everybody is ready
  $rootScope.$watchCollection( 'resources', function () {
    if ( $rootScope.resources.playlists && $rootScope.resources.library ) {
      $rootScope.$broadcast( 'resourcesReady' );
    }
  });

  // Force cache clear if necessary
  // cache.removeAll();

  // Build initial resource set if needed
  initResources();

  // Return reference to resources object (or it can be accessed via rootScope)
  return $rootScope.resources;


  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  /**
   * Initialize resources in the event cache is totally empty to start
   */
  function initResources () {
    $rootScope.resources.playlists = cache.get( 'playlists' );
    $rootScope.resources.library   = cache.get( 'library' );

    // If data isn't set, refresh the cache
    if ( ! $rootScope.resources.playlists || ! $rootScope.resources.library ) {
      refreshCache();
    }
  }

  /**
   * Rebuild cache values.  Will wait for the spotify API to ready before doing
   * this.
   *
   * @param  {String} key   Cache key to refresh
   * @param  {Mixed}  value Last cache value
   */
  function refreshCache ( key, value ) {
    if ( spotifyApi.apiReady ) {
      // If API is already ready, go immediately
      buildResources();
    } else {
      // Fine, we'll just wait.  That's cool.  No hurry, really.
      $rootScope.$on( 'spotifyApiReady', function () {
        buildResources();
      });
    }
  };

  /**
   * Build all needed resources from scratch.
   */
  function buildResources () {
    buildPlaylists();
    buildLibrary();
  }

  /**
   * Build playlist resources (playlists and tracks).
   */
  function buildPlaylists () {
    spotifyApi
      .getPlaylists()
      .then( function ( playlists ) {
        if ( playlists && playlists.total ) {
          // Then for each playlist, pull tracks
          var count = 1;

          playlists.items.forEach( function ( playlist ) {
            spotifyApi
              .getPlaylistTracks( playlist.id )
              .then( function ( tracks ) {
                // Save the tracks
                playlist.tracksUrl = playlist.tracks.href;
                playlist.tracks    = tracks;

                if ( count === playlists.total ) {
                  // All done - format data, cache everything and set resources
                  var formattedPlaylists = formatPlaylists( playlists.items );

                  cache.put( 'playlists', formattedPlaylists );

                  // And set resource
                  $rootScope.resources.playlists = formattedPlaylists;
                }
              })
              .finally( function () {
                count++;
              });
          });
        }
      });
  }

  function buildLibrary () {
    spotifyApi
      .getLibrary()
      .then( function ( tracks ) {
        // All done - format data, cache everything and set resources
        tracks.forEach( function ( track ) {
          spotifyUtility.formatTrack( track );
        });

        cache.put( 'library', tracks );

        // And set resource
        $rootScope.resources.library = tracks;
      });
  }

  /**
   * Given an array of playlists, do a bit of formatting of the data for
   * display.
   *
   * @param  {Array} playlists Array of playlists from Spotify API
   * @return {Array}           Returns formatted array of playlists
   */
  function formatPlaylists ( playlists ) {
    playlists.forEach( function ( playlist ) {
      // Track formatting
      if ( playlist.tracks && playlist.tracks.length ) {
        playlist.tracks.forEach( function ( track ) {
          spotifyUtility.formatTrack( track );
        });
      }
    });

    return playlists;
  }
}]);

/**
 * Wrapper for ng-spotify service that handles auth stuff and abstracts methods
 * we're using a lot.
 */
App.service( 'spotifyApi', [ 'Spotify', 'userConfig', 'localStorageService', '$cookies', '$http', '$q', '$rootScope', function ( Spotify, userConfig, localStorageService, $cookies, $http, $q, $rootScope ) {

  /////////////////////////////////////////////////////////////////////////////
  // Setup ////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  // Bucket we'll dump all Service Stuff into
  var service = { apiReady: false };

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

/**
 * Service for misc. Spotify functionality.
 */
App.service( 'spotifyUtility', [ function () {
  var service = {};

  /**
   * Given a Spotify track object, return thumbnail of the specified size.
   * If the size cannot be found and fallback is true, just return the first
   * available image instead.
   *
   * @param  {Object}  track    Spotify track object
   * @param  {Integer} size     Desired thumbnail size.  Valid options:
   * 64, 300, 640
   * @param  {Boolean} fallback Pass true to fall back to first available
   * image if desired size cannot be found.
   * @return {String}           Returns thumbnail URI if it exists
   */
  service.getTrackThumbnail = function ( track, size, fallback ) {
    if ( track.album && track.album.images && track.album.images.length ) {
      var thumbnail = track.album.images.filter( function ( image ) {
        return image.width === size;
      });

      if ( thumbnail.length ) {
        return thumbnail[0].url;
      }

      // Just return the first available image then
      return track.album.images[0].url;
    }

    // Guess it didn't work out
    return null;
  };

  /**
   * Do a bit of formatting on a raw Spotify track to make display easier.
   *
   * @param  {Object} track Track object from Spotify API
   * @return {Object}       Returns formatted track object
   */
  service.formatTrack = function ( track ) {
    // Track can be nested in other stuff depending on where it came from so
    // find it first
    if ( track.track ) { track = track.track; }

    // Put together display-friendly track titles
    var title   = track.name;
    var artists = track.artists.map( function ( artist ) {
      return artist.name;
    });

    track.artist_string  = artists.join( ', ' );
    track.playlist_title = track.artist_string + ' - ' + title;

    // Get reference thumbnail
    track.thumbnail      = service.getTrackThumbnail( track, 300, true );

    return track;
  };

  return service;
}]);

/**
 * Global object for simple Underscore templates.
 */
App.service( 'templates', [ 'spotifyConfig', function ( spotifyConfig ) {
  return {
    spotifyCommandUrl: spotifyConfig.spotifyHelperUrl + '<%= action %>.json?csrf=<%= csrf %>&oauth=<%= oauth %>&<%= suffix %>&ref=&cors'
  };
}]);

/**
 * Service for random functionality that doesn't fit better elsewhere.
 */
App.service( 'utility', [ function () {
  return {
    /**
     * Convert a track playing time in seconds or milliseconds to formatted
     * minutes:seconds string.
     *
     * @param  {Int}    time Raw time to format, in seconds or milliseconds
     * @param  {String} unit Unit of raw time, 's' or 'ms.'  Defaults to
     * seconds
     * @return {String}      Returns formatted playtime string
     */
    getPlayingTimeString: function ( time, unit ) {
      unit = unit || 's';

      // Deal with milliseconds
      if ( unit === 'ms' ) {
        time /= 1000;
      }

      // Round time to nearest second
      time = Math.round( time );

      var minutes = parseInt( time / 60 ).toString();
      var seconds = ( time % 60 ).toString();

      if ( seconds < 10 ) { seconds = '0' + seconds; }

      // And back we go
      return minutes + ':' + seconds;
    }
  };
}]);

/**
 * Controller for areas that can receive dropped tracks.
 */
App.controller( 'Dropzone', [ '$scope', '$element', function ( $scope, $element ) {
  // Assume dropzone is inactive to start
  $scope.active = false;

  // Keep track of the last dropped track for propagating to other controllers
  var droppedTrack = null;

  // On drag start event, set dropzone to active
  $scope.$on( 'dragStart', function () {
    // Update dropzone states
    $scope.active = true;

    $scope.safeApply();
  });

  // On drag stop, reset active status
  $scope.$on( 'dragStop', function ( $event, track ) {
    // Save reference to the track in case we want to use it later
    droppedTrack = track.track;

    // Update dropzone states
    $scope.active = false;

    $scope.safeApply();
  });

  /////////////////////////////////////////////////////////////////////////////
  // Scope functions //////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  $scope.dragDrop = function () {
    // Drop successful, so emit an event to controllers above with the dropped
    // track
    $scope.$emit( 'trackDropped', droppedTrack );

    // Also reset droppedTrack for next time
    droppedTrack = null;

    // And reset hover state just in case
    $scope.hover = false;

    $scope.safeApply();
  };

  // Set hover state on mouseover
  $scope.dragOver = function () {
    $scope.hover = true;

    $scope.safeApply();
  };

  // Remove hover state on mouseout
  $scope.dragOut = function () {
    $scope.hover = false;

    $scope.safeApply();
  };
}]);

/**
 * Library controller.
 */
App.controller( 'Library', [ '$scope', '$rootScope', '$element', 'spotifyApi', 'resources', 'spotifyConfig', 'dragAndDrop', 'spotifyUtility', 'debounce', function ( $scope, $rootScope, $element, spotifyApi, resources, spotifyConfig, dragAndDrop, spotifyUtility, debounce ) {

  /////////////////////////////////////////////////////////////////////////////
  // Init /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  // Search object for containing playlist/track queries
  $scope.search = {};

  // Wait for resources to be loaded before going
  $scope.$on( 'resourcesReady', function () {
    $scope.library = resources.library;
  });


  /////////////////////////////////////////////////////////////////////////////
  // Scope functions //////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  $scope.addToPlaylist = function ( track ) {
    $rootScope.$broadcast( 'addToMasterPlaylist', spotifyUtility.formatTrack( track ) );
  };

  $scope.dragStart = function ( $event, ui, track ) {
    $rootScope.$broadcast( 'dragStart', track );

    // Update the track currently dragging in the drag and drop service so
    // other controllers can see it
    dragAndDrop.currentTrack = track.track;
  };

  $scope.dragStop = function ( $event, ui, track ) {
    $rootScope.$broadcast( 'dragStop', track );
  };

  $scope.searchLibrary = debounce( function () {
    var query = $scope.search.library.toLowerCase();

    if ( query ) {
      var filtered = resources.library.filter( function ( track ) {
        return track.track.name.toLowerCase().indexOf( query ) > -1 ||
          track.track.artist_string.toLowerCase().indexOf( query ) > -1;
      });

      $scope.library = filtered;
    } else {
      $scope.library = resources.library;
    }
  }, 200 );

}]);

/**
 * Body-level controller for anything site-wide.
 */
App.controller( 'Main', [ '$scope', '$element', 'spotifyHelper', '$timeout', 'Spotify', function ( $scope, $element, spotifyHelper, $timeout, Spotify ) {
  // $scope.$on( 'spotifyHelperLoaded', function () {
  //   // Play a track
  //   console.log( 'Starting playback...' );

  //   spotifyHelper.play( 'spotify:track:6qIhYlaLt0ra6YohxThTqi' );

  //   // Pull the status after a bit
  //   $timeout( function () {
  //     console.log( 'Pulling playback status...' );

  //     spotifyHelper.status()
  //       .then( function ( status ) {
  //         console.log( status );
  //       });
  //   }, 2500 );

  //   // After another bit, pause it
  //   $timeout( function () {
  //     console.log( 'Pausing playback...' );

  //     spotifyHelper.pause();
  //   }, 5000 );
  // });

  // Soooo $scope.$apply() is something you sometimes have to use when dealing
  // with 3rd-party DOM events (which in practice happens all the time).
  // Angular sucks at handling these calls safely, so the following will just
  // make sure it's not trying to call it when in the middle of an existing
  // apply/digest cycle.  This will automatically propagate to all scopes
  // below the main controller (so the whole app)
  $scope.safeApply = function(fn) {
    var phase = this.$root.$$phase;
    if ( phase === '$apply' || phase === '$digest' ) {
      if ( fn && ( typeof( fn ) === 'function' ) ) fn();
    } else {
      this.$apply(fn);
    }
  };
}]);

/**
 * Controller for the main playlist.
 */
App.controller( 'MasterPlaylist', [ '$scope', '$element', '$rootScope', 'localStorageService', 'dragAndDrop', function ( $scope, $element, $rootScope, localStorageService, dragAndDrop ) {
  // No track is playing to start
  $scope.currentTrack = null;

  // Set up the master list of tracks - load from cache if available
  $scope.tracks = localStorageService.get( 'playerMasterPlaylist' );

  if ( ! $scope.tracks ) { $scope.tracks = []; }

  // Keep track of the fact that we're dragging an internal track so we can
  // delete it from the old location after dropping it
  var draggingTrackIndex = -1;

  /////////////////////////////////////////////////////////////////////////////
  // Scope functions //////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  $scope.playTrack = function ( track ) {
    // Tell the player to play the track (but only if track is playable)
    if ( ! track.unplayable ) {
      $rootScope.$broadcast( 'playTrack', track );
    }
  };

  $scope.removeTrack = function ( index ) {
    removeFromPlaylist( index );
  };

  $scope.dragDrop = function ( $event, ui ) {
    // Then deal with adding the new track at the correct position
    var $tracks = $element.find( '.master-playlist__tracks__track' );

    if ( $tracks.length ) {
      // Figure out which track we're closest to and our offset relative to it
      // We only care about vertical offset because this event won't fire unless
      // the dropped track was in the playlist container
      var trackOffsets = $tracks.map( function () {
        return Math.abs( ui.offset.top - $( this ).offset().top );
      });

      var closestIndex = trackOffsets.index( Math.min.apply( trackOffsets, trackOffsets ));

      // Now figure out if we're above or below it and add accordingly.  If it
      // happens to be right over it, default to adding after it
      var closestOffset = $( $tracks[ closestIndex ] ).offset().top;

      if ( ( ui.offset.top - closestOffset ) >= 0 ) {
        // Insert after the closest track
        addToPlaylist( dragAndDrop.currentTrack, closestIndex + 1 );

        // If this is an internal drag and drop, remove the old track
        if ( draggingTrackIndex > -1 ) {
          if ( draggingTrackIndex > ( closestIndex + 1 ) ) { draggingTrackIndex++; }
        }
      } else {
        // Insert before the closest track
        addToPlaylist( dragAndDrop.currentTrack, closestIndex );

        // If this is an internal drag and drop, remove the old track
        if ( draggingTrackIndex > -1 ) {
          if ( draggingTrackIndex > closestIndex ) { draggingTrackIndex++; }
        }
      }
    } else {
      // If this is the first track, it doesn't matter where it lands so just
      // add it right away
      addToPlaylist( dragAndDrop.currentTrack );
    }

    // Deal with internal drag and drop
    if ( draggingTrackIndex > -1 ) {
      removeFromPlaylist( draggingTrackIndex );

      // Clear the internal dragging track index
      draggingTrackIndex = -1;
    }

    // Clear the current drag track now that drop has been achieved
    dragAndDrop.currentTrack = null;

    // Reset the hover state
    $scope.hover = false;

    $scope.safeApply();
  };

  // Set hover state on mouseover
  $scope.dragOver = function () {
    $scope.hover = true;

    $scope.safeApply();
  };

  // Remove hover state on mouseout
  $scope.dragOut = function () {
    $scope.hover = false;

    $scope.safeApply();
  };

  $scope.dragStart = function ( $event, ui, track, index ) {
    $rootScope.$broadcast( 'dragStart', track );

    // Update the track currently dragging in the drag and drop service so
    // other controllers can see it
    dragAndDrop.currentTrack = track;

    // Keep track of the fact that we're dragging an internal track so we can
    // delete it from the old location after dropping it
    draggingTrackIndex = index;
  };

  $scope.dragStop = function ( $event, ui, track ) {
    $rootScope.$broadcast( 'dragStop', track );
  };

  /////////////////////////////////////////////////////////////////////////////
  // Events ///////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // On track ended event, attempt to play the next track
  $scope.$on( 'trackEnded', function () {
    var playing = playNextTrack();

    if ( ! playing ) {
      // If there is no next track, tell the player to stop
      $rootScope.$broadcast( 'stopPlayback' );
    }
  });

  // On play track event, display track as the current track
  $scope.$on( 'playTrack', function ( $event, track ) {
    $scope.currentTrack = track;

    // Deactivate any currently-active tracks
    $scope.tracks
      .filter( function ( track ) {
        return track.active;
      }).forEach( function ( track ) {
        track.active = false;
      });

    // And activate this track
    track.active = true;
  });

  // Play next track if available
  $scope.$on( 'nextTrack', function () {
    playNextTrack();
  });

  // Play previous track if available
  $scope.$on( 'previousTrack', function () {
    playPreviousTrack();
  });

  // On player playing, set current item to active
  $scope.$on( 'playerPlaying', function () {
    // Set current track status to active
    $scope.currentTrack.active = true;

    // Set master playlist status to active
    $scope.playing = true;
  });

  // On player stopped, set current item to inactive
  $scope.$on( 'playerStopped', function () {
    $scope.playing = false;

    // Deactivate tracks in the playlist
    $scope.tracks
      .filter( function ( track ) {
        return track.active;
      }).forEach( function ( track ) {
        track.active = false;
      });
  });

  $scope.$on( 'addToMasterPlaylist', function ( $event, track, index ) {
    index = index || 0;

    addToPlaylist( track, index );
  });

  // Deal with unplayable tracks.  These are discovered at play time (there's
  // no way to detect these in the API results).
  $scope.$on( 'unplayableTrack', function ( $event, track ) {
    track.unplayable = true;

    // Update the track cache so we know ahead of time next time
    localStorageService.set( 'playerMasterPlaylist', $scope.tracks );
  });

  // On the sidebars closing, check if they're both closed, and if so, expand
  // the playlist to full width
  $rootScope.$watchCollection( 'sidebarStatus', function () {
    var status = $rootScope.sidebarStatus;

    $scope.fullWidth = status.left && status.right;
  });

  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Add to the master playlist and update the track cache appropriately
   *
   * @param {Object}  track Spotify track object
   * @param {Integer} index Specific inex to add track at (opt.)
   */
  function addToPlaylist ( track, index ) {
    // Add track to the master list
    if ( typeof( index ) !== 'undefined' ) {
      $scope.tracks.splice( index, 0, track );
    } else {
      $scope.tracks.push( track );
    }

    // And update the cache
    localStorageService.set( 'playerMasterPlaylist', $scope.tracks );
  }

  /**
   * Remove track at the specified index.
   *
   * @param  {Integer} index Index to remove item at
   */
  function removeFromPlaylist ( index ) {
    // Remove the track
    $scope.tracks.splice( index, 1 );

    // Update the cache
    localStorageService.set( 'playerMasterPlaylist', $scope.tracks );
  }

  /**
   * Attempt to play the next track in the master playlist.
   *
   * @return {Boolean} Returns true/false on play success/fail
   */
  function playNextTrack () {
    // Cut tracks down to the playable set just in case
    var playable = $scope.tracks.filter( function ( track ) {
      return ! track.unplayable;
    });

    if ( playable.length ) {
      var trackIndex = playable.indexOf( $scope.currentTrack );

      if ( trackIndex > -1 && playable[ trackIndex + 1 ] ) {
        $rootScope.$broadcast( 'playTrack', playable[ trackIndex + 1 ] );

        return true;
      }
    }

    // Apparently there was nothing to play
    return false;
  }

  /**
   * Attempt to play the previous track in the master playlist.
   *
   * @return {Boolean} Returns true/false on play success/fail
   */
  function playPreviousTrack () {
    // Cut tracks down to the playable set just in case
    var playable = $scope.tracks.filter( function ( track ) {
      return ! track.unplayable;
    });

    if ( playable.length ) {
      var trackIndex = playable.indexOf( $scope.currentTrack );

      if ( trackIndex > -1 && playable[ trackIndex - 1 ] ) {
        $rootScope.$broadcast( 'playTrack', playable[ trackIndex - 1 ] );

        return true;
      }
    }

    // Apparently there was nothing to play
    return false;
  }
}]);

/**
 * Controller for The Player.
 */
App.controller( 'Player', [ '$scope', '$rootScope', '$element', 'spotifyHelper', 'utility', '$interval', '$timeout', function ( $scope, $rootScope, $element, spotifyHelper, utility, $interval, $timeout ) {

  /////////////////////////////////////////////////////////////////////////////
  // Init /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // Assume we're not playing to start and that a track isn't loaded
  var progressTimer   = null;
  $scope.currentTrack = null;
  $scope.playing      = false;

  /////////////////////////////////////////////////////////////////////////////
  // Events ///////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // On request, play passed Spotify track object
  $rootScope.$on( 'playTrack', function ( $event, track ) {
    playTrack( track );
  });

  // On request, stop playback
  $rootScope.$on( 'stopPlayback', function ( $event, track ) {
    stopPlayback();
  });

  // On the sidebars closing, move player a bit to take advantage of the extra
  // space
  $rootScope.$watchCollection( 'sidebarStatus', function () {
    var status = $rootScope.sidebarStatus;

    $scope.fullWidth = status.left && status.right;
  });

  /////////////////////////////////////////////////////////////////////////////
  // Scope functions //////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  $scope.playPause = function () {
    if ( $scope.playing ) {
      stopPlayback();
    } else {
      if ( $scope.currentTrack ) {
        playTrack( $scope.currentTrack );
      }
    }
  };

  $scope.nextTrack = function () {
    $rootScope.$broadcast( 'nextTrack' );
  };

  $scope.previousTrack = function () {
    $rootScope.$broadcast( 'previousTrack' );
  };

  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Stop playback and update player status appropriately.
   */
  function stopPlayback () {
    spotifyHelper.pause()
      .then( function ( response ) {
        if ( response && ! response.playing ) {
          setPlayerStatusStopped();
        } else {
          // Deal with player errors
          console.error( response );
        }
      });
  }

  /**
   * Play a track object.
   *
   * @param  {Object} track Track object from Spotify API
   */
  function playTrack ( track ) {
    spotifyHelper.play( track.uri )
      .then( function ( response ) {
        if ( response.playing ) {
          // Set the player status to playing
          setPlayerStatusPlaying( track, response );

          // Update the current track
          $scope.currentTrack = track;
        } else {
          // Deal with player errors
          // If API returns a specific error (4303), track is unplayable
          // (usually because it doesn't exist or got moved), so mark it as such
          // to avoid this is in the future
          if ( response.error && response.error.type && response.error.type === '4303' ) {
            $rootScope.$broadcast( 'unplayableTrack', track );
          }

          console.error( response );
        }
      });
  }

  /**
   * Update the player status to playing.
   *
   * @param {Object} track    Spotify Track object
   * @param {Object} response Response object from play or status request
   */
  function setPlayerStatusPlaying ( track, response ) {
    $scope.playing = true;

    startPlayerProgress( track );

    // Tell the world
    $rootScope.$broadcast( 'playerPlaying' );
  }

  /**
   * Update the player status to not playing.
   */
  function setPlayerStatusStopped () {
    // Turn of playing status
    $scope.playing = false;

    // Update player progress
    stopPlayerProgress();

    // Tell the world
    $rootScope.$broadcast( 'playerStopped' );
  }

  /**
   * Clear all progress-related status "stuff."
   */
  function clearProgress () {
    var $progress = $element.find( '.player__progress__inner' );

    // Reset counters
    $scope.currentTime   = null;
    $scope.timeRemaining = null;

    // Reset progress width
    $progress.width( 0 );

    // As well as progress counter
    if ( progressTimer ) {
      $interval.cancel( progressTimer );

      progressTimer = null;
    }

    // Reset reverse remaining timer
    $scope.reverseRemaining = false;
  }

  /**
   * Setup player progress bar counter and timing.
   *
   * @param {Object} track Spotify Track object
   */
  function startPlayerProgress ( track ) {
    var $progress  = $element.find( '.player__progress__inner' );

    // Clear progress before doing anything else
    clearProgress();

    // Set up progress counting
    var duration         = Math.round( track.duration_ms / 1000 );
    var progress         = 0;
    var timeRemaining    = duration;
    $scope.currentTime   = utility.getPlayingTimeString( progress );
    $scope.timeRemaining = '-' + utility.getPlayingTimeString( timeRemaining );

    // Start timer to update progress as track plays
    // Handle timing by date because timers are horribly inaccurate
    var start  = moment();
    var end    = moment().add( moment.duration( track.duration_ms ) );

    progressTimer = $interval( function () {
      var now                = moment();
      var progress           = ( now - start ) / 1000;
      var progressRounded    = Math.round( progress );
      var progressPercentage = progress / duration;
      var playing            = now.isBefore( end );

      if ( playing ) {
        // Set progress width
        $progress.width( ( progressPercentage * 100 ) + '%' );

        // And update playing numbers
        $scope.currentTime = utility.getPlayingTimeString( progressRounded );
        $scope.timeRemaining = '-' + utility.getPlayingTimeString( duration - progressRounded );

        // If we're a bit into playback, reverse display of Remaining timers
        if ( progressPercentage > 0.3 ) {
          $scope.reverseRemaining = true;
        }
      } else {
        // We've hit the end of the track so let the playlist know that
        $rootScope.$broadcast( 'trackEnded' );
      }
    }, 250 );
  }

  /**
   * Shut down player progress bar.
   */
  function stopPlayerProgress () {
    clearProgress();
  }
}]);

/**
 * Player actions.
 */
App.controller( 'PlayerActions', [ '$scope', '$element', 'buttons', 'resources', '$rootScope', function ( $scope, $element, buttons, resources, $rootScope ) {
  $scope.injectFromPlaylist = function ( $event ) {
    if ( resources.playlists && resources.playlists.length ) {
      // Find playlists with tracks
      var playlists = resources.playlists.filter( function ( playlist ) {
        return playlist.tracks && playlist.tracks.length;
      });

      if ( playlists.length ) {
        // Pick a random playlist
        var playlistIndex = Math.round( Math.random() * ( playlists.length - 1 ) );
        var playlist      = playlists[ playlistIndex ];

        // Then pick a random track from the playlist
        var trackIndex    = Math.round( Math.random() * ( playlist.tracks.length - 1 ) );
        var track         = playlist.tracks[ trackIndex ];

        // Add the track to the playlist
        $rootScope.$broadcast( 'addToMasterPlaylist', track.track );

        buttons.flash( $( $event.currentTarget ) );
      }
    }
  };

  $scope.injectFromLibrary = function ( $event ) {
    if ( resources.library && resources.library.length ) {
      // Pick a random track from the library
      var trackIndex = Math.round( Math.random() * ( resources.library.length - 1 ) );
      var track      = resources.library[ trackIndex ];

      // Add the track to the playlist
      $rootScope.$broadcast( 'addToMasterPlaylist', track.track );

      buttons.flash( $( $event.currentTarget ) );
    }
  };
}]);

/**
 * Playlists controller.
 */
App.controller( 'Playlists', [ '$scope', '$rootScope', '$element', 'spotifyApi', 'resources', 'spotifyConfig', 'dragAndDrop', 'spotifyUtility', 'debounce', function ( $scope, $rootScope, $element, spotifyApi, resources, spotifyConfig, dragAndDrop, spotifyUtility, debounce ) {

  /////////////////////////////////////////////////////////////////////////////
  // Init /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // Search object for containing playlist/track queries
  $scope.search = {};

  // Wait for resources to be loaded before going
  $scope.$on( 'resourcesReady', function () {
    var displayPlaylists = buildDisplayPlaylists( resources.playlists );

    // Turn the lights on
    $scope.playlists = displayPlaylists;
  });


  /////////////////////////////////////////////////////////////////////////////
  // Scope functions //////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  $scope.showPlaylist = function ( $event, playlist ) {
    var $parent = $($event.currentTarget).parent();
    var $tracks = $parent.find( '.playlist__tracks' );

    if ( playlist.activeTracks ) {
      playlist.active = false;

      $tracks.velocity( 'slideUp', { duration: Math.log( playlist.tracks.length ) * 0.5 * 1000, easing: 'easeOutExpo', complete: function () {
        playlist.activeTracks = null;

        $scope.safeApply();
      }});
    } else if ( playlist.tracks && playlist.tracks.length ) {
      playlist.activeTracks = playlist.tracks;

      playlist.active = true;

      var unsubscribe = $scope.$on( 'ngRepeatFinished', function () {
        $tracks.velocity( 'slideDown', { duration: Math.log( playlist.tracks.length ) * 0.5 * 1000, easing: 'easeOutExpo' });

        unsubscribe();
      });
    }
  };

  $scope.addToPlaylist = function ( track ) {
    $rootScope.$broadcast( 'addToMasterPlaylist', spotifyUtility.formatTrack( track ) );
  };

  $scope.dragStart = function ( $event, ui, track ) {
    $rootScope.$broadcast( 'dragStart', track );

    // Update the track currently dragging in the drag and drop service so
    // other controllers can see it
    dragAndDrop.currentTrack = track.track;
  };

  $scope.dragStop = function ( $event, ui, track ) {
    $rootScope.$broadcast( 'dragStop', track );
  };

  $scope.searchPlaylists = debounce( function () {
    var query = $scope.search.playlists.toLowerCase();

    if ( query ) {
      var filtered = resources.playlists.filter( function ( playlist ) {
        return playlist.name.toLowerCase().indexOf( query ) > -1 &&
          playlist.tracks &&
          playlist.tracks.length;
      });

      $scope.playlists = buildDisplayPlaylists( filtered );
    } else {
      $scope.playlists = buildDisplayPlaylists( resources.playlists );
    }
  }, 200 );

  $scope.searchTracks = debounce( function ( playlist ) {
    var query = $scope.search.tracks.toLowerCase();

    if ( query && playlist ) {
      var filtered = playlist.tracks.filter( function ( track ) {
        return track.track.name.toLowerCase().indexOf( query ) > -1 ||
          track.track.artist_string.toLowerCase().indexOf( query ) > -1;
      });

      playlist.activeTracks = filtered;
    } else {
      playlist.activeTracks = playlist.tracks;
    }
  }, 200 );


  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  /**
   * Put together display playlist array.
   *
   * @param  {Array} playlists Array of raw playlist results
   */
  function buildDisplayPlaylists ( playlists ) {
    var displayPlaylists = [];

    playlists.forEach( function ( playlist ) {
      displayPlaylists.push({
        id: playlist.id,
        image: playlist.images && playlist.images.length ? playlist.images[0].url : null,
        name: playlist.name,
        tracks: playlist.tracks
      });
    });

    return displayPlaylists;
  }
}]);

/**
 * Search controller.  It controls the search.
 */
App.controller( 'Search', [ '$scope', '$rootScope', '$element', 'spotifyApi', 'debounce', 'spotifyUtility', function ( $scope, $rootScope, $element, spotifyApi, debounce, spotifyUtility ) {
  // Create blank object for search query
  $scope.search = {};

  // Keep track of search results so we can slide in with Velocity
  var $results = $element.find( '.search__results' );

  /////////////////////////////////////////////////////////////////////////////
  // Scope functions //////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  $scope.runSearch = debounce( function () {
    if ( $scope.search.query ) {
      spotifyApi.search( $scope.search.query )
        .then( function ( results ) {
          // Check which arrays have results so we know how many finished
          // events to listen for
          var finishedCount = ( results.tracks.total > 0 ? 1 : 0 ) +
            ( results.artists.total > 0 ? 1 : 0 ) +
            ( results.albums.total > 0 ? 1 : 0 );

          var eventCount = 0;
          var unsubscribe = $scope.$on( 'ngRepeatFinished', function () {
            eventCount++;

            if ( eventCount === finishedCount ) {
              unsubscribe();

              // Slide in results
              openSearchResults();
            }
          });

          // Set the results arrays
          $scope.results = results;
        })
    } else {
      // Slide out results
      closeSearchResults();
    }
  }, 300 );

  $scope.closeSearch = function () {
    closeSearchResults();
  };

  // Tells the master playlist to add the track
  $scope.addToPlaylist = function ( track ) {
    $rootScope.$broadcast( 'addToMasterPlaylist', spotifyUtility.formatTrack( track ) );
  };

  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  function openSearchResults () {
    $results
      .velocity( 'stop', true )
      .velocity( 'slideDown', { duration: 200 } );
  }

  function closeSearchResults () {
    $results
      .velocity( 'stop', true )
      .velocity( 'slideUp', { duration: 200, complete: function () {
        $scope.results = null;
      }});
  }
}]);

/**
 * Sidebar controller.
 */
App.controller( 'Sidebar', [ '$scope', '$rootScope', '$element', '$attrs', function ( $scope, $rootScope, $element, $attrs ) {
  // Get the width of the first sidebar pane for switching panes
  var sidebarWidth = $element.find( '.sidebar__panes__pane' ).first().width();

  // Keep track of the sidebar status in the root scope
  if ( typeof( $rootScope.sidebarStatus ) === 'undefined' ) {
    $rootScope.sidebarStatus = {};
  }

  // Set status to open to start
  $scope.closed = false;

  $rootScope.sidebarStatus[ $attrs.side ] = false;

  /////////////////////////////////////////////////////////////////////////////
  // Scope functions //////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // Toggle both sidebars at the same time
  $scope.toggleSidebars = function () {
    // Tell everyone both sidebars are closing
    $rootScope.$broadcast( 'sidebarsToggle' );
  };

  // Toggle just this sidebar
  $scope.toggleSidebar = function () {
    toggleSidebar();

    // Tell everyone the sidebar was toggled
    $rootScope.$broadcast( 'sidebarToggle' );
  };

  $scope.showSidebarPane = function ( index ) {
    var $container = $element.find( '.sidebar__panes__pane-container' );

    $container.css( 'left', '-' + ( index * sidebarWidth ) + 'px' );

    $scope.activePane = index;
  };

  /////////////////////////////////////////////////////////////////////////////
  // Events ///////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  $scope.$on( 'sidebarsToggle', function () {
    toggleSidebar();
  });

  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Open/close this sidebar.
   */
  function toggleSidebar () {
    $scope.closed = ! $scope.closed;

    // Update the sidebar status in the root scope
    $rootScope.sidebarStatus[ $attrs.side ] = $scope.closed;
  }

}]);

'use strict';

/**
 * Simple directive for emitting an event when repeat is finished
 */
App.directive( 'repeatDoneEvent', function () {
  return function( scope, element, attrs ) {
    if ( scope.$last ) {
      // At this point, ng-repeat is done populating - but we're not finished
      // yet because $compile still has to compile any tags in the repeat
      // directive
      scope.$evalAsync(function() {
        // NOW we're done
        scope.$emit( 'ngRepeatFinished', element );
      });
    }
  };
});
