    angular.module('workfit')
        .controller('PersonalityResultsController', PersonalityResultsCtrl);

    function PersonalityResultsCtrl($scope, $location, $routeParams, Store) {
        document.getElementById('spinner').style.display = 'none';
        var personality = Store.getResults().personality;
        if (personality == undefined) $location.path('/personalitytest/results');
        $scope.personality = personality;
    }
