/**
 * Sidebar controller.
 */
App.controller( 'Sidebar', [ '$scope', '$rootScope', '$element', '$attrs', function ( $scope, $rootScope, $element, $attrs ) {
  // Keep track of the sidebar status in the root scope
  if ( typeof( $rootScope.sidebarStatus ) === 'undefined' ) {
    $rootScope.sidebarStatus = {};
  }

  $scope.toggleSidebar = function () {
    $scope.closed = ! $scope.closed;

    // Update the sidebar status in the root scope
    $rootScope.sidebarStatus[ $attrs.side ] = $scope.closed;

    // Tell everyone the sidebar was toggled
    $rootScope.$broadcast( 'sidebarToggle' );
  };
}]);
