import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, PhoneAuthProvider, multiFactor , sendSignInLinkToEmail } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {

};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
auth.useDeviceLanguage();

export { auth, googleProvider, db , PhoneAuthProvider, multiFactor , sendSignInLinkToEmail };


