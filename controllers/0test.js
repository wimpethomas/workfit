angular.module('workfit').controller('TestController', TestCtrl);

function TestCtrl($scope, QuestionsNew, ResponsesPerUser) {

  function sendInvitationEmail(bedrijf) {
    var baseUrl = 'https://www.workfit-pmo.nl/#!/';
    var promises = [];
    var data = [];
    var promises = [];

    firebase.database().ref('klanten').orderByChild('bedrijf').equalTo(bedrijf).once('value').then(function(snapshot) {
      snapshot.forEach(function(childSnap) {
        var email = childSnap.val().email;
        var name = childSnap.val().naam;
        var obj = {name: name, email: email};
        data.push(obj);
      })
      return data;
    }).then(function(data){
      //console.log(data);
      var subject = 'Uitnodiging WorkFit-app';
      var body = '<p>Bij deze nodigen we je uit voor de WorkFit-app. De app helpt - op een leuke en laagdrempelige manier - mee je gezond en prettig op je werk te blijven voelen.<br>Je kunt je registreren voor de app op <a href="https://www.workfit-pmo.nl">workfit-pmo.nl</a>.</p>';
      body += '<p>De app is er op gericht te achterhalen op welke gebieden je goed functioneert en op welke gebieden minder. Constateren we dat je op een bepaald gebied achterblijft, dan zoomen we op dat gebied in en kijken we wat precies de oorzaken zijn. Dit alles doen we aan de hand van korte vragenlijsten. Bij opstarten via een eenmalige nulmeting, vervolgens via een paar korte vragen waar je periodiek een melding voor krijgt. Die periode is de eerste maand iedere week, blijkt dan alles goed te gaan dan krijg je nog maar eens per drie weken een melding voor de vragenlijst.<br>';
      body += 'Als we na het inzoomen op een gebied zien waardoor je voor dat gebied minder scoort, dan bieden we je een zo goed als kant-en-klaar traject aan om je op dit gebied te ontwikkelen. Het is uiteraard aan jou of je hier ook daadwerkelijk iets mee wilt doen.</p>';
      body += '<p>Tot slot, als je je hebt geregistreerd vraagt de app om notificaties toe te staan. We raden je dit aan te doen, zodat je op een eenvoudige manier - direct op je smartphone - meldingen vanuit de app kunt ontvangen.</p>';
      body += '<p>Veel plezier met het gebruik van WorkFit!</p>';
      body += '<p>Het WorkFit team</p>';
      for (var i = 0; i < data.length; i++) {
        var header = '<p>Beste ' + data[i].name + '</p>';
        var to = data[i].email;
        var mailOptions = {
          from : 'WorkFit <noreply@workfit.nl>',
          to: to,
          subject: subject,
          html: header + body
        };
        promises.push(mailOptions);
      }
      console.log(promises);
    });
  }
  sendInvitationEmail('WorkFit')


  /*
  var setWfDate = function(type, days) {
    var datum = new Date();
    if (type == 'notification') {
      datum.setDate(datum.getDate() + days);
      return datum.toISOString().split('T')[0];
    } else return datum.toISOString();
  };
  var gebieden = ['competentie', 'sociale_steun', 'zelfstandigheid', 'vermoeidheid', 'werkdruk', 'gezondheid', 'fysieke_gezondheid'];

  function updateNotificationDates(){
    var yesterday = setWfDate('notification', -1);
    var nextWeek = setWfDate('notification', 7);
    firebase.database().ref('notifications').orderByChild('datum').endAt(yesterday).once('value').then(function(snapshot) {
      snapshot.forEach(function(childSnap) {
        var user = childSnap.key;
        firebase.database().ref('notifications/' + user + '/datum').set(nextWeek);
        firebase.database().ref('notifications/' + user + '/messageType').set('weekly');
      });
    });
  }
  updateNotificationDates();

  function updateAverageGrades(){
    var now = new Date();
    var today = setWfDate('notification', 0);
    var lastWeek = setWfDate('notification', -7);

    var NulmetingResponses = firebase.database().ref('responses').orderByChild('nulmeting/datum').startAt(lastWeek).endAt(today).once('value');
    var ExistingGradeData = firebase.database().ref('questions/settings/averages/nulmeting').once('value');

    Promise.all([NulmetingResponses, ExistingGradeData]).then(function(snapshot) {
      console.log(snapshot[0].val());
      var numberOfUsers = 0;
      var grades = {};
      grades[gebieden[0]] = grades[gebieden[1]] = grades[gebieden[2]] = grades[gebieden[3]] = grades[gebieden[4]] = grades[gebieden[5]] = grades[gebieden[6]] = 0;
      snapshot[0].forEach(function(childSnap) {
        var userData = childSnap.val();
        if (userData.nulmeting.status == 'closed'){
          numberOfUsers += 1;
          //var grades = {};
          for (var i = 0; i < gebieden.length; i++){
            var vals = userData.nulmeting[gebieden[i]];
            var sum = 0;
            for (val in vals){
              sum += parseInt(vals[val]);
            }
            var grade = 10 * sum / (Object.keys(vals).length * 3);
            grades[gebieden[i]] += grade;
          }
        }
      });
      var gradesData = {numberOfUsers: numberOfUsers, grades: grades};

      const existing = snapshot[1].val();
      var newGrades = {nrofusers: existing.nrofusers + gradesData.numberOfUsers};
      for (var i = 0; i < gebieden.length; i++){
        var existingTotal = existing[gebieden[i]] * existing.nrofusers;
        var toAddTotal = gradesData.grades[gebieden[i]];
        var newTotal = existingTotal + toAddTotal;
        var newGrade = newTotal / newGrades.nrofusers;
        newGrades[gebieden[i]] = Math.round(newGrade * 10) / 10;
      }
      console.log(newGrades);

      firebase.database().ref().child('questions/settings/averages/nulmeting').remove();
      firebase.database().ref().child('questions/settings/averages/nulmeting').set(newGrades);
    });
  }
  //updateAverageGrades();


  // TESTSCRIPT VOOR OPVRAGEN VAN DEVICEIDS (CLOUD FUNCTION TEST OBV URL ENDPOINT) EN VOOR FUNCNOTIFICATION
  function sendFuncNotification(){
    console.log('test');
    const getDeviceTokensPromise = firebase.database().ref('/notifications/kwek_duck_nl/deviceId').once('value');

    return getDeviceTokensPromise.then(function(tokensSnapshot){
      // Check if there are any device tokens.
      if (!tokensSnapshot.hasChildren()) {
        return console.log('There are no notification tokens to send to.');
      }
      console.log('There are', tokensSnapshot.numChildren(), 'tokens to send notifications to.');
      console.log(tokensSnapshot.val());
    });
  }
  //sendFuncNotification();
  //sendNotifications();
  //sendEmails();

  function setup(type) {
    var now = new Date();
    var today = now.toISOString().split('T')[0];
    var datumRem = new Date();
    datumRem.setDate(datumRem.getDate() + 3);
    var datumRemString = datumRem.toISOString().split('T')[0];
    var baseUrl = 'https://www.workfit-pmo.nl/#!/';

    var promises = [];
    var mTypes = [];
    var dataDevices = {
      "advicereminder": {
        "deviceIds": [],
        "users": []
      },
      "nulmetingreminder": {
        "deviceIds": [],
        "users": []
      },
      "personalityreminder": {
        "deviceIds": [],
        "users": []
      },
      "roadmap": {
        "deviceIds": [],
        "users": []
      },
      "testreminder": {
        "deviceIds": [],
        "users": []
      },
      "weekly": {
        "deviceIds": [],
        "users": []
      }
    };
    var dataEmails = {
      "advicereminder": [],
      "nulmetingreminder": [],
      "personalityreminder": [],
      "roadmap": [],
      "testreminder": [],
      "weekly": []
    };
    var promise = firebase.database().ref('notifications').orderByChild('datum').equalTo(today).once('value').then(function(snapshot) {
      snapshot.forEach(function(childSnap) {
        var user = childSnap.key;
        var deviceId = childSnap.val().deviceId;
        var messageType = childSnap.val().messageType;
        if (messageType !== 'roadmap') {
          //admin.database().ref('notifications/' + user + '/messageType').set('weekly');
          //admin.database().ref('notifications/' + user + '/datum').set(datumRemString);
        }
        if (deviceId !== undefined && messageType !== undefined) {
          for (var d = 0; d < deviceId.length; d++) {
            dataDevices[messageType].deviceIds.push(deviceId[d]);
            dataDevices[messageType].users.push(user);
          }
        } else if (deviceId == undefined) {
          var email = childSnap.val().email;
          dataEmails[messageType].push(email);
        }
      });
      return {
        dataDevices: dataDevices,
        dataEmails: dataEmails
      }
    });

    return {
      today: today,
      datumRemString: datumRemString,
      baseUrl: baseUrl,
      promise: promise
    }
  }

  function sendEmails() {
    var today = setup().today;
    var datumRemString = setup().datumRemString;
    var baseUrl = setup().baseUrl;
    var promises = [];
    var mTypes = [];

    setup().promise.then(function(data) {
      data = data.dataEmails;
      for (var mType in data) {
        var emails = data[mType];
        var slug = mType == 'weekly' ? 'weekly' : (mType == 'testreminder' ? 'tests' : (mType == 'roadmap' ? 'oplossing' : (mType == 'nulmetingreminder' ? 'nulmeting' : (mType == 'advicereminder' ? 'oplossing' : 'personalitytest'))));
        var header = '<p>Beste WorkFit-gebruiker,</p>';
        var url = baseUrl + slug;
        switch (mType) {
          case 'weekly':
            var subject = 'Tijd voor het maken van je wekelijkse WorkFit vragen';
            var text = '<p>Je nieuwe paar wekelijkse vragen staan klaar op ' + url + '.<br/>';
            break;
          case 'roadmap':
            var subject = 'Tijd voor het updaten van je WorkFit-stappenplan';
            var text = '<p>Je hebt aangegeven dat je verwacht vandaag een stap uit je WorkFit stappenplan te hebben afgerond. Ga naar ' + url + ' voor vervolgacties.<br/>';
            break;
          case 'testreminder':
            var subject = 'Rond je niet-afgeronde WorkFit-test af';
            var text = '<p>Je bent een gebiedstest op WorkFit begonnen, maar je hebt deze nog net afgerond. Rond de test af op ' + url + '.<br/>';
            break;
          case 'nulmetingreminder':
            var subject = 'Rond je niet-afgeronde WorkFit-nulmeting af';
            var text = '<p>Je bent de nulmeting op WorkFit begonnen, maar je hebt deze nog net afgerond. Rond de nulmeting af op ' + url + '.<br/>';
            break;
          case 'advicereminder':
            var subject = 'Er staat nog een WorkFit-advies voor je klaar.';
            var text = '<p>Je hebt een gebiedstest gedaan, maar deze geen vervolg gegeven door een ontwikkelingstraject te starten. Wellicht wil je dat toch nog doen. Ga dan naar ' + url + '.<br/>';
            break;
          case 'personalityreminder':
            var subject = 'Rond je niet-afgeronde WorkFit-persoonlijkheidstest af';
            var text = '<p>Je bent de persoonlijkheidstest op WorkFit begonnen, maar je hebt deze nog net afgerond. Rond de test af op ' + url + '.<br/>';
            break;
        }
        var extraText = 'Wil je deze reminder niet meer als email ontvangen, activeer dan de notificatiesettings in je browser. Voor meer uitleg, zie <a href="' + baseUrl + '/bladiebla.htm">instellen browsernotificaties</a>.</p>'

        var mailOptions = {
          from : 'WorkFit <noreply@workfit.nl>',
          bcc: emails.join(),
          subject: subject,
          html: header + text + extraText
        }

        //mTypes.push(mType);
        //promises.push(data);
        }

    });
  }

  function sendNotifications() {
    var today = setup().today;
    var datumRemString = setup().datumRemString;
    var baseUrl = setup().baseUrl;
    var promises = [];
    var mTypes = [];

    setup().promise.then(function(data) {
      data = data.dataDevices;
      for (var mType in data) {
        var slug = mType == 'weekly' ? 'weekly' : (mType == 'testreminder' ? 'tests' : (mType == 'roadmap' ? 'oplossing' : (mType == 'nulmetingreminder' ? 'nulmeting' : (mType == 'advicereminder' ? 'oplossing' : 'personalitytest'))));
        var text = mType == 'weekly' ? 'Tijd voor je korte wekelijkse check' : (mType == 'roadmap' ? 'Tijd voor het updaten van je stappenplan' : (mType == 'testreminder' ? 'Rond je niet-afgeronde WorkFit-test af' : (mType == 'nulmetingreminder' ? 'Rond je niet-afgeronde WorkFit-nulmeting af' : (mType == 'advicereminder' ? 'Er staat nog een WorkFit-advies voor je klaar. Wellicht iets mee doen?' : 'Rond je niet-afgeronde WorkFit-persoonlijkheidstest af'))));
        var url = baseUrl + slug;
        var deviceIds = data[mType].deviceIds;
        if (deviceIds.length !== 0) {
          var payload = {
            notification: {
              title: 'WorkFit melding',
              body: text,
              click_action: url
            }
          };
          mTypes.push(mType);
          promises.push(deviceIds);
        }
      }
      console.log(promises);
      console.log(mTypes);
      console.log(data);
      return {
        deviceIds: promises,
        mTypes: mTypes,
        data: data
      }
    }).then(function(defdata) {
                var mTypes = defdata.mTypes;
                var response = [{
                        "results": [{
                                "error": {
                                    "code": "messaging/invalid-registration-token",
                                    "message": "Invalid registration token provided. Make sure it matches the registration token the client app receives from registering with FCM."
                                }
                            }
                        ],
                        "canonicalRegistrationTokenCount": 0,
                        "failureCount": 1,
                        "successCount": 0,
                        "multicastId": 9211826049827922000
                    }, {
                        "results": [{
                                "messageId": "0:1518122195253062%901bb065f9fd7ecd"
                            }
                        ],
                        "canonicalRegistrationTokenCount": 0,
                        "failureCount": 0,
                        "successCount": 1,
                        "multicastId": 8705752488256362000
                    }
                ];;

                var store = [];
                var userDup = '';
                // First store all the users with something wrong
                for (var i = 0; i < response.length; i++) {
                    // All ids and users per messageType
                    if (response[i].failureCount > 0) {
                        var devicesPerType = defdata[mTypes[i]].deviceIds;
                        var usersPerType = defdata[mTypes[i]].users;
                        var resultsPerType = response[i].results;
                        for (var j = 0; j < resultsPerType.length; j++) {
                            var user = usersPerType[j];
                            if (resultsPerType[j].error !== undefined) {
                                if (resultsPerType[j].error.message.indexOf('not registered') !== -1 || resultsPerType[j].error.message.indexOf('Invalid registration token') !== -1) {
                                    var deviceId = devicesPerType[j];
                                    if (user == userDup) {
                                        store[store.length - 1].falseIds.push(deviceId);
                                    } else {
                                        userDup = user;
                                        store.push({
                                                user: user,
                                                falseIds: [deviceId]
                                            });
                                    }
                                }
                            }
                        }
                    }
                }
                console.log(store);

                // Make new deviceIds array (newDevIds) and set as new device ids
                var snapshots = [];
                for (var s = 0; s < store.length; s++) {
                    var userF = store[s].user;
                    snapshots.push(firebase.database().ref('notifications/' + userF + '/deviceId').once('value'));
                }
                Promise.all(snapshots).then(function(userdata) {
                    for (var u = 0; u < userdata.length; u++) {
                        var falseIds = store[u].falseIds;
                        var devIds = userdata[u].val();
                        var newDevIds = [];
                        for (var di = 0; di < devIds.length; di++) {
                            console.log(devIds[di]);
                            if (falseIds.indexOf(devIds[di]) == -1) newDevIds.push(devIds[di]);
                        }
                        console.log(newDevIds);
                        if (newDevIds.length == 0) firebase.database().ref('notifications/' + store[u].user).remove();
                        else firebase.database().ref('notifications/' + store[u].user + '/deviceId').set(newDevIds);
                    }
                });

                var test = [{
                        "results": [{
                                "error": {
                                    "code": "messaging/invalid-registration-token",
                                    "message": "Invalid registration token provided. Make sure it matches the registration token the client app receives from registering with FCM."
                                }
                            }
                        ],
                        "canonicalRegistrationTokenCount": 0,
                        "failureCount": 1,
                        "successCount": 0,
                        "multicastId": 9211826049827922000
                    }, {
                        "results": [{
                                "messageId": "0:1518122195253062%901bb065f9fd7ecd"
                            }
                        ],
                        "canonicalRegistrationTokenCount": 0,
                        "failureCount": 0,
                        "successCount": 1,
                        "multicastId": 8705752488256362000
                    }
                ];

    });
  }
  */
}
