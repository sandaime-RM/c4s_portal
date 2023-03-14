// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
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

//ログイン状態の確認
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log(user);
        document.getElementById("account").innerHTML = '<img src="'+user.photoURL+'" width="32px" height="32px" class="rounded-pill mx-2" onclick="goAccount()" style="cursor: pointer;"> <span class="fs-5" style="user-select: none; cursor: pointer;" onclick="goAccount()">'+user.displayName+'</span>'
    } else {
      document.getElementById("account").innerHTML = '<button type="button" class="btn btn-outline-dark me-2" onclick="login()"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-google" viewBox="0 0 16 16"><path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/></svg> ログイン</button><div class="text-danger small" id="error"></div>';
    }
});

//ログイン
function login() {
    signInWithPopup(auth, provider)
    .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
        document.getElementById("error").innerHTML = error.message;
      });
}

window.login = login;
export{login}

//アカウントページへ
function goAccount() {
    window.location.href = "https://portal.c4-s.net/account";
}

window.goAccount = goAccount;
export{goAccount}

//ログアウト
function logout() {
    signOut(auth).then(() => {
      var accountName = document.getElementById("userName");
      var accountIcon = document.getElementById("userIcon");
      var accountEmail = document.getElementById("userEmail");
      
      accountName.innerHTML = "";
      accountIcon.src = "";
      accountEmail.innerHTML = "ログインしていません";
      
      }).catch((error) => {
        document.getElementById("error").innerHTML = error.message;
      });
}

window.logout = logout;
export{logout}