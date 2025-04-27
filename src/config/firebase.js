const admin = require('firebase-admin');
const serviceAccount = require('./inpocket-bb64c-firebase-adminsdk-fbsvc-49ef92d638.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
