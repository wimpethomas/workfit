angular.module('workfit')
.service('Functions', getFunction);

function getFunction(Gebieden, ResponseOptions) {

  var lastResultPerGebied = function(responses, gebied, type, status) {
    // Returns last started/closed/all [type] results data per gebied ordered on datum
    var dateProp = status == 'all' ? 'datum' : (status == 'started' ? 'datum_start' : 'datum_end');
    var resultsObj = responses !== undefined ? responses[gebied] : undefined;
    var latest = [undefined, 0]; // latest[0] = name, latest[1] = dateProp
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

  function lastUnfinishedResult(responses) {
    // Return charcteristics of last unfinished [type] - excluding a null-[type] (losse test)
    var gebiedenInDB = responses == undefined ? 0 : Object.keys(responses); // Array with gebieden in db /[type]
    var latest = [undefined, 0, undefined]; // latest[0] = [type]Str, latest[1] = datum_start, latest[2] = gebied
    for (var i = 0; i < gebiedenInDB.length; i++) {
      var resultsObj = responses == undefined ? undefined : responses[gebiedenInDB[i]]; // Object on level /advies/[gebied]
      for (result in resultsObj) {
        var dateResult = resultsObj[result].datum_start !== undefined ? Date.parse(resultsObj[result].datum_start) : 0;
        if (dateResult > latest[1] && resultsObj[result].status == 'unfinished' && result.indexOf('null') == -1) latest = [result, dateResult, gebiedenInDB[i]]; // Only get an unfinished, no null [type]
      }
    }
    if (latest[0] !== undefined) {
      var resultStr = latest[0];
      var resultNr = resultStr.split('-')[1];
      if (resultNr == 'null') resultNr = null;
      else resultNr = parseInt(resultNr);
      var results = responses[latest[2]][latest[0]];
      results.newadv = false;
      return {
        gebied: latest[2],
        results: results,
        resultnr: resultNr,
        resultstr: resultStr
      };
    }
    else return undefined;
  }

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

  var rewriteDBResults = function(resultset, gebied, rewritten) {
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

  var setWfDate = function(type, days) {
    var datum = new Date();
    if (type == 'notification') {
      datum.setDate(datum.getDate() + days);
      return datum.toISOString().split('T')[0];
    } else return datum.toISOString();
  }

  var getPersScores = function(responses, traits, ref) {
    var scores = {
      extraversie: {max: 0, real: 0, traitChars: []},
      vriendelijkheid: {max: 0, real: 0, traitChars: []},
      zorgvuldigheid: {max: 0, real: 0, traitChars: []},
      emotionele_stabiliteit: {max: 0, real: 0, traitChars: []},
      intellectuele_autonomie: {max: 0, real: 0, traitChars: []}
    };

    // Fill max en real scores in scores object by going through responses
    for (var response in responses) {
      if (response !== 'status' && response !== 'datum' && response !== 'shared') {
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

    // Based on final real score (>3 or <-3) add trait characteristics to scores object
    // TODO: set low (<-3), middle (-3<x<3) and high (>3) in general settings
    for (var trait in scores) {
      scores[trait].name = Gebieden.traitsnamen[trait];
      var score = scores[trait].real;
      if (score < -3) {
        scores[trait].traitChars = traits[trait].low;
        if (ref == 'pers') scores[trait].traitResults = traits[trait].result.low;
        else if (ref == 'func') scores[trait].traitBoss = traits[trait].leidinggevende.low;
      } else if (score > 3) {
        scores[trait].traitChars = traits[trait].high;
        if (ref == 'pers') scores[trait].traitResults = traits[trait].result.high;
        else if (ref == 'func') scores[trait].traitBoss = traits[trait].leidinggevende.high;
      } else {
        scores[trait].traitChars = traits[trait].middle;
        if (ref == 'pers') scores[trait].traitResults = traits[trait].result.middle;
      }
    }
    return scores;
  }

  var getResponsesPerFuncUser = function(user, dbentry) {
    if (user.indexOf('@') > -1){
      var user = user.replace('.', '_');
      user = user.replace('@', '_');
    }
    return {
      username: user,
      data: firebase.database().ref().child('responses/' + user + '/' + dbentry).once('value')
    };
  }

  function getFuncTrajects(responses) {
    // Return status and number of last traject and statusses of test within.
    var funcObj = responses == undefined ? undefined : responses; // Object on level /functionering
    var latest = [undefined, 0]; // latest[0] = trajectName, latest[1] = datum
    for (func in funcObj) {
      var dateFunc = funcObj[func].datum !== undefined ? Date.parse(funcObj[func].datum) : 0;
      if (dateFunc > latest[1]) latest = [func, dateFunc];
    }
    if (latest[0] !== undefined){
      var funcNr = latest[0].split('-')[1];
      var statusLastFunc = funcObj[latest[0]].status;
      var funcArr = Object.keys(funcObj); // Array with trajects in db /functionering
      var nrOfTests = funcArr.length;
      // Next variables are extra compared to other function in /tests
      var statusSlaveTest = funcObj[latest[0]].test.werknemer == undefined ? undefined : funcObj[latest[0]].test.werknemer.status;
      var statusBossTest = funcObj[latest[0]].test.leidinggevende.status;
      var statusAgreements = funcObj[latest[0]].afspraken == undefined ? undefined : funcObj[latest[0]].afspraken.status;
      return {
        status: statusLastFunc,
        amount: nrOfTests,
        funcnr: parseInt(funcNr),
        statusSlaveTest: statusSlaveTest,
        statusBossTest:statusBossTest,
        statusAgreements: statusAgreements
      };
    } else return undefined;
  }

  function getFuncScores(responses){
    var valueRange = ResponseOptions.posvalues.length - 1;
    var scores = [];
    for (var onderdeel in responses) {
      var values = Object.values(responses[onderdeel]);
      var maxScore = values.length * valueRange;
      var sum = values.reduce(function(a, b) {
        return parseInt(a) + parseInt(b);
      }, 0);
      if (sum > -1) {
        scores.push({
          onderdeel: onderdeel,
          totaalScore: sum,
          maxScore: maxScore
        });
      }
    }
    return scores;
  }

  function valToKey(val, obj) {
    for (var key in obj) {
      if (obj[key] == val) return key;
    }
    return false;
  }

  return {
    lastResultPerGebied: lastResultPerGebied,
    metadataPerResult: metadataPerResult,
    rewriteDBResults: rewriteDBResults,
    addNiveaus: addNiveaus,
    lastUnfinishedResult: lastUnfinishedResult,
    setWfDate: setWfDate,
    getPersScores: getPersScores,
    getResponsesPerFuncUser: getResponsesPerFuncUser,
    getFuncTrajects: getFuncTrajects,
    getFuncScores: getFuncScores,
    valToKey: valToKey
  };
}
