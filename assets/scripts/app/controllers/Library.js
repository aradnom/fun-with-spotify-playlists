/**
 * Library controller.
 */
App.controller( 'Library', [ '$scope', '$rootScope', '$element', 'spotifyApi', 'resources', 'spotifyConfig', 'dragAndDrop', 'spotifyUtility', function ( $scope, $rootScope, $element, spotifyApi, resources, spotifyConfig, dragAndDrop, spotifyUtility ) {

  /////////////////////////////////////////////////////////////////////////////
  // Init /////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////


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

}]);
