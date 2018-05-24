angular.module('workfit')
.controller('FuncResultsController', FuncResultsCtrl);

function FuncResultsCtrl($scope, $location, $routeParams, $ocLazyLoad, ResponsesPerUser, QuestionsNew, UserData, Store, Gebieden, Functions) {
  $ocLazyLoad.load('https://ajax.googleapis.com/ajax/libs/angularjs/1.6.4/angular-sanitize.js');

  // Role based: If no company user redirect
  UserData.then(function(data) {
    var access = Functions.getAccess('companyUser', data.type);
    if(!access) {
      $scope.$apply(function() {$location.path('/pagina/geen-toegang/nocompany'); })
      return;
    }
  });

  // GA FUNCRESULTS EN FUNCDATA SAMENVOEGEN IN 1 OBJECT! VOORKOMT DUBBELE CODE BIJ HET DEFINIEREN VAN VARIABLE IN BEGIN EN DE $SCOPE.MENUNAV FUNCTIE
  var funcResults = Store.getResults().funcresults;
  var funcData = Store.getResults().funcdata;
  var urlRole = $routeParams.role;
  var user = $routeParams.user !== undefined ? $routeParams.user : funcResults.user;
  $scope.user = user;
  var trajectStr = $routeParams.fid !== undefined ? 'traject-' + $routeParams.fid : (funcResults !== undefined ? funcResults.traject : undefined);
  var prevTrajectNr = $routeParams.fid !== undefined ? $routeParams.fid - 1 : (funcResults !== undefined ? parseInt(funcResults.traject.split('-')[1]) - 1 : undefined);
  var prevTrajectStr = prevTrajectNr < 1 || prevTrajectNr == undefined ? undefined : 'traject-' + prevTrajectNr;
  //console.log(prevTrajectStr);
  $scope.nav = 'results';
  if ($routeParams.user !== undefined) $scope.navlinksdisplay = true;
  else if (funcData !== undefined) $scope.navlinksdisplay = funcData.trajectnr > 0 ? true : false;

  // Calculate results and store them in array for charts
  function chartData(scoresNow, scoresWas){
    if (scoresWas == undefined) var chartData = [["Onderdeel", "Cijfer", {type: "string", role: "style"}]];
    else var chartData = [["Onderdeel", "Cijfer (was)", {type: "string", role: "style"}, "Cijfer (is)", {type: "string", role: "style"}]];
    var colors = ['#d73027', '#f46d43', '#fdae61', '#fee090', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4'];
    var colorsWas = ['#E36F69', '#F79A7C', '#FDC691', '#FEE9B1', '#E9F6FB', '#C3E5EF	', '#9EC5E0	', '#7E9FCC'];

    for (var i = 0; i < scoresNow.length; i++) {
      var onderdeelArr = [];
      onderdeelArr.push(scoresNow[i].onderdeel);
      if (scoresWas !== undefined) {
        var cijferWas = (Math.round(100 * (scoresWas[i].totaalScore / scoresWas[i].maxScore))) / 10;
        onderdeelArr.push(cijferWas);
        onderdeelArr.push('color:' + colorsWas[i]);
      }
      var cijfer = (Math.round(100 * (scoresNow[i].totaalScore / scoresNow[i].maxScore))) / 10;
      onderdeelArr.push(cijfer);
      //var color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
      //onderdeelArr.push(color);
      onderdeelArr.push(colors[i]);
      chartData.push(onderdeelArr);
    }

    //console.log(chartData);
    return chartData;
  }

  // Set paddings based on screen size
  $scope.chartClass = window.innerWidth > 700 ? 'chart' : 'chart2';
  // Google charts
  google.charts.load("current", {packages:['corechart']});
  //google.charts.load("current", {packages:['bar']});
  function googleCharts(scoresNow, type, scoresWas){
    var element = type == 'self' ? 'chartself' : 'chartslave';
    function drawChart() {
      var data = google.visualization.arrayToDataTable(chartData(scoresNow, scoresWas));
      var view = new google.visualization.DataView(data);
      if (scoresWas == undefined) view.setColumns([0, 1, {calc: "stringify", sourceColumn: 1, type: "string", role: "annotation" }, 2]);
      else view.setColumns([0, 1, {calc: "stringify", sourceColumn: 1, type: "string", role: "annotation" }, 2, 3, {calc: "stringify", sourceColumn: 3, type: "string", role: "annotation" }, 4]);
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

  // Get Starsky Hutch data
  function getStarskyHutchLoc(scores) {
    for (var i = 0; i < scores.length; i++){
      if (scores[i].onderdeel == 'betrokkenheid') var sBScore = scores[i].totaalScore / scores[i].maxScore;
      else if (scores[i].onderdeel == 'competentie') var sCScore = scores[i].totaalScore / scores[i].maxScore;
      else if (scores[i].onderdeel == 'locus_of_control') var locScore = scores[i].totaalScore / scores[i].maxScore;
    }
    if (sCScore <= 0.33 && sBScore <= 0.5) var assessment = 's1';
    else if (sCScore <= 0.33 && sBScore > 0.5) var assessment = 's2';
    else if (sCScore <= 0.67 && sBScore <= 0.5) var assessment = 's3';
    else if (sCScore <= 0.67 && sBScore > 0.5) var assessment = 's4';
    else if (sCScore > 0.67 && sBScore <= 0.5) var assessment = 's5';
    else if (sCScore > 0.67 && sBScore > 0.5) var assessment = 's6';
    var loc = locScore < 0.5 ? 'extern' : 'intern';
    return {
      hunchblend: assessment,
      loc: loc
    };
  }

  // Switch graph view - Initialize
  if (prevTrajectStr !== undefined) $scope.switchdisplay = true;
  $scope.switchType = ['compare', 'Vergelijk met voorgaande periode'];


  // Start core of page: first for role leidinggevende
  if (urlRole == 'leidinggevende'){

    // Get real name of werknemer
    if (Store.getResults().slavedata !== undefined) {
      var slavedata = Store.getResults().slavedata;
      slavedata = slavedata[Object.keys(slavedata)[0]];
      $scope.werknemer = slavedata.naam !== undefined ? slavedata.naam : slavedata.email;
    }
    else {
      firebase.database().ref('klanten').orderByChild("username").equalTo(user).once("value", function(snapshot) {
        slavedata = snapshot.val()[Object.keys(snapshot.val())[0]];
        $scope.werknemer = slavedata.naam !== undefined ? slavedata.naam : slavedata.email;
      });
    }

    // Get data of werknemer (and ofcourse own data)
    var responsesPromise = Functions.getResponsesPerFuncUser(user, 'functionering');
    responsesPromise.data.then(function(snapshot) {
      document.getElementById('spinner').style.display = 'none';
      $scope.chartloadeddisplay = true;

      // Get the scores (is and was) and chart of leidinggevende
      // Scores previous functioneringstraject (was)
      var responsesSelfWas = prevTrajectStr == undefined ? undefined : snapshot.val()[prevTrajectStr].test.leidinggevende;
      var scoresSelfWas = prevTrajectStr == undefined ? undefined : Functions.getFuncScores(responsesSelfWas);
      // Scores current functioneringstraject (is)
      if (funcResults !== undefined) {
        if (funcResults.scores !== undefined) {
          var scoresSelf = funcResults.scores;
        }
        else var noStoredScores = true;
      }
      else var noStoredScores = true;
      if (noStoredScores) {
        // In case no trajectnr is given as URL parameter find the last traject
        if (trajectStr == undefined) {
          var trajectStrings = Object.keys(snapshot.val());
          trajectStr = trajectStrings[trajectStrings.length - 1];
        }
        var responsesSelf = snapshot.val()[trajectStr].test.leidinggevende;
        var scoresSelf = Functions.getFuncScores(responsesSelf);
      }
      //console.log(scoresSelf);
      //console.log(scoresSelfWas);
      googleCharts(scoresSelf, 'self');

      // Get the scores and chart of werknemer
      var responsesSlave = snapshot.val()[trajectStr].test.werknemer;
      var scoresSlave = Functions.getFuncScores(responsesSlave);
      console.log(scoresSlave);
      var responsesSlaveWas = prevTrajectStr == undefined ? undefined : snapshot.val()[prevTrajectStr].test.werknemer;
      var scoresSlaveWas = prevTrajectStr == undefined ? undefined : Functions.getFuncScores(responsesSlaveWas);
      if (scoresSlave.length > 0) googleCharts(scoresSlave, 'slave');
      else $scope.noresultsdisplay = true;

      // Switch graph view
      $scope.switchView = function(type){
        if (type == 'normal'){
          googleCharts(scoresSelf, 'self');
          googleCharts(scoresSlave, 'slave');
          $scope.switchType = ['compare', 'Vergelijk met voorgaande periode'];
        }
        else {
          googleCharts(scoresSelf, 'self', scoresSelfWas);
          googleCharts(scoresSlave, 'slave', scoresSlaveWas);
          $scope.switchType = ['normal', 'Alleen laatste resultaten'];
        }
      }

      $scope.$apply(function(){
        $scope.bossdisplay = true;
      });

      $scope.showMore = function(role){
        $scope.showmoredisplay = true;
        $scope.bossdisplay = false;
        if (role == 'leidinggevende') $scope.showmorebossdisplay = true;
        var shBossIndex = getStarskyHutchLoc(scoresSelf).hunchblend;
        var shSlaveIndex = getStarskyHutchLoc(scoresSlave).hunchblend;
        var locBossIndex = getStarskyHutchLoc(scoresSelf).loc;
        var locSlaveIndex = getStarskyHutchLoc(scoresSlave).loc;

        QuestionsNew.then(function(questions){
          $scope.$apply(function(){
            $scope.shBoss = questions.profile.functionering[shBossIndex][locBossIndex];
            $scope.shSlave = questions.profile.functionering[shSlaveIndex][locSlaveIndex];
          });
        });
      }
    });

    var persoonlijkheidsPromise = Functions.getResponsesPerFuncUser(user, 'personality');
    Promise.all([QuestionsNew, persoonlijkheidsPromise.data]).then(function(data) {
      var responses = data[1].val();
      var traits = data[0].profile.functionering_persoonlijkheid;
      if (responses == null || responses.status == 'unfinished') $scope.nopersonalitydisplay = true;
      else {
        if (responses.shared){
          $scope.personality = {};
          var scores = Functions.getPersScores(responses, traits, 'func');
          //console.log(scores);
          for (onderdeel in scores){
            if (scores[onderdeel].traitBoss !== undefined) $scope.personality[onderdeel] = scores[onderdeel];
          }
        }
        else $scope.notshareddisplay = true;
      }
    });
  }

  // Results in case of werknemer
  else if (urlRole == 'werknemer'){
    ResponsesPerUser.then(function(data){
      data.responses.then(function(responses){
        document.getElementById('spinner').style.display = 'none';
        $scope.chartloadeddisplay = true;

        // Get the scores and chart of werknemer
        if (funcResults !== undefined) {
          if (funcResults.scores !== undefined) {
            var scoresSelf = funcResults.scores;
          }
          else var noStoredScores = true;
        }
        else var noStoredScores = true;
        if (noStoredScores){
          var responsesSelf = responses.functionering[trajectStr].test.werknemer;
          var scoresSelf = Functions.getFuncScores(responsesSelf);
        }
        var responsesSelfWas = prevTrajectStr == undefined ? undefined : responses.functionering[prevTrajectStr].test.werknemer;
        var scoresSelfWas = prevTrajectStr == undefined ? undefined : Functions.getFuncScores(responsesSelfWas);
        googleCharts(scoresSelf, 'self');

        // Switch graph view
        $scope.switchView = function(type){
          if (type == 'normal'){
            googleCharts(scoresSelf, 'self');
            $scope.switchType = ['compare', 'Vergelijk met voorgaande periode'];
          }
          else {
            googleCharts(scoresSelf, 'self', scoresSelfWas);
            $scope.switchType = ['normal', 'Alleen laatste resultaten'];
          }
        }
      });
    });

    // Get personality
    $scope.personality = Store.getResults().personality;
    if ($scope.personality !== undefined) {
      $scope.showmoredisplay = true;
      $scope.showmoreslavedisplay = true;
    }
    else $scope.personalitydisplay = true;

    $scope.showMore = function(){
      if ($scope.personality !== undefined) {
        $scope.showmoredisplay = true;
        $scope.showmoreslavedisplay = true;
      }
      else if ($routeParams.user == undefined) $location.path('/personalitytest/func');
      else $location.path('/personalitytest/funcuser-' + $routeParams.fid);
    }

    // Share personality with leidinggevende
    var persoonlijkheidsPromise = Functions.getResponsesPerFuncUser(user, 'personality');
    persoonlijkheidsPromise.data.then(function(data) {
      $scope.nosharedisplay = !data.val().shared;
    });
    $scope.shareResults = function(username){
      firebase.database().ref().child('responses/' + username + '/personality/shared').set(true);
      $scope.nosharedisplay = false;
      $scope.thankyoudisplay = true;
    }
  }

  // Backbutton
  $scope.goBack = function() {
    $scope.showmoredisplay = false;
    if (urlRole == 'leidinggevende') $scope.bossdisplay = true;
    else $scope.personalitydisplay = true;
  }

  $scope.menuNav = function(tab){
    var role = $routeParams.role !== undefined ? $routeParams.role : funcData.role;
    var werknemer = $routeParams.user !== undefined ? $routeParams.user : funcData.werknemer;
    var fid = $routeParams.fid !== undefined ? $routeParams.fid : (funcData !== undefined ? funcData.trajectnr : '');
    if (tab == 'home') $location.path('functioneringstest');
    else if (tab == 'agreements') $location.path('functioneringsafspraken/' + role + '/view/' + werknemer + '/' + fid);
    else if (tab == 'archive') $location.path('functioneringsarchief/' + role + '/' + werknemer);
  }
}
