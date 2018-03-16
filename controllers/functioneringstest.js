angular.module('workfit')
.controller('FuncTestController', FuncTestCtrl);

function FuncTestCtrl($scope, $location, $routeParams, QuestionsNew, ResponsesPerUser, ResponseOptions, UserData, Customers, Store, Gebieden, Functions) {
  var urlRole = $routeParams.role;
  $scope.questions = [];
  var nowString = Functions.setWfDate();

  // Dropdown settings
  $scope.slaveddmodel = [];
  $scope.slaveddsettings = {checkBoxes: true,
                            keyboardControls: true,
                            selectionLimit: 1,
                            showCheckAll: false,
                            showUncheckAll: false,
                            smartButtonMaxItems: 1,
                            template: '{{option}}',
                            smartButtonTextConverter(skip, option) { return option; }
                           };
  $scope.slaveddcustomTexts = {buttonDefaultText: 'Selecteer Werknemer'};

  Promise.all([ResponsesPerUser, UserData, QuestionsNew]).then(function(data) {
    var role = data[1].type;
    if (urlRole !== undefined) var roleCat = urlRole;
    else if (role.indexOf('leidinggevende') > -1 && role.indexOf('werknemer') > -1) var roleCat = 'both';
    else if (role.indexOf('leidinggevende') > -1) var roleCat = 'leidinggevende';
    else if (role.indexOf('werknemer') > -1) var roleCat = 'werknemer';
    else var roleCat = 'none';
    $scope.role = roleCat;

    data[0].responses.then(function(responses) {
      document.getElementById('spinner').style.display = 'none';
      switch (roleCat) {
        case 'both':
          $scope.chooseroledisplay = true;
          break;
        case 'none':
          $scope.norightsdisplay = true;
          break;
        case 'leidinggevende':
          $scope.bossstartdisplay = true;
          $scope.bossfinisheddisplay = false;
          // Choose werknemer form dropdown
          $scope.slavedddata = [];
          firebase.database().ref('klanten').orderByChild("leidinggevende").equalTo(data[1].email).once("value", function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
              var werknemer = childSnapshot.val().email;
              $scope.slavedddata.push(werknemer);
            });
          })
          // When werknemer is selected do follow up
          $scope.slaveddevent = {
            onItemDeselect: function(item){
              $scope.slaveselected = false;
            },
            onItemSelect: function(slaveEmail){
              $scope.activetrajectdisplay = false;
              $scope.viewagreementsdisplay = false;
              // Get the status of last test by calling werknemer in DB
              var responsesPromise = Functions.getResponsesPerFuncUser(slaveEmail, 'functionering');
              var werknemer = responsesPromise.username;
              responsesPromise.data.then(function(snapshot) {
                var responsesSlave = snapshot.val();
                console.log(responsesSlave);
                if (responsesSlave !== undefined && responsesSlave !== null){
                  var funcData = Functions.getFuncTrajects(responsesSlave);
                  var type = funcData.status == 'active' ? 'existing' : 'new';
                  if (funcData.funcnr == 1 && type == 'existing') $scope.noarchivedisplay = true;
                  var results = {user: werknemer, traject: 'traject-' + funcData.funcnr};
                  Store.setResults('funcresults', results);                }
                else {
                  var type = 'new';
                  $scope.noarchivedisplay = true;
                }
                if (type == 'existing') {
                  $scope.activetrajectdisplay = true;
                  if (funcData.statusBossTest == 'closed') {
                    $scope.bossfinisheddisplay = true;
                    if (funcData.statusAgreements !== undefined) {
                      $scope.viewagreementsdisplay = true;
                      if (funcData.statusAgreements == 'disapproved') $scope.disapproveddisplay = true;
                      else if (funcData.statusAgreements == 'repending') $scope.rependeddisplay = true;
                      else if (funcData.statusAgreements == 'approved') $scope.ontwikkelingsdisplay = true;
                    }
                  }
                }
                $scope.$apply(function(){
                  $scope.slaveselected = true;
                });
                $scope.startTest = function(){
                  doTest(type, 'leidinggevende', funcData.funcnr, werknemer, responsesSlave);
                }
              })

            }
          };

          // 5) Bekijk ontwikkelingstraject dat door werknemer is opgesteld --> Naar ontwikkelingstraject
          break;
        case 'werknemer':
          $scope.slavestartdisplay = true;
          $scope.slavestarteddisplay = false;
          $scope.slavefinisheddisplay = false;
          $scope.activetrajectdisplay = false;
          $scope.viewagreementsdisplay = false;
          var statusTest = responses == undefined ? undefined : Functions.getFuncTrajects(responses.functionering).statusSlaveTest;
          var werknemer = data[0].username;
          if (status !== 'undefined'){
            var funcData = Functions.getFuncTrajects(responses.functionering);
            var type = funcData.status == 'active' && statusTest !== 'pending' ? 'existing' : 'new';
            if (funcData.funcnr == 1 && type == 'existing') $scope.noarchivedisplay = true;
            var results = {user: werknemer, traject: 'traject-' + funcData.funcnr};
            Store.setResults('funcresults', results);
          }
          else {
            var type = 'new';
            $scope.noarchivedisplay = true;
          }
          if (funcData.status == 'active') {
            $scope.activetrajectdisplay = true;
            if (statusTest !== 'pending') {
              $scope.slavestarteddisplay = true;
              if (statusTest == 'closed') {
                $scope.slavefinisheddisplay = true;
                if (funcData.statusAgreements !== undefined) {
                  $scope.viewagreementsdisplay = true;
                  if (funcData.statusAgreements == 'repending') $scope.rependeddisplay = true;
                  else if (funcData.statusAgreements == 'disapproved') $scope.disapproveddisplay = true;
                  else if (funcData.statusAgreements == 'approved') $scope.ontwikkelingsdisplay = true;
                }
              }
            }
          }
          $scope.startTest = function(){
            doTest(type, 'werknemer', funcData.funcnr, werknemer, responses.functionering);
          }
          $scope.startOntwikkeling = function() {
            firebase.database().ref().child('responses/' + werknemer + '/functionering/traject-' + funcData.funcnr + '/status').set('closed');
            $location.path('/verbetertraject/' + funcData.funcnr);
            // TODO: NOTIFICATIE BIJ HET CLOSEN VAN FUNCTIONERINGSTRAJECT
          }
          break;
      }

      // Close a functioneringstraject
      $scope.closeTraject = function() {
        firebase.database().ref().child('responses/' + werknemer + '/functionering/traject-' + funcData.funcnr + '/status').set('closed');
        $scope.activetrajectdisplay = false;
        // TODO: NOTIFICATIE BIJ HET CLOSEN VAN FUNCTIONERINGSTRAJECT
      }
    });

    function doTest(type, role, trajectnr, werknemer, responsesObj) {
      console.log(type, role, trajectnr, werknemer, responsesObj);
      var questions = data[2].functionering;
      trajectnr = trajectnr == null ? 1 : (type == 'new' && role == 'leidinggevende' ? trajectnr + 1 : trajectnr);
      var trajectStr = 'traject-' + trajectnr;
      if (type == 'existing') var responses = responsesObj == undefined ? undefined : responsesObj[trajectStr].test[role];

      console.log(type, role, trajectStr, werknemer, responses);
      $scope.bossstartdisplay = false;
      $scope.slavestartdisplay = false;

      // Firstly get the questions in the question scope
      var j = 0;
      for (var onderdeel in questions) {
        for (var i = 0; i < questions[onderdeel][role].length; i++) {
          // Fill question object with key/values
          $scope.questions.push({
            q: questions[onderdeel][role][i].q,
            pos: questions[onderdeel][role][i].pos,
            ro: questions[onderdeel][role][i].ro,
            display: false,
            onderdeel: onderdeel
          });
        }
        j = j + 1;
      };
      $scope.questionsLength = $scope.questions.length;

      // Set traject in database in case of new traject
      if (type == 'new') {
        // Make new traject with date and status
        firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/datum').set(nowString);
        firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/status').set('active');
        // Make new test(s) depending on role
        firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/test/' + role + '/status').set('unfinished');
        firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/test/' + role + '/datum_start').set(nowString);
        if (role == 'leidinggevende'){
          firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/test/werknemer/status').set('pending');
          firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/test/leidinggevende/user').set(data[0].username);
        }
      }

      // And display the right question. If new test first question is displayed
      if (type == 'existing') {
        var count = 0;
        for (var onderdeel in responses) {
          if (Gebieden.funconderdelen.indexOf(onderdeel) !== -1) { // It has to be a funconderdeel, not status or datum
            for (var response in responses[onderdeel]) {
              count = count + 1;
            }
          }
        }
        // Evaluate when all questions are answered.
        if (count == $scope.questions.length) {
          evaluate(werknemer, responses, trajectStr, role, 'redirect');
          return;
        }
      }
      var index = type == 'new' ? 0 : count;
      $scope.questionsdisplay = true;
      $scope.questions[index].display = true;

      // Set notification to werknemer when leidinggevende initiated traject
      var sender = role == 'leidinggevende' ? data[0].username : werknemer;
      var receiver = role == 'leidinggevende' ? werknemer : responsesObj[trajectStr].test.leidinggevende.user;
      if (role == 'leidinggevende') firebase.database().ref().child('notifications/' + receiver + '/messageFunc/' + sender).set('traject_started');

      // Scopes for the response options. These can be managed in the ResponseOptions service
      $scope.posvalues = ResponseOptions.posvalues;
      $scope.negvalues = ResponseOptions.negvalues;

      // Write answers to Firebase
      $scope.checkedquestion = [];
      $scope.changedRN = function(valRN, onderdeel, nr) {
        firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/test/' + role + '/' + onderdeel + '/question-' + nr).set(valRN);
        // Set display of next question
        $scope.questions[nr].display = false;
        if (nr < $scope.questions.length - 1) $scope.questions[nr + 1].display = true;
        // In case of last question, evaluate responses
        else {
          firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/test/' + role + '/status').set('closed');
          Functions.getResponsesPerFuncUser(werknemer, 'functionering').data.then(function(snapshot) {
            var responsesFin = snapshot.val();
            evaluate(werknemer, responsesFin[trajectStr].test[role], trajectStr, role, 'regular', {sender: sender, receiver: receiver});
          });
        }
        // Set a checked mark when question is answered - with timeout because of 0,5 second animation
        setTimeout(function() {
          $scope.checkedquestion[nr] = true;
        }, 500);
      };

      $scope.prevQuestion = function(nr) {
        $scope.questions[nr].display = false;
        $scope.questions[nr - 1].display = true;
      };
      $scope.nextQuestion = function(nr) {
        $scope.questions[nr].display = false;
        $scope.questions[nr + 1].display = true;
      };
    }
  });

  function evaluate(username, responses, trajectStr, role, type, notifUser) {
    // Get onderdelen with total scores in results array
    var scores = Functions.getFuncScores(responses);
    var results = {user: username, traject: trajectStr, scores: scores};

    // Set or update notifications
    if (role == 'werknemer') firebase.database().ref().child('notifications/' + notifUser.receiver + '/messageFunc/' + notifUser.sender).set('test_finished');

    // Wrap up test evaluation
    Store.setResults('funcresults', results);
    if (type == 'redirect') $location.path('/functioneringsresults/' + role);
    else {
      $scope.$apply(function(){
        $location.path('/functioneringsresults/' + role);
      });
    }
  }

  $scope.getNulmeting = function() {
    $location.path('/nulmeting');
  }

  $scope.chooseRole = function(role) {
    $location.path('/functioneringstest/' + role);
  }

  $scope.getFuncArchive = function(role, user) {
    if (role == 'leidinggevende') $location.path('/functioneringsarchief/' + role + '/' + user);
    else $location.path('/functioneringsarchief/' + role);
  }

  $scope.setAgreements = function(role) {
    $location.path('/functioneringsafspraken/' + role + '/set');
  }

  $scope.viewAgreements = function(role) {
    $location.path('/functioneringsafspraken/' + role + '/view');
  }
}
