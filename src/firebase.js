// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBUgfwL45bPz_wwcLd2uKrDLdKLK-p8dDI",
    authDomain: "calling-95527.firebaseapp.com",
    projectId: "calling-95527",
    storageBucket: "calling-95527.appspot.com",
    messagingSenderId: "874462410285",
    appId: "1:874462410285:web:49396efac655e7297a2aa4",
    measurementId: "G-YELP3RC2SF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth(app);
const firestore = getFirestore(app);

export {
    auth,
    firestore,
}

