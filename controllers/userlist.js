    angular.module('workfit')
        .controller('UserListController', UserListCtrl);

    function UserListCtrl($scope, $firebaseObject, $timeout) {
        $scope.userList = [];
        const ref = firebase.database().ref().child('responses');
        ref.on("child_added", function(snapshot) {
            $timeout(function() {
                $scope.userList.push(snapshot.key);
            }, 0);
        });
        console.log($scope.userList);
    }
