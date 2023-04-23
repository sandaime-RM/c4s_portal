// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, push, remove, set, get, update } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
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
var amount = 0;
var myName = "";
var url = "";
var getId = "";
var getModal = new bootstrap.Modal(document.getElementById('getModal'))


//読み込み時に実行
window.onload = function() {
    var nowYear = (new Date()).getFullYear();

    for(var i=2022; i<=nowYear; i++) {
        if(i == nowYear) {
            document.getElementById("year").innerHTML = '<option value="'+i+'" selected>'+i+'年</option>' + document.getElementById("year").innerHTML;
        } else {
            document.getElementById("year").innerHTML = '<option value="'+i+'">'+i+'年</option>' + document.getElementById("year").innerHTML;
        }
    }
}

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
    user = us;

    get(ref(db, "users/"+user.uid+"/name"))
    .then((snapshot) => {
        myName = snapshot.val();
    });

    //自分のポイント情報の取得
    get(ref(db, "users/"+user.uid+"/point"))
    .then((snapshot) => {
        amount = snapshot.val();
        if(!amount){amount = 0;}

        document.getElementById("total").textContent = Number(amount).toLocaleString();

        var date = new Date();

        document.getElementById("date").textContent = date.toLocaleString();


        getId = getParam("get");
        console.log(getId)

        //ポイント受け取り
        if(getId) {
            get(ref(db, "pointBank/" + getId))
            .then((snapshot2) => {
                var getData = snapshot2.val();

                amount += Number(getData.amount);

                document.getElementById("getPoint").textContent = getData.amount;
                document.getElementById("senderName").textContent = getData.senderName;

                set(ref(db, "users/"+user.uid+"/point"), amount);

                remove(ref(db, "pointBank/" + getId));
                
                getModal.show();

                document.getElementById("total").textContent = Number(amount).toLocaleString();
            });
        }
    });
});

//ポイント送信用リンクを作成
function sendPoint() {
    var sendAmount = Number(document.getElementById("sendAmount").value);

    if(amount < sendAmount) {
        document.getElementById("pointError").textContent = "エラー：残高を超過しています。";
        return;
    }

    push(ref(db, "pointBank"), {
        senderName : myName,
        amount : sendAmount,
        sendDate : (new Date()).getTime()
    })
    .then((snapshot) => {
        amount -= sendAmount;

        set(ref(db, "users/" + user.uid + "/point"), amount);

        url = "https://portal.c4-s.net/wallet?get=" + snapshot.key;

        document.getElementById("sendUrl").textContent = url;
        document.getElementById("urlDisp").style.display = "";
        document.getElementById("total").textContent = Number(amount).toLocaleString();

    });
}

window.sendPoint = sendPoint;
export{sendPoint}


//リンクをコピー
function copyUrl() {
    if (navigator.clipboard) { // navigator.clipboardが使えるか判定する
        return navigator.clipboard.writeText(url).then(function () { // クリップボードへ書きむ
            document.getElementById("copyBtn").innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-clipboard-check" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>';
        })
    } else {
        url.select() // inputタグを選択する
        document.execCommand('copy') // クリップボードにコピーする
        document.getElementById("copyBtn").innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-clipboard-check" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>';
    }
}

window.copyUrl = copyUrl;
export{copyUrl}

//URLのパラメータ取得
function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}