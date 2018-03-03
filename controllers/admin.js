angular.module('workfit')
.controller('AdminController', AdminCtrl);

function AdminCtrl($scope, $location, QuestionsNew) {
  QuestionsNew.then(function(questions) {
    document.getElementById('spinner').style.display = 'none';
    questions.$bindTo($scope, "data");

    var urlParam = $location.search().tab;
    $scope.tabs = ['0meting', 'wekelijks', 'test', 'niveaus', 'perslkheid', 'faq', 'rest'];
    $scope.display = [false, false, false, false, false, false];
    if (urlParam !== undefined) $scope.display[urlParam] = true;
    else $scope.display[0] = true;

    $scope.isActiveTab = function(tab) {
      return tab == $scope.tabs[urlParam];
    }

    $scope.onClickTab = function(index) {
      $location.path('/admin').search({
        tab: index
      });
    }
  });
}
