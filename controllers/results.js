angular.module('workfit')
.controller('ResultsController', ResultsCtrl);

function ResultsCtrl($scope, $location, $routeParams, $firebaseObject, QuestionsNew, ResponsesPerUser, ResponseOptions, Store, Gebieden, Functions) {
  $scope.profile = {};
  var storedResults = Store.getResults().testresults;
  var storedTestnr = Store.getResults().testnr;
  var urlGebied = $routeParams.gebied;
  var urlTestnr = $routeParams.tid;

  var testlog = {
    testgebieden: Store.getResults().testgebieden,
    resultgebied: Store.getResults().resultgebied,
    testresults: storedResults,
    testnr: storedTestnr,
    persoonlijkheid: Store.getResults().personality,
    niveaus: Store.getResults().niveaus
  };
  console.log(testlog);

  if (storedResults !== undefined) getData('direct', undefined, undefined, storedResults);
  else if (urlGebied !== undefined && urlTestnr !== undefined) getData('detailview', urlGebied, urlTestnr);
  else if (urlGebied !== undefined && urlTestnr == undefined) getData('gebiedview', urlGebied);
  else getData('home');

  function getData(type, gebied, resultnr, storedresults) {
    Promise.all([QuestionsNew, ResponsesPerUser]).then(function(data) {
      var username = data[1].username;
      var niveaus = data[0].profile;
      data[1].responses.then(function(responses) {
        var responses = responses.test;
        var resultsObj = {};
        var lastResultsObj = {};
        if (type == 'direct') {
          for (var storedGebied in storedresults) {
            lastResultsObj[storedGebied] = {};
            lastResultsObj[storedGebied].results = {};
            lastResultsObj[storedGebied].results.vals = storedresults[storedGebied];
            Functions.addNiveaus(lastResultsObj[storedGebied].results, niveaus[storedGebied]);
          }
          resultsObj.lastresults = lastResultsObj;
        } else {
          // Last results are needed for any view because we want to display the tabs in any view.
          // But with current design responses loop is run twice in worst case. Once for getting last results and one to get metadata. For now okay.
          for (var gebiedInDB in responses) {
            var lrpg = Functions.lastResultPerGebied(responses, gebiedInDB, 'test', 'closed');
            if (lrpg !== undefined) {
              lrpg.results = Functions.rewriteDBResults(lrpg.results, gebiedInDB, lrpg.results.rewritten);
              Functions.addNiveaus(lrpg.results, niveaus[gebiedInDB]);
              lastResultsObj[gebiedInDB] = lrpg;
            }
          }
          resultsObj.lastresults = lastResultsObj;
          switch (type) {
            case 'detailview':
              var resultStr = 'test-' + resultnr;
              var resultsDB = responses[gebied][resultStr];
              var results = Functions.rewriteDBResults(resultsDB, gebied, resultsDB.rewritten);
              Functions.addNiveaus(results, niveaus[gebied]);
              resultsObj[gebied] = {
                resultnr: resultnr,
                results: results,
                resultstr: resultStr
              };
              break;
            case 'gebiedview':
              // resultsObj is different in this case; it contains metadata per result
              var mpr = Functions.metadataPerResult(responses, gebied, 'test');
              resultsObj[gebied] = {
                metadata: mpr
              };
              break;
          }
        }
        // Add niveaus because of adding youtube and combotekst for advice later
        getViews(resultsObj, type, niveaus);
      });
    });
  }

  function getViews(resultsObj, type, niveausextra) {
    document.getElementById('spinner').style.display = 'none';
    if (Object.keys(resultsObj.lastresults).length == 0) $scope.noresultdisplay = true;
    else {
      $scope.tabs = [];
      // Youtube and combotekst in there because of advice
      var niveausLastResults = {
        youtube: niveausextra.youtube,
        combotekst: niveausextra.combotekst
      };
      for (var gebied in resultsObj.lastresults) {
        if (resultsObj.lastresults[gebied] !== undefined) {
          resultsObj.lastresults[gebied].display = $scope.tabs.length == 0 ? true : false;
          if (type == 'home' || type == 'direct') resultsObj.lastresults[gebied].active = $scope.tabs.length == 0 ? true : false;
          else resultsObj.lastresults[gebied].active = resultsObj[gebied] !== undefined ? true : false;
          resultsObj.lastresults[gebied].name = Gebieden.gebiedsnamen[gebied];
          // For storedresults ('direct') only a tab for the stored gebied. For the other views a tab for all gebieden
          if (type == 'direct') $scope.tabs.push(Gebieden.gebiedsnamen[gebied]);
          else $scope.tabs.push(Gebieden.gebiedsnamen[gebied]);
          // For security: get the stored resultnr in the resultsObj in case of 'direct' so that in getAdvice in any case a resultnr will be stored
          if (type == 'direct') resultsObj.lastresults[gebied].resultnr = storedTestnr;
        }
        if (resultsObj[gebied] !== undefined) {
          $scope.gebied = gebied;
          $scope.gebiedsnaam = Gebieden.gebiedsnamen[gebied];
        }
        switch (type) {
          case 'detailview':
            if (resultsObj[gebied] !== undefined) {
              // Add youtube and combotekst because of advice
              var niveausSingle = {
                youtube: niveausextra.youtube,
                combotekst: niveausextra.combotekst
              };
              niveausSingle[gebied] = resultsObj[gebied].results.niveaus;
              $scope.niveaus = niveausSingle;
              $scope.resultnr = resultsObj[gebied].resultnr;
              $scope.viewresultdisplay = true;
            }
            break;
          case 'gebiedview':
            if (resultsObj[gebied] !== undefined) {
              $scope.gebiedviewdisplay = true;
              $scope.metadatas = resultsObj[gebied].metadata;
            }
            break;
          case 'home':
          case 'direct':
            $scope.homedisplay = true;
            break;
        }
        niveausLastResults[gebied] = resultsObj.lastresults[gebied].results.niveaus;

        // To view or edit result screen
        $scope.toResult = function(gebiedinp, resultnrinp, type, parent) {
          gebied = gebiedinp !== undefined ? gebiedinp : gebied;
          if (resultnrinp !== undefined) var resultnr = resultnrinp;
          else if (parent == 'home') var resultnr = resultsObj.lastresults[gebied].resultnr;
          else if (parent == 'detail') var resultnr = resultsObj[gebied].resultnr;
          $location.path('/results/' + gebied + '/' + resultnr);
        }

        // To archive of gebied
        $scope.toGebiedResults = function(gebied) {
          $location.path('/results/' + gebied);
        }
      }
      $scope.results = resultsObj;
      console.log($scope.results);

      $scope.getAdvice = function(gebied, resultnr, niveausSingle) {
        Store.setResults('resultgebied', gebied);
        if (storedTestnr == undefined || type == 'detailview') Store.setResults('testnr', resultnr);
        if (type == 'detailview') Store.setResults('niveaus', niveausSingle);
        else Store.setResults('niveaus', niveausLastResults);
        if (gebied == 'vermoeidheid' || gebied == 'fysieke_gezondheid' || gebied == 'gezondheid') $location.path('/advies');
        else $location.path('/personalitytest/flow');
      }
    }

    $scope.isActiveTab = function(gebiedsnaam) {
      var gebied = valToKey(gebiedsnaam, Gebieden.gebiedsnamen);
      return $scope.results.lastresults[gebied].active;
    }

    $scope.onClickTab = function(gebiedsnaam) {
      // First set all gebieden displays on false and inactive
      var gebied = valToKey(gebiedsnaam, Gebieden.gebiedsnamen);
      switch (type) {
        case 'home':
          for (var gebiedAll in $scope.results.lastresults) {
            if ($scope.results.lastresults[gebiedAll] !== undefined) {
              $scope.results.lastresults[gebiedAll].display = false;
              $scope.results.lastresults[gebiedAll].active = false;
            }
          }
          // Then set the clicked tab display on true and active
          $scope.results.lastresults[gebied].display = true;
          $scope.results.lastresults[gebied].active = true;
          break;
        case 'gebiedview':
        case 'detailview':
          $location.path('/results/' + gebied);
          break;
      }
    }
  }

  $scope.getTests = function() {
    $location.path('/tests');
  }

  function valToKey(val, obj) {
    for (var key in obj) {
      if (obj[key] == val) return key;
    }
    return false;
  }

}
