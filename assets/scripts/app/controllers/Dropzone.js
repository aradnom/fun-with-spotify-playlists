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
