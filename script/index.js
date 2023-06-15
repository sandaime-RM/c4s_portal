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
      document.getElementById("userName").innerText = c4suser.name;
      document.getElementById("userNum").innerText = c4suser.studentNumber;

      //ランク計算
      // 0-     ビギナー
      // 3000-  アマチュア
      // 8000-  エキスパート
      // 15000- ベテラン
      var rankname = ["ビギナー", "アマチュア", "エキスパート", "ベテラン"];
      var rankcolor = ["cornflowerblue", "darkgreen", "purple", "goldenrod"];
      document.getElementById("pointnum").innerText = c4suser.point;
      var ranknum;
      var ratio;
      var messageHTML;
      if ( c4suser.point < 3000 ) {
        ranknum = 0;
        ratio = String(c4suser.point / 3000 * 100) + "%";
        messageHTML = '<p>' + rankname[1] + 'まであと<span style="color: darkred; font-weight: bold;">' + String(3000 - c4suser.point) + '</span>pt</p>';
      }
      else if ( c4suser.point < 8000 ) {
        ranknum = 1;
        ratio = String((c4suser.point - 3000) / 5000 * 100) + "%";
        messageHTML = '<p>' + rankname[2] + 'まであと<span style="color: darkred; font-weight: bold;">' + String(8000 - c4suser.point) + '</span>pt</p>';
      }
      else if ( c4suser.point < 15000 ) {
        ranknum = 2;
        ratio = String((c4suser.point - 8000) / 7000 * 100) + "%";
        messageHTML = '<p>' + rankname[3] + 'まであと<span style="color: darkred; font-weight: bold;">' + String(15000 - c4suser.point) + '</span>pt</p>';
      }
      else {
        ranknum = 3;
        ratio = "100%";
        messageHTML = '<p style="color: darkred;">最高ランク会員</p>';
      }
      document.getElementById("pointbar").style.width = ratio;
      document.getElementById("pointbar").style.backgroundColor = rankcolor[ranknum];
      document.getElementById("restpoint").innerHTML = messageHTML;
      document.getElementById("ranktext").innerText = rankname[ranknum];
      document.getElementById("ranktext").style.backgroundColor = rankcolor[ranknum];

      //ポイントモーダルに履歴を表示
      var y = new Date().getFullYear();
      var pointHistory = Object.keys(c4suser.pointHistory[new Date().getFullYear()]).reverse();
      pointHistory.forEach((id) => {
        var data = c4suser.pointHistory[new Date().getFullYear()][id];
        var date = getdatetext(new Date(data.date));
        if (data.mode == 1) {
          document.getElementById("pointHistory").innerHTML += '<li class="list-group-item"><h6 class="mb-0">' + data.title + '</h6><div class="row"><p class="text-secondary small col-6 mb-0">' + date + '</p><h4 class="col-6" style="text-align: right; margin-bottom: 0;">' + data.amount + 'pt</h4></div></li>';
        }
        else {
          document.getElementById("pointHistory").innerHTML += '<li class="list-group-item"><h6 class="mb-0">' + data.title + '</h6><div class="row"><p class="text-secondary small col-6 mb-0">' + date + '</p><h4 class="col-6" style="text-align: right; color: darkred; margin-bottom: 0;">-' + data.amount + 'pt</h4></div></li>';
        }
      });
      
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

//Twitterみたいな日付を文字列で取得:made by toyton
export function getdatetext(date) {
  var dif = Math.floor((new Date() - date) / 1000 / 60 / 60 / 24);
  if(dif < 7){
    if(new Date().getDate() == date.getDate()){
      return "きょう";
    }
    else{
      switch (Math.floor(dif)) {
        case 0: return "きのう";
        case 1: return "一昨日";
        default: return String(Math.floor(dif)) + "日前";
      }
    }
  }
  else{
    return String(date.getMonth() + 1) + "月" + String(date.getDate()) + "日"
  }
}
window.getdatetext = getdatetext;