var config = {
  apiKey: "AIzaSyCPEHUsuIv1Ww2845q33QU_ohTu-MteDls",
  authDomain: "workfit-adde0.firebaseapp.com",
  databaseURL: "https://workfit-adde0.firebaseio.com",
  projectId: "workfit-adde0",
  storageBucket: "",
  messagingSenderId: "686177789160"
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

angular.module('workfit', ['ngRoute', 'ngTouch', 'ngAnimate', 'firebase', 'youtube-embed', 'angular-inview'])
.directive('wfMenu', wfMenu)
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
  .when("/weekly/:wid?", {
    templateUrl: "partials/weekly.htm",
    controller: ResponseCtrl
  })
  .when("/tests/:gebied?/:tid?", {
    templateUrl: "partials/tests.htm",
    controller: TestsCtrl
  })
  .when("/results/:gebied?/:tid?", {
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
  .when("/verbetertraject", {
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
  .when("/0test", {
    templateUrl: "partials/0test.htm",
    controller: TestCtrl
  })
  .otherwise({
    redirectTo: '/'
  });
})
.factory('QuestionsNew', getQuestionsNew)
.factory('ResponsesPerUser', getResponsesPerUser)
.factory('User', getUser);

function getQuestionsNew($firebaseObject, User) {
  return User.then(function(userObj) {
    // If user is logged in
    if (userObj !== null) {
      var refQ = firebase.database().ref().child('questions');
      return $firebaseObject(refQ).$loaded();
    } else return false;
  });
}

function getResponsesPerUser($firebaseObject, User) {
  return User.then(function(userObj) {
    // If user is logged in
    if (userObj !== null) {
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
      else ui.start('#firebaseui-auth-container', uiConfig);
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

function wfMenuCtrl($scope, User) {
  $scope.isShowingMenu = false;
  $scope.openMenu = openMenu;
  $scope.closeMenu = closeMenu;
  $scope.signOut = signOut;

  User.then(function(userObj) {
    if (userObj !== null) $scope.username = userObj.email;
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
