    angular.module('workfit')
        .controller('AdviceController', AdviceCtrl);

    function AdviceCtrl($scope, $location, $routeParams, $sce, ResponsesPerUser, Store, Gebieden, Functions) {
        // Distinction between (1) diagnosis (this page) (based on gebied, personality and niveaus) and (2) user's solution and roadmap (also based on testnr).
        var storedTestnr = Store.getResults().testnr; // Set in /tests (if coming from 'losse' test: storedTestnr = null). If coming from results-archief: storedTestnr = undefined
        var storedGebied = Store.getResults().resultgebied // Set in /results. If direct to /advice: storedGebied = undefined
        var storedPersnl = Store.getResults().personality; // Set in /personalitytest
        var storedNiveau = Store.getResults().niveaus; // Set in /results.
        var urlGebied = $routeParams.gebied; // For advice archive detail - TODO: WORDT TOCH NIET GEBRUIKT??
        $scope.urlgebied = urlGebied; // For uitleg movie
        var urlTestnr = $routeParams.tid; // For advice archive detail - TODO: WORDT TOCH NIET GEBRUIKT??
        var now = new Date();
        var nowString = now.toISOString();
        // Set notification date for test reminder on days + 3 (in test 1)
        var datumRem = new Date();
        datumRem.setDate(datumRem.getDate() + 1);
        var datumRemString = datumRem.toISOString().split('T')[0];

        var testlog = {
            resultgebied: storedGebied,
            testresults: Store.getResults().testresults,
            testnr: storedTestnr,
            persoonlijkheid: Store.getResults().personality,
            niveaus: Store.getResults().niveaus
        };
        console.log(testlog);

        // Define types
        // TODO: BIJ EEN REDIRECT VAN GEBIED/NR WORDEN NIVEAUS NIET UIT STORE OVERSCHREVEN: HIJ ZOU EIGENLIJK NAAR 'REDIRECTED' MOETEN GAAN, MAAR GAAT NAAR NULL/UITVAL WANT NIVEAUS !== UNDEFINED
        // TODO: ALS JE HET FILMPJE HELEMAAL AF LAAT LOPEN DAN WORDEN BULLETS NIET GETOOND
        if (urlGebied == 'uitleg') getUitleg();
        else if (urlGebied !== undefined && urlTestnr !== undefined) {
            Store.setResults('testnr', urlTestnr);
            Store.setResults('resultgebied', urlGebied);
            if (storedNiveau !== undefined) Store.setResults('niveaus', undefined);
            if (urlGebied == 'vermoeidheid' || urlGebied == 'fysieke_gezondheid' || urlGebied == 'gezondheid') $location.path('/advies'); // Redirect to self. Ensures that personality will be set in store
            else $location.path('/personalitytest/flow');
        } else if (storedGebied !== undefined && storedTestnr == 'null' && storedNiveau !== undefined) preAdvice('nulltest', storedGebied, storedTestnr, storedPersnl, storedNiveau);
        else if (storedGebied !== undefined && storedTestnr !== undefined && storedNiveau !== undefined) preAdvice('uitval', storedGebied, storedTestnr, storedPersnl, storedNiveau);
        else if (storedGebied !== undefined && storedTestnr !== undefined && storedNiveau == undefined) preAdvice('redirected', storedGebied, storedTestnr, storedPersnl, storedNiveau);
        else $location.path('/results');

        function preAdvice(type, gebied, testnr, personality, niveaus) {
            ResponsesPerUser.then(function(data) {
                document.getElementById('spinner').style.display = 'none';
                var username = data.username;
                data.responses.then(function(responses) {
                    var responsesAdv = responses.advies;
                    var responsesTests = responses.test;
                    switch (type) {
                        case 'uitval':
                        case 'nulltest':
                            doAdvice(gebied, testnr, personality, niveaus, username, type);
                            break;
                        case 'redirected':
                            var resultstr = 'test-' + testnr;
                            var resultset = responsesTests[gebied][resultstr];
                            resultset = Functions.rewriteDBResults(resultset, gebied, resultset.rewritten);
                            firebase.database().ref().child('questions/profile').once('value').then(function(snapshot) {
                                return snapshot.val();
                            }).then(function(niveaus) {
                                Functions.addNiveaus(resultset, niveaus[gebied]);
                                var niveausSingle = {
                                    youtube: niveaus.youtube,
                                    combotekst: niveaus.combotekst
                                };
                                niveausSingle[gebied] = resultset.niveaus;
                                Store.setResults('niveaus', niveausSingle);
                                console.log(niveausSingle);
                                doAdvice(gebied, testnr, personality, niveausSingle, username, type);
                            })
                            break;
                    }
                });
            });
        }

        function doAdvice(gebied, testnr, personality, niveaus, username, type) {
            // Note: Testnr is not being used in this function
            var testlog = {
                gebied: gebied,
                advnr: testnr,
                type: type,
                niveaus: niveaus
            };
            console.log(testlog);

            var niveausGeb = niveaus[gebied];
            var gebieden = Gebieden.gebieden;
            $scope.gebied = Gebieden.gebiedsnamen[gebied];

            function playMovie() {
                // Play instruction movie
                $scope.ytId = type == 'redirected' || type == 'rest' ? niveaus.youtube[gebied] : Store.getResults().niveaus.youtube[gebied];
                $scope.playerVars = {
                    showinfo: 0,
                    autoplay: 1
                };
                $scope.movieDisplay = true;
            }
            if (type == 'redirected' || type == 'rest') {
                $scope.$apply(function() {
                    playMovie();
                });
            } else playMovie();
            $scope.$on('youtube.player.ended', function($event, player) {
                $scope.movieDisplay = false;
                $scope.coachingDisplay = true;
            });

            // Skip instruction movie and show advice
            $scope.skipMovie = function() {
                // Remove movie display and show coaching
                var movieDiv = angular.element(document.querySelector('#movie'));
                movieDiv.remove();
                $scope.coachingDisplay = true;
            }

            // Get specific bullets based on traits
            var traits = {
                'competentie': ['zorgvuldigheid', 'intellectuele_autonomie'],
                'sociale_steun': ['extraversie', 'vriendelijkheid'],
                'zelfstandigheid': ['zorgvuldigheid', 'intellectuele_autonomie'],
                'werkdruk': ['zorgvuldigheid']
            }
            $scope.bulletsP = [];
            $scope.bulletsR = [];
            var einst = '';
            if (gebied !== 'vermoeidheid' && gebied !== 'fysieke_gezondheid' && gebied !== 'gezondheid') {
                for (var i = 0; i < traits[gebied].length; i++) {
                    var traitChars = personality[traits[gebied][i]].traitChars;
                    var traitResults = personality[traits[gebied][i]].traitResults[gebied];
                    $scope.bulletsP = $scope.bulletsP.concat(traitChars);
                    $scope.bulletsR = $scope.bulletsR.concat(traitResults);
                }
                $scope.persDisplay = true;
                einst = personality['emotionele_stabiliteit'].traitChars[0] == 'low' ? niveaus.combotekst[gebied].extra : '';
            }
            var combotekst = niveaus.combotekst[gebied].main.replace("[es]", einst);
            $scope.combotekst = combotekst;

            // Get negative bullets from testresults gebied
            var treshold = 0.5;
            $scope.bulletsG = [];
            for (var onderdeel in niveausGeb) {
                var score = niveausGeb[onderdeel].score;
                var maxscore = niveausGeb[onderdeel].maxscore;
                if (score / maxscore < treshold) $scope.bulletsG.push(niveausGeb[onderdeel].value);
            }

            // Set reminders for ontwikkelingstraject
            if (storedTestnr !== null || storedTestnr !== undefined) {
                firebase.database().ref().child('notifications/' + username + '/messageType').set('advicereminder');
                firebase.database().ref().child('notifications/' + username + '/datum').set(datumRemString);
            }

            $scope.getSolution = function() {
                $location.path('/verbetertraject');
            }
        }

        function getUitleg() {
            document.getElementById('spinner').style.display = 'none';

            function playMovie() {
                // Play instruction movie
                $scope.ytId = '8G2tOgjC0HU';
                $scope.playerVars = {
                    showinfo: 0,
                    autoplay: 1
                };
                $scope.movieDisplay = true;
            }
            playMovie();

            $scope.getFaq = function() {
                $location.path('/faq');
            }
            $scope.getBack = function() {
                $location.path('/nulmeting');
            }
        }
    }
