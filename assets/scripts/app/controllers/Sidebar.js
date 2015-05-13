/**
 * Sidebar controller.
 */
App.controller( 'Sidebar', [ '$scope', '$element', function ( $scope, $element ) {
  $scope.toggleSidebar = function () {
    $scope.closed = ! $scope.closed;
  };
}]);
