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
var users;
var menNum = 0;
var totalNum = 0;
var grades = [0, 0, 0, 0];

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
    user = us;
    restart();
});

//読み込み
function restart() {
    get(ref(db, "users")).then((snapshot) => {
        users = snapshot.val();

        totalNum = Object.keys(users).length;

        Object.keys(users).forEach((key, index) => {
            if(users[key].status) {totalNum --; return;}

            if(users[key].sex == "man") {menNum ++;}

            grades[users[key].grade - 1] ++;
        });

        dispGenderRatio();
        dispGradeRatio();
    });
}

//男女比表示
function dispGenderRatio() {
    document.getElementById("menNum").textContent = menNum;
    document.getElementById("womenNum").textContent = totalNum - menNum;
    document.getElementById("menPercent").textContent = Math.floor(menNum/totalNum*1000)/10;
    document.getElementById("womenPercent").textContent = Math.floor((totalNum - menNum)/totalNum*1000)/10;

    const ctx1 = document.getElementById('genderGraph');

    new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['男性', '女性'],
            datasets: [{
                label: '男女比',
                data: [menNum, (totalNum-menNum)],
                backgroundColor: [
                    '#2a8aeb',
                    '#e82c68',
                ],
                hoverOffset: 4
            }]
        }
    });
}

//学年別人数比
function dispGradeRatio() {
    for(var i=1; i<=4; i++) {
        document.getElementById("grade"+i).textContent = grades[i-1];
        document.getElementById("grade"+i + "Ratio").textContent = Math.floor(grades[i-1]/totalNum * 1000)/10;
    }

    const ctx2 = document.getElementById('gradeGraph');

    new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['1年生', '2年生', '3年生', '4年生'],
            datasets: [{
                label: '学年別人数比',
                data: grades,
                backgroundColor: [
                    '#e83c2c',
                    '#51bf22',
                    '#18acd9',
                    '#7947ed'
                ],
                hoverOffset: 4
            }]
        }
    });
}