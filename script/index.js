// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, push, remove, set, get, onValue } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
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

//ページURLを取得
const url = new URL(window.location.href);

//HTML要素
var attendmodal = new bootstrap.Modal(document.getElementById("attendModal"));
var getpointmodal = new bootstrap.Modal(document.getElementById("getpointModal"));

//ポイント履歴のうち現在表示されている数
var historynum;
var giftID;

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
  user = us;

  //ログイン状態
  if(user){
    var url = new URL(window.location.href);
    var giftID = url.searchParams.get("getpoint");

    //ポイント情報が更新されたとき
    onValue(ref(db, "users/" + user.uid + "/point"), (snapshot) => {
      repoint(snapshot.val());
    });
    onValue(ref(db, "users/" + user.uid + "/pointHistory/" + new Date().getFullYear()), (snapshot) => {
      historynum = 0;
      document.getElementById("pointHistory").innerHTML = "";
      showhistory(snapshot.val());
    })

    get(ref(db, "users/" + user.uid)).then((snapshot) => {
      c4suser = snapshot.val();
      
      //プロフィールを表示
      document.getElementById("userPic").innerHTML = '<img src="' + user.photoURL + '" style="width: 100%; height: 100%; border-radius: 50%;">'
      document.getElementById("userName").innerText = c4suser.name;
      document.getElementById("userNum").innerText = c4suser.studentNumber;

      //repoint(c4suser.point);
      //historynum = 0;
      //document.getElementById("pointHistory").innerHTML = "";
      //showhistory();

      document.getElementById("profile").style.display = "block";

      //ポイントリンクを表示
      get(ref(db, "pointGift")).then((snapshot) => {
        if(snapshot.val()){
          Object.keys(snapshot.val()).forEach(id => {
            if(snapshot.val()[id].senderID == user.uid) {
              addgift(id, snapshot.val()[id].amount);
            }
          });
        }
      });

      amount = c4suser.point;
      userAttend = c4suser.attend;

      document.getElementById("info1").textContent = c4suser.studentNumber + " " + c4suser.name;
      document.getElementById("info2").textContent = c4suser.department + " " + c4suser.grade + "年生";
      showQR();

      //ポイント受け取り画面
      giftID = url.searchParams.get("getpoint");
      if(giftID){
        get(ref(db, "pointGift/" + giftID)).then((snapshot) => {
          var giftdata = snapshot.val();
          if(giftdata){
            openmodal("getpoint");
            //自分のギフト
            if(giftdata.senderID == user.uid){
              document.getElementById("cancel-getpoint").style.display = "block";
            }
            //受け取り処理
            else{
              document.getElementById("pointsender").innerText = giftdata.senderName;
              document.getElementById("pointamount").innerText = giftdata.amount + "pt";
              set(ref(db, "users/" + user.uid + "/point"), (Number(c4suser.point) + Number(giftdata.amount))).then(() => {
                c4suser.point += giftdata.amount;
                remove(ref(db, "pointGift/" + giftID));
              });
              push(ref(db, "users/" + user.uid + "/pointHistory/" + new Date().getFullYear().toString()), {
                date : new Date().getTime(),
                mode : 1,
                amount : giftdata.amount,
                title : giftdata.senderName + "さんからのギフト"
              });
              document.getElementById("success-getpoint").style.display = "block";
            }
            document.getElementById("loading-getpoint").style.display = "none";
          }
        });
      }
    });

    //開催中のイベントをトップに表示:made by toyton
    //複数同時開催には対応していません
    get(ref(db, "event")).then((snapshot) => {
      events = snapshot.val();
      Object.keys(events).forEach((i) => {
        var data = events[i];
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
  //ログアウト状態
  else{

  }
});

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
    case "attend": attendmodal.show(); break;
    case "getpoint": getpointmodal.show(); break;
    default: break;
  }
}
window.openmodal = openmodal;

//ポイント履歴を5件表示
export function showhistory(datas) {
  if(!datas) { datas = c4suser.pointHistory[new Date().getFullYear()]; }
  var historykeys = Object.keys(datas).reverse();
  for (let i = 0; i < 5; i++) {
    document.getElementById("addhistory").style.display = "block";
    var id = historykeys[historynum];
    var data = datas[id];
    var date = getdatetext(new Date(data.date));
    var pointcolor = ["black", "darkred"];
    document.getElementById("pointHistory").innerHTML += '<li class="list-group-item"><h6 class="mb-0">' + data.title + '</h6><div class="row"><p class="text-secondary small col-6 mb-0">' + date + '</p><h4 class="col-6" style="text-align: right; color: ' + pointcolor[data.mode - 1] + ';margin-bottom: 0;">' + (-2 * data.mode + 3) * data.amount + 'pt</h4></div></li>';
    historynum++;
    if(historynum == historykeys.length) { document.getElementById("addhistory").style.display = "none"; return; }
  }
}
window.showhistory = showhistory;

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

//ポイント送信リンクを作成
export function sendgift() {
  if(!user || !c4suser) {
    alert("通信エラー");
  }
  else{
    var num = document.getElementById('giftNum').value;
  
    if(num){
      if(num <= 0) { showalert("値が不正です"); }
      else if(c4suser.point < num) { showalert("ポイントが足りません"); console.log(c4suser.point, num);}
      else if(Math.floor(num) != num) { showalert("小数の値は送信できません"); }
      else {
        showalert();
        var id = new Date().getTime().toString(16).toUpperCase();
        set(ref(db, "pointGift/" + id), {
          senderID : user.uid,
          senderName : c4suser.name,
          amount : num
        }).then(() => {
          set(ref(db, "users/" + user.uid + "/point"), c4suser.point - num).then(() => {
            c4suser.point -= num;
            addgift(id, num);
          });
          push(ref(db, "users/" + user.uid + "/pointHistory/" + new Date().getFullYear().toString()), {
            date : new Date().getTime(),
            mode : 2,
            amount : num,
            title : "ギフトの作成"
          });
        });
      }
    }
  }
  
  function showalert(text) {
    if(text) {
      document.getElementById('giftalert').innerText = text;
      document.getElementById('giftalert').style.display = "block";
    }
    else{
      document.getElementById('giftalert').style.display = "none";
    }
  }
  window.showalert = showalert;
}
window.sendgift = sendgift;

//ポイント送信リンクをモーダル内のリストに追加
export function addgift(id, amount) {
  document.getElementById("giftNum").value = "";
  document.getElementById("giftList-footer").style.display = "block";
  document.getElementById("giftList").innerHTML += '<div class="row mb-1"><div class="col-10" style="outline: solid 1px lightgray; border-radius: 5px; padding: 0;"><p style="margin: 1em 0.5em;"><span style="font-weight: bold;">' + amount + 'pt</span> : https://portal.c4-s.net?getpoint=...</p></div><div class="col-2"><button class="btn btn-outline-dark w-100 h-100" style="text-align: center;" onclick="copylink(\'' + id + '\')"))"><i class="bi bi-share-fill"></i></button></div></div>';
}
window.addgift = addgift;

//ポイント送信リンクを取り消し
export function cancel_gift() {
  document.getElementById("cancel-getpoint").style.display = "none";
  document.getElementById("loading-getpoint").style.display = "block";

  giftID = url.searchParams.get("getpoint");
  get(ref(db, "pointGift/" + giftID + "/amount")).then((giftamount) => {
    set(ref(db, "users/" + user.uid + "/point"), (Number(c4suser.point) + Number(giftamount.val()))).then(() => {
      set(ref(db, "pointGift/" + giftID), null).then(() => {
        if(!alert("取り消しました")) { location.href = "/"; }
      })
    })
    push(ref(db, "users/" + user.uid + "/pointHistory/" + new Date().getFullYear().toString()), {
      date : new Date().getTime(),
      mode : 1,
      amount : giftamount.val(),
      title : "ギフトの取り消し"
    });
  });
}
window.cancel_gift = cancel_gift;

//クリップボードにstrをコピー
export function copylink(str) {
  return navigator.clipboard.writeText("https://portal.c4-s.net?getpoint=" + str).then(() => { alert("クリップボードにコピーしました"); });
}
window.copylink = copylink;

//プロフィールのポイント画面を更新
export function repoint(amount) {
  if(!amount) { amount = c4suser.point; }
  //ランク計算
  // 0-     ビギナー
  // 3000-  アマチュア
  // 8000-  エキスパート
  // 15000- ベテラン
  var rankname = ["ビギナー", "アマチュア", "エキスパート", "ベテラン"];
  var rankcolor = ["cornflowerblue", "darkgreen", "purple", "goldenrod"];
  document.getElementById("pointnum").innerText = amount;
  var ranknum;
  var ratio;
  var messageHTML;
  if ( amount < 3000 ) {
    ranknum = 0;
    ratio = String(amount / 3000 * 100) + "%";
    messageHTML = '<p>' + rankname[1] + 'まであと<span style="color: darkred; font-weight: bold;">' + String(3000 - amount) + '</span>pt</p>';
  }
  else if ( amount < 8000 ) {
    ranknum = 1;
    ratio = String((amount - 3000) / 5000 * 100) + "%";
    messageHTML = '<p>' + rankname[2] + 'まであと<span style="color: darkred; font-weight: bold;">' + String(8000 - amount) + '</span>pt</p>';
  }
  else if ( amount < 15000 ) {
    ranknum = 2;
    ratio = String((amount - 8000) / 7000 * 100) + "%";
    messageHTML = '<p>' + rankname[3] + 'まであと<span style="color: darkred; font-weight: bold;">' + String(15000 - amount) + '</span>pt</p>';
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
}