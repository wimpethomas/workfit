angular.module('workfit')
.service('AllowNotifications', notification);

function notification() {
  // Ask for allowing notifications
  var setNotification = function(username, email) {
    const messaging = firebase.messaging();
    firebase.database().ref('notifications').once('value').then(function(snapshot) {
      // If username is not found in /notifications then newUser
      if (snapshot.hasChild(username)) return false;
      else return true;
    }).then(function(newUser) {
      if (newUser) firebase.database().ref().child('notifications/' + username + '/email').set(email);
      messaging.requestPermission().then(function() {
        // User has allowed WorkFit to send notifications
        console.log('Notification permission granted.');
        return messaging.getToken();
      }).then(function(token) {
        // If newUser then add user under notification with token as deviceId, else check deviceIds
        if (newUser) {
          firebase.database().ref().child('notifications/' + username + '/deviceId').set([token]);
        } else {
          // If token is not known under deviceIds then add token as deviceId, else do nothing
          var devicesRef = firebase.database().ref().child('notifications/' + username + '/deviceId');
          firebase.database().ref().child('notifications/' + username + '/deviceId').once('value').then(function(snapshot) {
            var devices = snapshot.val();
            var index = devices.length;
            if (devices.indexOf(token) == -1) firebase.database().ref().child('notifications/' + username + '/deviceId').child(index).set(token);
          });
        }
      })                   .
      catch (function(err) {
        // User has blocked WorkFit to send notifications. TODO: let user know that notifications must be allowed
        console.log('Unable to get permission to notify.', err);
        // alert('Je moet notificaties toestaan om de app te laten werken');
        return err;
      });
    });
  };

  return {
    notify: setNotification
  };

}
