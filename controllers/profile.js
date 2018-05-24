angular.module('workfit')
.controller('ProfileController', ProfileCtrl);

function ProfileCtrl($scope, $location, $routeParams, QuestionsNew, ResponsesPerUser, UserData, Gebieden, Functions) {
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
      //console.log(vals);
      var score = 0;
      var maxscore = 0;
      for (var i = 0; i < vals.length; i++) {
        score += vals[i].q !== undefined ? parseInt(vals[i].q) : vals[i].value;
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


  // Calculate results and store them in array for BAR chart
  // The same as in functioneringsresults (PROBABLY SHARE IN VARIOUSFUNCTIONS)
  function chartData(scoresNow, scoresWas, averages){
    if (scoresWas == undefined) var chartData = [["Gebied",
                                                  "Cijfer",
                                                  {type: "string", role: "style"},
                                                  {type: 'string', role: 'tooltip', 'p': {'html': true}}]];
    else var chartData = [["Gebied",
                           "Cijfer (was)",
                           {type: "string", role: "style"},
                           "Cijfer (is)",
                           {type: "string", role: "style"}]];
    var colors = ['#d73027', '#fc8d59', '#fee090', '#ffffbf', '#e0f3f8', '#91bfdb', '#4575b4'];

    var i = 0;
    for (gebied in scoresNow) {
      var gebiedsnaam = scoresNow[gebied].name;
      var cijfer = (Math.round(100 * (scoresNow[gebied].score / scoresNow[gebied].maxscore))) / 10;
      var tooltip = '<div style="font-size: 140%; padding: 20px 10px;"><b>'+ gebiedsnaam +'</b><br>Cijfer: '+ cijfer +'<br>Gemiddeld cijfer WF gebruikers: '+ averages[gebied] +'</div>';

      var onderdeelArr = [];
      onderdeelArr.push(gebiedsnaam);
      if (scoresWas !== undefined) {
        var cijferWas = (Math.round(100 * (scoresWas[gebied].score / scoresWas[gebied].maxscore))) / 10;
        onderdeelArr.push(cijferWas);
        onderdeelArr.push('color:' + colors[i] + '; opacity:0.5');
      }
      onderdeelArr.push(cijfer);
      //var color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
      var color = colors[i];
      onderdeelArr.push(color);
      //onderdeelArr.push(colors[i]);
      onderdeelArr.push(tooltip);
      chartData.push(onderdeelArr);
      i += 1;
    }

    //console.log(chartData);
    return chartData;
  }

  // Set paddings based on screen size
  // ALSO MOSTLY THE SAME AS FUNCTIONERINGSRESULTS
  $scope.chartClass = window.innerWidth > 800 ? 'chart' : 'chart2';
  // Google charts
  google.charts.load("current", {packages:['corechart']});
  //google.charts.load("current", {packages:['bar']});
  function googleCharts(scoresNow, type, scoresWas, averages){
    var element = 'chartbar';
    function drawChart() {
      var data = google.visualization.arrayToDataTable(chartData(scoresNow, scoresWas, averages));
      var view = new google.visualization.DataView(data);
      if (scoresWas == undefined) view.setColumns([0,
                                                   1,
                                                   {calc: "stringify", sourceColumn: 1, type: "string", role: "annotation" },
                                                   2,
                                                   3]);
      else view.setColumns([0,
                            1,
                            {calc: "stringify", sourceColumn: 1, type: "string", role: "annotation" },
                            2,
                            3,
                            {calc: "stringify", sourceColumn: 3, type: "string", role: "annotation" },
                            4]);
      var chart = new google.visualization.ColumnChart(document.getElementById(element));
      chart.draw(view, optionsGc);
      //var chart = new google.charts.Bar(document.getElementById(element));
      //chart.draw(view, google.charts.Bar.convertOptions(optionsGc));
    }

    google.charts.setOnLoadCallback(drawChart);
    var width = window.innerWidth > 700 ? 0.8 * 700 : 0.92 * window.innerWidth;
    var chartWidth = window.innerWidth > 580 ? '98%' : '92%';
    var optionsGc = {
      width: width,
      height: 500,
      backgroundColor: 'transparent',
      bar: {groupWidth: "85%"},
      fontSize: 18,
      tooltip: { isHtml: true },
      chartArea: {
        top: 0,
        right: 0,
        width: chartWidth,
        height: '90%'
      },
      legend: { position: "none" },
      vAxis: { textPosition: 'none' },
      hAxis: {
        slantedText: true,
        slantedTextAngle: 20,
        textStyle: {fontSize: 10}
      }
    };
  }

  Promise.all([QuestionsNew, ResponsesPerUser, UserData]).then(function(data) {
    // Role based: If demo user with expired account redirect
    var access = Functions.getAccess('allButDemoExpired', data[2].type, data[2].datum);
    if(!access) {
      $scope.$apply(function() {$location.path('/pagina/geen-toegang/demo-user'); })
    }
    else {
      var username = data[1].username;
      var averages = data[0].settings.averages.nulmeting;
      data[1].responses.then(function(responses) {
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
          //console.log(data);

          // BARCHART
          googleCharts(data, undefined, undefined, averages);

          // COMPARE TO AVERAGE
          var sorted = [];
          for (gebied in data){
            var grade = data[gebied].percdisplay / 10;
            sorted.push({gebied: gebied, gebiedsnaam: data[gebied].name, grade: grade});
            sorted.sort(function(a, b) {
              return b.grade - a.grade;
            });
          }
          //console.log(sorted);

          $scope.topgebied = sorted[0].gebiedsnaam;
          $scope.dalgebied = sorted[6].gebiedsnaam;
          $scope.topgrade = sorted[0].grade;
          $scope.dalgrade = sorted[6].grade;
          $scope.topaverage = averages[sorted[0].gebied];
          $scope.dalaverage = averages[sorted[6].gebied];
          $scope.topvgl = $scope.topgrade > $scope.topaverage ? 'boven' : 'onder';
          $scope.dalvgl = $scope.dalgrade > $scope.dalaverage ? 'boven' : 'onder';

          // Display gebieden
          document.getElementById('spinner').style.display = 'none';
          $scope.spinnerdone = true;
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

        // Google charts FOR PIE CHARTS
        var width = window.innerWidth > 700 ? 0.8 * 700 : 0.8 * window.innerWidth;
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
    }
  });
}
