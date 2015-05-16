/**
 * Sidebar controller.
 */
App.controller( 'Sidebar', [ '$scope', '$rootScope', '$element', '$attrs', function ( $scope, $rootScope, $element, $attrs ) {
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
