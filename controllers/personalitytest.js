    angular.module('workfit')
        .controller('PersonalityController', PersonalityCtrl);

    function PersonalityCtrl($scope, $location, $routeParams, QuestionsNew, ResponsesPerUser, ResponseOptions, Store, Gebieden, Functions) {
        var inFlow = $routeParams.type;
        var nowString = Functions.setWfDate();
        // Set notification date for nulmeting reminder on days + 3 (in test 1)
        var datumRemString = Functions.setWfDate('notification', 1);
        $scope.questions = [];

        Promise.all([QuestionsNew, ResponsesPerUser]).then(function(data) {
            var questions = data[0].persoonlijkheidstest;
            var traitSpecs = data[0].profile.personality;
            var username = data[1].username;

            // Check if personality test is already finished
            data[1].responses.then(function(responses) {
                document.getElementById('spinner').style.display = 'none';
                // Get the personality test responses;
                var responses = responses.personality;
                var status = responses !== undefined ? responses.status : undefined;
                var isFinished = status == 'closed' ? true : false;
                var storedResult = Store.getResults().resultgebied;
                var redirectType = $routeParams.type !== undefined ? $routeParams.type : (storedResult == undefined ? 'results' : undefined);
                if (isFinished) evaluate(username, responses, traitSpecs, isFinished, redirectType); // In this case test questions can be skipped
                else {
                    // Define start function first, because it is a $scope function
                    $scope.startPersonality = function(type) {
                        if (type == 'new') {
                            firebase.database().ref().child('responses/' + username + '/personality/status').set('unfinished');
                            firebase.database().ref().child('responses/' + username + '/personality/datum').set(nowString);
                            firebase.database().ref().child('notifications/' + username + '/messageType').set('personalityreminder');
                            firebase.database().ref().child('notifications/' + username + '/datum').set(datumRemString);
                        }
                        var index = type == 'new' ? 0 : count;
                        var notify = angular.element(document.getElementsByClassName("notify"));
                        notify.remove();
                        $scope.questionsdisplay = true;
                        $scope.questions[index].display = true;
                    }

                    // Firstly get the questions in the question scope
                    for (var i = 0; i < questions.length; i++) {
                        // Fill question object with key/values
                        $scope.questions.push({
                                q: questions[i].q,
                                gebied: questions[i].gebied,
                                pos: questions[i].pos,
                                mixed: questions[i].mixed,
                                display: false
                            });
                    }
                    $scope.questionsLength = $scope.questions.length;
                    // And display the right question. If new user first question is displayed
                    if (responses == null) {
                        if (inFlow == 'flow') $scope.startfromflowdisplay = true;
                        else $scope.startPersonality('new');
                    } else {
                        // Count which questions are already answered
                        var count = 0;
                        for (var qnr in responses) {
                            if (qnr !== 'status' && qnr !== 'datum') count = count + 1;
                        }
                        // Evaluate when all questions are answered. Else show first unanswered question
                        if (count == $scope.questions.length) evaluate(username, responses, traitSpecs, isFinished, redirectType);
                        else $scope.existingdisplay = true;
                    }

                    // Scopes for the response options. These can be managed in the ResponseOptions service
                    $scope.posvalues = ResponseOptions.posvalues2p;
                    $scope.negvalues = ResponseOptions.negvalues2p;

                    // Write answers to Firebase
                    $scope.checkedquestion = [];
                    $scope.changedRP = function(valRP, gebied, nr, mixed) {
                        const refRP = firebase.database().ref().child('responses/' + username + '/personality/' + nr);
                        refRP.set({
                                q: valRP,
                                gebied: gebied,
                                mixed: mixed
                            });
                        // Set display of next question
                        $scope.questions[nr].display = false;
                        if (nr < $scope.questions.length - 1) $scope.questions[nr + 1].display = true;
                        // In case of last question, evaluate responses
                        else {
                            firebase.database().ref().child('responses/' + username + '/personality/status').set('closed');
                            data[1].responses.then(function(responses) {
                                evaluate(username, responses.personality, traitSpecs, isFinished, redirectType);
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
                    }
                    $scope.nextQuestion = function(nr) {
                        $scope.questions[nr].display = false;
                        $scope.questions[nr + 1].display = true;
                    }
                }
            });
        });

        function evaluate(username, responses, traits, isFinished, redirectType) {
            var isRedirect = redirectType == undefined ? false : true;
            if (!isFinished || isRedirect) {
                console.log('Case 1 personalitytest: Test is nog niet af (' + !isFinished + ') OF het is een redirect van results/advies (' + isRedirect + ').');
                var scores = {
                    extraversie: {
                        max: 0,
                        real: 0,
                        traitChars: []
                    },
                    vriendelijkheid: {
                        max: 0,
                        real: 0,
                        traitChars: []
                    },
                    zorgvuldigheid: {
                        max: 0,
                        real: 0,
                        traitChars: []
                    },
                    emotionele_stabiliteit: {
                        max: 0,
                        real: 0,
                        traitChars: []
                    },
                    intellectuele_autonomie: {
                        max: 0,
                        real: 0,
                        traitChars: []
                    }
                };

                // Fill max en real scores in scores object by going through responses
                for (var response in responses) {
                    if (response !== 'status' && response !== 'datum') {
                        var value = responses[response].q;
                        var mixed = responses[response].mixed;
                        for (var j = 0; j < responses[response].gebied.length; j++) {
                            var factor = j == 0 ? 1 : 0.5;
                            scores[responses[response].gebied[j]].max = scores[responses[response].gebied[j]].max + factor;
                            if (mixed && j == 1) scores[responses[response].gebied[j]].real = scores[responses[response].gebied[j]].real - factor * value;
                            else scores[responses[response].gebied[j]].real = scores[responses[response].gebied[j]].real + factor * value;
                        }
                    }
                }

                // Based on final real score (>0 or <0) add trait characteristics to scores object
                for (var trait in scores) {
                    scores[trait].name = Gebieden.traitsnamen[trait];
                    var score = scores[trait].real;
                    if (score < -3) {
                        scores[trait].traitChars = traits[trait].low;
                        scores[trait].traitResults = traits[trait].result.low;
                    } else if (score > 3) {
                        scores[trait].traitChars = traits[trait].high;
                        scores[trait].traitResults = traits[trait].result.high;
                    } else {
                        scores[trait].traitChars = traits[trait].middle;
                        scores[trait].traitResults = traits[trait].result.middle;
                    }
                }

                Store.setResults('personality', scores);
                if (redirectType == 'results') $location.path('/personalityresults');
                else $location.path('/advies');
            } else {
                console.log('Case 2 personalitytest: Test is al gedaan en het is geen redirect van results/advies.')
                $scope.againdisplay = true;
            }
        }

        $scope.getResults = function() {
            $location.path('/personalityresults');
        }
    }
