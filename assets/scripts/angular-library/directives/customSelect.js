App.directive('customSelect', [function() {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var showFirstOption = (attrs.hideFirstOption === 'true') ? false : true;
      element.selectBoxIt({
        copyClasses: 'container',
        autoWidth: false,
        showFirstOption: showFirstOption
      });
    }
  };
}]);