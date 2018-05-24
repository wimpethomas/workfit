angular.module('workfit')
.controller('RapportageController', RapportageCtrl);

function RapportageCtrl($scope, $location, UserData, Gebieden, Functions) {
  // Role based: If not superadmin account redirect
  UserData.then(function(data) {
    var access = Functions.getAccess('workFitAdmin', data.type);
    if(!access) {
      $scope.$apply(function() {$location.path('/pagina/geen-toegang/nosuperadmin'); })
      return;
    }
  })

  var now = new Date();
  var nowString = Functions.setWfDate();
  var period = {};

  $scope.startDate = function (newValue, oldValue) {
    period.start = + newValue;
    if (period.end !== undefined) {
      $scope.resultsdisplay = false;
      $scope.spinnerdisplay = true;
      getAnalytics(period);
    }
  };
  $scope.endDate = function (newValue, oldValue) {
    period.end = + newValue;
    if (period.start !== undefined) {
      $scope.resultsdisplay = false;
      $scope.spinnerdisplay = true;
      getAnalytics(period);
    }
  };

  function getAnalytics(period) {
    //console.log(period);
    UserData.then(function(data) {
      return data.bedrijf;
    }).then(function(bedrijf){
      var userList = firebase.database().ref("bedrijven").orderByChild("name").equalTo(bedrijf).once("value").then(function(snapshot) {
        //console.log(snapshot.val());
        var compId = Object.keys(snapshot.val())[0];
        var naam = snapshot.val()[compId].name;
        var regdatum = snapshot.val()[compId].datum;
        var users = [];
        return firebase.database().ref("klanten").orderByChild("bedrijf").equalTo(naam).once("value").then(function(snapshot) {
          snapshot.forEach(function(childSnapshot) {
            users.push(childSnapshot.val().username);
          });
          return users;
        });
      });
      return userList;
    }).then(function(users){
      var dataNulmeting = [];
      var dataWeekly = [];
      var dataTests = [];
      var dataOntwikkel = [];
      for (var i = 0; i < users.length; i++){
        dataNulmeting.push(Functions.getResponsesPerFuncUser(users[i], 'nulmeting').data);
        dataWeekly.push(Functions.getResponsesPerFuncUser(users[i], 'weekly').data);
        dataTests.push(Functions.getResponsesPerFuncUser(users[i], 'test').data);
        dataOntwikkel.push(Functions.getResponsesPerFuncUser(users[i], 'advies').data);
      }
      return {nulmeting: dataNulmeting, weekly: dataWeekly, tests: dataTests, ontwikkel: dataOntwikkel};
    }).then(function(allUserData){
      var gebieden = Gebieden.gebieden;
      var gebiedsnamen = Gebieden.gebiedsnamen;
      gebiedsnamen.gezondheid = 'gezondheid';

      // Nulmetingsdata first
      $scope.nulmeting = {aantal: 0, gebieden: {}, categorie: {geen: 0, een: 0, twee: 0, meer: 0}};
      Promise.all(allUserData.nulmeting).then(function(snapshot){
        snapshot.forEach(function(childSnapshot) {
          //console.log(childSnapshot.val());
          if (childSnapshot.val() !== null) { // There is a nulmeting
            var timeNm = new Date(childSnapshot.val().datum).getTime();

            if (timeNm > period.start && timeNm < period.end && childSnapshot.val().status == 'closed') { // Nulmeting is done in given period
              var uitvalsGebieden = 0;
              // Get the scores of all gebieden.
              for (var gebied in childSnapshot.val()) {
                if (gebieden.indexOf(gebied) !== -1) {
                  if ($scope.nulmeting.aantal == 0) $scope.nulmeting.gebieden[gebied] = {value: 0, count: 0, uitval: 0, naam: gebiedsnamen[gebied]}; // If it is the first nulmeting set gebied initial settings
                  var uitvalScore = 0;
                  var uitvalCount = 0;
                  for (var question in childSnapshot.val()[gebied]) {
                    $scope.nulmeting.gebieden[gebied].value += parseInt(childSnapshot.val()[gebied][question]);
                    $scope.nulmeting.gebieden[gebied].count += 1;
                    uitvalScore += parseInt(childSnapshot.val()[gebied][question]);
                    uitvalCount += 1;
                  }
                  var uitvalPerc = (uitvalScore / 3) / uitvalCount;
                  if (uitvalPerc < 0.4) {
                    $scope.nulmeting.gebieden[gebied].uitval += 1;
                    uitvalsGebieden += 1;
                  }
                }
              }
              $scope.nulmeting.aantal += 1;
              if (uitvalsGebieden == 0) $scope.nulmeting.categorie.geen += 1;
              else if (uitvalsGebieden == 1) $scope.nulmeting.categorie.een += 1;
              else if (uitvalsGebieden == 2) $scope.nulmeting.categorie.twee += 1;
              else $scope.nulmeting.categorie.meer += 1;
            }
          }
        });
        for (var gebied in $scope.nulmeting.gebieden) {
          $scope.nulmeting.gebieden[gebied].cijfer = Math.round((100 * $scope.nulmeting.gebieden[gebied].value / 3) / $scope.nulmeting.gebieden[gebied].count) / 10;
        }
        //console.log($scope.nulmeting);
      });

      // Weekly checks second
      $scope.weekly = {aantal: {checks: 0}, hoofdgebieden: {}, gebieden: {}, catNrOfChecks: {"<3": 0, "3-6": 0, ">6": 0}};
      Promise.all(allUserData.weekly).then(function(snapshot){
        snapshot.forEach(function(childSnapshot) {
          //console.log(childSnapshot.val());
          var numberOfChecks = 0;
          if (childSnapshot.val() !== null) { // There is at least 1 weekly check done by a user
            for (var week in childSnapshot.val()) {
              var timeWc = new Date(childSnapshot.val()[week].datum).getTime();

              if (timeWc > period.start && timeWc < period.end && childSnapshot.val()[week].status == 'closed') { // Weekly check is done in given period
                // Get the answers on all hoofdgebieden
                var basisvragen = ['stress_basis', 'vermoeidheid_basis', 'gezondheid_basis', 'fysieke_gezondheid_basis'];
                var followup = {
                  'gezondheid_followup_basis': 'gezondheid',
                  'fysieke_gezondheid_followup_basis': 'fysieke_gezondheid',
                };

                for (var gebied in childSnapshot.val()[week]) {
                  if (basisvragen.indexOf(gebied) !== -1) {
                    var gebiednew = gebied.replace('_basis', '');
                    if ($scope.weekly.aantal.checks == 0) {
                      $scope.weekly.hoofdgebieden[gebiednew] = {pos: 0, neg: 0, naam: gebiednew}; // If it is the first check set hoofdgebied initial settings
                      // Because gezondheid and fysiek are alternated
                      if (gebiednew == 'gezondheid') $scope.weekly.hoofdgebieden.fysieke_gezondheid = {pos: 0, neg: 0, naam: 'lichamelijke klachten'};
                      else if (gebiednew == 'fysieke_gezondheid') $scope.weekly.hoofdgebieden.gezondheid = {pos: 0, neg: 0, naam: 'gezondheid'};
                    }
                    if (childSnapshot.val()[week][gebied] == 'n') $scope.weekly.hoofdgebieden[gebiednew].pos += 1;
                    else if (childSnapshot.val()[week][gebied] == 'y') $scope.weekly.hoofdgebieden[gebiednew].neg += 1;
                  }
                  else if (gebieden.indexOf(gebied) !== -1) {
                    if ($scope.weekly.gebieden[gebied] == undefined) $scope.weekly.gebieden[gebied] = {value: 0, count: 0, naam: gebiedsnamen[gebied]};
                    $scope.weekly.gebieden[gebied].value += parseInt(childSnapshot.val()[week][gebied].value);
                    $scope.weekly.gebieden[gebied].count += 1;
                  }
                  else if (gebied == 'gezondheid_followup_basis' || gebied == 'fysieke_gezondheid_followup_basis') {
                    var gebiednew = gebied.replace('_followup_basis', '');
                    if ($scope.weekly.gebieden[gebiednew] == undefined) $scope.weekly.gebieden[gebiednew] = {value: 0, count: 0, naam: gebiedsnamen[gebiednew]};
                    if (childSnapshot.val()[week][gebied] == 'y') $scope.weekly.gebieden[gebiednew].value += 3;
                    $scope.weekly.gebieden[gebiednew].count += 1;
                  }
                }
                $scope.weekly.aantal.checks += 1;
                numberOfChecks += 1;
              }
            }
          }
          if (numberOfChecks < 3) $scope.weekly.catNrOfChecks['<3'] += 1;
          else if (numberOfChecks < 6) $scope.weekly.catNrOfChecks['3-6'] += 1;
          else $scope.weekly.catNrOfChecks['>6'] += 1;
        });
        $scope.weekly.aantal.users = $scope.weekly.catNrOfChecks['<3'] + $scope.weekly.catNrOfChecks['3-6'] + $scope.weekly.catNrOfChecks['>6'];
        $scope.weekly.aantal.average = Math.round(10 * $scope.weekly.aantal.checks / $scope.weekly.aantal.users) / 10;

        for (var gebied in $scope.weekly.gebieden) {
          $scope.weekly.gebieden[gebied].cijfer = Math.round(100 * (1 - ($scope.weekly.gebieden[gebied].value / 3) / $scope.weekly.gebieden[gebied].count)) / 10;
        }
        //console.log($scope.weekly);

      }).then(function(){
        $scope.$apply(function(){
          $scope.spinnerdisplay = false;
          $scope.resultsdisplay = true;
        })
      });
    });
  }

  document.getElementById('spinner').style.display = 'none';
}
