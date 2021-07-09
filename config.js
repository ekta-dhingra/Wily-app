import firebase from "firebase"
require("@firebase/firestore")
var firebaseConfig = {
    apiKey: "AIzaSyBWA2Xj--_pWH4ae9io3a_qhB3-PT_viHM",
    authDomain: "wily-5304d.firebaseapp.com",
    projectId: "wily-5304d",
    storageBucket: "wily-5304d.appspot.com",
    messagingSenderId: "1073260433985",
    appId: "1:1073260433985:web:5e5339fef018c98db12cc0"
  };
  // Initialize Firebase
  if(!firebase.apps.length)
  {
  firebase.initializeApp(firebaseConfig);
  }
  export default firebase.firestore()
