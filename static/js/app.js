var user_id = null,
    cookie_parts = document.cookie.split(";")

for (var i = 0, _ref = cookie_parts.length; i < _ref; i += 1) {

  var cookie_pair = cookie_parts[i].split("=")
  if (cookie_pair[0] == "deleteitlater") {

    var value = decodeURIComponent(cookie_pair[1])
    user_id = JSON.parse(value.slice(value.indexOf("{"),value.indexOf("}")+1)).id

  }

} 


angular.module('delete-it-later', []).
  config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when('/landing', {templateUrl: '/partials/landing.html',   controller: LandingController}).
      when('/join', {templateUrl: '/partials/join.html',   controller: JoinController}).
      when('/_=_',{redirectTo: "/"}).
      when('/', {redirectTo: function() {
          return "/landing"
        }
      })
}]);
