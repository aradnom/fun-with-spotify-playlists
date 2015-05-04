'use strict';

App.service('throttle', ['$timeout', function ($timeout) {
  // Throttle function from underscores
  var throttle = function(func, wait, options) {

    // Now function from underscores
    var getCurrentTime = Date.now || function() {
      return new Date().getTime();
    };

    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};

    var later = function() {
      previous = options.leading === false ? 0 : getCurrentTime();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = getCurrentTime();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          $timeout.cancel(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = $timeout(later, remaining);
      }
      return result;
    };
  };

  return throttle;
}]);
