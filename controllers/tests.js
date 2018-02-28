    angular.module('workfit')
        .controller('TestsController', TestsCtrl);

    function TestsCtrl($scope, $location, $routeParams, $firebaseObject, QuestionsNew, ResponsesPerUser, ResponseOptions, Store, Gebieden, Functions) {
        // Note: If a user exits screen after dropout on nulmeting/weekly, there is no tests in database. So after refreshing screen there is not an 'open' test.
        // Two variables that defines logic in /tests: (1) stored testgebieden, (2) gebieds URL parameter
        var storedGebieden = Store.getResults().testgebieden;
        var isTestDone = Store.getResults().testresults == undefined ? false : true;
        var urlGebied = $routeParams.gebied;
        var urlTestNr = $routeParams.tid;
        var nowString = Functions.setWfDate();
        // Set notification date for test reminder on days + 3 (in test 1)
        var datumRemString = Functions.setWfDate('notification', 1);

        // Define testgebieden en type
        if (urlTestNr !== undefined) preTest('unfinished', [urlGebied], parseInt(urlTestNr));
        else if (storedGebieden !== undefined && !isTestDone) preTest('uitval', storedGebieden, undefined);
        else if (urlGebied !== undefined) preTest('nulltest', [urlGebied], undefined);
        else if (storedGebieden !== undefined && isTestDone) preTest('testdone', storedGebieden, undefined);
        else preTest('rest', undefined, undefined);

        function testsPerGebied(responses, gebied) {
            // Return status of last test per gebied and the number of tests - excluding a null-test (loss test)
            var testsObj = responses == undefined ? undefined : responses[gebied]; // Object on level /test/[gebied]
            var latest = [undefined, 0]; // latest[0] = testName, latest[1] = datum
            for (test in testsObj) {
                var dateTest = testsObj[test].datum !== undefined ? Date.parse(testsObj[test].datum) : 0;
                if (dateTest > latest[1] && test.indexOf('null') == -1) latest = [test, dateTest];
            }
            var testNr = latest[0] == undefined ? undefined : latest[0].split('-')[1];
            var statusLastTest = latest[0] == undefined ? undefined : testsObj[latest[0]].status;
            var indexCorr = 'test-null' in testsObj ? 1 : 0;
            var testsArr = Object.keys(testsObj); // Array with tests in db /test/[gebied]
            var nrOfTests = testsArr.length - indexCorr;
            return {
                status: statusLastTest,
                amount: nrOfTests,
                testnr: parseInt(testNr)
            };
        }

        function testOptions(type, gebieden, testNr, username) {
            $scope.notests = Gebieden.gebiedsnamen;
            var gebied = gebieden == undefined ? undefined : gebieden[0];
            $scope.gebied = gebieden == undefined ? undefined : Gebieden.gebiedsnamen[gebied];
            switch (type) {
                case 'notests':
                    $scope.notestsdisplay = true;
                    break;
                case 'testdone':
                    $scope.testdonedisplay = true;
                    break;
                case 'incoaching':
                    $scope.incoachingdisplay = true;
                    $scope.getAdvice = function() {
                        $location.path('/advies/' + gebieden[0] + '/' + testNr);
                    }
                    break;
                case 'unfinished':
                    $scope.text = 'Er staat een niet afgemaakte test open op het gebied ' + $scope.gebied;
                    $scope.unfinisheddisplay = true;
                    $scope.finishTest = function() {
                        $location.path('/tests/' + gebieden[0] + '/' + testNr);
                    }
                    break;
                case 'pending':
                    $scope.text = 'In een eerder stadium is ' + $scope.gebied + ' als risicogebied geconstateerd voor wat betreft gezondheid en welzijn op het werk. We hebben een aantal aanvullende vragen klaar staan om hier beter zicht op te krijgen.';
                    $scope.unfinisheddisplay = true;
                    $scope.finishTest = function() {
                        $location.path('/tests/' + gebieden[0] + '/' + testNr);
                    }
                    break;
                case 'uitval':
                    $scope.uitvaldisplay = true;
                    $scope.getNext = function() {
                        $scope.uitvaldisplay = false;
                        doTest(gebieden, testNr, username, type, 0);
                    }
                    break;
            }
        }

        function preTest(type, gebieden, tid) {
            ResponsesPerUser.then(function(data) {
                var username = data.username;
                data.responses.then(function(responses) {
                    document.getElementById('spinner').style.display = 'none';
                    var responses = responses.test;
                    var gebiedenInDB = responses == undefined ? 0 : Object.keys(responses); // Array with testgebieden in db /test
                    switch (type) {
                        case 'unfinished':
                            console.log('Case 1: Onafgemaakte of pending test: er is een testnummer als URL-parameter. Je komt vanaf: Maak onafgemaakte test af (case 4b)');
                            Store.setResults('testnr', tid);
                            // Check URL-parameters
                            var gebied = gebieden[0];
                            var resultStr = 'test-' + tid;
                            var status = responses[gebied][resultStr] == undefined ? false : responses[gebied][resultStr].status;
                            type = status == 'pending' ? 'pending' : 'unfinished';
                            if (status == 'unfinished' || status == 'pending') {
                                // Check which questions are already answered
                                var vals = responses[gebied][resultStr].vals;
                                var nrOfAnsw = vals == undefined ? 0 : vals.length;
                                doTest([gebied], tid, username, type, nrOfAnsw);
                            } else $location.path('/tests');
                            break;
                        case 'nulltest':
                            console.log('Case 2: Losse test voor gebied: er is een gebied als URL-parameter. Je komt vanaf: Maak losse test (case 4a)');
                            var gebied = gebieden[0];
                            doTest([gebied], null, username, type, 0);
                            break;
                        case 'uitval':
                            console.log('Case 3: Test bij uitval: er zitten testgebieden in de Store, maar nog geen testresults.');
                            var gebied = gebieden[0];
                            var testNr = 1;
                            for (var i = 0; i < gebiedenInDB.length; i++) {
                                var tpg = testsPerGebied(responses, gebiedenInDB[i]); //TODO TESTSPERGEBIED IN FUNCTIONS
                                if (gebiedenInDB[i] == gebied && (tpg.status == 'unfinished' || tpg.status == 'pending')) {
                                    testOptions('unfinished', [gebied], tpg.testnr, username);
                                    return;
                                }
                                testNr += tpg.amount;
                            }
                            testOptions(type, gebieden, testNr, username);
                            break;
                        case 'testdone':
                            console.log('Case 4: Test al in sessie gemaakt: er zitten testgebieden in de Store, maar test is al gedaan.');
                            testOptions(type, gebieden, undefined, username);
                            break;
                        case 'rest':
                            console.log('Case 5: Testarchief: er is niets bekend. Mogelijkheden: (a) Maak losse test of (b) Maak onafgemaakte test af');
                            var isPending = false;
                            var isInCoaching = false;
                            for (var i = 0; i < gebiedenInDB.length; i++) {
                                var tpg = testsPerGebied(responses, gebiedenInDB[i]); //TODO TESTSPERGEBIED IN FUNCTIONS
                                if (tpg.status == 'unfinished') {
                                    testOptions('unfinished', [gebiedenInDB[i]], tpg.testnr, username); // Use case: notification reminders
                                    return;
                                } else if (tpg.status == 'pending') {
                                    isPending = true;
                                    var gebiedP = gebiedenInDB[i];
                                    var testNrP = tpg.testnr;
                                } else if (tpg.status == 'in_coaching') {
                                    isInCoaching = true;
                                    var gebiedC = gebiedenInDB[i];
                                    var testNrC = tpg.testnr;
                                }
                            }
                            if (isInCoaching) testOptions('incoaching', [gebiedC], testNrC, username); // Use case: there is a current coaching traject
                            else if (isPending) testOptions('pending', [gebiedP], testNrP, username); // Use case: notification after closure advice
                            else testOptions('notests', undefined, undefined, username);
                            break;
                    }
                });
            });
        }

        function doTest(gebieden, testNr, username, type, nrOfAnsw) {
            var gebied = gebieden[0];
            var onderdelenObj = Gebieden.onderdelen[gebied];
            // Write testId to Store
            Store.setResults('testnr', testNr);
            $scope.testnr = testNr;
            $scope.questions = [];

            QuestionsNew.then(function(data) {
                var questions = data.testen[gebied];
                // Get the questions
                for (var i = 0; i < questions.length; i++) {
                    // Fill question object with key/values
                    $scope.questions.push({
                            q: questions[i].q,
                            pos: questions[i].pos,
                            ro: questions[i].ro,
                            display: false
                        });
                }
                $scope.questions[nrOfAnsw].display = true;
                $scope.questionsLength = $scope.questions.length;

                // Make a store object for testgebied, which stores onderdeel en score
                var store = {};
                store[gebied] = {};
                for (var i = 0; i < questions.length; i++) {
                    store[gebied][i] = {
                        onderdeel: questions[i].gebied,
                        value: 0
                    };
                }

                // Write setup for tests to Firebase
                for (var g = 0; g < gebieden.length; g++) {
                    var testId = testNr == null ? testNr : testNr + g;
                    firebase.database().ref().child('responses/' + username + '/test/' + gebieden[g] + '/test-' + testId + '/datum').set(nowString);
                    if (type !== 'nulltest') {
                        if (g == 0) {
                            if (type !== 'unfinished') firebase.database().ref().child('responses/' + username + '/test/' + gebieden[g] + '/test-' + testId + '/status').set('unfinished');
                            if (type !== 'unfinished') firebase.database().ref().child('responses/' + username + '/test/' + gebieden[g] + '/test-' + testId + '/datum_start').set(nowString);
                            // Update notification settings to test reminder
                            firebase.database().ref().child('notifications/' + username + '/messageType').set('testreminder');
                            firebase.database().ref().child('notifications/' + username + '/datum').set(datumRemString);
                        } else firebase.database().ref().child('responses/' + username + '/test/' + gebieden[g] + '/test-' + testId + '/status').set('pending');
                    } else firebase.database().ref().child('responses/' + username + '/test/' + gebieden[g] + '/test-' + testId + '/datum_start').set(nowString);
                }

                // Scopes for the response options. These can be managed in the ResponseOptions service
                $scope.posvalues = ResponseOptions.posvalues;
                $scope.negvalues = ResponseOptions.negvalues;

                // Write answers to Firebase
                $scope.checkedquestion = [];
                $scope.changed = function(val, nr) {
                    store[gebied][nr].value = parseInt(val);
                    var onderdeel = store[gebied][nr].onderdeel;
                    var onderdeelId = valToKey(onderdeel, onderdelenObj);
                    firebase.database().ref().child('responses/' + username + '/test/' + gebied + '/test-' + testNr + '/vals/' + nr).set({
                            q: val,
                            ond: onderdeelId
                        });
                    // Set display of next question
                    $scope.questions[nr].display = false;
                    if (nr < $scope.questions.length - 1) $scope.questions[nr + 1].display = true;
                    // In case of last question
                    else {
                        // Get date and write datum_end to database and change status to in_coaching
                        var datumEnd = new Date();
                        datumEnd = datumEnd.toISOString();
                        firebase.database().ref().child('responses/' + username + '/test/' + gebied + '/test-' + testNr + '/datum_end').set(datumEnd);
                        firebase.database().ref().child('responses/' + username + '/test/' + gebied + '/test-' + testNr + '/status').set('in_coaching');
                        // Store results and go to next step
                        Store.setResults('testresults', store);
                        $location.path('/results');
                    }
                    // Set a checked mark when question is answered - with timeout because of 0,5 second animation
                    setTimeout(function() {
                        $scope.checkedquestion[nr] = true;
                    }, 500);
                };

                $scope.prevQuestion = function(nr) {
                    $scope.questions[nr].display = false;
                    $scope.questions[nr - 1].display = true;
                }
                $scope.nextQuestion = function(nr) {
                    $scope.questions[nr].display = false;
                    $scope.questions[nr + 1].display = true;
                }
            });
        }

        $scope.getTest = function(gebiedI) {
            $location.path('/tests/' + gebiedI);
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
