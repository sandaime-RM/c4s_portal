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
var getModal = new bootstrap.Modal(document.getElementById('getModal'));
var keys;
var data;


//読み込み時に実行
window.onload = function() {
    var nowYear = (new Date()).getFullYear();

    document.getElementById("year").addEventListener('change', dispList);
    
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
        console.log(getId);

        dispList();

        //ポイント受け取り
        if(getId) {
            get(ref(db, "pointBank/" + getId))
            .then((snapshot2) => {
                var getData = snapshot2.val();

                amount += Number(getData.amount);

                document.getElementById("getPoint").textContent = getData.amount;
                document.getElementById("senderName").textContent = getData.senderName;

                set(ref(db, "users/"+user.uid+"/point"), amount);

                push(ref(db, "users/"+user.uid+"/pointHistory/"+((new Date()).getFullYear()) + "/"), {
                    amount : getData.amount,
                    date : date.getTime(),
                    title : getData.senderName + " さんから受け取り",
                    mode : 1
                });

                remove(ref(db, "pointBank/" + getId));
                
                getModal.show();

                document.getElementById("total").textContent = Number(amount).toLocaleString();
                dispList();
            });
        }
    });
});

//ポイント送信用リンクを作成
function sendPoint() {
    var sendAmount = Number(document.getElementById("sendAmount").value);

    if(0 >= sendAmount) {
        document.getElementById("pointError").textContent = "エラー：0pt以下の送信はできません。";
        return;
    }

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

        push(ref(db, "users/"+user.uid+"/pointHistory/"+((new Date()).getFullYear()) + "/"), {
            amount : sendAmount,
            date : (new Date()).getTime(),
            title : "送信用リンクの作成",
            mode : 2
        });

        url = "https://portal.c4-s.net/wallet?get=" + snapshot.key;

        //URL表示
        document.getElementById("sendUrl").textContent = url;
        document.getElementById("urlDisp").style.display = "";
        document.getElementById("total").textContent = Number(amount).toLocaleString();

        //QRコード生成
        // 入力された文字列を取得
        var userInput = url
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
        qr.foreground = '#333'; //QRコード自体の色
        qr.foregroundAlpha = 1.0; //QRコード自体の透過率
        qr.level = 'L'; // QRコードの誤り訂正レベル
        qr.size = 160; // QRコードのサイズ
            // QRコードをflexboxで表示
            document.getElementById('qrOutput').style.display = 'flex';
        })();

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


//履歴の表示
function dispList() {
    var total = 0;
    document.getElementById("moneyList").innerHTML = '<div class="text-center py-3"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    get(ref(db, 'users/'+user.uid + "/pointHistory")).then((snapshot) => {
        document.getElementById("errorMoney").innerHTML = "";
        data = snapshot.child(document.getElementById("year").value).val();

        //詳細表示
        if(!data) {
            document.getElementById("moneyList").innerHTML = "<div class='text-center text-secondary py-3'>データがありません</div>";
            return;
        } else {
            document.getElementById("moneyList").innerHTML = "";
            keys = Object.keys(data);
        }

        Object.keys(data).forEach((element, index) => {
            dispMoneyInfo(data[element], index);
        });

        return;
    })
    .catch((error) => {
        document.getElementById("moneyList").innerHTML = "";
        document.getElementById("errorMoney").innerHTML = '<span class="text-danger small">'+error+'</span>';
    });
}

function dispMoneyInfo(e, index) {

    if(e.mode == 1) {
        document.getElementById("moneyList").innerHTML = '<li class="list-group-item"><div class="row"><div class="col-2 text-primary fs-6"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" class="bi bi-box-arrow-in-down" viewBox="0 0 16 16" ><path fill-rule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/><path fill-rule="evenodd" d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg></div><div class="col-10"><div class="fw-normal">'+e.title+'</div><div class="row py-1"><div class="col-7 text-secondary small">'+(new Date(e.date)).toLocaleString()+'</div><div class="col-5 fw-bold fs-5 text-end">'+Number(e.amount).toLocaleString()+' pt</div></div></div></div></li>' + document.getElementById("moneyList").innerHTML;
    } else {
        document.getElementById("moneyList").innerHTML = '<li class="list-group-item"><div class="row"><div class="col-2 text-danger fs-6"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" class="bi bi-box-arrow-up" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/><path fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 1.707V10.5a.5.5 0 0 1-1 0V1.707L5.354 3.854a.5.5 0 1 1-.708-.708l3-3z"/></svg></div><div class="col-10"><div class="fw-normal">'+e.title+'</div><div class="row py-1"><div class="col-7 text-secondary small">'+(new Date(e.date)).toLocaleString()+'</div><div class="col-5 fw-bold fs-5 text-end">'+Number(e.amount).toLocaleString()+' pt</div></div></div></div></li>' + document.getElementById("moneyList").innerHTML;
    }
}