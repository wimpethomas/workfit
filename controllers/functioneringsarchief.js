angular.module('workfit')
.controller('FuncArchiefController', FuncArchiefCtrl);

function FuncArchiefCtrl($scope, $location, $routeParams, Store, Functions) {
  var funcResults = Store.getResults().funcresults;
  var funcData = Store.getResults().funcdata;
  var role = $routeParams.role;
  $scope.user = funcResults !== undefined ? funcResults.user : $routeParams.user;
  document.getElementById('spinner').style.display = 'none';
  $scope.nav = 'archive';
  $scope.navlinksdisplay = true;

  var responsesFunc = Functions.getResponsesPerFuncUser($scope.user, 'functionering');
  var responsesAdv = Functions.getResponsesPerFuncUser($scope.user, 'advies');
  Promise.all([responsesFunc.data, responsesAdv.data]).then(function(data) {
    $scope.$apply(function(){
      $scope.trajecten = {};
      var trajecten = data[0].val();
      for (traject in trajecten) {
        if (trajecten[traject].status == 'closed') {
          trajecten[traject].datum = trajecten[traject].datum.split('T')[0];
          $scope.trajecten[traject] = trajecten[traject];
        }
      }
      var adviezen = data[1].val();
      var adviezenFunc = adviezen == undefined ? undefined : adviezen.functionering;
      if (adviezenFunc !== undefined) $scope.ontwikkelingdisplay = true;
    });
  });

  $scope.getResults = function(user, funcnr) {
    $location.path('/functioneringsresults/' + role + '/' + user + '/' + funcnr);
  }

  $scope.getAgreements = function(user, funcnr) {
    $location.path('/functioneringsafspraken/' + role + '/view/' + user + '/' + funcnr);
  }

  $scope.ontwikkelingsArchief = function() {
    $location.path('/verbetertrajecten/functionering');
  }

  $scope.menuNav = function(tab, role, werknemer){
    var role = $routeParams.role !== undefined ? $routeParams.role : funcData.role;
    var werknemer = $routeParams.user !== undefined ? $routeParams.user : funcData.werknemer;
    var fid = $routeParams.fid !== undefined ? $routeParams.fid : (funcData !== undefined ? funcData.trajectnr : '');
    if (tab == 'home') $location.path('functioneringstest');
    else if (tab == 'results') $location.path('functioneringsresults/' + role + '/' + werknemer + '/' + fid);
    else if (tab == 'agreements') $location.path('functioneringsafspraken/' + role + '/view/' + werknemer + '/' + fid);
  }
}
