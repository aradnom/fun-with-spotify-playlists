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
