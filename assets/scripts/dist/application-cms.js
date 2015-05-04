'use strict';

// Declare app level module which depends on filters, and services
var App = angular.module( 'App', [ 'ngSanitize', 'ngResource' ] );

// App-wide config

// General config
App.value( 'appConfig', {
  config_option: true
});


'use strict';

App.service( 'service', [ function () {
  // Do service things!
}]);

'use strict';

App.controller('Controller', ['$scope', '$element', function($scope, $element) {
  // Do controller things!
}]);

'use strict';

App.directive('directive', ['$', function($) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      // Do directive things!
    }
  };
}]);
