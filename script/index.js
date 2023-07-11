import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, push, remove, set, get, onValue } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getObj, DateText } from "/script/methods.js";

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
var heldeventID;
var reactions;
var userAttend;
var amount;

//ページURLを取得
const url = new URL(window.location.href);

//HTML要素
var attendmodal = new bootstrap.Modal(getObj("attendModal"));
var getpointmodal = new bootstrap.Modal(getObj("getpointModal"));

//ポイント履歴のうち現在表示されている数
var historynum;
//URLでパラメータ指定されたときのGIFTID
var giftID;

//ユーザーランクの定義
var ranks = {
  name : ["ノーマル", "ブロンズ", "シルバー", "ゴールド"],
  //color : ["cornflowerblue", "darkgreen", "purple", "goldenrod"],
  color : ["cornflowerblue", "#c95700", "#aba9a1", "#decb00"],
  basis : [0, 1000, 5000, 12000]
}

//ユーザー情報の取得
onAuthStateChanged(auth, (snapshot) => {  
  user = snapshot;
  
  getObj("loading-overray").show("block");
  getObj("login-overray").hide();

  getObj("overray").show("block");
  
  //ログイン状態
  if(user) {
    //ページトップにする
    window.scrollTo({ top: 0 });

    get(ref(db, "users/" + user.uid)).then((snapshot) => {
      //部員
      if(snapshot.val()){
        c4suser = snapshot.val();
        
        //プロフィールを表示
        getObj("userPic").innerHTML = '<img src="' + user.photoURL + '" style="width: 100%; height: 100%; border-radius: 50%;">'
        getObj("userName").innerText = c4suser.name;
        var roles = { leader : "部長", subleader : "副部長", treasurer : "会計", active : "現役", new : "新入部員", obog : "卒業生", other : "部員ではありません" };
        getObj("userRole").innerText = roles[c4suser.role];
  
        getObj("profile").style.display = "block";
  
        amount = c4suser.point;
        userAttend = c4suser.attend;
  
        getObj("info1").textContent = c4suser.studentNumber + " " + c4suser.name;
        getObj("info2").textContent = c4suser.department + " " + c4suser.grade + "年生";
        showQR();

        getObj("pointHistoryBtn").disabled = false;
        getObj("sendPointBtn").disabled = false;

        //HTMLにランクバーを表示
        for (let i = 0; i < ranks.name.length; i++) {
          getObj("pointbars").tail('<div class="progress-bar progress-bar-striped" style="width: 0%;" role="progressbar" id="pointbar' + i + '"></div>'); 
        }
        var url = new URL(window.location.href);
        var giftID = url.searchParams.get("getpoint");
    
        //ポイント情報が更新されたとき
        onValue(ref(db, "users/" + user.uid + "/point"), (snapshot) => {
          repoint(snapshot.val());
        });
        //ポイント履歴も更新
        onValue(ref(db, "users/" + user.uid + "/pointHistory/" + new Date().getFullYear()), (snapshot) => {
          historynum = 0;
          getObj("pointHistory").innerHTML = "";
          showhistory(snapshot.val());
        });
        //ポイント履歴を5件表示
        function showhistory(datas) {
          if(!datas) { datas = c4suser.pointHistory[new Date().getFullYear()]; }
          var historykeys = Object.keys(datas).reverse();
          for (let i = 0; i < 5; i++) {
            getObj("addhistory").show();
            var id = historykeys[historynum];
            var data = datas[id];
            var date = DateText(new Date(data.date));
            var pointcolor = ["black", "darkred"];
            getObj("pointHistory").tail('<li class="list-group-item"><h6 class="mb-0">' + data.title + '</h6><div class="row"><p class="text-secondary small col-6 mb-0">' + date + '</p><h4 class="col-6" style="text-align: right; color: ' + pointcolor[data.mode - 1] + ';margin-bottom: 0;">' + (-2 * data.mode + 3) * data.amount + 'pt</h4></div></li>');
            historynum++;
            if(historynum == historykeys.length) { getObj("addhistory").hide(); return; }
          }
        }
        window.showhistory = showhistory;
        //ポイントリンクを表示
        onValue(ref(db, "pointGift"), (snapshot) => {
          getObj("giftList").innerHTML = '<h5 class="text-center">受け取り用URL</h5>';
          if(snapshot.val()) {
            Object.keys(snapshot.val()).forEach(id => {
              if(snapshot.val()[id].senderID == user.uid) {
                var amount = snapshot.val()[id].amount;
                getObj("giftNum").value = "";
                getObj("giftList-footer").show("block");
                getObj("giftList").tail('<div class="w-100 p-3 position-relative"><h5 class="mb-0">' + amount + 'ポイント</h5><p class="mb-0">https://https://portal.c4-s.net?getpoint=' + id + '</p><h6 onclick="copylink(\'' + id + '\')" style="position: absolute; top: 20%; right: 10%; cursor: pointer;"><i class="bi bi-share-fill"></i></h6></div>');
              }
            });
          }
          else{
            getObj("giftList-footer").hide();
          };
        });
        //ポイント受け取り画面
        giftID = url.searchParams.get("getpoint");
        if(giftID){
          openmodal("getpoint");
          get(ref(db, "pointGift/" + giftID)).then((snapshot) => {
            getObj("loading-getpoint").style.display = "none";
            var giftdata = snapshot.val();
            if(giftdata){
              //自分のギフト
              if(giftdata.senderID == user.uid){
                getObj("cancel-getpoint").style.display = "block";
              }
              //受け取り処理
              else{
                getObj("success-getpoint").style.display = "block";
                getObj("pointsender").innerText = giftdata.senderName;
                getObj("pointamount").innerText = giftdata.amount + "pt";
                set(ref(db, "users/" + user.uid + "/point"), (Number(c4suser.point) + Number(giftdata.amount))).then(() => {
                  remove(ref(db, "pointGift/" + giftID));
                });
                push(ref(db, "users/" + user.uid + "/pointHistory/" + new Date().getFullYear().toString()), {
                  date : new Date().getTime(),
                  mode : 1,
                  amount : giftdata.amount,
                  title : giftdata.senderName + "さんからのギフト"
                });
              }
            }
            else{
              getObj("failed-getpoint").style.display = "block";
            }
          });
        }
      }
      else {
        //ゲスト用表示
        getObj("userPic").innerHTML = '<img src="' + user.photoURL + '" style="width: 100%; height: 100%; border-radius: 50%;">'
        getObj("userName").innerText = user.displayName;
        getObj("userRole").innerText = "部員ではありません";
  
        getObj("profile").show("block");
  
        $("#pointnum").html("0");
        $("#restpoint").html("<p>まだポイントを獲得できません</p>");
        getObj("pointHistoryBtn").disabled = true;
        getObj("sendPointBtn").disabled = true;
        getObj("info2").textContent = user.email;
        showQR();
      }
      //ローディング解除
      $("#overray").fadeOut();
    });

    //開催中のイベントをトップに表示
    get(ref(db, "event")).then((snapshot) => {
      events = snapshot.val();
      Object.keys(events).forEach((key) => {
        var data = events[key];
        if(data.term){
          if(new Date(data.term.begin) <= new Date() && new Date() <= new Date(data.term.end)){
            heldeventID = key;

            getObj("heldevent").style.display = "block";
            getObj("heldevent_title").innerText = data.title;
            getObj("heldevent_place").innerText = data.place;
            data.tags.forEach(tag => {
              getObj("heldevent_tags").innerText += "#" + tag;
            });
            getObj("heldevent_description").innerText = data.description;

            if(data.code){
              getObj("attendbtn-text").style.display = "block";
              getObj("heldevent").style.cursor = "pointer";
            }
            else{
              getObj("attendbtn-text").style.display = "none"; 
              getObj("heldevent").style.cursor = "default";
            }
          }
        }
      })
    });
  }
  //ログアウト状態
  else{
    getObj("loading-overray").hide()
    getObj("login-overray").show("block");
  }
});

//出席登録
export function attend() {
  //開催中のイベントがないときのエラー(フォアグラウンド)
  if(!heldeventID || !events[heldeventID].code || new Date(events[heldeventID].term.end) < new Date()) { alert("出席登録を受け付けているイベントはありません"); }
  //出席コード未入力時のエラー(バックグラウンド)
  else if(!getObj("code").value) { console.error("attendance code input is null"); }
  //ここまで正常、出席コード判定
  else {
    //正解
    if(events[heldeventID].code == getObj("code").value) {
      getObj("attend-btnform").hide();
      getObj("attend-failed").hide();
      getObj("attend-already").hide();
      getObj("attend-success").show();
      getObj("code").value = "";
      getObj("attend-points").innerText = events[heldeventID].point;

      //データベースに登録
      set(ref(db, "event/" + heldeventID + "/attenders/" + user.uid), true).then(() => {
        events[heldeventID].attenders = { [user.uid] : true };
      });
      set(ref(db, "users/" + user.uid + "/point"), Number(c4suser.point) + Number(events[heldeventID].point)).then(() => {
        c4suser.point += Number(events[heldeventID].point);
      });
      push(ref(db, "users/" + user.uid + "/pointHistory/" + String(new Date().getFullYear())), {
        title : "【出席登録】" + events[heldeventID].title,
        amount : Number(events[heldeventID].point),
        date : new Date().getTime(),
        mode : 1
      });
    }
    //しっぱい
    else{
      getObj("attend-failed").show();
    }
  }
}
window.attend = attend;

//QR表示
function showQR() {
    // 入力された文字列を取得
    var userInput = user.uid;
    var query = userInput.split(' ').join('+');
    // QRコードの生成
    (function() {
       var qr = new QRious({
         element: getObj('qr'),
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
      getObj("attend-btnform").show();
      getObj("attend-already").hide();
      getObj("attend-failed").hide();
      getObj("attend-success").hide();
      getObj("code").value = "";
      
      //出席登録済みの判定
      if(events[heldeventID].attenders && events[heldeventID].attenders[user.uid]) { getObj("attend-btnform").hide(); getObj("attend-already").show(); }

      attendmodal.show();
    break;
    case "getpoint": getpointmodal.show(); break;
    default: break;
  }
}
window.openmodal = openmodal;

//ポイント送信リンクを作成
export function sendgift() {
  if(!user || !c4suser) {
    alert("通信エラー");
  }
  else{
    var num = getObj('giftNum').value;
  
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
          set(ref(db, "users/" + user.uid + "/point"), c4suser.point - num);
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
      getObj('giftalert').innerText = text;
      getObj('giftalert').style.display = "block";
    }
    else{
      getObj('giftalert').style.display = "none";
    }
  }
  window.showalert = showalert;
}
window.sendgift = sendgift;

//ポイント送信リンクを取り消し
export function cancel_gift() {
  getObj("cancel-getpoint").style.display = "none";
  getObj("loading-getpoint").style.display = "block";

  giftID = url.searchParams.get("getpoint");
  get(ref(db, "pointGift/" + giftID + "/amount")).then((giftamount) => {
    set(ref(db, "users/" + user.uid + "/point"), (Number(c4suser.point) + Number(giftamount.val()))).then(() => {
      remove(ref(db, "pointGift/" + giftID));
      getObj("pointsender").innerText = c4suser.name;
      getObj("pointamount").innerText = giftamount.val() + "pt";
      getObj("loading-getpoint").style.display = "none";
      getObj("success-getpoint").style.display = "block";
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
export async function copylink(str) {
  await navigator.clipboard.writeText("https://portal.c4-s.net?getpoint=" + str);
  alert("クリップボードにコピーしました");
}
window.copylink = copylink;

//プロフィールのポイント画面を更新
export function repoint(amount) {
  c4suser.point = amount;
  getObj("pointnum").innerText = amount;
  var ranknum = ranks.basis.length - 1;
  //0以下または未定義なら0にリセット
  if ( amount < ranks.basis[0] || !amount) { set(ref(db, "users/" + user.uid + "/point"), 0); amount = 0; }
  //最高ランクなら最高ランク表示にする
  if ( ranks.basis.slice(-1)[0] <= amount ) {
    getObj("pointbar" + String(ranks.name.length - 1)).style.width = "100%";
    getObj("pointbar" + String(ranks.name.length - 1)).style.display = "block";
    getObj("pointbar" + String(ranks.name.length - 1)).style.backgroundColor = ranks.color[ranknum];
    getObj("restpoint").innerHTML = '<p style="color: darkred;">最高ランク会員</p>';
    for (let i = 0; i < ranks.name.length - 1; i++) {
      getObj("pointbar" + String(i)).style.display = "none";
    }
  }
  //それ以外ならランク番号を取得
  else{
    getObj("pointbar" + String(ranks.name.length - 1)).style.display = "none";
    for (let i = 0; i < ranks.basis.length; i++) { if(ranks.basis[i] <= amount) { ranknum = i; } }
    getObj("restpoint").innerHTML = '<p>' + ranks.name[ranknum+1] + 'まであと<span style="color: darkred; font-weight: bold;">' + String(ranks.basis[ranknum+1] - amount) + '</span>pt</p>';
    for (let i = 0; i < ranks.color.length - 1; i++) {
      var bar = getObj("pointbar" + String(i));
      bar.style.backgroundColor = ranks.color[i];
      var ratio = (amount - ranks.basis[i]) / ranks.basis.slice(-1)[0];
      ratio = Math.max(ratio, 0);
      ratio = Math.min(ratio, (ranks.basis[i+1] - ranks.basis[i]) / ranks.basis.slice(-1)[0]);
      bar.style.width = String(ratio * 100) + "%";
      bar.style.display = "block";
    }
  }
  getObj("ranktext").innerText = ranks.name[ranknum];
  getObj("ranktext").style.backgroundColor = ranks.color[ranknum];
}

//通知を送信
export function sendNotice() {
  var data = {};

  data.title = getObj("noticeTitle").value;
  data.content = getObj("noticeContent").value;
  data.target = getObj("noticeTarget").value;
  data.time = new Date(getObj("noticeTime").value).getTime();
  data.dead = new Date(getObj("noticeDead").value).getTime();
  data.link = getObj("noticeLink").value;

  try {
    if(!data.title) { e("タイトルが入力されていません"); }
    if(!data.time) { e("公開日が入力されていません"); }
    if(!data.dead) { data.dead = new Date().getTime() + (1000 * 60 * 60 * 24 * 14); }
    if(data.dead < data.time) { e("日付が不正です"); }
    function e ( msg ) { throw new Error ( msg ); }
  } catch (msg) {
    alert(msg); return;
  }
  console.table(data);
  push(ref(db, "notice"), data).then(() => {
    getObj("noticeTitle").value = "";
    getObj("noticeContent").value = "";
    getObj("noticeTarget").value = "whole";
    getObj("noticeTime").value = "";
    getObj("noticeDead").value = "";
    getObj("noticeLink").value = "";
    alert("通知を送信しました");
  });
}
window.sendNotice = sendNotice;