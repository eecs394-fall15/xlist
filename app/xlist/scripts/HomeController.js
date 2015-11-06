angular
  .module('xlist')
  .controller('HomeController',
      ['$scope', '$q', 'supersonic', 'Task', 'Store', 'deviceReady', 'slackbot',
       function($scope, $q, supersonic, Task, Store, deviceReady, slackbot) {
    $scope.tasks = [];

    var overrideLocation = null;

    // Haversine formula for getting distance in miles.
    var getDistance = function(p1, p2) {
      var R = 6378137; // Earth’s mean radius in meter
      var degToRad = Math.PI / 180; // Degree to radian conversion.
      var dLat = (p2.latitude - p1.latitude) * degToRad;
      var dLong = (p2.longitude - p1.longitude) * degToRad;
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(p1.latitude * degToRad) * Math.cos(p2.latitude * degToRad) *
          Math.sin(dLong / 2) * Math.sin(dLong / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c; // d = distance in meters
      return d; // Returns the distance in meters.
    };

    var makeCoords = function(latitude, longitude) {
      return {latitude: latitude, longitude: longitude};
    };

    var presetLocations = {
      'wholefoods': makeCoords(42.046858, -87.679596),
      'slivka': makeCoords(42.060487, -87.675712),
      'ford': makeCoords(42.056924, -87.676544),
      'tech': makeCoords(42.057488, -87.675817)
    };

    var waitUntil = {
      'wholefoods': 0,
      'slivka': 0,
      'ford': 0,
      'tech': 0
    };

    $scope.setLocation = function() {
      var presets = [];
      for (var preset in presetLocations) {
        presets.push(preset);
      }
      console.log(presets);
      supersonic.ui.dialog.confirm('Set Location', {
        message: 'Choose one of the following preset locations.',
        buttonLabels: presets
      }).then(function(buttonIndex) {
        overrideLocation = presetLocations[presets[buttonIndex]];
      });
    };

    var getLocation = function() {
      var deferred = $q.defer();
      if (overrideLocation) {
        deferred.resolve(overrideLocation);
      }
      supersonic.device.geolocation.getPosition().then(function(position) {
        var hardwareLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp
        };
        deferred.resolve(hardwareLocation);
      }, deferred.reject);
      return deferred.promise;
    };

    var THRESHOLD = 50;

    var findNear = function(location) {
      var slackbotNear = function(preset) {
        var now = new Date().getTime()
        if (now > waitUntil[preset]) {
          waitUntil[preset] = now + 1000 * 90
          slackbot(device.uuid + ' is near ' + preset);
        }
      };
      supersonic.logger.info(JSON.stringify(location));
      for (var preset in presetLocations) {
        var distance = getDistance(location, presetLocations[preset]);
        if (distance < THRESHOLD) {
          deviceReady().then(_.partial(slackbotNear, preset));
        }
      }
    };

    deviceReady().then(function() {
      cordova.plugins.backgroundMode.configure({
        silent: true
      });
      cordova.plugins.backgroundMode.enable();
      if (!cordova.plugins.backgroundMode.isEnabled()) {
        supersonic.ui.dialog.alert('Failed to enable background mode.');
      }
      window.setInterval(function() {
        getLocation().then(findNear);
      }, 5 * 1000);
    });

    var getTasks = function() {
      var queryTasks = new Parse.Query(Task);
      queryTasks.find({
        success: function(results) {
          $scope.$apply(function($scope) {
            for (var i = 0; i < results.length; i++) {
              $scope.tasks.push(results[i]);
            }
          });
        },
        error: function(error) {
          supersonic.ui.dialog.alert(
              'Error: ' + error.code + ' ' + error.message);
        }
      });
    };

    supersonic.ui.views.current.whenVisible(getTasks);
  }]);
