angular
  .module('xlist')
  .controller('LocationController',
      ['$scope', '$q', 'supersonic', 'Task', 'Store', 'deviceReady', 'slackbot',
       'push', 'ParseQuery', 'ParseObject', 'uiGmapGoogleMapApi',
  function($scope, $q, supersonic, Task, Store, deviceReady, slackbot, push, ParseQuery, ParseObject, uiGmapGoogleMapApi) {
   
    $scope.map = { center: { latitude: 42.0464, longitude: -87.6947 }, zoom: 12 };
    var events = {
      places_changed: function (searchBox) {}
    }
    $scope.searchbox = { template:'searchbox.tpl.html', events:events};

  }]);
