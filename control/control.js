// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, onChildAdded, push, remove, set, get } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
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

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
    user = us;
});

//読み込み時に実行
window.onload = function() {
    get(ref(db, 'users')).then((snapshot) => {
        document.getElementById("loadingControl").style.display = "none";
        var users = snapshot.val();
        var date = new Date();

        Object.keys(users).forEach((key, i) => {
            if(key == "admin-users") {return;}

            var sex = "女性";
            if(users[key].sex == "man") {sex="男性";}

            var tags = "";
            var roles = "";
            if(users[key].fields) {
                tags = '<div class="text-primary small">';
                users[key].fields.forEach(element => {
                    tags += '<span class="mx-1">'+element+'</span>';
                });
                tags += '</div>';
            }

            if(users["admin-users"][key]) {
                roles += '<span class="badge bg-secondary mx-1">管理者</span>';
            }

            var age = 0;
            var birth = new Date(users[key].birth);
            age = Math.floor((date - birth) / (86400000 * 365));

            document.getElementById("memberList").innerHTML += '<li class="list-group-item col-lg-6" onclick="openInfo('+i+')" data-bs-toggle="modal" data-bs-target="#exampleModal"><h6>'+users[key].name + '<span class="text-secondary mx-1">' + users[key].studentNumber + '</span>' + roles + '</h6><div class="small text-secondary">'+users[key].department+' '+users[key].grade+'年 '+sex+' '+age+'歳</div>'+tags+'</li>'
        });
    })
    .catch((error) => {
        document.getElementById("loadingControl").style.display = "none";
        document.getElementById("errorControl").innerHTML = '<span class="text-danger small">'+error+'</span>';
    });
}

//部員情報の表示
function openInfo(i) {
    
}

window.openInfo = openInfo;
export{openInfo}