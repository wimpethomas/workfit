    angular.module('workfit')
        .controller('ResponseController', ResponseCtrl);

    function ResponseCtrl($scope, $location, $routeParams, $firebaseObject, QuestionsNew, ResponsesPerUser, ResponseOptions, Store, Functions) {
        // weekRef based on URL is not necessary, because var week does the same 
        var weekRef = $routeParams.wid;
        $scope.questions = [];
        var now = new Date();
        var nowString = Functions.setWfDate();
        // Set notification date for next week reminder on days + 7 (in test 3)
        var datumRemString = Functions.setWfDate('notification', 3);

        Promise.all([QuestionsNew, ResponsesPerUser]).then(function(data) {
            // Get settings
            var settings = data[0].settings;
            var testPeriod = settings.period;
            // 3 is the maximum score per question. Make this a function of ResponseOptions (also for nulmeting)
            var maxscore = 3 * testPeriod;
            var continuousEval = settings.cont_evaluation;

            // Get questions
            var questions = {
                stress: data[0].stress,
                vermoeidheid: data[0].vermoeidheid,
                fysieke_gezondheid: data[0].fysieke_gezondheid,
                gezondheid: data[0].gezondheid
            };
            // The ResponsesPerUser is a promise with an object that contains userName and a second level promise (responses)
            var username = data[1].username;
            // Get the questions
            for (var gebied in questions) {
                var values = [];
                for (var subgebied in questions[gebied]) {
                    if (subgebied == 'basis' || gebied == 'fysieke_gezondheid' || gebied == 'gezondheid') {
                        // Fill question array with key/values for basis questions en fysieke klachten (all y/n questions)
                        var displayB = gebied == 'stress' ? true : false;
                        values.push({
                                q: questions[gebied][subgebied],
                                display: displayB,
                                basisType: subgebied,
                                basis: true
                            });

                    } else {
                        // All multiple choice questions
                        var numberOfQuestions = questions[gebied][subgebied].length;
                        var index = Math.floor(Math.random() * numberOfQuestions);
                        // Fill question array with key/values for details subgebieden
                        values.push({
                                q: questions[gebied][subgebied][index].q,
                                pos: questions[gebied][subgebied][index].pos,
                                ro: questions[gebied][subgebied][index].ro,
                                index: index,
                                display: false,
                                subgebied: subgebied,
                                basis: false
                            });
                    }
                }
                $scope.questions.push({
                        gebied: gebied,
                        values: values
                    });
            }

            data[1].responses.then(function(responses) {
                document.getElementById('spinner').style.display = 'none';
                var responsesWeek = responses.weekly;
                var responsesNull = responses == undefined ? undefined : responses.nulmeting;
                if (responsesNull == undefined) $scope.nonulmetingdisplay = true;
                else if (responsesNull.status == 'unfinished') $scope.nonulmetingdisplay = true;
                else {
                    var week = responsesWeek == undefined ? 1 : Object.keys(responsesWeek).length + 1;
                    var isEvenWeek = week % 2 == 0 ? true : false;
                    executeCheck(week, responsesWeek);

                    // Scopes for the response options. These can be managed in the ResponseOptions service
                    $scope.posvalues = ResponseOptions.posvalues;
                    $scope.negvalues = ResponseOptions.negvalues;

                    // Write answers to Firebase
                    $scope.basis_answer = {};
                    $scope.changedB = function(val, gebied, basisType, gebiedindex, vraagindex) {
                        // Write basis answer to Firebase and reset notifications
                        if (gebied == 'stress') firebase.database().ref().child('responses/' + username + '/weekly/week-' + week + '/datum').set(nowString);
                        if (gebied == 'stress') firebase.database().ref().child('notifications/' + username + '/datum').set(datumRemString);
                        if (gebied == 'stress') firebase.database().ref().child('notifications/' + username + '/messageType').set('weekly');
                        firebase.database().ref().child('responses/' + username + '/weekly/week-' + week + '/' + gebied + '_' + basisType).set(val);

                        // Set displays
                        $scope.questions[gebiedindex].values[vraagindex].display = false;
                        // On even weeks, show fysieke_gezondheid, else gezondheid
                        var nextIndex = isEvenWeek ? 1 : 2;
                        // On 'yes' go to next question in array, except for last question in fysiek
                        if (val == 'y' && basisType !== 'followup_basis') $scope.questions[gebiedindex].values[vraagindex + 1].display = true;
                        else {
                            // If latest gebiedindex or the exception on followup (fysieke) gezondheid then evaluate, else go to next gebied
                            if (gebiedindex == 2 || gebiedindex == 3 || basisType == 'followup_basis') preEvaluate(week);
                            else if (gebiedindex == 0 || isEvenWeek) $scope.questions[gebiedindex + 1].values[0].display = true;
                            else $scope.questions[gebiedindex + 2].values[0].display = true;
                        }
                    };
                    // Get value of follow up Stress/Vermoeidheid and write to DB
                    $scope.gebied_answer = {};
                    $scope.changedD = function(val, subgebied, questionNr, gebiedindex, vraagindex) {
                        firebase.database().ref().child('responses/' + username + '/weekly/week-' + week + '/' + subgebied).set({
                                'question_nm': questionNr,
                                value: val
                            });
                        // Set displays
                        var numberOfQuests = $scope.questions[gebiedindex].values.length;
                        $scope.questions[gebiedindex].values[vraagindex].display = false;
                        if (vraagindex !== numberOfQuests - 1) $scope.questions[gebiedindex].values[vraagindex + 1].display = true;
                        else {
                            if (gebiedindex == 0 || isEvenWeek) $scope.questions[gebiedindex + 1].values[0].display = true;
                            else if (gebiedindex == 1) $scope.questions[gebiedindex + 2].values[0].display = true;
                            else preEvaluate(week);
                        }
                    }
                }
            });

            function preEvaluate(week) {
                // 6 weeks taking into account, because of alternating display of fysieke_gezondheid and gezondheid
                var drempel = week >= testPeriod * 2 ? testPeriod * 2 : testPeriod;
                var periode = week >= testPeriod * 2 ? testPeriod * 2 : week;
                if (week >= drempel) {
                    data[1].responses.then(function(responses) {
                        var lastXresults = [];
                        for (var x = 0; x < periode; x++) {
                            var weekNr = week - x;
                            var weekStr = 'week-' + weekNr;
                            lastXresults.push({
                                    week: weekNr,
                                    values: responses.weekly[weekStr]
                                });
                        }
                        evaluate(week, maxscore, username, lastXresults, testPeriod);
                    });
                } else {
                    $location.path('/profiel');
                }
            }
        });

        function evaluate(week, maxscore, username, lastXresults, testPeriod) {
            console.log(lastXresults);
            var treshold = 0.6;
            // Dit ook aanpassen en uit database halen zodat minder foutgevoelig wordt!!!!
            var scores = {
                competentie: 0,
                sociale_steun: 0,
                zelfstandigheid: 0,
                vermoeidheid: 0,
                werkdruk: 0,
                fysieke_gezondheid: 0,
                gezondheid: 0
            };
            var gebieden = Object.keys(scores);
            var store = [];
            for (var i = 0; i < lastXresults.length; i++) {
                for (var subgebied in lastXresults[i].values) {
                    var testgebied = undefined;
                    if (subgebied == 'fysieke_gezondheid_followup_basis') {
                        var testgebied = 'fysieke_gezondheid';
                        var value = lastXresults[i].values[subgebied] == 'y' ? 3 : 0;
                    } else if (subgebied == 'gezondheid_followup_basis') {
                        var testgebied = 'gezondheid';
                        var value = lastXresults[i].values[subgebied] == 'y' ? 2.5 : 0;
                    } else if (gebieden.indexOf(subgebied) !== -1 && i < testPeriod) {
                        var testgebied = subgebied;
                        var value = parseInt(lastXresults[i].values[subgebied].value);
                    }
                    if (testgebied !== undefined && (lastXresults[i].values[subgebied].value !== undefined || subgebied.indexOf('followup_basis') !== -1)) {
                        scores[testgebied] += value;
                        if (scores[testgebied] > treshold * maxscore && store.indexOf(testgebied) == -1) store.push(testgebied);
                    }
                }
            }
            // Sort testgebieden on highest score. (Only highest testgebied will be handled in tests.js.)
            var scoresSorted = Object.keys(scores).sort(function(a, b) {
                return scores[b] - scores[a];
            });
            var storeSorted = [];
            for (var j = 0; j < scoresSorted.length; j++) {
                if (store.indexOf(scoresSorted[j]) !== -1) storeSorted.push(scoresSorted[j]);
            }

            if (store.length == 0) $location.path('/profiel');
            else {
                Store.setResults('testgebieden', storeSorted);
                $location.path('/tests');
            }
        }

        function executeCheck(week, responses) {
            // This function checks if user can do weekly checkup. He can if (1) weekNr reference in URL is correct or (2) if last checkup is done more than 7 days ago
            // If there is a weeknr URL parameter, then check if weeknr corresponds with week.
            if (weekRef !== undefined) {
                if (weekRef < week) $scope.duplicatedisplay = true;
                else if (weekRef > week) $location.path('/weekly');
                else $scope.welcomedisplay = true;
            } else {
                // Else do a check on date: now versus last weekly in DB. If smaller then 7 days then reject (in test 2)
                if (week > 1) {
                    var lastWeekly = 'week-' + (week - 1);
                    var datumLString = responses[lastWeekly].datum;
                    var datumL = Date.parse(datumLString);
                    var timeDiff = Math.abs(now.getTime() - datumL);
                    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                    console.log(diffDays);
                    // TODO: TESTFASE: URL-parameter even misbruiken om om 2 (7) dagen check heen te werken. Die weekRef condition in PRODUCTIE weghalen
                    if (diffDays < 2 && weekRef !== 'test') $scope.duplicatedisplay = true;
                    else $scope.welcomedisplay = true;
                } else $scope.welcomedisplay = true;
            }
        }

        $scope.startTest = function() {
            var notify = angular.element(document.getElementsByClassName("notify"));
            notify.remove();
            $scope.questionsdisplay = true;
        }

        $scope.getProfile = function() {
            $location.path('/profiel');
        }

        $scope.getNulmeting = function() {
            $location.path('/nulmeting');
        }
    }
