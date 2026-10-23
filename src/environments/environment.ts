// Firebase web app configuration for LifeSync.
// Replace the placeholder values with your real config from the Firebase Console.
export const environment = {
  production: false,
  // Keep the main app project for authentication and personal user data.
  firebase: {
    apiKey: 'AIzaSyC1rG8h6UeHbUaexFwmyyCj87KERme6NGE',
    authDomain: 'lifesync-f8691.firebaseapp.com',
    projectId: 'lifesync-f8691',
    storageBucket: 'lifesync-f8691.firebasestorage.app',
    messagingSenderId: '461104823636',
    appId: '1:461104823636:web:b54acb9cc0a6bd1e0a9cc1',
    measurementId: 'G-76FXJ51FLH',
  },
  // Contact requests use a separate project from account and personal data.
  supportFirebase: {
    apiKey: 'AIzaSyDPieRxv2i1FmLbfvJXi1yq-J7e1YgZ0aE',
    authDomain: 'lifesync-support.firebaseapp.com',
    projectId: 'lifesync-support',
    storageBucket: 'lifesync-support.firebasestorage.app',
    messagingSenderId: '665346197454',
    appId: '1:665346197454:web:4bdec1c75968edd88d4d9f',
    measurementId: 'G-8YZD8FX792',
  },
};
