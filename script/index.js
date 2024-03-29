import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, push, remove, set, get, onValue } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { Obj, Hizke, DateText } from "/script/methods.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth();

var user = {};
var c4suser = {};
//データベースのデータ格納用
var events = {};
var heldeventID = "";

//ページURLを取得
const url = new URL(window.location.href);

//HTML要素
var attendmodal = new bootstrap.Modal(new Obj("attendModal"));
var getpointmodal = new bootstrap.Modal(new Obj("getpointModal"));

//ポイント履歴のうち現在表示されている数
var historynum;
//URLでパラメータ指定されたときのGIFTID
var giftID;

var ranks;
let links;
//jsonファイルを読み込み
fetch("/script/variable.json").then((data) => { return data.json(); }).then((json) => {
  ranks = json.ranks;
  links = json.links;
});

//ユーザー情報の取得
onAuthStateChanged(auth, (snapshot) => {  
  user = snapshot;
  
  if(!user) { return; }
  
  //ページトップにする
  window.scrollTo({ top: 0 });
  
  // リンク集を表示
  links.public.forEach(link => {
    new Obj("links").after(`
      <div onclick="go('${link.url.split('/').join('\\/')}')" class="text-center w-100 mb-2 py-2 bg-c4s-light c4s rounded-sm shadow-sm hover pointer">
        <h6 class="mb-0">${link.title}</h6>
        <p class="text-secondary small mb-0">${link.description}</p>
      </div>
    `);
  })
  links.adminonly.forEach(link => {
    new Obj("adminlinks").after(`
      <div onclick="go('${link.url.split('/').join('\\/')}')" class="text-center w-100 mb-2 py-2 bg-c4s-light c4s rounded-sm shadow-sm hover pointer">
        <h6 class="mb-0">${link.title}</h6>
        <p class="text-secondary small mb-0">${link.description}</p>
      </div>
    `);
  })

  get(ref(db, "users/" + user.uid)).then((snapshot) => {
    //部員
    if(snapshot.val()){
      c4suser = snapshot.val();

      // 管理者のみ
      get(ref(db, "admin-users/" + user.uid)).then((snapshot) => {
        if(snapshot.val()) {
          // 最近ログインしていない部員一覧・部員のポイント一覧
          get(ref(db, "users")).then((snapshot) => {
            let users = snapshot.val();
            let noLogins = {};
            let points = {};
            Object.keys(users).forEach((uid) => {
              if(users[uid].reason) { return; }
              if(!users[uid].accessHistory) {
                noLogins[uid] = { 氏名 : users[uid].name, 最終ログイン : "不明" };
              }
              else if(new Date(users[uid].accessHistory[Object.keys(users[uid].accessHistory).slice(-1)[0]].date).getTime() < new Date().getTime() - 1000 * 60 * 60 * 24 * 30) {
                noLogins[uid] = { 氏名 : users[uid].name, 最終ログイン : DateText(new Date(users[uid].accessHistory[Object.keys(users[uid].accessHistory).slice(-1)[0]].date)), TimeStamp: new Date(users[uid].accessHistory[Object.keys(users[uid].accessHistory).slice(-1)[0]].date) }
              }

              if(users[uid].point) {
                points[users[uid].name] = users[uid].point;
              } else {
                points[users[uid].name] = 0;
              }
            });
            console.warn("一か月以上ログインしていないユーザー一覧");
            console.table(noLogins);

            console.warn("ユーザのポイント一覧");
            console.table(points);
          })

          // 管理者専用のリンク集を表示
          new Obj("adminlinks").show("block");
        }
      })
      
      //プロフィールを表示
      new Obj("userPic").innerHTML = '<img src="' + user.photoURL + '" style="width: 100%; height: 100%; border-radius: 50%;">'
      new Obj("userName").innerText = c4suser.name;
      var roles = { leader : "部長", subleader : "副部長", treasurer : "会計", active : "現役", new : "新入部員", obog : "卒業生", other : "部員ではありません" };
      new Obj("userRole").innerText = roles[c4suser.role];

      new Obj("profile").style.display = "block";

      new Obj("info1").textContent = c4suser.studentNumber + " " + c4suser.name;
      new Obj("info2").textContent = c4suser.department + " " + c4suser.grade + "年生";
      showQR();

      new Obj("pointHistoryBtn").disabled = false;
      new Obj("sendPointBtn").disabled = false;

      //HTMLにランクバーを表示
      for (let i = 0; i < ranks.name.length; i++) {
        new Obj("pointbars").after('<div class="progress-bar progress-bar-striped" style="width: 0%;" role="progressbar" id="pointbar' + i + '"></div>'); 
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
        new Obj("pointHistory").innerHTML = "";
        showhistory(snapshot.val());
      });
      //ポイント履歴を5件表示
      function showhistory(datas) {
        if(!datas) { datas = c4suser.pointHistory[new Date().getFullYear()]; }
        var historykeys = Object.keys(datas).reverse();
        for (let i = 0; i < 5; i++) {
          new Obj("addhistory").show();
          var id = historykeys[historynum];
          var data = datas[id];
          var date = DateText(new Date(data.date));
          var pointcolor = ["black", "darkred"];
          new Obj("pointHistory").after('<li class="list-group-item"><h6 class="mb-0">' + data.title + '</h6><div class="row"><p class="text-secondary small col-6 mb-0">' + date + '</p><h4 class="col-6" style="text-align: right; color: ' + pointcolor[data.mode - 1] + ';margin-bottom: 0;">' + (-2 * data.mode + 3) * data.amount + 'pt</h4></div></li>');
          historynum++;
          if(historynum == historykeys.length) { new Obj("addhistory").hide(); return; }
        }
      }
      window.showhistory = showhistory;
      //ポイントリンクを表示
      onValue(ref(db, "pointGift"), (snapshot) => {
        new Obj("giftList").innerHTML = '<h5 class="text-center">受け取り用URL</h5>';
        if(snapshot.val()) {
          Object.keys(snapshot.val()).forEach(id => {
            if(snapshot.val()[id].senderID == user.uid) {
              var amount = snapshot.val()[id].amount;
              new Obj("giftNum").value = "";
              new Obj("giftList-footer").show("block");
              new Obj("giftList").after('<div class="w-100 p-3 position-relative"><h5 class="mb-0">' + amount + 'ポイント</h5><p class="mb-0">https://portal.c4-s.net?getpoint=' + id + '</p><h6 onclick="copylink(\'' + id + '\')" style="position: absolute; top: 20%; right: 10%; cursor: pointer;"><i class="bi bi-share-fill"></i></h6></div>');
            }
          });
        }
        else{
          new Obj("giftList-footer").hide();
        };
      });
      //ポイント受け取り画面
      giftID = url.searchParams.get("getpoint");
      if(giftID){
        openmodal("getpoint");
        get(ref(db, "pointGift/" + giftID)).then((snapshot) => {
          new Obj("loading-getpoint").style.display = "none";
          var giftdata = snapshot.val();
          if(giftdata){
            //自分のギフト
            if(giftdata.senderID == user.uid){
              new Obj("cancel-getpoint").style.display = "block";
            }
            //受け取り処理
            else{
              new Obj("success-getpoint").style.display = "block";
              new Obj("pointsender").innerText = giftdata.senderName;
              new Obj("pointamount").innerText = giftdata.amount + "pt";
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
            new Obj("failed-getpoint").style.display = "block";
          }
        });
      }
      //部員登録完了画面からの遷移
      var join2 = url.searchParams.get("new");
      if(join2) { alert("ようこそ！左上のメニューから各ページにアクセスしてみてください。"); }
    }

    //ゲスト用表示
    else {
      new Obj("userPic").innerHTML = '<img src="' + user.photoURL + '" style="width: 100%; height: 100%; border-radius: 50%;">'
      new Obj("userName").innerText = user.displayName;
      new Obj("userRole").innerText = "部員ではありません";

      new Obj("profile").show("block");

      new Obj("pointnum").set("0");
      new Obj("restpoint").set("<p>まだポイントを獲得できません</p>");
      new Obj("pointHistoryBtn").disabled = true;
      new Obj("sendPointBtn").disabled = true;
      new Obj("info2").textContent = user.email;
      showQR();
    }

    //ローディング解除
    $("#overray").fadeOut();
  });

  // 今後のイベント情報をトップに表示
  onValue(ref(db, "event"), (snapshot) => {
    events = snapshot.val();

    Object.keys(events).forEach(id => 
    { if(new Date(events[id].term.end) < new Date()) { delete events[id]; } });

    if(!events) { new Obj("NoEvents").show(); new Obj("YesEvents").hide(); return; }
    else { new Obj("NoEvents").hide(); new Obj("YesEvents").show(); }

    let keys = sortEvents(Object.keys(events));

    function sortEvents (keys) {
      let top;
      if(!keys[0]) { return []; }
      keys.forEach(key => {
        if(!top || new Date(events[key].term.begin) < new Date(events[top].term.begin)) { top = key; }
      });
      return [keys.splice(keys.indexOf(top), 1), ...sortEvents(keys)];
    }

    let top = events[keys[0]];
    let begin = new Hizke(top.term.begin);
    new Obj("event_time").set(begin.DateText());
    if(!top.term.allday) { new Obj("event_time").after(`・${addzero(begin.hour)}:${addzero(begin.minute)}～`)}
    function addzero(params) {
      if(params.toString().length < 2) { return addzero("0"+params.toString()); }
      else { return params}
    }
    new Obj("event_title").set(top.title);
    new Obj("event_location").set(top.place);
    new Obj("event_detail").set(top.description);

    if (new Date(top.term.begin) - (1000*60*15) <= new Date()) {
      heldeventID = keys[0];
      new Obj("KaiSaiChu").show();
      if(top.code) {
        if(top.attenders[user.uid]) { new Obj("attendBtn").hide(); new Obj("attended").show(); }
        else { new Obj("attendBtn").show(); new Obj("attended").hide(); }
      } else {
        new Obj("attendBtn").hide(); new Obj("attended").hide();
      }
    } else { new Obj("attendBtn").hide(); new Obj("attended").hide(); new Obj("KaiSaiChu").hide(); }

    new Obj("other_events").set();
    for(let i = 1; i < keys.length; i++) {
      let key = keys[i];
      new Obj("other_events").after(`<hr class="my-2"><div class="hover pointer" onclick="go('/event')"><p class="mb-0">${new Hizke(events[key].term.begin).DateText()}</p><h4 class="mb-0">${events[key].title}</h4><p class="mb-0 text-secondary">${events[key].place}</p></div>`)
    }
  });
});

//出席登録
window.attend = () => {
  //開催中のイベントがないときのエラー(フォアグラウンド)
  if(!heldeventID || !events[heldeventID].code || new Date(events[heldeventID].term.end) < new Date()) { alert("出席登録を受け付けているイベントはありません"); }
  //出席コード未入力時のエラー(バックグラウンド)
  else if(!new Obj("code").value) { console.error("attendance code input is null"); }
  //ここまで正常、出席コード判定
  else {
    //正解
    if(events[heldeventID].code == new Obj("code").value) {
      //出席済みであるかどうか判定
      get(ref(db, `event/${heldeventID}/attenders/${user.uid}`)).then((snapshot) => {
        //出席済みだったとき
        if(snapshot.val()) {
          new Obj("attend-btnform").hide();
          new Obj("attend-failed").hide();
          new Obj("attend-already").show();
          new Obj("attend-success").hide();
        }
        //出席登録処理
        else {
          new Obj("attend-btnform").hide();
          new Obj("attend-failed").hide();
          new Obj("attend-already").hide();
          new Obj("attend-success").show();
          new Obj("code").value = "";
          new Obj("attend-points").innerText = events[heldeventID].point;
    
          //データベースに登録
          push(ref(db, "users/" + user.uid + "/attend"), {
            date : (new Date()).getTime(),
            title : events[heldeventID].title
          });
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
      })
    }
    //しっぱい
    else{
      new Obj("attend-failed").show();
    }
  }
}

//QR表示
function showQR() {
    // 入力された文字列を取得
    var userInput = user.uid;
    var query = userInput.split(' ').join('+');
    // QRコードの生成
    (function() {
       var qr = new QRious({
         element: new Obj('qr'),
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
      new Obj("attend-btnform").show();
      new Obj("attend-already").hide();
      new Obj("attend-failed").hide();
      new Obj("attend-success").hide();
      new Obj("code").value = "";
      
      //出席登録済みの判定
      if(events[heldeventID].attenders && events[heldeventID].attenders[user.uid]) { new Obj("attend-btnform").hide(); new Obj("attend-already").show(); }

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
    var num = new Obj('giftNum').value;
  
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
      new Obj('giftalert').innerText = text;
      new Obj('giftalert').style.display = "block";
    }
    else{
      new Obj('giftalert').style.display = "none";
    }
  }
  window.showalert = showalert;
}
window.sendgift = sendgift;

//ポイント送信リンクを取り消し
export function cancel_gift() {
  new Obj("cancel-getpoint").style.display = "none";
  new Obj("loading-getpoint").style.display = "block";

  giftID = url.searchParams.get("getpoint");
  get(ref(db, "pointGift/" + giftID + "/amount")).then((giftamount) => {
    set(ref(db, "users/" + user.uid + "/point"), (Number(c4suser.point) + Number(giftamount.val()))).then(() => {
      remove(ref(db, "pointGift/" + giftID));
      new Obj("pointsender").innerText = c4suser.name;
      new Obj("pointamount").innerText = giftamount.val() + "pt";
      new Obj("loading-getpoint").style.display = "none";
      new Obj("success-getpoint").style.display = "block";
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
window.repoint = (amount) => {
  c4suser.point = amount;
  new Obj("pointnum").set(amount);
  var ranknum = ranks.basis.length - 1;
  //最高ランクなら最高ランク表示にする
  if ( ranks.basis.slice(-1)[0] <= amount ) {
    new Obj("pointbar" + String(ranks.name.length - 1)).style.width = "100%";
    new Obj("pointbar" + String(ranks.name.length - 1)).style.display = "block";
    new Obj("pointbar" + String(ranks.name.length - 1)).style.backgroundColor = ranks.color[ranknum];
    new Obj("restpoint").innerHTML = '<p style="color: darkred;">最高ランク会員</p>';
    for (let i = 0; i < ranks.name.length - 1; i++) {
      new Obj("pointbar" + String(i)).style.display = "none";
    }
  }
  //それ以外ならランク番号を取得
  else{
    new Obj("pointbar" + String(ranks.name.length - 1)).style.display = "none";
    for (let i = 0; i < ranks.basis.length; i++) { if(ranks.basis[i] <= amount) { ranknum = i; } }
    new Obj("restpoint").innerHTML = '<p>' + ranks.name[ranknum+1] + 'まであと<span style="color: darkred; font-weight: bold;">' + String(ranks.basis[ranknum+1] - amount) + '</span>pt</p>';
    for (let i = 0; i < ranks.color.length - 1; i++) {
      var bar = new Obj("pointbar" + String(i));
      bar.style.backgroundColor = ranks.color[i];
      var ratio = (amount - ranks.basis[i]) / ranks.basis.slice(-1)[0];
      ratio = Math.max(ratio, 0);
      ratio = Math.min(ratio, (ranks.basis[i+1] - ranks.basis[i]) / ranks.basis.slice(-1)[0]);
      bar.style.width = String(ratio * 100) + "%";
      bar.style.display = "block";
    }
  }
  new Obj("ranktext").set(ranks.name[ranknum]+"部員");
  new Obj("ranktext").style.backgroundColor = ranks.color[ranknum];
}

//通知を送信
export function sendNotice() {
  var data = {};

  data.title = new Obj("noticeTitle").value;
  data.content = new Obj("noticeContent").value;
  data.target = new Obj("noticeTarget").value;
  data.time = new Date(new Obj("noticeTime").value).getTime();
  data.dead = new Date(new Obj("noticeDead").value).getTime();
  data.link = new Obj("noticeLink").value;

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
    new Obj("noticeTitle").value = "";
    new Obj("noticeContent").value = "";
    new Obj("noticeTarget").value = "whole";
    new Obj("noticeTime").value = "";
    new Obj("noticeDead").value = "";
    new Obj("noticeLink").value = "";
    alert("通知を送信しました");
  });
}
window.sendNotice = sendNotice;