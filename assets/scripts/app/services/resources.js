/**
 * Service for loading all the stuff we'll need and caching it for use later.
 */
App.service( 'resources', [ '$rootScope', 'spotifyConfig', 'spotifyApi', 'spotifyUtility', 'CacheFactory', '$q', function ( $rootScope, spotifyConfig, spotifyApi, spotifyUtility, CacheFactory, $q ) {
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
