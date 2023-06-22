// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, get, push } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getObj, show, hide } from "/script/methods.js";
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
const db = getDatabase();

//データ格納用
var user = {};
var c4suser = {};
var adminusers = {};

//ログイン状態の確認
onAuthStateChanged(auth, (snapshot) => {
  user = snapshot;
  if (user) {
    console.log(user);
    document.getElementById("account").innerHTML = '<img id="userpic" src="'+user.photoURL+'" width="32px" height="32px" class="rounded-pill mx-2" onclick="goAccount()" style="cursor: pointer;"> <span class="fs-5" style="user-select: none; cursor: pointer;" onclick="goAccount()">'+user.displayName+' <span id="topUserTag"></span></span>'

    get(ref(db, "users/" + user.uid)).then((snapshot) => {
      c4suser = snapshot.val();
      get(ref(db, "admin-users")).then((snapshot) => {
        adminusers = snapshot.val();

        //ヘッダーとオフキャンバスメニューを構成
        getObj("menuBtn").src = user.photoURL;
        getObj("userPic_offcanvas").src = user.photoURL;
        getObj("userName_offcanvas").innerText = c4suser.name;
        if(adminusers[user.uid]) { getObj("admin-check").style.display = "inline"; }
        getObj("userData_offcanvas").innerText = c4suser.department.split(' ').splice(-1)[0];
        //メニューを開く
        getObj("menuBtn").onclick = function () { new bootstrap.Offcanvas(getObj("menu")).show(); };
      })

      if(snapshot.child("point").exists()) {
        var point = snapshot.child("point").val();
        var color = "#c95700";
        
        if(point >= 8000) {
          color = "#aba9a1";
        }

        if(point >= 15000) {
          color = "#decb00";
        }

        if(point >= 3000) {
          document.getElementById("topUserTag").innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" style="color: '+color+'" class="ms-1 bi bi-check-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>';
          document.getElementById("userpic").style.border = "solid 3px " + color;
        }
      }

      if(snapshot.exists()) {
        push(ref(db, "users/" + user.uid + "/accessHistory"), {
          date : (new Date()).getTime(),
          path : location.pathname
        });
      }
    });
  } else {
    if(location.pathname != "/") { location.href = "/"; }
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
    if (errorMessage == "Firebase: Error (auth/unauthorized-domain).") {
      alert("不正なドメインです");
    }
    else{
      alert(errorMessage);
    }
  });
}

window.login = login;
export{login}

//アカウントページへ
export function goAccount() { window.location.href = "/account"; } window.goAccount = goAccount;

//ログアウト
export function logout() {
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

//誰かが出席登録をしたら管理者に通知する
export function AttendanceNotification() {
  console.error("function AttendanceNotification is not built.")
}
window.AttendanceNotification = AttendanceNotification;