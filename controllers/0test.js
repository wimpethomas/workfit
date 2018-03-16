angular.module('workfit').controller('TestController', TestCtrl);

function TestCtrl($scope, QuestionsNew, ResponsesPerUser) {

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
  sendFuncNotification()






  // TESTSCRIPT VOOR OPVRAGEN VAN DEVICEIDS (CLOUD FUNCTION TEST OBV URL ENDPOINT)
  sendNotifications();
  sendEmails();

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
      /*
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
                */

    });
  }
}
