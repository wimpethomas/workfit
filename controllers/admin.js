angular.module('workfit')
.controller('AdminController', AdminCtrl);

function AdminCtrl($scope, $location, QuestionsNew, UserData, Functions) {

  Promise.all([QuestionsNew, UserData]).then(function(data) {
    // Role based: If demo user with expired account redirect
    var access = Functions.getAccess('workFitAdmin', data[1].type);
    if(!access) {
      $scope.$apply(function() {$location.path('/pagina/geen-toegang/nosuperadmin'); })
    }
    else {
      document.getElementById('spinner').style.display = 'none';
      data[0].$bindTo($scope, "data");

      var urlParam = $location.search().tab;
      $scope.tabs = ['0meting', 'wekelijks', 'test', 'niveaus', 'perslkheid', 'faq', 'rest', 'solutions'];
      $scope.display = [false, false, false, false, false, false];
      if (urlParam !== undefined) $scope.display[urlParam] = true;
      else $scope.display[0] = true;

      $scope.solutions = data[0].profile.ontwikkeling;
      $scope.changedS = function(val, gebied, onderdeel, trait, highlow) {
        firebase.database().ref().child('questions/profile/ontwikkeling/' + gebied + '/' + onderdeel + '/' + trait + '/' + highlow + '/solution').set(val);
      }
      $scope.changedSD = function(val, gebied, onderdeel, trait) {
        firebase.database().ref().child('questions/profile/ontwikkeling/' + gebied + '/' + onderdeel + '/' + trait + '/solution').set(val);
      }
      $scope.changedR = function(val, gebied, onderdeel, trait, highlow, index) {
        firebase.database().ref().child('questions/profile/ontwikkeling/' + gebied + '/' + onderdeel + '/' + trait + '/' + highlow + '/roadmap/' + index).set(val);
      }
      $scope.changedRD = function(val, gebied, onderdeel, trait, index) {
        firebase.database().ref().child('questions/profile/ontwikkeling/' + gebied + '/' + onderdeel + '/' + trait + '/roadmap/' + index).set(val);
      }

      $scope.isActiveTab = function(tab) {
        return tab == $scope.tabs[urlParam];
      }

      $scope.onClickTab = function(index) {
        $location.path('/admin').search({tab: index});
      }
    }
  });
}
