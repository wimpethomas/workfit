var config = {
  apiKey: "AIzaSyD87-VF66Pqcdo1RiGesY7ReyNmOqrNrhQ",
  authDomain: "workfit-staging.firebaseapp.com",
  databaseURL: "https://workfit-staging.firebaseio.com",
  projectId: "workfit-staging",
  storageBucket: "workfit-staging.appspot.com",
  messagingSenderId: "239348273347"
};
firebase.initializeApp(config);

var uiConfig = {
  callbacks: {
    signInSuccess: function(currentUser, credential, redirectUrl) {
      return false;
    },
    uiShown: function() {
      document.getElementById('spinner').style.display = 'none';
    }
  },
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  signInSuccessUrl: '/',
  signInOptions: [
    //firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    {
      provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
      requireDisplayName: false
    }
  ],
  signInFlow: 'popup'
};
var ui = new firebaseui.auth.AuthUI(firebase.auth());
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

angular.module('workfit', ['ngRoute', 'ngTouch', 'ngAnimate', 'ngSanitize', 'firebase', 'youtube-embed', 'angular-inview', 'angularjs-dropdown-multiselect'])
.directive('wfMenu', wfMenu)
.directive('wfLogin', Login)
.config(function($routeProvider) {
  $routeProvider
  .when("/", {
    templateUrl: "partials/nulmeting.htm",
    controller: NullCtrl
  })
  .when("/nulmeting", {
    templateUrl: "partials/nulmeting.htm",
    controller: NullCtrl
  })
  .when("/profiel/:type?", {
    templateUrl: "partials/profile.htm",
    controller: ProfileCtrl
  })
  .when("/weekly/:test?", {
    templateUrl: "partials/weekly.htm",
    controller: ResponseCtrl
  })
  .when("/tests/:gebied?/:tid?", {
    templateUrl: "partials/tests.htm",
    controller: TestsCtrl
  })
  .when("/results/:gebied?/:tid?/:type?", {
    templateUrl: "partials/results.htm",
    controller: ResultsCtrl
  })
  .when("/personalitytest/:type?", {
    templateUrl: "partials/personalitytest.htm",
    controller: PersonalityCtrl
  })
  .when("/personalityresults", {
    templateUrl: "partials/personalityresults.htm",
    controller: PersonalityResultsCtrl
  })
  .when("/advies/:gebied?/:tid?", {
    templateUrl: "partials/advice.htm",
    controller: AdviceCtrl
  })
  .when("/verbetertraject/:fid?", {
    templateUrl: "partials/improvement.htm",
    controller: ImprovementCtrl
  })
  .when("/verbetertrajecten/:gebied?/:tid?/:mode?", {
    templateUrl: "partials/improvement-results.htm",
    controller: ImprovementResultsCtrl
  })
  .when("/faq", {
    templateUrl: "partials/faq.htm",
    controller: FaqCtrl
  })
  .when("/functioneringstest/:role?/:user?", {
    templateUrl: "partials/functioneringstest.htm",
    controller: FuncTestCtrl
  })
  .when("/functioneringsresults/:role?/:user?/:fid?", {
    templateUrl: "partials/functioneringsresults.htm",
    controller: FuncResultsCtrl
  })
  .when("/functioneringsafspraken/:role?/:mode?/:user?/:fid?", {
    templateUrl: "partials/functioneringsafspraken.htm",
    controller: FuncAfsprakenCtrl
  })
  .when("/functioneringsarchief/:role?/:user?", {
    templateUrl: "partials/functioneringsarchief.htm",
    controller: FuncArchiefCtrl
  })
  .when("/userdata", {
    templateUrl: "partials/userdata.htm",
    controller: UserCtrl
  })
  .when("/userlist", {
    templateUrl: "partials/userlist.htm",
    controller: UserListCtrl
  })
  .when("/admin", {
    templateUrl: "partials/admin.htm",
    controller: AdminCtrl
  })
  .when("/adminusers", {
    templateUrl: "partials/adminusers.htm",
    controller: AdminUsersCtrl
  })
  .when("/notifications-accept", {
    templateUrl: "partials/notifications-accepteren.htm",
    controller: NotifCtrl
  })
  .when("/0test", {
    templateUrl: "partials/0test.htm",
    controller: TestCtrl
  })
  .otherwise({
    redirectTo: '/'
  });
})
.factory('QuestionsNew', getQuestionsNew)
.factory('Customers', getCustomers)
.factory('UserData', getUserData)
.factory('ResponsesPerUser', getResponsesPerUser)
.factory('User', getUser)
.controller('ScreenController', ScreenCtrl);

function getQuestionsNew($firebaseObject, User) {
  return User.then(function(userObj) {
    // If user is logged in
    if (userObj !== null && userObj !== 'anonymous') {
      var refQ = firebase.database().ref().child('questions');
      return $firebaseObject(refQ).$loaded();
    } else return false;
  });
}

function getCustomers($firebaseObject, User) {
  return User.then(function(userObj) {
    // If user is logged in
    if (userObj !== null && userObj !== 'anonymous') {
      var email = userObj.email;
      var refK = firebase.database().ref().child('klanten');
      return {
        email: email,
        customers: $firebaseObject(refK).$loaded()
      };
    } else return false;
  });
}

function getUserData($firebaseObject, User) {
  return User.then(function(userObj) {
    // If user is logged in
    if (userObj !== null && userObj !== 'anonymous') {
      var email = userObj.email;
      var refR = firebase.database().ref('klanten').orderByChild("email").equalTo(email);
      return $firebaseObject(refR).$loaded();
    } else return false;
  }).then(function(userData) {
    var pushId = Object.keys(userData).pop();
    return userData[pushId];
  });
}

function getResponsesPerUser($firebaseObject, User) {
  return User.then(function(userObj) {
    // If user is logged in
    if (userObj !== null && userObj !== 'anonymous') {
      var username = userObj.email.replace('.', '_');
      username = username.replace('@', '_');
      var refR = firebase.database().ref().child('responses/' + username);
      return {
        username: username,
        email: userObj.email,
        responses: $firebaseObject(refR).$loaded()
      };
    } else return false;
  });
}

function getUser() {
  var userName = new Promise(function(resolve) {
    return firebase.auth().onAuthStateChanged(function(user) {
      // If user is logged in
      if (user) {
        resolve(user);
        analytics.user = user.email;
      }
      else {
        resolve('anonymous');
        document.getElementById('spinner').style.display = 'none';
      }
    });
  });
  return userName;
}

function wfMenu() {
  return {
    restrict: 'E',
    templateUrl: 'partials/menu.htm',
    controller: wfMenuCtrl
  };
}

function wfMenuCtrl($scope, UserData) {
  $scope.isShowingMenu = false;
  $scope.openMenu = openMenu;
  $scope.closeMenu = closeMenu;
  $scope.signOut = signOut;

  UserData.then(function(userObj) {
    if (userObj !== null) {
      $scope.username = userObj.email;
      $scope.bedrijf = userObj.bedrijf;
    }
    else $scope.username = 'Anoniem';
  })

  function openMenu() {
    $scope.isShowingMenu = true;
  }

  function closeMenu() {
    $scope.isShowingMenu = false;
  }

  function signOut() {
    firebase.auth().signOut();
    location.reload();
  }
}

function Login() {
  return {
    restrict: 'E',
    templateUrl: 'partials/login.htm',
    controller: LoginCtrl
  };
}

function LoginCtrl($scope, User) {
  User.then(function(data) {
    //console.log(data);
    if (data == 'anonymous') {
      $scope.logindisplay = true;
      document.getElementById('wrapper').style.display = 'none';
    }
    else document.getElementById('loginunit').remove();

    $scope.login = function() {
      firebase.auth().signInWithEmailAndPassword($scope.email, $scope.password).then(function(user) {
        console.log(user);
        firebase.auth.Auth.Persistence.LOCAL;
        location.reload();
      }).
      catch (function(error) {
        var errorCode = error.code;
        $scope.$apply(function() {
          if (errorCode == 'auth/invalid-email' || errorCode == 'auth/user-not-found') {
            $scope.pwerror = undefined;
            if (errorCode == 'auth/invalid-email') $scope.unerror = 'Vul een geldig email-adres in.';
            else if (errorCode == 'auth/user-not-found') $scope.unerror = 'E-mailadres bestaat niet als gebruiker bij WorkFit. Registreer je eerst.';
          } else if (errorCode == 'auth/wrong-password') {
            $scope.unerror = undefined;
            $scope.pwerror = 'Het opgegeven wachtwoord is ongeldig.';
          }
        });
      });
    }

    $scope.signup = function() {
      var usersToCheck = firebase.database().ref('klanten').orderByChild("email").equalTo($scope.email).once("value").then(function(snapshot) {
        return snapshot.val();
      }).then(function(registeredEmail) {
        // Email is posted by company admin, so user can register with this email adress
        if (registeredEmail !== null) {
          firebase.auth().createUserWithEmailAndPassword($scope.email, $scope.password).then(function(user) {
            console.log(user);
            firebase.auth.Auth.Persistence.LOCAL;
            location.reload();
          }).
          catch (function(error) {
            var errorCode = error.code;
            $scope.$apply(function() {
              if (errorCode == 'auth/invalid-email' || errorCode == 'auth/email-already-in-use') {
                $scope.pwrerror = undefined;
                if (errorCode == 'auth/invalid-email') $scope.unrerror = 'Het opgegeven e-mailadres is al in gebruik';
                else if (errorCode == 'auth/email-already-in-use') $scope.unrerror = 'Het opgegeven e-mailadres is al in gebruik';
              } else if (errorCode == 'auth/weak-password') {
                $scope.unrerror = undefined;
                $scope.pwrerror = 'Het opgegeven wachtwoord is te zwak. Kies een moelijker wachtwoord';
              }
            });
          });
        } else {
          $scope.$apply(function() {
            $scope.unrerror = 'Het e-mailadres is niet opgegeven door je bedrijf. Neem contact op met je H&R-medewerker.';
          });
        }
      });
    }

    $scope.reset = function() {
      firebase.auth().sendPasswordResetEmail($scope.email).then(function() {
        console.log('Mail sent');
        $scope.$apply(function() {
          $scope.resetdisplay = false;
          $scope.resetsentdisplay = true;
        });
      }).
      catch (function(error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode);
        console.log(errorMessage);
      });
    }
  });
}

function ScreenCtrl($scope, User) {
  var deviceType = navigator.userAgent; // Maybe for future use
  var isMobile = window.innerWidth < 680;

  //$scope.removeLS = function() {localStorage.removeItem("screenMessage");}

  User.then(function(data) {
    if (data !== 'anonymous' && !isMobile) {
      var dateNow = new Date();
      var msNow = dateNow.getTime();
      // Store when not already stored
      if (localStorage.getItem("screenMessage") == null) localStorage.setItem("screenMessage", JSON.stringify({"time": msNow, "displayed": 0}));
      var stored = JSON.parse(localStorage.getItem("screenMessage"));
      if (stored.displayed == 0 || (msNow - stored.time > 1000*60*60*24*30 && stored.displayed < 2)) {
        $scope.showmessage = true;
        $scope.message = "WorkFit is geoptimaliseerd voor gebruik op smartphones. Je kunt gewoon doorgaan op je huidige toestel, maar we raden je aan de app ook op een smartphone te proberen.";
        localStorage.setItem("screenMessage", JSON.stringify({"time": stored.time, "displayed": stored.displayed + 1}));
      }

      $scope.closeMessage = function() {
        $scope.showmessage = false;
      }
    }
  });
}
