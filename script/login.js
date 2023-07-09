import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, get, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getObj } from "/script/methods.js";

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
const analytics = getAnalytics(app);
const auth = getAuth();
const provider = new GoogleAuthProvider();
const db = getDatabase();

//データ格納用
var user = {};
var c4suser = {};
var adminusers = {};

//0:外部、1:部員、2:管理者
var status = 0;

//ログイン状態の確認
onAuthStateChanged(auth, (snapshot) => {
  //ヘッダーを描画(メニューを含む)
  $("#header").load("/frames/header.html", function () {
    $("#menu-" + location.pathname.split('/')[1]).css("color", "darkorange");
  });

  user = snapshot;
  if (user) {
    console.log(user);

    get(ref(db, "users/" + user.uid)).then((snapshot) => {
      c4suser = snapshot.val();
      get(ref(db, "admin-users")).then((snapshot) => {
        adminusers = snapshot.val();

        //ユーザー写真をメニューボタンとメニュー内に表示
        if(getObj("menu")) {
          getObj("menuBtn").src = user.photoURL;
          getObj("userPic_offcanvas").src = user.photoURL;
        }

        //部員用
        if(c4suser){
          //更新情報を表示
          function news () {
            //ローカル環境でも表示しない
            if(location.hostname == "localhost") { return; }
            if(!c4suser.accessHistory || new Date(c4suser.accessHistory[Object.keys(c4suser.accessHistory).slice(-1)[0]].date) < new Date("2023-06-22 13:50"))
            { alert("アップデート：メニュー画面が新しくなりました！"); alert("左上のプロフィールアイコンを押してみよう！"); }
          }
          news();

          status = 1;

          var outsideonly = document.getElementsByClassName("outsideonly");
          Object.keys(outsideonly).forEach((key) => { outsideonly[key].style.display = "none"; })
          
          var activeonly = document.getElementsByClassName("activeonly");
          Object.keys(activeonly).forEach((key) => { activeonly[key].style.display = "inherit"; })

          //名前&学科を表示
          if(getObj("menu")) {
            getObj("userName_offcanvas").innerText = c4suser.name;
            getObj("userData_offcanvas").innerText = c4suser.department.split(' ').splice(-1)[0];
          }
          
          //管理者用
          if(adminusers[user.uid]) {
            status = 2;

            var adminonly = document.getElementsByClassName("adminonly");
            Object.keys(adminonly).forEach((key) => { adminonly[key].style.display = "inherit"; })
          }
          //adminonlyを非表示
          else{
            var adminonly = document.getElementsByClassName("adminonly");
            Object.keys(adminonly).forEach((key) => { adminonly[key].style.display = "none"; })
          }
        }
        //外部用
        else{
          //外部の人がアクセスできるページリスト
          //ここに記載されたパス以外はアクセス拒否
          let accessable = ["/", "/event/", "/equips/", "/procedure/join.html", "/procedure/join2.html"];
          let reload = true;
          accessable.forEach((path) => { if(location.pathname == path) { reload = false; } });
          if(reload) { location.href = "/"; }

          var outsideonly = document.getElementsByClassName("outsideonly");
          Object.keys(outsideonly).forEach((key) => { outsideonly[key].style.display = "inherit"; })
          
          var activeonly = document.getElementsByClassName("activeonly");
          Object.keys(activeonly).forEach((key) => { activeonly[key].style.display = "none"; })
          
          var adminonly = document.getElementsByClassName("adminonly");
          Object.keys(adminonly).forEach((key) => { adminonly[key].style.display = "none"; })

          //氏名と未所属だよ～を表示
          if(getObj("menu")) {
            getObj("userName_offcanvas").innerText = user.displayName;
            getObj("userData_offcanvas").innerText = "部員登録されていません";
          }
        }

        //通知の描画
        onValue(ref(db, "notices"), (snapshot) => {
          var data = snapshot.val();
          getObj("noNotice").show();
          if(data) {
            Object.keys(data).forEach((key) => {
              var notice = data[key];
              //30日以上過ぎた通知は削除
              if(30 * 24 * 60 * 60 * 1000 < (new Date().getTime() - new Date(notice.time).getTime()))
              { remove(ref(db, "notices/" + key)); }
              //30日以内の通知なら表示
              else {
                //通知表示条件を満たしているか確認
                var show;
                if(notice.target == "whole") { show = true; }
                else if(notice.target == "active" && (status == 1 || status == 2)) { show = true; }
                else if(notice.target == "admin" && status == 2) { show = true; }
                else if(0 < notice.target.indexOf(user.uid)) { show = true; }
                //満たしているとき表示
                if(show) {
                  getObj("noNotice").hide();
                  var titles = {
                    attender : "出席登録されました",
                    purchase : "商品が購入されました",
                    newEvent : "新しいイベントが登録されました",
                    newProject : "新しい企画が作られました"
                  }
                  let title = titles[notice.type];
                  if(!title) { title = notice.type; }
                  getObj("noticeList").head('<li class="list-group-item" id="notice' + notice.time + '"><h5>' + title + '</h5><p>' + notice.content + '</p></li>');
                  if(notice.link) { 
                    getObj("notice" + notice.time).onclick = 'location.href="' + notice.link + '"';
                    getObj("notice" + notice.time).style.cursor = "pointer";
                  }
                }
              }
            });
          }
        });

        //まだメニューがないページは旧スクリプト
        if(!getObj("menu")){
          if(snapshot.child("point").exists()) {
            var point = snapshot.child("point").val();
            var color = "#c95700";
            
            if(point >= 8000) {
              color = "#aba9a1";
            }
    
            if(point >= 15000) {
              color = "#decb00";
            }
    
            if(point >= 3000) {
              document.getElementById("topUserTag").innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" style="color: '+color+'" class="ms-1 bi bi-check-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>';
              document.getElementById("userpic").style.border = "solid 3px " + color;
            }
          }
          document.getElementById("account").innerHTML = '<img id="userpic" src="'+user.photoURL+'" width="32px" height="32px" class="rounded-pill mx-2" onclick="goAccount()" style="cursor: pointer;"> <span class="fs-5" style="user-select: none; cursor: pointer;" onclick="goAccount()">'+user.displayName+' <span id="topUserTag"></span></span>'
        }
    
        //アクセス履歴を表示
        if(c4suser && location.hostname != "localhost") {
          push(ref(db, "users/" + user.uid + "/accessHistory"), {
            date : (new Date()).getTime(),
            path : location.pathname
          });
        }
      })
    });
  } else {
    if(location.pathname != "/") { location.href = "/"; }
  }
});

//ログイン
function login() {
  signInWithPopup(auth, provider)
  .catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData.email;
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);
    // ...
    if (errorMessage == "Firebase: Error (auth/unauthorized-domain).") {
      alert("不正なドメインです");
    }
    else{
      alert(errorMessage);
    }
  });
}

window.login = login;
export{login}

//アカウントページへ
export function goAccount() { window.location.href = "/account"; } window.goAccount = goAccount;

//ログアウト
export function logout() {
  signOut(auth).then(() => {
    var accountName = document.getElementById("userName");
    var accountIcon = document.getElementById("userIcon");
    var accountEmail = document.getElementById("userEmail");
    
    accountName.innerHTML = "";
    accountIcon.src = "";
    accountEmail.innerHTML = "ログインしていません";
  });
}
window.logout = logout;