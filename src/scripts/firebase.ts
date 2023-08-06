// initialize firebase related objects and export them (at the bottom)
// so that they are created only once and can be imported anywhere

// Firebase App (the core Firebase SDK) is always required and must be listed first
import firebase from "firebase/app";
// If you are using v7 or any earlier version of the JS SDK, you should import firebase using namespace import
// import * as firebase from "firebase/app"

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";
import "firebase/functions"; // for cloud functions

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyBZ3s0xKCNhnv82FOXY4k-osI1hbBoUgLw",
    authDomain: "in-a-line-7be84.firebaseapp.com",
    projectId: "in-a-line-7be84",
    storageBucket: "in-a-line-7be84.appspot.com",
    messagingSenderId: "540128111004",
    appId: "1:540128111004:web:a7d85651cf0d4f28fcc059",
};
// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

export const functions = firebase.app().functions("asia-east2"); // to call, see https://firebase.google.com/docs/functions/callable#call_the_function
export const auth = firebase.auth();
export const db = app.firestore();
export const firestore = firebase.firestore;
export const usersCollection = "users";
export const waitingPlayersCollection = "waitingPlayers";
export const gamesCollection = "games";
export const googleProvider = firebase.auth.GoogleAuthProvider; // call to instantiate
export default app;
