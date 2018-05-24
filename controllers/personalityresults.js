angular.module('workfit')
.controller('PersonalityResultsController', PersonalityResultsCtrl);

function PersonalityResultsCtrl($scope, $location, $routeParams, UserData, Store, Functions) {
  document.getElementById('spinner').style.display = 'none';

  // Role based: If demo user with expired account redirect
  UserData.then(function(data) {
    var access = Functions.getAccess('allButDemoExpired', data.type, data.datum);
    if(!access) {
      $scope.$apply(function() {$location.path('/pagina/geen-toegang/demo-user'); })
      return;
    }
  });

  var personality = Store.getResults().personality;
  if (personality == undefined) $location.path('/personalitytest/results');
  $scope.personality = personality;
}
