import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, PhoneAuthProvider, multiFactor , sendSignInLinkToEmail } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_CDNPI-0tR244to6NbYRKdLbAd3lESgY",
  authDomain: "datadash-firebaselogin.firebaseapp.com",
  projectId: "datadash-firebaselogin",
  storageBucket: "datadash-firebaselogin.firebasestorage.app",
  messagingSenderId: "760679953803",
  appId: "1:760679953803:web:0031b0c9ad38867f58eb8e",
  measurementId: "G-SN3F1MQQJJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
auth.useDeviceLanguage();

export { auth, googleProvider, db , PhoneAuthProvider, multiFactor , sendSignInLinkToEmail };


