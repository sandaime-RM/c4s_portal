// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { GoogleAuthProvider, getAuth, signInWithRedirect, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBE60G8yImWlENWpCnQZzqqVUrwWa_torg",
    authDomain: "c4s-portal.firebaseapp.com",
    databaseURL: "https://c4s-portal-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "c4s-portal",
    storageBucket: "c4s-portal.appspot.com",
    messagingSenderId: "863775995414",
    appId: "1:863775995414:web:82eb9557a13a099dfbe737",
    measurementId: "G-K2SR1WSNRC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth();
const provider = new GoogleAuthProvider();

//読み込み時に実行
window.onload = function() {

}

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log(user);
        document.getElementById("account").innerHTML = '<img src="'+user.photoURL+'" width="32px" height="32px" class="rounded-pill mx-2"> <span class="fs-5">'+user.displayName+'</span>'
    } else {
      document.getElementById("account").innerHTML = '<button type="button" class="btn btn-outline-dark me-2" onclick="login()"><img src="icons/google.svg" height="20px"> ログイン</button>';
    }
});

//ログイン
function login() {
    signInWithRedirect(auth, provider);
}

window.login = login;
export{login}