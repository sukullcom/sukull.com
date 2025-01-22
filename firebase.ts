// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBX6uS6Im63-V6RUvHmXDolwfxhJcQlbhA",
  authDomain: "sukull-65f42.firebaseapp.com",
  projectId: "sukull-65f42",
  storageBucket: "sukull-65f42.firebasestorage.app",
  messagingSenderId: "444025198190",
  appId: "1:444025198190:web:1bfba5b6702d40fc95b87f",
  measurementId: "G-RW2Y0S9Y8V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);