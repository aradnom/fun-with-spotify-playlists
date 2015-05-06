'use strict';

// Declare app level module which depends on filters, and services
var App = angular.module('App', [ 'ngSanitize', 'ngResource', 'spotify', 'LocalStorageModule', 'ngCookies', 'debounce', 'angular-cache', 'ngDragDrop' ]);

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
App.service( 'resources', [ '$rootScope', 'spotifyConfig', 'spotifyApi', 'CacheFactory', '$q', function ( $rootScope, spotifyConfig, spotifyApi, CacheFactory, $q ) {
  // Top-level object for all resource types
  $rootScope.resources = {
    playlists: null
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
    if ( $rootScope.resources.playlists ) {
      $rootScope.$broadcast( 'resourcesReady' );
    }
  });

  // Force cache clear if necessary
  //cache.removeAll();

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

    // If data isn't set, refresh the cache
    if ( ! $rootScope.resources.playlists ) { refreshCache(); }
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
  }

  /**
   * Build playlist resources (playlists and tracks).
   */
  function buildPlaylists () {
    spotifyApi.getPlaylists()
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
                  // All done, cache everything and set resources
                  cache.put( 'playlists', playlists.items );

                  // And set resource
                  $rootScope.resources.playlists = playlists.items;
                }
              })
              .finally( function () {
                count++;
              });
          });
        }
      });
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


  /**
   * Retrieve user's playlists.
   * TODO: retrieve all playlists instead of just first page.
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

      Spotify.getPlaylistTracks( userConfig.username, playlistId )
        .then( function ( tracks ) {
          if ( tracks.total ) {
            // Throw tracks on the stack
            allTracks = allTracks.concat( tracks.items );

            if ( allTracks.length < tracks.total ) {
              // Set up requests to get the rest of the tracks if necessary
              var promises = [];

              for ( var i = tracks.limit; i < tracks.total; i += tracks.limit ) {
                promises.push( Spotify.getPlaylistTracks( userConfig.username, playlistId, { offset: i } ) );
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
    droppedTrack = track;

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
  };
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
App.controller( 'MasterPlaylist', [ '$scope', '$element', function ( $scope, $element ) {
  // Set up empty list of tracks
  $scope.tracks = [];

  $scope.$on( 'trackDropped', function ( $event, track ) {
    // Add the track to the active playlist
    $scope.tracks.push( track.track );
  });
}]);

/**
 * Controller for The Player.
 */
App.controller( 'Player', [ '$scope', '$rootScope', '$element', 'spotifyHelper', 'utility', '$interval', '$timeout', function ( $scope, $rootScope, $element, spotifyHelper, utility, $interval, $timeout ) {

  /////////////////////////////////////////////////////////////////////////////
  // Init /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // Assume we're not playing to start and that a track isn't loaded
  var currentTrack  = null;
  var progressTimer = null;
  $scope.playing    = false;

  /////////////////////////////////////////////////////////////////////////////
  // Events ///////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  // On request, play passed Spotify track object
  $rootScope.$on( 'playTrack', function ( $event, track ) {
    playTrack( track );
  });

  /////////////////////////////////////////////////////////////////////////////
  // Scope functions //////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  $scope.playPause = function () {
    if ( $scope.playing ) {
      stopPlayback();
    } else {
      if ( currentTrack ) {
        playTrack( currentTrack );
      }
    }
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
          console.log( response );
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
          currentTrack = track;
        } else {
          // Deal with player errors
          console.log( response );
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
    console.log( track, response );

    $scope.playing = true;

    startPlayerProgress( track );
  }

  /**
   * Update the player status to not playing.
   */
  function setPlayerStatusStopped () {
    // Turn of playing status
    $scope.playing = false;

    // Update player progress
    stopPlayerProgress();
  }

  /**
   * Clear all progress-related status "stuff."
   */
  function clearProgress () {
    var $progress = $element.find( '.player__progress__inner' );

    // Reset counters
    $scope.currentTime   = null;
    $scope.timeRemaining = null;

    // Reset styles - with regular jQuery because we actually need this to go
    // through right-the-hell-now, not when-digest-gets-around-to-it.
    $progress.css({
      'transition-duration': '0',
      '-moz-transition-duration': '0',
      '-webkit-transition-duration': '0',
      '-o-transition-duration': '0',
      '-ms-transition-duration': '0'
    });

    // This will kill a CSS transition mid-progress
    $progress.width( 0 ).hide().show( 0 );

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
    var $progress = $element.find( '.player__progress__inner' );

    // Clear progress before doing anything else
    clearProgress();

    // Set progress styles
    var duration = Math.round( track.duration_ms / 1000 );

    // Set progress styles
    $progress.css({
      'transition-duration': duration.toString() + 's',
      '-moz-transition-duration': duration.toString() + 's',
      '-webkit-transition-duration': duration.toString() + 's',
      '-o-transition-duration': duration.toString() + 's',
      '-ms-transition-duration': duration.toString() + 's'
    });

    // And set width
    $progress.width( '100%' );

    // Set up progress counting
    var progress         = 0;
    var timeRemaining    = duration;
    $scope.currentTime   = utility.getPlayingTimeString( progress );
    $scope.timeRemaining = '-' + utility.getPlayingTimeString( timeRemaining );

    // Start timer to update progress as track plays
    progressTimer = $interval( function () {
      if ( progress < duration ) {
        $scope.currentTime = utility.getPlayingTimeString( ++progress );
        $scope.timeRemaining = '-' + utility.getPlayingTimeString( --timeRemaining );

        // If we're a bit into playback, reverse display of Remaining timers
        if ( ( progress / duration ) > 0.3 ) {
          $scope.reverseRemaining = true;
        }
      }
    }, 1000 );
  }

  /**
   * Shut down player progress bar.
   */
  function stopPlayerProgress () {
    clearProgress();
  }
}]);

/**
 * Playlists controller.
 */
App.controller( 'Playlists', [ '$scope', '$rootScope', '$element', 'spotifyApi', 'resources', 'spotifyConfig', function ( $scope, $rootScope, $element, spotifyApi, resources, spotifyConfig ) {

  /////////////////////////////////////////////////////////////////////////////
  // Init /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  // Wait for resources to be loaded before going
  $scope.$on( 'resourcesReady', function () {
    displayPlaylists( resources.playlists );
  });


  /////////////////////////////////////////////////////////////////////////////
  // Scope functions //////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  $scope.showPlaylist = function ( $event, playlist ) {
    var $parent = $($event.currentTarget).parent();
    var $tracks = $parent.find( '.playlist__tracks' );

    if ( playlist.activeTracks ) {
      $tracks.velocity( 'slideUp', { duration: playlist.tracks.length * 50, easing: 'easeOutExpo', complete: function () {
        playlist.activeTracks = null;

        $scope.safeApply();
      }});
    } else if ( playlist.tracks && playlist.tracks.length ) {
      playlist.activeTracks = playlist.tracks;

      $scope.safeApply();

      var unsubscribe = $scope.$on( 'ngRepeatFinished', function () {
        $tracks.velocity( 'slideDown', { duration: playlist.tracks.length * 50, easing: 'easeOutExpo' });

        unsubscribe();
      });
    }
  };

  $scope.playTrack = function ( track ) {
    // Tell the player to play the track
    $rootScope.$broadcast( 'playTrack', track );
  };

  $scope.dragStart = function ( $event, ui, track ) {
    $rootScope.$broadcast( 'dragStart', track );
  };

  $scope.dragStop = function ( $event, ui, track ) {
    $rootScope.$broadcast( 'dragStop', track );
  };


  /////////////////////////////////////////////////////////////////////////////
  // Internal functions ///////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


  /**
   * Put together display playlist array
   *
   * @param  {Array} playlists Array of raw playlist results
   */
  function displayPlaylists ( playlists ) {
    var displayPlaylists = [];

    playlists.forEach( function ( playlist ) {
      displayPlaylists.push({
        id: playlist.id,
        image: playlist.images && playlist.images.length ? playlist.images[0].url : null,
        name: playlist.name,
        tracks: playlist.tracks
      });
    });

    // Turn the lights on
    $scope.playlists = displayPlaylists;
  }
}]);

/**
 * Search controller.  It controls the search.
 */
App.controller( 'Search', [ '$scope', '$element', 'spotifyApi', 'debounce', function ( $scope, $element, spotifyApi, debounce ) {
  $scope.search = {};

  $scope.runSearch = debounce( function () {
    if ( $scope.search.query ) {
      spotifyApi.search( $scope.search.query )
        .then( function ( results ) {
          console.log( results );
        })
    }
  }, 200 );
}]);

/**
 * Sidebar controller.
 */
App.controller( 'TrackSidebar', [ '$scope', '$element', 'Spotify', function ( $scope, $element, Spotify ) {

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
