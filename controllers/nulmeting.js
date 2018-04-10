angular.module('workfit')
.controller('NullController', NullCtrl);

function NullCtrl($scope, $location, $firebaseObject, QuestionsNew, ResponsesPerUser, UserData, ResponseOptions, Store, AllowNotifications, Gebieden, Functions) {
  $scope.questions = [];
  var now = new Date();
  var nowString = Functions.setWfDate();
  // Set notification date for nulmeting reminder on days + 3 (in test 1) and weekly updates on days +7 (in test 3)
  var datumRemString = Functions.setWfDate('notification', 3);
  var datumWeekString = Functions.setWfDate('notification', 7);

  Promise.all([QuestionsNew, ResponsesPerUser]).then(function(data) {
    // First load questions and - if they are there - responses
    var questions = data[0].nulmeting;
    // The ResponsesPerUser is a promise with an object that contains userName and a second level promise (responses)
    var username = data[1].username;
    var email = data[1].email;
    Store.setResults('username', username);
    // Check on notifications: allow/block and set in database
    var notifyAllowed = AllowNotifications.notify(username, email);
    console.log(notifyAllowed);

    data[1].responses.then(function(responses) {
      document.getElementById('spinner').style.display = 'none';
      var responsesNul = responses.nulmeting;
      var status = responsesNul !== undefined ? responsesNul.status : undefined;
      var isStarter = status == 'closed' ? false : true;
      if (!isStarter) evaluate(undefined, undefined, isStarter);
      else {
        // Firstly get the questions in the question scope
        var j = 0;
        for (var nulGebied in questions) {
          for (var i = 0; i < questions[nulGebied].length; i++) {
            // Fill question object with key/values
            $scope.questions.push({
              q: questions[nulGebied][i].q,
              pos: questions[nulGebied][i].pos,
              ro: questions[nulGebied][i].ro,
              display: false,
              gebied: nulGebied
            });
          }
          j = j + 1;
        };
        $scope.questionsLength = $scope.questions.length;

        // And display the right question. If new user first question is displayed
        if (responsesNul == null) $scope.welcomedisplay = true;
        else {
          // Count which questions are already answered
          var count = 0;
          for (var gebied in responsesNul) {
            if (Gebieden.gebieden.indexOf(gebied) !== -1) { // It has to be a gebied, not status or datum
              for (var response in responsesNul[gebied]) {
                count = count + 1;
              }
            }
          }
          // Evaluate when all questions are answered. Else show first unanswered question
          if (count == $scope.questions.length) evaluate(username, responsesNul, isStarter);
          else $scope.existingdisplay = true;
        }

        $scope.startNulmeting = function(type) {
          if (type == 'new') {
            firebase.database().ref().child('responses/' + username + '/nulmeting/status').set('unfinished');
            firebase.database().ref().child('responses/' + username + '/nulmeting/datum').set(nowString);
          }
          var index = type == 'new' ? 0 : count;
          $scope.welcomedisplay = false;
          $scope.existingdisplay = false;
          $scope.questionsdisplay = true;
          $scope.questions[index].display = true;

          // Start nulmeting so set notifications on nulmeting reminder and set notification date if date is not already set
          firebase.database().ref().child('notifications/' + username).once('value').then(function(snapshot) {
            // If datum in notifications is already set, then don't update the datum because it's not a 'fresh' nulmeting
            if (snapshot.hasChild('datum')) return false;
            else return true;
          }).then(function(hasDatum) {
            if (hasDatum) {
              firebase.database().ref().child('notifications/' + username + '/messageType').set('nulmetingreminder');
              firebase.database().ref().child('notifications/' + username + '/datum').set(datumRemString);
            }
          });
        }

        // Scopes for the response options. These can be managed in the ResponseOptions service
        $scope.posvalues = ResponseOptions.posvalues;
        $scope.negvalues = ResponseOptions.negvalues;

        // Write answers to Firebase
        $scope.checkedquestion = [];
        $scope.changedRN = function(valRN, gebied, nr) {
          firebase.database().ref().child('responses/' + username + '/nulmeting/' + gebied + '/question-' + nr).set(valRN);
          // Set display of next question
          $scope.questions[nr].display = false;
          if (nr < $scope.questions.length - 1) $scope.questions[nr + 1].display = true;
          // In case of last question, evaluate responses
          else {
            firebase.database().ref().child('responses/' + username + '/nulmeting/status').set('closed');
            data[1].responses.then(function(responses) {
              evaluate(username, responses.nulmeting, isStarter);
            });
          }
          // Set a checked mark when question is answered
          $scope.checkedquestion[nr] = true;
        }

        $scope.prevQuestion = function(nr) {
          $scope.questions[nr].display = false;
          $scope.questions[nr - 1].display = true;
        }
        $scope.nextQuestion = function(nr) {
          $scope.questions[nr].display = false;
          $scope.questions[nr + 1].display = true;
        }
      }

      // Check if bell icon must be set in case of tiles display
      // Weekly check
      var weekly = responses.weekly;
      if (weekly !== undefined) {
        var nrOfWeeks = Object.keys(weekly).length;
        var weekStr = 'week-' + nrOfWeeks;
        var dateLastW = weekly[weekStr].datum;
        var datumL = Date.parse(dateLastW);
        var timeDiff = Math.abs(now.getTime() - datumL);
        var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (diffDays > 6) $scope.weeklynot = true;
      }
      else $scope.weeklynot = true;

      // Ontwikkeltraject
      var ontwikkel = responses.advies;
      if (ontwikkel !== undefined) {
        var lastOntwikkel = Functions.lastUnfinishedResult(ontwikkel);
        if (lastOntwikkel !== undefined) $scope.ontwikkelnot = true;
      }

      // Functionering
      UserData.then(function(userdata){
        var roles = userdata.type;
        if (roles.indexOf('werknemer') > -1 || roles.indexOf('leidinggevende') > -1) {
          $scope.$apply(function(){
            $scope.functile = true;
            var functionering = responses.functionering;
            if (functionering !== undefined) {
              var nrOfTrajects = Object.keys(functionering).length;
              var trajectStr = 'traject-' + nrOfTrajects;
              var isActive = functionering[trajectStr].status == 'active' ? true : false;
              if (isActive) $scope.funcnot = true;
            }
          })
        }
      })
    });
  });

  $scope.getPath = function(path, type, link) {
    type = type ? type : '';
    if (link) $location.path('/' + path + '/' + type);
  }

  function evaluate(username, responses, isStarter) {
    if (isStarter) {
      var treshold = 0.4;
      var valueRange = ResponseOptions.posvalues.length - 1;
      var maxScores = {};
      for (var i = 0; i < Gebieden.gebieden.length; i++) {
        maxScores[Gebieden.gebieden[i]] = valueRange * 3;
      }
      // Get gebieden with total scores in results array
      var results = [];
      for (var gebied in responses) {
        var values = Object.values(responses[gebied]);
        var sum = values.reduce(function(a, b) {
          return parseInt(a) + parseInt(b);
        }, 0);
        if (sum > -1) {
          results.push({
            gebied: gebied,
            totaalScore: sum
          });
        }
      }
      // Sort gebieden on lowest scores
      results.sort(function(a, b) {
        return a.totaalScore - b.totaalScore;
      });
      // Store results if gebied is below treshold
      var store = [];
      for (var r = 0; r < results.length; r++) {
        var gebied = results[r].gebied;
        var score = results[r].totaalScore;
        for (var maxGebied in maxScores) {
          if (maxGebied == gebied) {
            var maxScore = maxScores[gebied];
            if (score < treshold * maxScore) store.push(gebied);
            break;
          }
        }
      }
      // And finally sort stored gebieden on preferred gebieden (competentie, sociale steun, werkdruk, zelfstandigheid)
      var prefGebieden = [];
      for (var i = store.length - 1; i >= 0; --i) {
        if (store[i] == 'competentie' || store[i] == 'sociale_steun' || store[i] == 'werkdruk' || store[i] == 'zelfstandigheid') prefGebieden.push(store[i]);
      }
      for (var j = 0; j < prefGebieden.length; j++) {
        store.sort(function(a, b) {
          return a == prefGebieden[j] ? -1 : b == prefGebieden[j] ? 1 : 0;
        });
      }

      // Update notification settings to weekly
      firebase.database().ref().child('notifications/' + username + '/messageType').set('weekly');
      firebase.database().ref().child('notifications/' + username + '/datum').set(datumWeekString);
      if (store.length == 0) {
        // Show good message :-)
        $scope.questionsdisplay = false;
        $scope.resultdisplay = true;
      } else {
        Store.setResults('testgebieden', store);
        // Redirect to test page
        $location.path('/tests');
      }
    }
    else $scope.againdisplay = true;
  }
}
