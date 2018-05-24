angular.module('workfit')
.controller('ResultsController', ResultsCtrl);

function ResultsCtrl($scope, $location, $routeParams, $firebaseObject, QuestionsNew, ResponsesPerUser, UserData, ResponseOptions, Store, Gebieden, Functions) {
  $scope.profile = {};
  var storedResults = Store.getResults().testresults;
  var storedTestnr = Store.getResults().testnr; // Set in /tests (if coming from 'losse' test: storedTestnr = null).
  var urlGebied = $routeParams.gebied; // For archive gebiedview
  var urlTestnr = $routeParams.tid;// For archive detailview

  if (storedResults !== undefined) getData('direct', undefined, undefined, storedResults);
  else if (urlGebied !== undefined && urlTestnr !== undefined) getData('detailview', urlGebied, urlTestnr);
  else if (urlGebied !== undefined && urlTestnr == undefined) getData('gebiedview', urlGebied);
  else getData('home');

  // Sort niveaus and get positive and negative indicators
  function sortNiveaus(type, resultsObj, gebied) {
    var obj = type == 'single' ? resultsObj[gebied].results : resultsObj.lastresults[gebied].results;
    var sorted = [];
    for (onderdeel in obj.niveaus){
      var grade = obj.niveaus[onderdeel].score / obj.niveaus[onderdeel].maxscore;
      var indicator = grade < 0.5 ? 'negative' : 'positive';
      sorted.push({grade: grade, indicator: indicator, value: obj.niveaus[onderdeel].value, onderdeel: onderdeel});
      sorted.sort(function(a, b) {
        return b.grade - a.grade;
      });
    }
    obj.niveausSorted = sorted;
    return sorted;
  }

  // Return worst onderdeel by (1) get pairs (add onderdeel and alias (DB)), (2) calculate average scores of ond. and avg. and (3) sort those averages
  function getOnderdeel(type, resultsObj, gebied, niveaus){
    var onderdelen = type == 'single' ? resultsObj[gebied].onderdelen : resultsObj.lastresults[gebied].onderdelen;
    var weging = {};
    for (onderdeel in onderdelen){
      var onderdeelDef = onderdelen[onderdeel].alias !== undefined ? onderdelen[onderdeel].alias : onderdeel;
      for (var i = 0; i < niveaus.length; i++){
        if (onderdeel == niveaus[i].onderdeel) {
          if (weging[onderdeelDef] == undefined) weging[onderdeelDef] = [niveaus[i].grade];
          else weging[onderdeelDef].push(niveaus[i].grade);
          break;
        }
      }
    }
    var averages = [];
    for (onderdeel in weging){
      var scores = weging[onderdeel];
      var average = function(scores){
        return scores.reduce(function(a, b){
          return (a + b);
        }) / scores.length;
      };
      averages.push({onderdeel: onderdeel, average: average(scores)});
    }
    averages.sort(function(a, b) {
      return a.average - b.average;
    });
    var lowest = averages[0].average <= 0.5 ? averages[0].onderdeel : false;
    if (type == 'single') resultsObj[gebied].onderdelenmeta = {averages: averages, lowest: lowest};
    else resultsObj.lastresults[gebied].onderdelenmeta = {averages: averages, lowest: lowest};
  }

  // Personality - set displays only for gebieden where personality has impact
  function setPersonalityDisplays(type, resultsObj, gebied) {
    var obj = type == 'single' ? resultsObj[gebied] : resultsObj.lastresults[gebied];
    const gebiedenTraits = {
      'competentie': ['zorgvuldigheid', 'intellectuele_autonomie'],
      'sociale_steun': ['extraversie', 'vriendelijkheid'],
      'zelfstandigheid': ['zorgvuldigheid', 'intellectuele_autonomie'],
      'werkdruk': ['zorgvuldigheid']
    };
    const gebiedenTraitsArr = Object.keys(gebiedenTraits);
    if (gebiedenTraitsArr.indexOf(gebied) > -1) {
      var traitsArray = gebiedenTraits[gebied];
      var traitCharsTotal = [];
      var comboBulletsTotal = [];
      var comboEminst = resultsObj.persoonlijkheid.score['emotionele_stabiliteit'].traitChars[0] == 'low' ? resultsObj.persoonlijkheid.combotexts[gebied].extra : '';

      for (var i = 0; i < traitsArray.length; i++) {
        var traitChars = resultsObj.persoonlijkheid.score[traitsArray[i]].traitChars;
        for (var j = 0; j < traitChars.length; j++) {
          traitCharsTotal.push(traitChars[j]);
        }
        var comboBullet = resultsObj.persoonlijkheid.score[traitsArray[i]].traitResults[gebied];
        comboBulletsTotal.push(comboBullet);
      }
      var comboText = resultsObj.persoonlijkheid.combotexts[gebied].main.replace("[es]", comboEminst);
      obj.results.persoonlijkheid = {'traitbullets': traitCharsTotal, 'combotext': comboText, 'combobullets': comboBulletsTotal};

      // Set displays
      if (resultsObj.persoonlijkheid.status == 'closed') obj.personalitydisplay = true;
      else if (resultsObj.persoonlijkheid.status == 'unfinished') obj.fuunfinisheddisplay = true;
      else if (resultsObj.persoonlijkheid.status == undefined) obj.funopersdisplay = true;
    }
  }

  function getData(type, gebied, resultnr, storedresults) {
    //console.log(type);
    Promise.all([QuestionsNew, ResponsesPerUser, UserData]).then(function(data) {
      // Role based: If demo user with expired account redirect
      var access = Functions.getAccess('allButDemoExpired', data[2].type, data[2].datum);
      if(!access) {
        $scope.$apply(function() {$location.path('/pagina/geen-toegang/demo-user'); })
      }
      else {
        var username = data[1].username;
        var profile = data[0].profile;
        data[1].responses.then(function(responses) {
          var testResults = responses.test;
          var advices = responses.advies;
          var resultsObj = {};
          var lastResultsObj = {};

          // When coming from finished test, get data from results Store and add niveaus (wondering if this is a gain in performance compared to DB retrieval)
          // Only difference from DB retrieval (else case) is that not all gebieden are retrieved and stored in resultsObj, but only the one from the test.
          if (type == 'direct') {
            for (var storedGebied in storedresults) {
              lastResultsObj[storedGebied] = {};
              lastResultsObj[storedGebied].results = {};
              lastResultsObj[storedGebied].results.vals = storedresults[storedGebied];
              lastResultsObj[storedGebied].onderdelen = profile.ontwikkeling[storedGebied];
              Functions.addNiveaus(lastResultsObj[storedGebied].results, profile[storedGebied]);
            }
            resultsObj.lastresults = lastResultsObj;
          }
          else {
            // When coming from menu (or page refresh) get data from DB and add niveaus
            // Last results are needed for any view because we want to display the tabs in any view.
            for (var gebiedInDB in testResults) {
              var lastTestPerGebied = Functions.lastResultPerGebied(testResults, gebiedInDB, 'test', 'closed');
              var lastAdviesPerGebied = Functions.lastResultPerGebied(advices, gebiedInDB, 'advies', 'started');
              if (lastTestPerGebied !== undefined) {
                lastTestPerGebied.results = Functions.rewriteDBResults(lastTestPerGebied.results, gebiedInDB, lastTestPerGebied.results.rewritten);
                Functions.addNiveaus(lastTestPerGebied.results, profile[gebiedInDB]);
                lastResultsObj[gebiedInDB] = lastTestPerGebied;
                // Has a corresponding advice if resultnrs of test and advice are matching
                if (lastAdviesPerGebied !== undefined) lastResultsObj[gebiedInDB].hasadvicedisplay = lastAdviesPerGebied.resultnr == lastTestPerGebied.resultnr ? true : false;
                lastResultsObj[gebiedInDB].onderdelen = profile.ontwikkeling[gebiedInDB];
              }
            }
            resultsObj.lastresults = lastResultsObj;
            switch (type) {
              case 'detailview':
                var resultStr = 'test-' + resultnr;
                var resultsDB = testResults[gebied][resultStr];
                var results = Functions.rewriteDBResults(resultsDB, gebied, resultsDB.rewritten);
                var hasadvicedisplay = false;
                if (advices !== undefined) {
                  if (advices[gebied] !== undefined) var hasadvicedisplay = advices[gebied]['advies-' + resultnr] !== undefined ? true : false;
                }
                Functions.addNiveaus(results, profile[gebied]);
                resultsObj[gebied] = {
                  resultnr: resultnr,
                  results: results,
                  resultstr: resultStr,
                  hasadvicedisplay: hasadvicedisplay,
                  onderdelen: profile.ontwikkeling[gebied]
                };
                break;
              case 'gebiedview':
                // resultsObj is different in this case; it contains metadata per result
                var mpr = Functions.metadataPerResult(testResults, gebied, 'test');
                resultsObj[gebied] = {
                  metadata: mpr
                };
                break;
            }
          }
          // Finally, set personality in resultsObj
          var personalityResults = responses.personality;
          var personalityStatus = personalityResults !== undefined ? personalityResults.status : undefined;
          var traits =  profile.personality;
          var combotexts =  profile.combotekst;
          var personalityScore = Functions.getPersScores(personalityResults, traits, 'pers');
          Store.setResults('personality', personalityScore);
          resultsObj.persoonlijkheid = {status: personalityStatus, traits: traits, combotexts: combotexts, score: personalityScore};

          getViews(resultsObj, type);
        });
      }
    });
  }

  function getViews(resultsObj, type) {
    document.getElementById('spinner').style.display = 'none';
    if (storedResults !== undefined) $scope.directdisplay = true;

    if (Object.keys(resultsObj.lastresults).length == 0) $scope.noresultdisplay = true;
    else {
      $scope.tabs = [];
      var niveausLastResults = {};
      var onderdelenLastResults = {};
      for (var gebied in resultsObj.lastresults) {
        if (resultsObj.lastresults[gebied] !== undefined && $routeParams.type !== 'verbeter') {
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
              var sortedNiveaus = sortNiveaus('single', resultsObj, gebied);
              getOnderdeel('single', resultsObj, gebied, sortedNiveaus);
              setPersonalityDisplays('single', resultsObj, gebied);

              $scope.gebiedS = resultsObj[gebied];
              //var niveausSingle = {};
              //niveausSingle[gebied] = resultsObj[gebied].results.niveausSorted;
              var onderdelenSingle = {};
              onderdelenSingle[gebied] = {main: resultsObj[gebied].onderdelen, meta: resultsObj[gebied].onderdelenmeta};
              console.log(onderdelenSingle);

              //In case of redirect (pass through) from tests to verbetertraject
              if ($routeParams.type == 'verbeter') {
                //Store.setResults('niveaus', niveausSingle);
                Store.setResults('onderdelen', onderdelenSingle);
                $location.path('/verbetertrajecten/' + urlGebied + '/' + urlTestnr);
              }
              else $scope.viewresultdisplay = true;
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
            var sortedNiveaus = sortNiveaus('multi', resultsObj, gebied);
            getOnderdeel('multi', resultsObj, gebied, sortedNiveaus);
            setPersonalityDisplays('multi', resultsObj, gebied)
            break;
        }
        //niveausLastResults[gebied] = resultsObj.lastresults[gebied].results.niveausSorted;
        onderdelenLastResults[gebied] = {main: resultsObj.lastresults[gebied].onderdelen, meta: resultsObj.lastresults[gebied].onderdelenmeta};

        // To detailview
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

      $scope.getSolution = function(typePers, gebied, resultnr, newontwikkel) {
        //console.log(type, gebied, resultnr);
        // Set Store parameters
        Store.setResults('resultgebied', gebied);
        Store.setResults('testnr', resultnr);
        Store.setResults('newontwikkel', newontwikkel);
        if (type == 'detailview') {
          //Store.setResults('niveaus', niveausSingle);
          Store.setResults('onderdelen', onderdelenSingle);
        }
        else {
          //Store.setResults('niveaus', niveausLastResults);
          Store.setResults('onderdelen', onderdelenLastResults);
        }

        // Redirect based on type
        if (typePers == 'direct') $location.path('/verbetertrajecten/' + gebied + '/' + resultnr);
        else $location.path('/personalitytest/flow');
      }
    }

    $scope.isActiveTab = function(gebiedsnaam) {
      var gebied = Functions.valToKey(gebiedsnaam, Gebieden.gebiedsnamen);
      return $scope.results.lastresults[gebied].active;
    }

    $scope.onClickTab = function(gebiedsnaam) {
      // First set all gebieden displays on false and inactive
      var gebied = Functions.valToKey(gebiedsnaam, Gebieden.gebiedsnamen);
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

}
