App.directive( 'loadingFinished', [ '$rootScope', function ( $rootScope ) {
  return {
    restrict: 'A',
    link: function( $scope ) {
      var to;
      var listener = $scope.$watch( function() {
        clearTimeout( to );
        to = setTimeout( function () {
          listener();
          $rootScope.$broadcast( 'loadingFinished' );
        }, 50 );
      });
    }
  };
}]);
