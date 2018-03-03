angular.module('workfit')
.controller('ProfileController', ProfileCtrl);

function ProfileCtrl($scope, $location, $routeParams, $firebaseObject, ResponsesPerUser, Gebieden) {
  var urlParam = $routeParams.type;

  function testsPerGebied(responses, gebied) {
    // Return results (as percentage) of last ended test per gebied - including a null-test (loss test)
    var testsObj = responses == undefined ? undefined : responses[gebied]; // Object on level /test/[gebied]
    var latest = [undefined, 0]; // latest[0] = testName, latest[1] = datum_end
    for (test in testsObj) {
      var dateTest = testsObj[test].datum_end !== undefined ? Date.parse(testsObj[test].datum_end) : 0;
      if (dateTest > latest[1]) latest = [test, dateTest];
    }
    if (testsObj == undefined || latest[1] == 0) return undefined;
    else {
      var vals = testsObj[latest[0]].vals;
      var score = 0;
      var maxscore = 0;
      for (var i = 0; i < vals.length; i++) {
        score += parseInt(vals[i].q);
        maxscore += 3;
      }
      return {
        score: score,
        maxscore: maxscore,
        percentage: score / maxscore,
        percdisplay: Math.floor((score / maxscore) * 100)
      };
    }
  }

  function nulmPerGebied(responses, gebied) {
    // Return results (as percentage) of nulmeting per gebied
    var nulmObj = responses == undefined ? undefined : responses[gebied]; // Object on level /nulmeting/[gebied]
    if (nulmObj == undefined) return undefined;
    else {
      var score = 0;
      var maxscore = 0;
      for (question in nulmObj) {
        score += parseInt(nulmObj[question]);
        maxscore += 3;
      }
      return {
        score: score,
        maxscore: maxscore,
        percentage: score / maxscore,
        percdisplay: Math.floor((score / maxscore) * 100)
      };
    }
  }

  ResponsesPerUser.then(function(data) {
    var username = data.username;
    data.responses.then(function(responses) {
      document.getElementById('spinner').style.display = 'none';
      var responsesNulm = responses.nulmeting;
      var status = responsesNulm == undefined ? undefined : responsesNulm.status;
      if (responsesNulm == undefined || status !== 'closed') $location.path('/nulmeting');
      else {
        // Get the results (in percentages). If there is a testresult, then get that one. Otherwise get nulmeting result
        var responsesTest = responses.test;
        var gebieden = Gebieden.gebieden;
        var data = {};
        for (var i = 0; i < gebieden.length; i++) {
          var results = testsPerGebied(responsesTest, gebieden[i]);
          if (results == undefined || urlParam == 'nulmeting') results = nulmPerGebied(responsesNulm, gebieden[i]);
          data[gebieden[i]] = results;
          var display = i == 0 ? true : false;
          data[gebieden[i]].display = display;
          data[gebieden[i]].name = Gebieden.gebiedsnamen[gebieden[i]];
        }
        $scope.results = data;

        // Display gebieden
        document.getElementById('spinner').style.display = 'none';
        $scope.gid = 0;
        $scope.showNext = function(gid) {
          $scope.results[gebieden[gid]].display = false;
          if (gid == 6) {
            $scope.results[gebieden[0]].display = true;
            $scope.gid = 0;
          } else {
            $scope.results[gebieden[gid + 1]].display = true;
            $scope.gid = gid + 1;
          }
        };
        $scope.showPrev = function(gid) {
          $scope.results[gebieden[gid]].display = false;
          if (gid == 0) {
            $scope.results[gebieden[6]].display = true;
            $scope.gid = 6;
          } else {
            $scope.results[gebieden[gid - 1]].display = true;
            $scope.gid = gid - 1;
          }
        };
      }

      // Google charts
      var width = window.innerWidth > 860 ? 0.8 * 860 : 0.8 * window.innerWidth;
      var optionsGc = {
        pieHole: 0.4,
        backgroundColor: '#d6cecc',
        legend: 'none',
        width: width,
        height: width,
        chartArea: {
          top: 0,
          width: '100%',
          height: '100%'
        },
        colors: ['red', 'green'],
        pieSliceTextStyle: {
          fontSize: 20
        }
      };

      google.charts.load("current", {
        packages: ["corechart"]
      });
      google.charts.setOnLoadCallback(drawChart);

      function drawChart() {
        var dataWerk = google.visualization.arrayToDataTable([
          ['Score', '%'],
          ['', 1 - data.werkdruk.percentage],
          ['', data.werkdruk.percentage]
        ]);
        var dataComp = google.visualization.arrayToDataTable([
          ['Score', '%'],
          ['', 1 - data.competentie.percentage],
          ['', data.competentie.percentage]
        ]);
        var dataSteun = google.visualization.arrayToDataTable([
          ['Score', '%'],
          ['', 1 - data.sociale_steun.percentage],
          ['', data.sociale_steun.percentage]
        ]);
        var dataRegel = google.visualization.arrayToDataTable([
          ['Score', '%'],
          ['', 1 - data.zelfstandigheid.percentage],
          ['', data.zelfstandigheid.percentage]
        ]);
        var dataFysiek = google.visualization.arrayToDataTable([
          ['Score', '%'],
          ['', 1 - data.fysieke_gezondheid.percentage],
          ['', data.fysieke_gezondheid.percentage]
        ]);
        var dataGezond = google.visualization.arrayToDataTable([
          ['Score', '%'],
          ['', 1 - data.gezondheid.percentage],
          ['', data.gezondheid.percentage]
        ]);
        var dataVermoeid = google.visualization.arrayToDataTable([
          ['Score', '%'],
          ['', 1 - data.vermoeidheid.percentage],
          ['', data.vermoeidheid.percentage]
        ]);

        var chartWerk = new google.visualization.PieChart(document.getElementById('chart-werkdruk'));
        chartWerk.draw(dataWerk, optionsGc);
        var chartFysiek = new google.visualization.PieChart(document.getElementById('chart-fysieke_gezondheid'));
        chartFysiek.draw(dataFysiek, optionsGc);
        var chartGezond = new google.visualization.PieChart(document.getElementById('chart-gezondheid'));
        chartGezond.draw(dataGezond, optionsGc);
        var chartComp = new google.visualization.PieChart(document.getElementById('chart-competentie'));
        chartComp.draw(dataComp, optionsGc);
        var chartSteun = new google.visualization.PieChart(document.getElementById('chart-sociale_steun'));
        chartSteun.draw(dataSteun, optionsGc);
        var chartRegel = new google.visualization.PieChart(document.getElementById('chart-zelfstandigheid'));
        chartRegel.draw(dataRegel, optionsGc);
        var chartVermoeid = new google.visualization.PieChart(document.getElementById('chart-vermoeidheid'));
        chartVermoeid.draw(dataVermoeid, optionsGc);
      }
    });
  });
}
