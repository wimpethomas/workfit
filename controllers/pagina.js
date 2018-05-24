angular.module('workfit').controller('PageController', PageCtrl);

function PageCtrl($scope, $routeParams) {
  document.getElementById('spinner').style.display = 'none';
  var pagina = $routeParams.title;
  var extraParam = $routeParams.param;

  if (pagina == 'notificaties') $scope.notifsettings = true;
  else if (pagina == 'geen-toegang') {
    $scope.noaccess = true;
    if (extraParam == 'demo-user') $scope.demouser = true;
    else if (extraParam == 'nocompany') $scope.nocompany = true;
    else if (extraParam == 'noadmin') $scope.noadmin = true;
    else if (extraParam == 'nosuperadmin') $scope.nosuperadmin = true;
    else $scope.default = true;
  }

}
