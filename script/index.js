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
var c4suser = {};

//データベースのデータ格納用
var events = {};
var reactions;
var userAttend;
var amount;

//HTML要素
var attendmodal = new bootstrap.Modal(document.getElementById("attendModal"));

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
  user = us;

  //ログイン状態
  if(user){
    get(ref(db, "users/" + user.uid)).then((snapshot) => {
      c4suser = snapshot.val();
      
      //プロフィールを表示
      document.getElementById("userPic").innerHTML = '<img src="' + user.photoURL + '" style="width: 100%; height: 100%; border-radius: 50%;">'
      document.getElementById("userName").innerText = user.displayName;
      document.getElementById("userTUS").innerHTML = c4suser.department + " " + c4suser.grade + "年生" + "<br>" + c4suser.studentNumber;

      document.getElementById("pointbar").style.width = String(c4suser.point / 10000 * 100) + "%";
      document.getElementById("pointnum").innerText = c4suser.point;
      

      document.getElementById("profile").style.display = "block";

      amount = c4suser.point;
      userAttend = c4suser.attend;

      document.getElementById("info1").textContent = c4suser.studentNumber + " " + c4suser.name;
      document.getElementById("info2").textContent = c4suser.department + " " + c4suser.grade + "年生";
      showQR();
    });
  }
  //ログアウト状態
  else{

  }
});

//読み込み時に実行
window.onload = function() {
  //開催中のイベントをトップに表示:made by toyton
  //複数同時開催には対応していません
  get(ref(db, "event")).then((events) => {
    Object.keys(events.val()).forEach((i) => {
      var data = events.val()[i];
      if(data.term != null){
        if(new Date(data.term.begin) <= new Date() && new Date() <= new Date(data.term.end)){
          document.getElementById("heldevent").style.display = "block";
          document.getElementById("heldevent_title").innerText = data.title;
          document.getElementById("heldevent_place").innerText = data.place;
          data.tags.forEach(tag => {
            document.getElementById("heldevent_tags").innerText += "#" + tag;
          });
          document.getElementById("heldevent_description").innerText = data.description;
        }
      }
    })
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

//モーダルを開くだけのプログラム:made by toyton
export function openmodal(target) {
  switch (target) {
    case "attend":
      attendmodal.show();
      break;
  
    default:
      break;
  }
}
window.openmodal = openmodal;