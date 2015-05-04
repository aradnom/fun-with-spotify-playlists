'use strict';

App.directive('backgroundCoverImage', ['$', function($) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var imageLoaded = function() {
        if (element[0].complete) {
          return true;
        }

        if (typeof(element[0].naturalWidth) !== 'undefined' && element[0].naturalWidth > 0) {
          return true;
        }

        return false;
      };

      var backgroundImageChanged = function() {
        var source = element[0].currentSrc || element[0].src;
        scope.backgroundUrl = source;
        scope.$emit('backgroundImageChanged');
      };

      element.addClass('sr-only');

      if (imageLoaded()) {
        backgroundImageChanged();
      }

      element.on('load', function() {
        backgroundImageChanged();
      });
    }
  };
}]);

