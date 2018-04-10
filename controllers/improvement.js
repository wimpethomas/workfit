angular.module('workfit')
.controller('ImprovementController', ImprovementCtrl);

function ImprovementCtrl($scope, $location, $routeParams, ResponsesPerUser, Store, Examples, Gebieden, Functions) {
  var storedGebied = Store.getResults().resultgebied // Set in /results.
  var storedTestnr = Store.getResults().testnr; // Set in /tests (if coming from 'losse' test: storedAdvNr = null)
  var funcNr = $routeParams.fid; // If coming van functioneringstrajecten
  var nowString = Functions.setWfDate();

  // Define type
  if (storedGebied !== undefined && storedTestnr !== undefined) getData('known', storedGebied, storedTestnr);
  else if (funcNr !== undefined) getData('func', undefined, funcNr);
  else getData('unknown', undefined, undefined);

  function stepsPerRoadmap(roadmap) {
    // Returns (1) steps in roadmap and (2) last unfinished step
    var steps = [];
    for (var i = 0; i < roadmap.length; i++) {
      steps.push(roadmap[i].step);
      if (roadmap[i].datum_start !== undefined) var lastStepDone = i;
    }
    var roadmapDone = lastStepDone == roadmap.length - 1 ? true : false;
    return {
      steps: steps,
      laststepdone: lastStepDone,
      roadmapdone: roadmapDone
    };
  }

  function pendingTest(responses) {
    // Returns true if there is a unfinished or pending test - excluding a null-test (loss test)
    var gebiedenInDB = responses == undefined ? 0 : Object.keys(responses); // Array with testgebieden in db /test
    for (var i = 0; i < gebiedenInDB.length; i++) {
      var testObj = responses == undefined ? undefined : responses[gebiedenInDB[i]]; // Object on level /test/[gebied]
      for (test in testObj) {
        if ((testObj[test].status == 'unfinished' || testObj[test].status == 'pending') && test.indexOf('null') == -1) return true;
      }
    }
    return false;
  }

  function getData(type, gebied, adviesnr) {
    ResponsesPerUser.then(function(data) {
      var username = data.username;
      data.responses.then(function(responses) {
        var responsesAdv = responses.advies;
        var responsesTest = responses.test;
        var isPendingTest = pendingTest(responsesTest);
        var resultsObj = {};
        switch (type) {
          case 'known': // New verbetertraject
          case 'func': // In case of functionering
            var adviesStr = 'advies-' + adviesnr;
            if (type == 'func') gebied = 'functionering';
            else var results = responsesAdv == undefined || responsesAdv[gebied] == undefined ? undefined : responsesAdv[gebied][adviesStr];
            var isNewAdvies = results == undefined ? true : false;
            if (!isNewAdvies) $location.path('/verbetertrajecten/' + gebied + '/' + adviesnr);
            else {
              resultsObj[gebied] = {
                resultnr: adviesnr,
                results: {newadv: true},
                resultstr: adviesStr
              };
            }
            break;
          case 'unknown': // Notification reminder roadmap
            var lur = Functions.lastUnfinishedResult(responsesAdv);
            if (lur !== undefined) {
              resultsObj[lur.gebied] = {
                resultnr: lur.resultnr,
                results: lur.results,
                resultstr: lur.resultstr
              };
            } else {
              document.getElementById('spinner').style.display = 'none';
              $scope.noadvicedisplay = true;
              return;
            }
            break;
        }
        doSolution(resultsObj, username, type, isPendingTest);
      });
    });
  }

  function doSolution(resultsObj, username, type, isPendingTest) {
    var testlog = {
      advies: resultsObj,
      type: type
    };
    console.log(testlog);

    document.getElementById('spinner').style.display = 'none';
    // Initial setup depending on type
    var gebied = Object.keys(resultsObj)[0];
    $scope.gebied = Gebieden.gebiedsnamen[gebied];
    console.log(gebied);

    var advStr = resultsObj[gebied] == undefined ? undefined : resultsObj[gebied].resultstr;
    if (resultsObj[gebied] !== undefined) {
      var hasRoadmap = resultsObj[gebied].results.roadmap !== undefined ? true : false;
      var roadmap = hasRoadmap ? stepsPerRoadmap(resultsObj[gebied].results.roadmap) : {};
      var steps = hasRoadmap ? roadmap.steps : [];
      var lastStepDone = roadmap.laststepdone;
      var roadmapDone = roadmap.roadmapdone;
    }
    else $scope.noadvicedisplay = true;
    switch (type) {
      case 'known':
      case 'func':
        $scope.solutioneditdisplay = true; // Display: Submit new solution
        $scope.solutionsentence = Examples.getSolutionSentence(gebied);
        if (type == 'func') $scope.hideexampledisplay = true; // Hide example buttons in case of functraject
        $scope.stepNext = 1;
        break;
      case 'unknown':
        if (lastStepDone !== undefined) {
          $scope.stepDone = lastStepDone + 1;
          $scope.stepTxt = steps[lastStepDone];
          $scope.reminderdonedisplay = true; // Display: Step x done? -> Set reminder next step
        } else {
          $scope.stepNext = 1;
          $scope.setreminderdisplay = true; // Display: Set reminder step 1
        }
        break;
    }

    // Show examples
    $scope.showExample = function(bin) {
      var niveaus = Store.getResults().niveaus[gebied];
      var onderdeelObj = {
        score: 1
      };
      for (var onderdeel in niveaus) {
        var score = niveaus[onderdeel].score;
        var maxscore = niveaus[onderdeel].maxscore;
        if (score / maxscore < onderdeelObj.score) onderdeelObj = {
          naam: onderdeel,
          score: score / maxscore
        };
      }
      $scope.exampledisplay = bin;
      $scope.example = Examples.getByGebied(gebied, onderdeelObj.naam);
      if ($scope.example.alias !== undefined) $scope.example = Examples.getByGebied(gebied, $scope.example.alias);
    }

    // Solution submit
    $scope.submitSolution = function() {
      $scope.solutioneditdisplay = false;
      $scope.roadmapdisplay = true;
      firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr).set({
        solution: $scope.solution,
        datum_start: nowString,
        status: 'unfinished'
      });
    }

    // Roadmap setup and submit
    $scope.roadmap = [{step: '', feedback: ''}];
    $scope.addStep = function() {
      $scope.roadmap.push({step: '', feedback: ''});
      if ($scope.roadmap.length > 1) $scope.showbutton = true;
    }
    $scope.removeStep = function() {
      $scope.roadmap.pop();
      if ($scope.roadmap.length == 1) $scope.showbutton = false;
    };
    $scope.submitRoadmap = function() {
      var testStr = advStr.replace("advies", "test");
      $scope.roadmapdisplay = false;
      firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap').set($scope.roadmap);
      if (advStr !== 'advies-null') $scope.setreminderdisplay = true;
      else {
        $scope.roadmapnulldisplay = true;
        firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/status').set('closed');
        firebase.database().ref().child('responses/' + username + '/test/' + gebied + '/' + testStr + '/status').set('closed');
      }
    }

    // Reminder and feedback (step) submits (only for uitval, not losse tests)
    $scope.reminderDone = function(step, type) {
      $scope.reminderdonedisplay = false;
      if (type == 'n') {
        $scope.setreminderdisplay = true;
        $scope.extra = 'extra';
      } else $scope.givefeedbackdisplay = true;
      $scope.stepNext = step;
      $scope.stepNTxt = steps[step - 1];
      $scope.type = type;
      if (type == 'y') firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap/' + (step - 2) + '/datum_end').set(nowString);
    }
    $scope.submitFeedback = function(type, step) {
      if (type == 'submit') firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap/' + (step - 1) + '/feedback').set($scope.feedback);
      $scope.givefeedbackdisplay = false;
      if (!roadmapDone) $scope.setreminderdisplay = true;
      else finishRoadmap();
    }

    $scope.setReminder = function(step, type, skipped) {
      //console.log(step, type, steps);
      if (type == 'y' || step == 1 || skipped) firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap/' + (step - 1) + '/datum_start').set(nowString);
      if (!skipped){
        // Set notification date for nulmeting reminder on days + given number of days
        var datumRem = Functions.setWfDate('notification', parseInt($scope.notification));
        firebase.database().ref().child('notifications/' + username + '/messageType').set('roadmap');
        firebase.database().ref().child('notifications/' + username + '/datum').set(datumRem);
        $scope.setreminderdisplay = false;
        $scope.roadmapsentdisplay = true;
      }
      else {
        firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap/' + (step - 1) + '/datum_end').set(nowString);
        if (step >= steps.length) {
          $scope.setreminderdisplay = false;
          finishRoadmap();
        }
        else {
          $scope.stepNext = step + 1;
          $scope.stepNTxt = steps[step];
          // Get animation effect via css
          $scope.fadeOutIn = true;
        }
      }
      // Reset animation class
      setTimeout(function() {
        $scope.fadeOutIn = false;
      }, 1000);
    }

    function finishRoadmap() {
      var testStr = advStr.replace("advies", "test");
      // Set notification again on weekly or pending test after closing advice. Notification after 7 days (3 in test)
      var notification = isPendingTest ? 'testreminder' : 'weekly';
      var datumRem = Functions.setWfDate('notification', 3);
      firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/status').set('closed');
      firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/datum_end').set(nowString);
      firebase.database().ref().child('responses/' + username + '/test/' + gebied + '/' + testStr + '/status').set('closed');
      firebase.database().ref().child('notifications/' + username + '/messageType').set(notification);
      firebase.database().ref().child('notifications/' + username + '/datum').set(datumRem);
      $scope.roadmapdonedisplay = true;
    }

  }

  $scope.getTrajecten = function() {
    $location.path('/verbetertrajecten');
  }

  function valToKey(val, obj) {
    for (var key in obj) {
      if (obj[key] == val) return key;
    }
    return false;
  }
}
