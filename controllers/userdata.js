    angular.module('workfit')
        .controller('UserController', UserCtrl);

    function UserCtrl($scope, $firebaseObject, $timeout) {
        var user = decodeURIComponent(window.location.search.substring(1).split('=')[1]);
        $scope.user = user;
        $scope.userData = [];
        const refUW = firebase.database().ref().child('responses/' + user + '/weekly');
        refUW.on("child_added", function(snapshot) {
            $timeout(function() {
                $scope.userData.push(snapshot.val());
            }, 0);
        });
        $scope.testData = [];
        const refUT = firebase.database().ref().child('responses/' + user + '/test');
        refUT.on("child_added", function(snapshot) {
            $timeout(function() {
                $scope.testData.push(snapshot.val());
            }, 0);
        });
        console.log($scope.testData);
    }
