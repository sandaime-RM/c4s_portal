// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, push, remove, set, get } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
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
var user = {};

//データベースのデータ格納用
var events = {};
var reactions;
var userAttend;
var amount;

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
    user = us;

    get(ref(db, "users/" + user.uid)).then((snapshot) => {
        var userData = snapshot.val();

        amount = userData.point;
        userAttend = userData.attend;

        document.getElementById("info1").textContent = userData.studentNumber + " " + userData.name;
        document.getElementById("info2").textContent = userData.department + " " + userData.grade + "年生";
        showQR();
    });
});

//読み込み時に実行
window.onload = function() {
    get(ref(db, "event")).then((snapshot) => {
        if(snapshot.exists()) {
            //イベントリストの表示
            if(Object.keys(snapshot.val()).length != Object.keys(events).length) {
                events = snapshot.val();
            }
        }
    });
}


//出席登録
function attend() {
    document.getElementById("errorAttend").innerHTML = "";

    if(document.getElementById("code").value == "") {
        return;
    }

    var code = document.getElementById("code").value;
    var successed = false;

    Object.keys(events).forEach((key, index) => {
        if(code == Number(events[key].code)) {
            successed = true;

            if(userAttend) {
                if(userAttend[key]) {
                    alert("既に出席登録しています。");
                    return;
                }
            }

            set(ref(db, "eventReactions/" + key + "/attended/" + user.uid), true);

            set(ref(db, "users/" + user.uid + "/attend/" + key), {
                date : (new Date()).getTime(),
                title : events[key].title
            })
            .then(() => {
                document.getElementById("pointText").textContent = "";

                if(events[key].point) {
                    amount += events[key].point;
                    set(ref(db, "users/" + user.uid + "/point/"), amount);
                    push(ref(db, "users/" + user.uid + "/pointHistory/"+ (new Date()).getFullYear() + "/"), {
                        date : (new Date()).getTime(),
                        mode : 1,
                        amount : events[key].point,
                        title : events[key].title+" への出席登録"
                    });

                    document.getElementById("pointText").textContent = events[key].point+"pt 受け取りました";
                }

                document.getElementById("success").style.display = "";
                document.getElementById("successText").textContent = events[key].title;
                document.getElementById("attendBtn").disabled = true;
            });
        }
    });

    if(!successed) {
        document.getElementById("errorAttend").innerHTML = "入力された出席コードは無効です。";
    }
}

window.attend = attend;
export{attend}

//QR表示

function showQR() {
    // 入力された文字列を取得
    var userInput = user.uid;
    var query = userInput.split(' ').join('+');
    // QRコードの生成
    (function() {
       var qr = new QRious({
         element: document.getElementById('qr'),
         // 入力した文字列でQRコード生成
         value: query
    });
    qr.background = '#FFF'; //背景色
    qr.backgroundAlpha = 0.8; // 背景の透過率
    qr.foreground = '#222'; //QRコード自体の色
    qr.foregroundAlpha = 1.0; //QRコード自体の透過率
    qr.level = 'L'; // QRコードの誤り訂正レベル
    qr.size = 240; // QRコードのサイズ
    })();
  
}

window.showQR = showQR;
export{showQR}