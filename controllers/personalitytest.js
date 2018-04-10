angular.module('workfit')
.controller('PersonalityController', PersonalityCtrl);

function PersonalityCtrl($scope, $location, $routeParams, QuestionsNew, ResponsesPerUser, ResponseOptions, Store, Gebieden, Functions) {
  var storedResult = Store.getResults().resultgebied;
  var storedTestnr = Store.getResults().testnr;
  //console.log(storedResult, storedTestnr);

  // There are 3 different types of redirectTypes:
  // (1) 'flow' (when /personalitytest follows on uitval),
  // (2) 'results' (when /personalitytest is called from personalityresults to check if finished and get evaluate()),
  // (3) 'func'/'funcuser' (when /personalitytest is called from functioneringsresults (role == werknemer) to check if finished and get evaluate()),

  var redirectType = $routeParams.type !== undefined ? $routeParams.type : (storedResult == undefined ? 'results' : undefined);
  var nowString = Functions.setWfDate();
  // Set notification date for nulmeting reminder on days + 3 (in test 1)
  var datumRemString = Functions.setWfDate('notification', 3);
  $scope.questions = [];

  Promise.all([QuestionsNew, ResponsesPerUser]).then(function(data) {
    var questions = data[0].persoonlijkheidstest;
    var traitSpecs = data[0].profile.personality;
    var username = data[1].username;

    // Check if personality test is already finished
    data[1].responses.then(function(responses) {
      document.getElementById('spinner').style.display = 'none';
      // Get the personality test responses;
      var responses = responses.personality;
      var status = responses !== undefined ? responses.status : undefined;
      var isFinished = status == 'closed' ? true : false
      if (isFinished) evaluate(username, responses, traitSpecs, isFinished, redirectType); // In this case test questions can be skipped
      else {
        // Define start function first, because it is a $scope function
        $scope.startPersonality = function(type) {
          if (type == 'new') {
            firebase.database().ref().child('responses/' + username + '/personality/status').set('unfinished');
            firebase.database().ref().child('responses/' + username + '/personality/datum').set(nowString);
            firebase.database().ref().child('notifications/' + username + '/messageType').set('personalityreminder');
            firebase.database().ref().child('notifications/' + username + '/datum').set(datumRemString);
          }
          var index = type == 'new' ? 0 : count;
          //var notify = angular.element(document.getElementsByClassName("notify"));
          //notify.remove();
          $scope.questionsdisplay = true;
          $scope.questions[index].display = true;
        }

        // Firstly get the questions in the question scope
        for (var i = 0; i < questions.length; i++) {
          // Fill question object with key/values
          $scope.questions.push({
            q: questions[i].q,
            gebied: questions[i].gebied,
            pos: questions[i].pos,
            mixed: questions[i].mixed,
            display: false
          });
        }
        $scope.questionsLength = $scope.questions.length;
        // And display the right question. If new user first question is displayed
        if (responses == undefined) {
          if (redirectType == 'func' || redirectType.indexOf('funcuser') > -1) $scope.startfromflowdisplay = true;
          else $scope.startPersonality('new');
        } else {
          // Count which questions are already answered
          var count = 0;
          for (var qnr in responses) {
            if (qnr.length < 4) count = count + 1;  // excludes 'status', 'datum' and 'shared'
          }
          // Evaluate when all questions are answered. Else show first unanswered question
          if (count == $scope.questions.length) evaluate(username, responses, traitSpecs, isFinished, redirectType);
          else if (redirectType == 'flow') $scope.startPersonality('existing');
          else $scope.existingdisplay = true;
        }

        // Scopes for the response options. These can be managed in the ResponseOptions service
        $scope.posvalues = ResponseOptions.posvalues2p;
        $scope.negvalues = ResponseOptions.negvalues2p;

        // Write answers to Firebase
        $scope.checkedquestion = [];
        $scope.changedRP = function(valRP, gebied, nr, mixed) {
          const refRP = firebase.database().ref().child('responses/' + username + '/personality/' + nr);
          refRP.set({
            q: valRP,
            gebied: gebied,
            mixed: mixed
          });
          // Set display of next question
          $scope.questions[nr].display = false;
          if (nr < $scope.questions.length - 1) $scope.questions[nr + 1].display = true;
          // In case of last question, evaluate responses
          else {
            firebase.database().ref().child('responses/' + username + '/personality/status').set('closed');
            data[1].responses.then(function(responses) {
              evaluate(username, responses.personality, traitSpecs, isFinished, redirectType);
            });
          }
          // Set a checked mark when question is answered
          $scope.checkedquestion[nr] = true;
        };

        $scope.prevQuestion = function(nr) {
          $scope.questions[nr].display = false;
          $scope.questions[nr - 1].display = true;
        }
        $scope.nextQuestion = function(nr) {
          $scope.questions[nr].display = false;
          $scope.questions[nr + 1].display = true;
        }
      }
    });
  });

  function evaluate(username, responses, traits, isFinished, redirectType) {
    //console.log(traits);
    //console.log(responses);
    var isRedirect = redirectType == undefined ? false : true;
    if (!isFinished || isRedirect) {
      console.log('Case 1 personalitytest: Test is nog niet af (' + !isFinished + ') OF het is een redirect van results/advies (' + isRedirect + ').');
      var scores = Functions.getPersScores(responses, traits, 'pers');
      Store.setResults('personality', scores);
      if (redirectType == 'results') $location.path('/personalityresults');
      else if (redirectType == 'func') $location.path('/functioneringsresults/werknemer/');
      else if (redirectType.indexOf('funcuser') > -1) $location.path('/functioneringsresults/werknemer/' + username + '/' + redirectType.split('-')[1]);
      else $location.path('/verbetertrajecten/' + storedResult + '/' + storedTestnr);
      //else $location.path('/verbetertraject');
    } else {
      console.log('Case 2 personalitytest: Test is al gedaan en het is geen redirect van results/advies.')
      $scope.againdisplay = true;
    }
  }

  $scope.getResults = function() {
    $location.path('/personalityresults');
  }
}
