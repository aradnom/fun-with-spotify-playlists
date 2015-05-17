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
