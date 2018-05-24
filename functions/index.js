const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const nodemailer = require('nodemailer');
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'workfitpmo@gmail.com',
    pass: 'honduras74'
  }
});

function setup(type) {
  var now = new Date();
  var today = now.toISOString().split('T')[0];
  var datumRem = new Date();
  datumRem.setDate(datumRem.getDate() + 7);
  var datumRemString = datumRem.toISOString().split('T')[0];
  var baseUrl = 'https://www.workfit-pmo.nl/#!/';

  var promises = [];
  var mTypes = [];
  var dataDevices = {
    "advicereminder": {"deviceIds": [], "users": []},
    "nulmetingreminder": {"deviceIds": [], "users": []},
    "personalityreminder": {"deviceIds": [], "users": []},
    "roadmap": {"deviceIds": [], "users": []},
    "testreminder": {"deviceIds": [], "users": []},
    "weekly": {"deviceIds": [], "users": []}
  };
  var dataEmails = {
    "advicereminder": [],
    "nulmetingreminder": [],
    "personalityreminder": [],
    "roadmap": [],
    "testreminder": [],
    "weekly": []
  };
  var promise = admin.database().ref('notifications').orderByChild('datum').equalTo(today).once('value').then(function(snapshot) {
    snapshot.forEach(function(childSnap) {
      var user = childSnap.key;
      var deviceId = childSnap.val().deviceId;
      var messageType = childSnap.val().messageType;
      if (messageType !== 'roadmap') {
        admin.database().ref('notifications/' + user + '/messageType').set('weekly');
        admin.database().ref('notifications/' + user + '/datum').set(datumRemString);
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

exports.sendFuncNotification = functions.database.ref('/notifications/{receiverId}/messageFunc/{senderId}').onWrite(function(event){
  const receiverId = event.params.receiverId;
  const senderId = event.params.senderId;
  const newVal = event.data.val();
  // const previous = event.data.previous.val(); // We don't need the previous value, the new value is enough

  switch (newVal) {
    case 'traject_started': // null -> traject_started (notif to werknemer)
      var body = 'Je hebt binnenkort een functioneringsgesprek. Doe de vragenlijst ter voorbereiding.';
      var url = setup().baseUrl + 'functioneringstest';
      break;
    case 'test_finished': // null -> test_finished (notif to boss)
      var body = senderId + ' heeft zijn vragenlijst voor het functioneringsgesprek ingevuld. Bekijk de resultaten.';
      var url = setup().baseUrl + 'functioneringsresults/leidinggevende/' + senderId;
      break;
    case 'afspraken_set': // traject_started -> afspraken_set (notif to werknemer)
      var body = senderId + ' heeft de afspraken uit het functioneringsgesprek vastgelegd. Controleer ze hier.';
      var url = setup().baseUrl + 'functioneringsafspraken/werknemer/view/' + receiverId;
      break;
    case 'afspraken_disapproved': // test_finished -> afspraken_disapproved (notif to boss)
      var body = senderId + ' is niet akkoord met de afspraken uit het functioneringsgesprek. Pas ze eventueel aan.';
      var url = setup().baseUrl + 'functioneringsafspraken/leidinggevende/edit/' + senderId;
      break;
    case 'afspraken_reset': // afspraken_set -> afspraken_reset (notif to werknemer)
      var body = senderId + ' heeft de afspraken uit het functioneringsgesprek aangepast. Controleer ze nogmaals.';
      var url = setup().baseUrl + 'functioneringsafspraken/werknemer/view/' + receiverId;
      break;
    case 'afspraken_approved': // test_finished / afspraken_disapproved -> afspraken_approved (notif to boss)
      var body = senderId + ' is akkoord met de afspraken uit het functioneringsgesprek.';
      var url = setup().baseUrl + 'functioneringsafspraken/leidinggevende/view/' + senderId;
      break;
  }

  // Na goedkeuren afspraken iets doen met ontwikkelingstraject. Echter geen notificatie want werknemer zit al in de app. Maar een mailtje wellicht. En in de app zelf een melding
  // Na starten ontwikkelingstraject nog een melding naar de boss

  const getDeviceTokensPromise = admin.database().ref('/notifications/' + receiverId + '/deviceId').once('value');
  return getDeviceTokensPromise.then(function(tokensSnapshot){
    const tokens = tokensSnapshot.val();
    // Check if there are any device tokens.
    if (!tokensSnapshot.hasChildren()) {
      return console.log('There are no notification tokens to send to.');
      // Send to email instead TODO
    }
    else {
      const payload = {
        notification: {
          title: 'WorkFit melding: functioneringsgesprek',
          body:  body,
          click_action: url
        },
      };
      return admin.messaging().sendToDevice(tokens, payload);
    }
  }).then((response) => {
    // For each message check if there was an error.
    const tokensToRemove = [];
    /* DIT STUKJE LATER TOEVOEGEN EN ALGEMENE FUNCTIE VAN MAKEN: IS WELLICHT BETER DAN IK NU BIJ sendNotification HEB STAAN
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error) {
        console.error('Failure sending notification to', tokens[index], error);
        // Cleanup the tokens who are not registered anymore.
        if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
          tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
        }
      }
    });
    return Promise.all(tokensToRemove);
    */
  });
});

exports.sendEmail = functions.https.onRequest(function(req, res) {
  var today = setup().today;
  var datumRemString = setup().datumRemString;
  var baseUrl = setup().baseUrl;
  var promises = [];

  setup().promise.then(function(data) {
    data = data.dataEmails;
    for (var mType in data) {
      var emails = data[mType];
      var slug = mType == 'weekly' ? 'weekly' : (mType == 'testreminder' ? 'tests' : (mType == 'roadmap' ? 'verbetertraject' : (mType == 'nulmetingreminder' ? 'nulmeting' : (mType == 'advicereminder' ? 'verbetertraject' : 'personalitytest'))));
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
      var extraText = 'Wil je deze reminder niet meer als email ontvangen, activeer dan de notificatiesettings in je browser. Voor meer uitleg, zie <a href="' + baseUrl + 'pagina/notificaties">instellen browsernotificaties</a>.</p><p>Het WorkFit Team</p>';

      var mailOptions = {
        from: 'WorkFit <noreply@workfit.nl>',
        bcc: emails.join(),
        subject: subject,
        html: header + text + extraText
      }

      promises.push(mailTransport.sendMail(mailOptions));
    }

    Promise.all(promises).then(function(response) {
      res.send(response);
    }).
    catch (function(error) {
      res.send(error);
    });
  });
});

exports.sendNotification = functions.https.onRequest(function(req, res) {
  var today = setup().today;
  var datumRemString = setup().datumRemString;
  var baseUrl = setup().baseUrl;
  var promises = [];
  var mTypes = [];

  setup().promise.then(function(data) {
    data = data.dataDevices;
    for (var mType in data) {
      var slug = mType == 'weekly' ? 'weekly' : (mType == 'testreminder' ? 'tests' : (mType == 'roadmap' ? 'verbetertraject' : (mType == 'nulmetingreminder' ? 'nulmeting' : (mType == 'advicereminder' ? 'verbetertraject' : 'personalitytest'))));
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
        promises.push(admin.messaging().sendToDevice(deviceIds, payload));
      }
    }

    Promise.all(promises).then(function(response) {
      var store = [];
      var userDup = '';
      // First store all the users with something wrong
      for (var i = 0; i < response.length; i++) {
        // All ids and users per messageType
        if (response[i].failureCount > 0) {
          var devicesPerType = data[mTypes[i]].deviceIds;
          var usersPerType = data[mTypes[i]].users;
          var resultsPerType = response[i].results;
          for (var j = 0; j < resultsPerType.length; j++) {
            var user = usersPerType[j];
            if (resultsPerType[j].error !== undefined) {
              if (resultsPerType[j].error.message.indexOf('not registered') !== -1 || resultsPerType[j].error.message.indexOf('Invalid registration token') !== -1) {
                //error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered'
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
      //console.log(store);

      // Make new deviceIds array (newDevIds) and set as new device ids
      var snapshots = [];
      for (var s = 0; s < store.length; s++) {
        var userF = store[s].user;
        snapshots.push(admin.database().ref('notifications/' + userF + '/deviceId').once('value'));
      }
      Promise.all(snapshots).then(function(userdata) {
        for (var u = 0; u < userdata.length; u++) {
          var falseIds = store[u].falseIds;
          var devIds = userdata[u].val();
          var newDevIds = [];
          for (var di = 0; di < devIds.length; di++) {
            if (falseIds.indexOf(devIds[di]) == -1) newDevIds.push(devIds[di]);
          }
          //console.log(newDevIds);
          if (newDevIds.length == 0) admin.database().ref('notifications/' + store[u].user).remove();
          else admin.database().ref('notifications/' + store[u].user + '/deviceId').set(newDevIds);
        }
        res.send(response);
      });
    }).
    catch (function(error) {
      res.send(error);
    });
  });
});

// Send a bulk invitation mail based on URL Endpoint. (Other option is an invitation mail directly when user is added to database)
exports.sendBulkInvitationEmail = functions.https.onRequest(function(req, res) {
  var bedrijf = req.query.bedrijf;
  console.log(bedrijf);
  var baseUrl = setup().baseUrl;
  var promises = [];
  var data = [];
  var promises = [];

  admin.database().ref('klanten').orderByChild('bedrijf').equalTo(bedrijf).once('value').then(function(snapshot) {
    snapshot.forEach(function(childSnap) {
      var email = childSnap.val().email;
      var name = childSnap.val().naam;
      var obj = {name: name, email: email};
      data.push(obj);
    })
    return data;
  }).then(function(data){
    var subject = 'Uitnodiging WorkFit-app';
    var body = '<p>Bij deze nodigen we je uit voor de WorkFit-app. De app helpt - op een leuke en laagdrempelige manier - mee je gezond en prettig op je werk te blijven voelen.<br>Je kunt je registreren voor de app op <a href="'+ baseUrl +'">workfit-pmo.nl</a>.</p>';
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
      promises.push(mailTransport.sendMail(mailOptions));
    }
  });

  Promise.all(promises).then(function(response) {
    res.send(response);
  }).
  catch (function(error) {
    res.send(error);
  });
  console.log(promises);
});

// Send a single invitation mail when user is created in adminusers.
exports.sendInvitationEmail = functions.database.ref('/klanten/{userId}').onWrite(function(event){
  const newVal = event.data.val();
  var baseUrl = setup().baseUrl;
  console.log(newVal);

  var subject = 'Uitnodiging WorkFit-app';
  var body = '<p>Bij deze nodigen we je uit voor de WorkFit-app. De app helpt - op een leuke en laagdrempelige manier - mee je gezond en prettig op je werk te blijven voelen.<br>Je kunt je registreren voor de app op <a href="'+ baseUrl +'">workfit-pmo.nl</a>.</p>';
  body += '<p>De app is er op gericht te achterhalen op welke gebieden je goed functioneert en op welke gebieden minder. Constateren we dat je op een bepaald gebied achterblijft, dan zoomen we op dat gebied in en kijken we wat precies de oorzaken zijn. Dit alles doen we aan de hand van korte vragenlijsten. Bij opstarten via een eenmalige nulmeting, vervolgens via een paar korte vragen waar je periodiek een melding voor krijgt. Die periode is de eerste maand iedere week, blijkt dan alles goed te gaan dan krijg je nog maar eens per drie weken een melding voor de vragenlijst.<br>';
  body += 'Als we na het inzoomen op een gebied zien waardoor je voor dat gebied minder scoort, dan bieden we je een zo goed als kant-en-klaar traject aan om je op dit gebied te ontwikkelen. Het is uiteraard aan jou of je hier ook daadwerkelijk iets mee wilt doen.</p>';
  body += '<p>Tot slot, als je je hebt geregistreerd vraagt de app om notificaties toe te staan. We raden je dit aan te doen, zodat je op een eenvoudige manier - direct op je smartphone - meldingen vanuit de app kunt ontvangen.</p>';
  body += '<p>Veel plezier met het gebruik van WorkFit!</p>';
  body += '<p>Het WorkFit team</p>';

  var header = '<p>Beste ' + newVal.naam + '</p>';
  var to = newVal.email;
  var mailOptions = {
    from : 'WorkFit <noreply@workfit.nl>',
    to: to,
    subject: subject,
    html: header + body
  };

  admin.database().ref('questions/settings/send_invitation').once("value", function(snapshot) {
    var doSend = snapshot.val();
    if (doSend) {
      mailTransport.sendMail(mailOptions).then(function(response){
        console.log(response);
      }).
      catch (function(error) {
        console.log(error);
      });
    }
    else console.log('Invitation will not be sent');
  });

});


// Below is for updating averages of all WF users and updating notification dates when they are in the past

var setWfDate = function(type, days) {
  var datum = new Date();
  if (type == 'notification') {
    datum.setDate(datum.getDate() + days);
    return datum.toISOString().split('T')[0];
  } else return datum.toISOString();
};
var gebieden = ['competentie', 'sociale_steun', 'zelfstandigheid', 'vermoeidheid', 'werkdruk', 'gezondheid', 'fysieke_gezondheid'];

exports.updateAverageGrades = functions.https.onRequest(function(req, res) {
  var today = setWfDate('notification', 0);
  var lastWeek = setWfDate('notification', -7);

  var NulmetingResponses = admin.database().ref('responses').orderByChild('nulmeting/datum').startAt(lastWeek).endAt(today).once('value');
  var ExistingGradeData = admin.database().ref('questions/settings/averages/nulmeting').once('value');

  Promise.all([NulmetingResponses, ExistingGradeData]).then(function(snapshot) {
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
    admin.database().ref().child('questions/settings/averages/nulmeting').remove();
    admin.database().ref().child('questions/settings/averages/nulmeting').set(newGrades);

    res.send(newGrades);
  }).
  catch (function(error) {
    res.send(error);
  });
});

exports.updateNotifications = functions.https.onRequest(function(req, res) {
  var yesterday = setWfDate('notification', -1);
  var nextWeek = setWfDate('notification', 7);
  var usersUpdated = [];
  admin.database().ref('notifications').orderByChild('datum').endAt(yesterday).once('value').then(function(snapshot) {
    snapshot.forEach(function(childSnap) {
      var user = childSnap.key;
      admin.database().ref('notifications/' + user + '/datum').set(nextWeek);
      admin.database().ref('notifications/' + user + '/messageType').set('weekly');
      usersUpdated.push(user);
    });
    res.send(usersUpdated);
  }).
  catch (function(error) {
    res.send(error);
  });
});
