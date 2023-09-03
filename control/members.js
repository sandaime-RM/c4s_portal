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
var departments = {
    name : [],
    num : []
}
var totalPoint = 0;
var pointYen = 30000;

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
        var date = new Date();

        document.getElementById("tableBirth").innerHTML = "";

        Object.keys(users).forEach((key, index) => {
            if(key == "admin-users") { return;}
            if(users[key].status) {totalNum --; return;}

            //合計ポイントの計算
            if(users[key].point) {
                totalPoint += users[key].point;
            }

            if(users[key].sex == "man") {menNum ++;}

            grades[users[key].grade - 1] ++;

            if(departments.name.indexOf(users[key].department) == -1) {
                departments.name.push(users[key].department);
                departments.num.push(1);
            } else {
                var indexDepart = departments.name.indexOf(users[key].department);
                departments.num[indexDepart] ++;
            }

            if(users[key].birth) {
                var birthDate = new Date(users[key].birth);
            
                if(date.getMonth() == birthDate.getMonth()) {
                    document.getElementById("tableBirth").innerHTML += '<tr><th scope="row">'+users[key].name+' さん</th><td>'+users[key].grade+'年生</td><td>'+(birthDate.getMonth() + 1)+'月'+(birthDate.getDate())+'日</td></tr>';
                }
            }
        });

        dispGenderRatio();
        dispGradeRatio();
        dispDepartRatio();

        document.getElementById("pointTotal").textContent = Math.floor(totalPoint).toLocaleString();
        document.getElementById("pointYen").textContent = "100 pt = ￥" + String(Math.round((pointYen/totalPoint) * 10000)/100) ;
    });
}

//男女比表示
function dispGenderRatio() {
    document.getElementById("menNum").textContent = menNum;
    document.getElementById("womenNum").textContent = totalNum - menNum;
    document.getElementById("menPercent").textContent = (Math.floor(menNum/totalNum*1000)/10).toString() + "%";
    document.getElementById("womenPercent").textContent = (Math.floor((totalNum - menNum)/totalNum*1000)/10).toString() + "%";

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
        document.getElementById("grade"+i + "Ratio").textContent = (Math.floor(grades[i-1]/totalNum * 1000)/10).toString() + "%";
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

//学科別人数比
function dispDepartRatio() {
    var length = departments.name.length;

    document.getElementById("tableDepart").innerHTML = "";

    for(var i=0; i<length; i++) {
        document.getElementById("tableDepart").innerHTML += '<tr><th scope="row">' + departments.name[i] + '</th><td>'+departments.num[i]+'</td><td>' + (Math.floor(departments.num[i] / totalNum * 1000)/10).toString() + '%</td></tr>';
    }

    const ctx3 = document.getElementById('departGraph');

    new Chart(ctx3, {
        type: 'doughnut',
        data: {
            labels: departments.name,
            datasets: [{
                label: '学科別人数比',
                data: departments.num,
                backgroundColor: [
                    '#e83c2c',
                    '#51bf22',
                    '#18acd9',
                    '#7947ed',
                    '#2cdb98',
                    '#d4d006',
                    '#363ce3'
                ],
                hoverOffset: 4
            }]
        }
    });
}