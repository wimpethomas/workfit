angular.module('workfit')
.controller('FuncAfsprakenController', FuncAfsprakenCtrl);

function FuncAfsprakenCtrl($scope, $location, $routeParams, ResponsesPerUser, Store, Gebieden, Functions) {
  var funcResults = Store.getResults().funcresults;
  var funcData = Store.getResults().funcdata;
  var role = $routeParams.role;
  var mode = $routeParams.mode;
  var werknemer = $routeParams.user !== undefined ? $routeParams.user : funcResults.user;
  var funcNr = $routeParams.fid !== undefined ? $routeParams.fid : (funcResults !== undefined ? funcResults.traject.split[1] : undefined);
  var trajectStr = $routeParams.fid !== undefined ? 'traject-' + $routeParams.fid : (funcResults !== undefined ? funcResults.traject : undefined);
  var nowString = Functions.setWfDate();
  if ($routeParams.user !== undefined && $routeParams.fid !== undefined) var extraSlug = '/' + $routeParams.user + '/' + $routeParams.fid;
  else if ($routeParams.user !== undefined && $routeParams.fid == undefined) var extraSlug = '/' + $routeParams.user;
  else var extraSlug = '';
  document.getElementById('spinner').style.display = 'none';
  $scope.nav = 'agreements';
  if ($routeParams.user !== undefined) $scope.navlinksdisplay = true;
  else if (funcData !== undefined) $scope.navlinksdisplay = funcData.trajectnr > 0 ? true : false;

  if (mode == 'set'){
    ResponsesPerUser.then(function(data){
      var leidinggevende = data.username;
      $scope.$apply(function(){
        $scope.submitdisplay = true;
        // Afspraken setup and submit
        $scope.agreements = [''];
        $scope.addAgreement = function() {
          $scope.agreements.push('');
          if ($scope.agreements.length > 1) $scope.showbutton = true;
        };
        $scope.removeAgreement = function() {
          $scope.agreements.pop();
          if ($scope.agreements.length == 1) $scope.showbutton = false;
        };
      });
      $scope.submitAgreements = function() {
        $scope.submitteddisplay = true;
        firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/afspraken').set($scope.agreements);
        firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/afspraken/datum').set(nowString);
        firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/afspraken/status').set('pending');
        firebase.database().ref().child('notifications/' + werknemer + '/messageFunc/' + leidinggevende).set('afspraken_set');
      }
    });
  }
  else if (mode == 'view'){
    var functioneringPromise = Functions.getResponsesPerFuncUser(werknemer, 'functionering');
    var ontwikkelingPromise = Functions.getResponsesPerFuncUser(werknemer, 'advies');
    Promise.all([functioneringPromise.data, ontwikkelingPromise.data]).then(function(snapshot) {
      // In case no trajectnr is given as URL parameter find the last traject
      if (trajectStr == undefined) {
        var trajectStrings = Object.keys(snapshot[0].val());
        trajectStr = trajectStrings[trajectStrings.length - 1];
      }
      var leidinggevende = snapshot[0].val()[trajectStr].test.leidinggevende.user;
      $scope.agreements = snapshot[0].val()[trajectStr].afspraken;
      $scope.$apply(function(){
        $scope.datum = $scope.agreements.datum.split('T')[0];
        var status = $scope.agreements.status;
        if (status == 'pending'|| status == 'repending'){
          if (role == 'werknemer'){
            $scope.approvedisplay = true;
            $scope.approveAgreements = function(bin){
              $scope.answer = bin ? 'Je bent akkoord met bovenstaande afspraken' : 'Je bent niet akkoord met bovenstaande afspraken';
              $scope.approvedisplay = false;
              var approvedSetting = bin ? 'approved' : 'disapproved';
              firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/afspraken/status').set(approvedSetting);
              firebase.database().ref().child('notifications/' + leidinggevende + '/messageFunc/' + werknemer).set('afspraken_' + approvedSetting);
            }
          }
          else {
            $scope.pasaan = true;
          }
        }
        else if (status == 'approved' || status == 'disapproved'){
          if (role == 'werknemer') {
            $scope.answer = status == 'approved' ? 'Je bent akkoord met bovenstaande afspraken' : 'Je bent niet akkoord met bovenstaande afspraken';
            if (status == 'approved') {
              var funcOntwikkelObj = snapshot[1].val() !== null ? snapshot[1].val().functionering : undefined;
              funcOntwikkelObj =  funcOntwikkelObj !== undefined ? funcOntwikkelObj : [];
              var funcOntwikkelTrajecten = Object.keys(funcOntwikkelObj);
              if (funcOntwikkelTrajecten.indexOf('advies-' + funcNr) == -1) {
                $scope.ontwikkeling = true;

                // Show dropdown with gebieden
                $scope.gebieddata = Gebieden.gebiedsnamenArr;
                $scope.gebieddata.push('anders');
                $scope.gebiedmodel = [];
                $scope.gebiedsettings = {checkBoxes: true,
                                         keyboardControls: true,
                                         selectionLimit: 1,
                                         showCheckAll: false,
                                         showUncheckAll: false,
                                         smartButtonMaxItems: 1,
                                         template: '{{option}}',
                                         smartButtonTextConverter(skip, option) { return option; }
                                        };
                $scope.gebiedcustomTexts = {buttonDefaultText: 'Selecteer Gebied'};
                $scope.gebiedevent = {
                  onItemDeselect: function(item){
                    $scope.gebiedselected = false;
                  },
                  onItemSelect: function(gebied){
                    $scope.gebiedselected = gebied;
                  }
                }
              }
            }
          }
          else {
            // Get real name of werknemer
            if (Store.getResults().slavedata !== undefined) {
              var slavedata = Store.getResults().slavedata;
              slavedata = slavedata[Object.keys(slavedata)[0]];
              var realname = slavedata.naam !== undefined ? slavedata.naam : slavedata.email;
            }
            else realname = werknemer;
            $scope.answerSlave = status == 'approved' ? realname + ' is akkoord met bovenstaande afspraken' : realname + ' is niet akkoord met bovenstaande afspraken';
            $scope.pasaan = true;
          }
        }
      });
    });
    $scope.viewdisplay = true;

    $scope.toEditView = function() {
      $location.path('/functioneringsafspraken/' + role + '/edit' + extraSlug);
    };

    $scope.startOntwikkeling = function(gebiedsnaam) {
      firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/status').set('closed');
      if (gebiedsnaam == 'anders' || gebiedsnaam == undefined) $location.path('/verbetertraject/' + funcNr);
      else {
        var gebied = Functions.valToKey(gebiedsnaam, Gebieden.gebiedsnamen);
        Store.setResults('resultgebied', gebied);
        Store.setResults('newontwikkel', true);
        $location.path('/verbetertrajecten/functionering/' + funcNr);
      }
      // TODO: NOTIFICATIE BIJ HET CLOSEN VAN FUNCTIONERINGSTRAJECT
    }
  }
  else if (mode == 'edit' && role == 'leidinggevende'){
    var responsesPromise = Functions.getResponsesPerFuncUser(werknemer, 'functionering');
    Promise.all([ResponsesPerUser, responsesPromise.data]).then(function(snapshot) {
      var leidinggevende = snapshot[0].username;
      $scope.$apply(function(){
        $scope.editdisplay = true;
        // In case no trajectnr is given as URL parameter find the last traject
        if (trajectStr == undefined) {
          var trajectStrings = Object.keys(snapshot[1].val());
          trajectStr = trajectStrings[trajectStrings.length - 1];
        }
        var editagreements = snapshot[1].val()[trajectStr].afspraken;
        $scope.editdatum = editagreements.datum;
        $scope.editstatus = editagreements.status;
        $scope.editagreements = [];
        for (agreement in editagreements){
          if (agreement !== 'datum' && agreement !== 'status') $scope.editagreements.push(editagreements[agreement]);
        }
        //console.log($scope.editagreements);
        // Add and remove agreement function in edit mode.
        $scope.addAgreement = function() {
          $scope.editagreements.push('');
        }
        $scope.removeAgreement = function() {
          $scope.editagreements.pop();
        };
      });

      $scope.editAgreements = function() {
        firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/afspraken').remove();
        firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/afspraken').set($scope.editagreements);
        firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/afspraken/datum').set($scope.editdatum);
        firebase.database().ref().child('notifications/' + werknemer + '/messageFunc/' + leidinggevende).set('afspraken_reset');
        var status = $scope.editstatus == 'disapproved' ? 'repending' : $scope.editstatus;
        firebase.database().ref().child('responses/' + werknemer + '/functionering/' + trajectStr + '/afspraken/status').set(status);
        $location.path('/functioneringsafspraken/' + role + '/view' + extraSlug);
      }
    });
  }

  $scope.menuNav = function(tab){
    var role = $routeParams.role !== undefined ? $routeParams.role : funcData.role;
    var werknemer = $routeParams.user !== undefined ? $routeParams.user : funcData.werknemer;
    var fid = $routeParams.fid !== undefined ? $routeParams.fid : (funcData !== undefined ? funcData.trajectnr : '');
    if (tab == 'home') $location.path('functioneringstest');
    else if (tab == 'results') $location.path('functioneringsresults/' + role + '/' + werknemer + '/' + fid);
    else if (tab == 'archive') $location.path('functioneringsarchief/' + role + '/' + werknemer);
  }
}
