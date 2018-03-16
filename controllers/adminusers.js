angular.module('workfit').controller('AdminUsersController', AdminUsersCtrl);

function AdminUsersCtrl($scope, $location, UserData, Customers) {
  $scope.roledataSuperAdm = ["superadmin", "admin", "regular", "werknemer", "leidinggevende"];
  $scope.roledataAdm = ["werknemer", "leidinggevende"];
  $scope.rolesettings = {checkBoxes: true,
                         keyboardControls: true,
                         showCheckAll: false,
                         showUncheckAll: false,
                         smartButtonMaxItems: 3,
                         template: '{{option}}',
                         smartButtonTextConverter(skip, option) { return option; }
                        };
  $scope.lgsettings = {checkBoxes: true,
                       keyboardControls: true,
                       selectionLimit: 1,
                       showCheckAll: false,
                       showUncheckAll: false,
                       smartButtonMaxItems: 1,
                       template: '{{option}}',
                       smartButtonTextConverter(skip, option) { return option; }
                      };
  $scope.rolecustomTexts = {buttonDefaultText: 'Selecteer Rol(len)'};
  $scope.lgcustomTexts = {buttonDefaultText: 'Selecteer Leidinggevende'};



  Customers.then(function(data) {
    var email = data.email;
    data.customers.then(function(customers) {
      document.getElementById('spinner').style.display = 'none';
      firebase.database().ref('klanten').orderByChild("email").equalTo(email).on("child_added", function(snapshot) {
        var role = snapshot.val().type;
        role = role.indexOf('superadmin') > -1 ? 'superadmin' : (role.indexOf('admin') > -1 ? 'admin' : undefined);
        console.log(role);

        if (role == 'superadmin') {
          $scope.addusersdisplay = true;
          $scope.bedrijfdisplay = true;
        } else if (role == 'admin') {
          $scope.addusersdisplay = true;
          var bedrijf = snapshot.val().bedrijf;
        } else $location.path('/');
        console.log(bedrijf);

        //Manage users display
        function displayUsers(redirect) {
          if (redirect) $scope.userlist = true;
          $scope.manageusers = [];
          if (role == 'admin') {
            var fbref = firebase.database().ref('klanten').orderByChild("bedrijf").equalTo(bedrijf);
          } else if (role == 'superadmin') {
            var fbref = firebase.database().ref('klanten');
          }
          fbref.once("value", function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
              console.log(childSnapshot.val());
              var types = childSnapshot.val().type.join();
              var userObj = {email: childSnapshot.val().email,
                             bedrijf: childSnapshot.val().bedrijf,
                             type: types,
                             boss: childSnapshot.val().leidinggevende
                            };
              //console.log(userObj);
              $scope.manageusers.push(userObj);
            });
            if ($scope.manageusers.length > 0) $scope.userlist = true;
          });
        }
        displayUsers(false);

        // Add users
        $scope.users = [{
          email: '',
          bedrijf: bedrijf,
          type: [],
          leidinggevende: []
        }];
        // Get a list of leidinggevenden for dropdown
        $scope.leidingEmail = [];
        firebase.database().ref('klanten').orderByChild("bedrijf").equalTo(bedrijf).once("value", function(snapshot) {
          snapshot.forEach(function(childSnapshot) {
            console.log(childSnapshot.val());
            var leidinggevende = childSnapshot.val().email;
            var types = childSnapshot.val().type;
            if (types.indexOf('leidinggevende') > -1) $scope.leidingEmail.push(leidinggevende);
          });
        });
        console.log($scope.leidingEmail);

        $scope.addUser = function() {
          $scope.users.push({
            email: '',
            bedrijf: bedrijf,
            type: [],
            leidinggevende: []
          });
          if ($scope.users.length > 1) $scope.showbutton = true;
        }
        $scope.removeUser = function() {
          $scope.users.pop();
          if ($scope.users.length == 1) $scope.showbutton = false;
        };

        // submitUsers
        $scope.submitUsers = function() {
          for (var i = 0; i < $scope.users.length; i++) {
            if ($scope.users[i].leidinggevende.length > 0) $scope.users[i].leidinggevende = $scope.users[i].leidinggevende[0];
            firebase.database().ref().child('klanten').push().set($scope.users[i]);
          }
          displayUsers(true);
        }
        $scope.deleteUser = function(user) {
          firebase.database().ref('klanten').orderByChild("email").equalTo(user.email).once("value", function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
              firebase.database().ref('klanten/' + childSnapshot.key).remove();
            });
          });
          displayUsers(true);
        }
        $scope.submitMultipleUsers = function() {
          var commaSeparated = $scope.userlist.replace(/\n/g, ",").replace(/\s/g, "");
          var userArray = commaSeparated.split(",");
          console.log(userArray);
          for (var i = 0; i < userArray.length; i++) {
            if (userArray[i] !== '') {
              firebase.database().ref('klanten').orderByChild("email").equalTo(userArray[i]).once('value', function(snapshot) {
                if (snapshot.val() == null) {
                  var userObj = {
                    email: userArray[i],
                    bedrijf: bedrijf,
                    type: type
                  };
                  firebase.database().ref().child('klanten').push().set(userObj);
                } else {
                  alert('E-mailadres ' + userArray[i] + ' is al bekend bij WorkFit')
                }
              });
            }
          }
        }
      });
    });
  });

  $scope.isWerknemer = function(index) {
    var rollen = JSON.stringify($scope.users[index].type);
    var isEmp = false;
    if (rollen.indexOf('werknemer') !== -1) isEmp = true;
    return isEmp;
  }
}

/*
Customers.then(function(data) {
  var email = data.email;
  data.customers.then(function(customers) {
    firebase.database().ref('klanten').orderByChild("email").equalTo(email).on("child_added", function(snapshot) {
      var role = snapshot.val().type;
      console.log(role);

    });
  });
});


UserData.then(function(userData) {
  document.getElementById('spinner').style.display = 'none';
  var role = userData.type;
  console.log(role);

});
*/

