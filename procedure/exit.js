// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, get, set, push } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
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
const db = getDatabase(app);
const auth = getAuth();
var user;
var userData;


//部員情報アップロード
function upload() {
    if(!user) {return;}

    var setData = {
        name : userData.name,
        nameKana : userData.nameKana,
        studentNumber : userData.studentNumber,
        time : (new Date()).getTime(),
        reason : document.getElementById("reason").value,
        status : 1
    }

    if(userData.buhiRecord) {
        setData.buhiRecord = userData.buhiRecord;
    }

    if(userData.point) {
        setData.point = userData.point;
    }

    if(userData.pointHistory) {
        setData.pointHistory = userData.pointHistory;
    }

    set(ref(db, "users/" + user.uid), setData)
    .then(() => {
        document.getElementById("loading").style.display = "none";
        document.getElementById("done").style.display = "";
    });
}

window.upload = upload;
export{upload}

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
    user = us;

    if(!user) {
        alert("Googleアカウントでのログインをしてから、部員情報の登録をお願いします。");
        login();
    } else {
        get(ref(db, "users/" + user.uid)).then((snapshot) => {
            userData = snapshot.val();
    
            document.getElementById("name").textContent = userData.name;
        });
    }
});