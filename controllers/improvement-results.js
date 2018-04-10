angular.module('workfit')
.controller('ImprovementResultsController', ImprovementResultsCtrl);

// As in results the gebieden are stored in:
// 1) resultsObj.lastresults. This is an object that contains adviesdata per gebied for all the gebieden that have an advies
// 2) resultsObj[gebied]. This is an object specific for 1 gebied that contains results (detailview and prefillednew) or metadata (gebieds overview)

// Note: There are several exemptions build in because of coupling with functioneringsgedeelte. Should probably be changed in future versions

function ImprovementResultsCtrl($scope, $location, $routeParams, QuestionsNew, ResponsesPerUser, Store, Examples, Gebieden, Functions) {
  var storedGebied = Store.getResults().resultgebied;
  var storedTestnr = Store.getResults().testnr;
  var urlGebied = $routeParams.gebied;
  var urlTestnr = $routeParams.tid == 'null' ? null : $routeParams.tid;
  var mode = $routeParams.mode; // To edit existing results
  var now = new Date();
  var nowString = now.toISOString();

  // Define type
  if (Store.getResults().newontwikkel) getData('prefillednew', storedGebied, storedTestnr);
  else if (urlGebied !== undefined && urlTestnr !== undefined) getData('detailview', urlGebied, urlTestnr);
  else if (urlGebied !== undefined && urlTestnr == undefined) getData('gebiedview', urlGebied);
  else getData('home');

  // Return trait and high/low by calculating most extreme trait
  // TODO: set low (<-3), middle (-3<x<3) and high (>3) in general settings
  function getTrait(traits, personality){
    //console.log(personality);
    var traitDef = {trait: '', absScore: 0, highlow: ''};
    for (trait in traits){
      if (trait !== 'default'){
        var score = personality[trait].real / personality[trait].max;
        var highlow = score < 0 ? 'low' : 'high';
        var absScore = Math.abs(score);
        traitDef = absScore > traitDef.absScore ? {trait: trait, absScore: absScore, highlow: highlow} : traitDef;
      }
    }
    if (traitDef.absScore > 0.3) return {trait: traitDef.trait, highlow: traitDef.highlow};
    else return {trait: 'default'};
  }

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

  function getData(type, gebied, resultnr, onderdeel) {
    //console.log(type, gebied);
    var gebiedWf = urlGebied == 'functionering' ? 'functionering' : gebied;
    resultnr = urlGebied == 'functionering' ? parseInt(urlTestnr) : resultnr;
    Promise.all([QuestionsNew, ResponsesPerUser]).then(function(data) {
      var username = data[1].username;
      data[1].responses.then(function(responses) {
        var responses = responses.advies;
        var resultsObj = {};
        var lastResultsObj = {};
        // Last results are needed for any view because we want to display the tabs in any view.
        // But with current design responses loop is run twice in worst case. Once for getting last results and one to get metadata. For now okay.
        for (var gebiedInDB in responses) {
          var lrpg = Functions.lastResultPerGebied(responses, gebiedInDB, 'advies', 'started');
          lastResultsObj[gebiedInDB] = lrpg;
          if (gebiedInDB !== 'functionering') lastResultsObj[gebiedInDB].youtube = data[0].profile.youtube[gebiedInDB];
        }
        resultsObj.lastresults = lastResultsObj;
        switch (type) {
          case 'prefillednew':
            var resultStr = 'advies-' + resultnr;
            var results = responses !== undefined ? responses[gebiedWf] : undefined;
            results = results !== undefined ? responses[gebiedWf][resultStr] : undefined;
            var onderdelen = urlGebied !== 'functionering' ? Store.getResults().onderdelen[gebied].main : data[0].profile.ontwikkeling[gebied];
            var onderdeel = urlGebied !== 'functionering' ? Store.getResults().onderdelen[gebied].meta.lowest : 'functionering';
            var personality = Store.getResults().personality;

            // If there isn't a lowest onderdeel (all onderdelen above 0.5) and not coming from functionering then display movie
            if (!onderdeel) {
              $scope.playMovie('nolowest');
              $scope.ytId = data[0].profile.youtube[gebied];
              return;
            }
            // Make a new ontwikkeltraject if (1) there isn't a database entry for this gebied/resultnr combination or (2) nulltest for that gebied (overwrite existing traject)
            else if (results == undefined || resultStr == 'advies-null') {
              if (urlGebied !== 'functionering') var trait = getTrait(onderdelen[onderdeel], personality);
              else var trait = {trait: 'default'};
              var results = {newadv: true};
              if (trait.trait == 'default'){
                results.solution = onderdelen[onderdeel].default.solution;
                results.roadmap = Object.values(onderdelen[onderdeel].default.roadmap);
              }
              else {
                results.solution = onderdelen[onderdeel][trait.trait][trait.highlow].solution;
                results.roadmap = Object.values(onderdelen[onderdeel][trait.trait][trait.highlow].roadmap);
              }
              console.log(onderdelen, onderdeel);
              // Determine if personality test results are counted in or not (treshold is a max below 5 for extraversie en vriendelijkheid (completely random :-))
              if (urlGebied !== 'functionering') {
                if (personality.extraversie.max > 5 && personality.vriendelijkheid.max > 5) $scope.personalitydisplay = true;
              }
            }
            else type = 'detailview';
            resultsObj[gebied] = {
              resultnr: resultnr,
              results: results,
              resultstr: resultStr,
              youtube: data[0].profile.youtube[gebied]
            };
            break;
          case 'detailview':
            var resultStr = 'advies-' + resultnr;
            var results = responses[gebied][resultStr];
            resultsObj[gebied] = {
              resultnr: resultnr,
              results: results,
              resultstr: resultStr,
              youtube: data[0].profile.youtube[gebied]
            };
            break;
          case 'gebiedview':
            // resultsObj is different in this case; it contains metadata per result
            var mpr = Functions.metadataPerResult(responses, gebied, 'advies');
            resultsObj[gebied] = {
              metadata: mpr
            };
            break;
        }
        getViews(resultsObj, username, type);
      });
    });
  }

  function getViews(resultsObj, username, type) {
    document.getElementById('spinner').style.display = 'none';
    if (Object.keys(resultsObj.lastresults).length == 0 && type !== 'prefillednew') $scope.noadvicedisplay = true;
    else {
      // Be sure that resultsObj.lastresults isn't empty in case of first ontwikkelttaject
      if (Object.keys(resultsObj.lastresults).length == 0) resultsObj.lastresults[storedGebied] = resultsObj[storedGebied];

      $scope.tabs = [];
      for (var gebied in resultsObj.lastresults) {
        if (resultsObj.lastresults[gebied] !== undefined) {
          // A view initial setting for display, active tab and youtube movie
          resultsObj.lastresults[gebied].display = $scope.tabs.length == 0 ? true : false;
          if (type == 'home') {
            resultsObj.lastresults[gebied].active = $scope.tabs.length == 0 ? true : false;
            if ($scope.tabs.length == 0) $scope.ytId = resultsObj.lastresults[gebied].youtube;
          }
          else resultsObj.lastresults[gebied].active = resultsObj[gebied] !== undefined ? true : false;
          resultsObj.lastresults[gebied].name = Gebieden.gebiedsnamen[gebied];
          $scope.tabs.push(Gebieden.gebiedsnamen[gebied]);
        }
        gebied = type == 'prefillednew' ? storedGebied : gebied;
        if (resultsObj[gebied] !== undefined) {
          $scope.gebied = gebied;
          $scope.gebiedsnaam = Gebieden.gebiedsnamen[gebied];
        }
        switch (type) {
          case 'detailview':
          case 'prefillednew':
            $scope.type = type;
            if (resultsObj[gebied] !== undefined) {
              $scope.solution = resultsObj[gebied].results.solution;
              $scope.roadmap = resultsObj[gebied].results.roadmap;
              var advStr = resultsObj[gebied].resultstr;
              $scope.ytId = resultsObj[gebied].youtube;
              $scope.editsolution = $scope.solution;
              $scope.editroadmap = $scope.roadmap;
              if (mode == 'edit') {
                $scope.editresultdisplay = true;
                // Add step function in edit mode. Takes into account that roadmap is not created yet
                $scope.addStep = function(type) {
                  if (type == 'detailview') {
                    if ($scope.roadmap == undefined) $scope.roadmap = [{step: '', feedback: ''}];
                    else $scope.roadmap.push({step: '', feedback: ''});
                  }
                  else if (type == 'prefillednew') $scope.roadmap.push('');
                }
                $scope.removeStep = function() {
                  $scope.roadmap.pop();
                  //if ($scope.roadmap.length == 1) $scope.showbutton = false;
                };
              }
              else {
                if (type == 'detailview') $scope.viewresultdisplay = true;
                else $scope.playMovie('detail', type);
              }
              if (type == 'prefillednew') $scope.prefilleddisplay = true;
            }
            break;
          case 'gebiedview':
            if (resultsObj[gebied] !== undefined) {
              $scope.gebiedviewdisplay = true;
              $scope.metadatas = resultsObj[gebied].metadata;
            }
            break;
          case 'home':
            $scope.homedisplay = true;
            break;
        }

        // To view or edit result screen
        $scope.toResult = function(gebiedinp, resultnrinp, mode, parent) {
          gebied = gebiedinp !== undefined ? gebiedinp : gebied;
          gebied = urlGebied == 'functionering' ? urlGebied : gebied;
          if (type == 'prefillednew' && urlGebied == 'functionering') var resultnr = urlTestnr;
          else if (resultnrinp !== undefined) var resultnr = resultnrinp;
          else if (parent == 'home') var resultnr = resultsObj.lastresults[gebied].resultnr;
          else if (parent == 'detail') var resultnr = resultsObj[gebied].resultnr;
          console.log(gebied + ' : ' + resultnr);
          if (mode == 'edit') $location.path('/verbetertrajecten/' + gebied + '/' + resultnr + '/edit');
          else $location.path('/verbetertrajecten/' + gebied + '/' + resultnr);
        }

        // To archive of gebied
        $scope.toGebiedResults = function(gebied) {
          $location.path('/verbetertrajecten/' + gebied);
        }
      }
      $scope.results = resultsObj;
      //console.log($scope.results);

      // Put functionering last in tabs if exists
      var funcTabIndex = $scope.tabs.indexOf('functionering');
      var nrOfTabs = $scope.tabs.length;
      $scope.tabs.splice(nrOfTabs - 1, 0, $scope.tabs.splice(funcTabIndex, 1)[0]);
    }

    $scope.editResult = function(gebied, roadmap, type) {
      gebied = urlGebied == 'functionering' && type == 'prefillednew' ? urlGebied : gebied;
      advStr = urlGebied == 'functionering' && type == 'prefillednew' ? 'advies-' + urlTestnr : advStr;
      console.log(gebied, roadmap, type);
      firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/solution').set($scope.editsolution);
      firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap').remove();
      for (var i = 0; i < roadmap.length; i++) {
        if (roadmap[i].datum_start !== undefined) firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap/' + i + '/datum_start').set(roadmap[i].datum_start);
        if (roadmap[i].datum_end !== undefined) firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap/' + i + '/datum_end').set(roadmap[i].datum_end);
        var step = type == 'prefillednew' ? roadmap[i] : roadmap[i].step;
        if (step !== '') firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap/' + i + '/step').set(step);
        if(roadmap[i].feedback !== '' && roadmap[i].feedback !== undefined) firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap/' + i + '/feedback').set(roadmap[i].feedback);
      }
      if (type == 'prefillednew') {
        firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/datum_start').set(nowString);
        if (advStr !== 'advies-null') {
          $scope.setreminderdisplay = true;
          firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/status').set('unfinished');
        }
        else {
          $scope.roadmapsentdisplay = true;
          $scope.roadmapnulldisplay = true;
          var testStr = advStr.replace("advies", "test");
          firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/status').set('closed');
          firebase.database().ref().child('responses/' + username + '/test/' + gebied + '/' + testStr + '/status').set('closed');
        }
        $scope.viewresultdisplay = false;
        $scope.editresultdisplay = false;
      }
      else $location.path('/verbetertrajecten/' + gebied + '/' + resultsObj[gebied].resultnr);
    }

    $scope.setReminder = function(notification, step, nrofsteps) {
      gebied = urlGebied == 'functionering' && type == 'prefillednew' ? urlGebied : gebied;
      advStr = urlGebied == 'functionering' && type == 'prefillednew' ? 'advies-' + urlTestnr : advStr;
      firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap/' + step + '/datum_start').set(nowString);
      if (notification !== 0){
        var datumRem = Functions.setWfDate('notification', parseInt(notification));
        firebase.database().ref().child('notifications/' + username + '/messageType').set('roadmap');
        firebase.database().ref().child('notifications/' + username + '/datum').set(datumRem);
        $scope.setreminderdisplay = false;
        $scope.roadmapsentdisplay = true;
      }
      else if (step >= nrofsteps - 1) {
        firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr).remove();
        $scope.setreminderdisplay = false;
        $scope.roadmapsentdisplay = true;
        $scope.fallsavedisplay = true;
      }
      else {
        firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap/' + step + '/datum_end').set(nowString);
        $scope.step = step + 1;
        $scope.notification = undefined;
        // Get animation effect via css
        $scope.fadeOutIn = true;
      }
      // Reset animation class
      setTimeout(function() {
        $scope.fadeOutIn = false;
      }, 1000);
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
          $scope.ytId = $scope.results.lastresults[gebied].youtube;
          break;
        case 'gebiedview':
        case 'detailview':
          $location.path('/verbetertrajecten/' + gebied);
          break;
      }
    }
  }

  $scope.getHome = function() {
    $location.path('/');
  }

  $scope.getTrajecten = function() {
    $location.path('/verbetertrajecten');
  }

  // Play instruction movie
  $scope.playMovie = function(page, type) {
    $scope.playerVars = {showinfo: 0, autoplay: 1};
    $scope.moviedisplay = true;
    $scope.viewresultdisplay = $scope.homedisplay = false;
    if (type == 'prefillednew') $scope.fromtestsdisplay = true;
    $scope.page = page;
  }

  $scope.$on('youtube.player.ended', function($event, player) {
    $scope.moviedisplay = false;
    if (Store.getResults().onderdelen[urlGebied].meta.lowest) $scope.viewresultdisplay = true;
    else $scope.nolowestdisplay = true;;
  });

  // Skip instruction movie and show advice
  $scope.skipMovie = function(page) {
    $scope.moviedisplay = false;
    if (page == 'detail') $scope.viewresultdisplay = true;
    else if (page == 'nolowest') $scope.nolowestdisplay = true;
    else $scope.homedisplay = true;
  }
}
