const admin = require('firebase-admin');

let firebaseApp = null;

const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if we're in demo mode
  if (process.env.FIREBASE_PROJECT_ID === 'DEMO_MODE') {
    console.log('Running in DEMO MODE - Firebase disabled');
    firebaseApp = { demo: true };
    return firebaseApp;
  }

  try {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
      token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    console.log('Firebase Admin initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

const getFirestore = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }

  // Return mock firestore for demo mode
  if (firebaseApp.demo) {
    return {
      collection: () => ({
        doc: () => ({
          get: () => Promise.resolve({ exists: false }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve()
        }),
        add: () => Promise.resolve({ id: 'demo-id' }),
        where: () => ({
          orderBy: () => ({
            limit: () => ({
              get: () => Promise.resolve({ docs: [] })
            })
          })
        })
      })
    };
  }

  return admin.firestore();
};

const getAuth = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }

  // Return mock auth for demo mode
  if (firebaseApp.demo) {
    return {
      verifyIdToken: () => Promise.resolve({ uid: 'demo-user', email: 'demo@example.com' })
    };
  }

  return admin.auth();
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  admin
};
