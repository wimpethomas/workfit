    angular.module('workfit')
        .controller('ImprovementResultsController', ImprovementResultsCtrl);

    function ImprovementResultsCtrl($scope, $location, $routeParams, ResponsesPerUser, Store, Examples, Gebieden, Functions) {
        var urlGebied = $routeParams.gebied;
        var urlTestnr = $routeParams.tid;
        var mode = $routeParams.mode; // To edit existing results
        var now = new Date();
        var nowString = now.toISOString();

        // Define type
        if (urlGebied !== undefined && urlTestnr !== undefined) getData('detailview', urlGebied, urlTestnr);
        else if (urlGebied !== undefined && urlTestnr == undefined) getData('gebiedview', urlGebied);
        else getData('home');

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

        function getData(type, gebied, resultnr) {
            ResponsesPerUser.then(function(data) {
                var username = data.username;
                data.responses.then(function(responses) {
                    var responses = responses.advies;
                    var resultsObj = {};
                    var lastResultsObj = {};
                    // Last results are needed for any view because we want to display the tabs in any view.
                    // But with current design responses loop is run twice in worst case. Once for getting last results and one to get metadata. For now okay.
                    for (var gebiedInDB in responses) {
                        var lrpg = Functions.lastResultPerGebied(responses, gebiedInDB, 'advies', 'started');
                        lastResultsObj[gebiedInDB] = lrpg;
                    }
                    resultsObj.lastresults = lastResultsObj;
                    switch (type) {
                        case 'detailview':
                            var resultStr = 'advies-' + resultnr;
                            var results = responses[gebied][resultStr];
                            resultsObj[gebied] = {
                                resultnr: resultnr,
                                results: results,
                                resultstr: resultStr
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
            var testlog = {
                data: resultsObj,
                type: type
            };
            console.log(testlog);

            document.getElementById('spinner').style.display = 'none';
            if (Object.keys(resultsObj.lastresults).length == 0) $scope.noadvicedisplay = true;
            else {
                $scope.tabs = [];
                for (var gebied in resultsObj.lastresults) {
                    if (resultsObj.lastresults[gebied] !== undefined) {
                        resultsObj.lastresults[gebied].display = $scope.tabs.length == 0 ? true : false;
                        if (type == 'home') resultsObj.lastresults[gebied].active = $scope.tabs.length == 0 ? true : false;
                        else resultsObj.lastresults[gebied].active = resultsObj[gebied] !== undefined ? true : false;
                        resultsObj.lastresults[gebied].name = Gebieden.gebiedsnamen[gebied];
                        $scope.tabs.push(Gebieden.gebiedsnamen[gebied]);
                    }
                    if (resultsObj[gebied] !== undefined) {
                        $scope.gebied = gebied;
                        $scope.gebiedsnaam = Gebieden.gebiedsnamen[gebied];
                    }
                    switch (type) {
                        case 'detailview':
                            if (resultsObj[gebied] !== undefined) {
                                $scope.solution = resultsObj[gebied].results.solution;
                                $scope.roadmap = resultsObj[gebied].results.roadmap;
                                if (mode == 'edit') {
                                    $scope.editresultdisplay = true;
                                    $scope.editsolution = $scope.solution;
                                    $scope.editroadmap = $scope.roadmap;
                                    var advStr = resultsObj[gebied].resultstr;
                                    // Add step function in edit mode. Takes into account that roadmap is not created yet
                                    $scope.addStep = function() {
                                        if ($scope.roadmap == undefined) {
                                            $scope.roadmap = [{
                                                    step: '',
                                                    feedback: ''
                                                }
                                            ];
                                        } else {
                                            $scope.roadmap.push({
                                                    step: '',
                                                    feedback: ''
                                                });
                                        }
                                    }
                                    $scope.removeStep = function() {
                                        $scope.roadmap.pop();
                                        //if ($scope.roadmap.length == 1) $scope.showbutton = false;
                                    };
                                } else $scope.viewresultdisplay = true;
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
                    $scope.toResult = function(gebiedinp, resultnrinp, type, parent) {
                        gebied = gebiedinp !== undefined ? gebiedinp : gebied;
                        if (resultnrinp !== undefined) var resultnr = resultnrinp;
                        else if (parent == 'home') var resultnr = resultsObj.lastresults[gebied].resultnr;
                        else if (parent == 'detail') var resultnr = resultsObj[gebied].resultnr;
                        console.log(gebied + ' : ' + resultnr);
                        if (type == 'edit') $location.path('/verbetertrajecten/' + gebied + '/' + resultnr + '/edit');
                        else $location.path('/verbetertrajecten/' + gebied + '/' + resultnr);
                    }

                    // To archive of gebied
                    $scope.toGebiedResults = function(gebied) {
                        $location.path('/verbetertrajecten/' + gebied);
                    }
                }
                $scope.results = resultsObj;
                console.log($scope.results);
            }

            $scope.editResult = function(gebied, roadmap) {
                firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/solution').set($scope.editsolution);
                firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap').remove();
                for (var i = 0; i < roadmap.length; i++) {
                    if (roadmap[i].datum_start !== undefined) firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap/' + i + '/datum_start').set(roadmap[i].datum_start);
                    if (roadmap[i].datum_end !== undefined) firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap/' + i + '/datum_end').set(roadmap[i].datum_end);
                    if (i !== roadmap.length - 1) {
                        firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap/' + i + '/step').set(roadmap[i].step);
                        firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap/' + i + '/feedback').set(roadmap[i].feedback);
                    } else {
                        if (roadmap[i].step !== '') {
                            firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap/' + i + '/step').set(roadmap[i].step);
                            firebase.database().ref().child('responses/' + username + '/advies/' + gebied + '/' + advStr + '/roadmap/' + i + '/feedback').set(roadmap[i].feedback);
                        }
                    }
                }
                $location.path('/verbetertrajecten/' + gebied + '/' + resultsObj[gebied].resultnr);
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
                        $location.path('/verbetertrajecten/' + gebied);
                        break;
                }
            }

        }

        $scope.getProfile = function() {
            $location.path('/profiel');
        }

        function valToKey(val, obj) {
            for (var key in obj) {
                if (obj[key] == val) return key;
            }
            return false;
        }
    }
