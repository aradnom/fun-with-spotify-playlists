App.service('siteWidth', ['$window', function($window) {
  var siteWidth = {
    get: function() {
      // Since iOS decides to not do window we have to do this
      var siteWidth = ($window.outerWidth === 0) ? screen.width : $window.outerWidth;
      return siteWidth;
    }
  };
  return siteWidth;
}]);