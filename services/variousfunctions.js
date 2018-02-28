    angular.module('workfit')
        .service('Functions', getFunction);

    function getFunction(Gebieden) {
        var lastResultPerGebied = function(responses, gebied, type, status) {
            // Returns last started/closed/all [type] results data per gebied ordered on datum
            var dateProp = status == 'all' ? 'datum' : (status == 'started' ? 'datum_start' : 'datum_end');
            var resultsObj = responses[gebied]; // Object on level /[type]/[gebied]
            var latest = [undefined, 0]; // latest[0] = testName, latest[1] = dateProp
            var amountPerStatus = {
                pending: 0,
                unfinished: 0,
                in_coaching: 0,
                closed: 0
            };
            for (result in resultsObj) {
                var dateResult = resultsObj[result][dateProp] !== undefined ? Date.parse(resultsObj[result][dateProp]) : 0;
                if (dateResult > latest[1]) latest = [result, dateResult];
                amountPerStatus[resultsObj[result].status] += 1;
            }
            if (latest[0] !== undefined) {
                var resultStr = latest[0];
                var resultNr = resultStr.split('-')[1];
                var hasNullResult = false;
                if (resultNr == 'null') {
                    resultNr = null;
                    hasNullResult = true;
                } else resultNr = parseInt(resultNr);
                var amountOfResults = Object.keys(resultsObj).length;
                var results = resultsObj[resultStr];
                if (type == 'advies') results.newadv = false;
                return {
                    results: results,
                    resultnr: resultNr,
                    resultstr: resultStr,
                    amountofresults: amountOfResults,
                    amountofresultsfor: amountPerStatus,
                    hasnullresult: hasNullResult
                };
            } else return undefined;
        };

        var metadataPerResult = function(responses, gebied, type) {
            // Returns metadata of all results in given gebied (object with metadata in array of results)
            var resultsObj = responses[gebied]; // Object on level /[type]/[gebied]
            var metadata = [];
            for (result in resultsObj) {
                var datum_start = resultsObj[result].datum_start == undefined ? undefined : resultsObj[result].datum_start.split('T')[0];
                var datum_end = resultsObj[result].datum_end == undefined ? undefined : resultsObj[result].datum_end.split('T')[0];
                metadata.push({
                        resultstr: result,
                        resultnr: result.split('-')[1],
                        datum_end: datum_end,
                        datum_start: datum_start,
                        status: resultsObj[result].status
                    });
            }
            return metadata;
        };

        rewriteDBResults = function(resultset, gebied, rewritten) {
            if (!rewritten) {
                var onderdelenObj = Gebieden.onderdelen[gebied];
                var vals = resultset.vals;
                for (var i = 0; i < vals.length; i++) {
                    var onderdeelId = vals[i].ond;
                    var onderdeel = onderdelenObj[onderdeelId];
                    resultset.vals[i] = {
                        onderdeel: onderdeel,
                        value: parseInt(vals[i].q)
                    };
                }
                resultset.rewritten = true;
            }
            return resultset;
        }

        var addNiveaus = function(resultset, niveaus) {
            var maxScorePerQuestion = 3; // Dit wellicht nog uit de ResponseOptions halen (array.length == 4) !!!!
            resultset.niveaus = {};
            var score = 0;
            var maxscore = 0;
            scoredArr = [];
            for (var nr in resultset.vals) {
                var onderdeel = resultset.vals[nr].onderdeel;
                var value = resultset.vals[nr].value;
                if (scoredArr.indexOf(onderdeel) !== -1) var inScored = true;
                else {
                    var inScored = false;
                    scoredArr.push(onderdeel);
                }
                if (inScored) {
                    score += value;
                    maxscore += maxScorePerQuestion;
                } else {
                    score = value;
                    maxscore = maxScorePerQuestion;
                }
                var scoreRatio = score / maxscore;
                var index = scoreRatio < 0.25 ? 0 : (scoreRatio < 0.5 ? 1 : (scoreRatio < 0.75 ? 2 : 3));
                if (niveaus[onderdeel] !== undefined) {
                    resultset.niveaus[onderdeel] = {};
                    resultset.niveaus[onderdeel].score = score;
                    resultset.niveaus[onderdeel].maxscore = maxscore;
                    resultset.niveaus[onderdeel].niveau = niveaus[onderdeel].niveau;
                    resultset.niveaus[onderdeel].value = niveaus[onderdeel].niveau[index];
                }
            }
            return resultset;
        }

        var lastUnfinishedResult = function(responses) {
            return responses;
        };

        var setWfDate = function(type, days) {
            var datum = new Date();
            if (type == 'notification') {
                datum.setDate(datum.getDate() + days);
                return datum.toISOString().split('T')[0];
            } else return datum.toISOString();
        }

        return {
            lastResultPerGebied: lastResultPerGebied,
            metadataPerResult: metadataPerResult,
            rewriteDBResults: rewriteDBResults,
            addNiveaus: addNiveaus,
            lastUnfinishedResult: lastUnfinishedResult,
            setWfDate: setWfDate
        };
    }
