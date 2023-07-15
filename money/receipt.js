// // Import the functions you need from the SDKs you need
// import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
// import { getDatabase, push, set, ref, get, child, remove } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
// import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//     apiKey: "AIzaSyBE60G8yImWlENWpCnQZzqqVUrwWa_torg",
//     authDomain: "c4s-portal.firebaseapp.com",
//     databaseURL: "https://c4s-portal-default-rtdb.asia-southeast1.firebasedatabase.app",
//     projectId: "c4s-portal",
//     storageBucket: "c4s-portal.appspot.com",
//     messagingSenderId: "863775995414",
//     appId: "1:863775995414:web:82eb9557a13a099dfbe737",
//     measurementId: "G-K2SR1WSNRC"
// };

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
// const db = getDatabase(app);
// const auth = getAuth();
var user;
var data, keys;
var number = getParam("num");
var toName = getParam("to");
var content = getParam("cnt");
var money = getParam("mny");
var setDate = getParam("dt");

window.onload = function () {
    var date = new Date();
    document.getElementById("date").textContent = date.toLocaleDateString();
    document.getElementById("num").textContent = ("00" + number.toString()).slice(-3);
    document.getElementById("content").textContent = content;
    document.getElementById("to").textContent = toName;
    document.getElementById("money").textContent = Number(money).toLocaleString();
    document.getElementById("date2").textContent = setDate;
}

/**
 * Get the URL parameter value
 *
 * @param  name {string} パラメータのキー文字列
 * @return  url {url} 対象のURL文字列（任意）
 */
function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}