import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, get, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getObj, Obj } from "/script/methods.js";

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

$(() => {
  if(!new Obj("login-overray").exists) return;
  // ロード画面を表示
  new Obj("loading-overray").show("block");
  new Obj("login-overray").hide();
  new Obj("overray").show("block");
})

//ログイン状態の確認
onAuthStateChanged(auth, snapshot => {
  if(new Obj("login-overray").exists) {
    // ロード画面を表示
    new Obj("loading-overray").show("block");
    new Obj("login-overray").hide();
    new Obj("overray").show("block");
  }

  //ヘッダーを描画(メニューを含む)
  $("#header").load("/frames/header.html", () => {
    let id = location.pathname.split('/')[1].split('?')[0];
    if(id == "index.html") id = "";
    $("#menu-" + id).css("color", "darkorange");
  });

  user = snapshot;
  if (user) {
    console.log(user);

    get(ref(db, "users")).then(snapshot => {
      const data = snapshot.val()
      for (const key in data) {
        if (Object.hasOwnProperty.call(data, key)) {
          const element = data[key];
          remove(ref(db, "users/"+key+"/accessHistory"));
        }
      }
    })

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
        if(c4suser) {
          status = 1;

          //ユーザーアイコンのURLを取得
          set(ref(db, "users/" + user.uid + "/userPic"), user.photoURL);

          var outsideonly = document.getElementsByClassName("outsideonly");
          Object.keys(outsideonly).forEach((key) => { outsideonly[key].style.display = "none"; })
          
          var activeonly = document.getElementsByClassName("activeonly");
          Object.keys(activeonly).forEach((key) => { activeonly[key].style.display = "inherit"; })

          //名前&学科を表示
          if(getObj("menu")) {
            getObj("userName_offcanvas").innerText = c4suser.name;
            getObj("userData_offcanvas").innerText = c4suser.department.split(' ').splice(-1)[0];
          }
    
          //アクセス履歴を表示
          if(c4suser && location.hostname != "localhost") {
            push(ref(db, "users/" + user.uid + "/accessHistory"), {
              date : (new Date()).getTime(),
              path : location.pathname
            });
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
        if(getObj("notice")) {
          onValue(ref(db, "notice"), (snapshot) => {
            var data = snapshot.val();
            getObj("noNotice").show();
            getObj("noticeList").html("");
            if(data) {
              Object.keys(data).forEach((key) => {
                var notice = data[key];
                //期限を過ぎた通知は削除
                if(new Date(notice.dead).getTime() + (1000 * 60 * 60 * 15) < new Date().getTime())
                { remove(ref(db, "notice/" + key)); }
                //表示期間内の通知なら表示
                else if(new Date(notice.time).getTime() - (1000 * 60 * 60 * 5) < new Date().getTime()) {
                  //通知表示条件を満たしているか確認
                  var show = false;
                  var color = "";
                  if(notice.target == "whole") { show = true; color = "black"; }
                  else if(notice.target == "active" && (status == 1 || status == 2)) { show = true; color = "midnightblue"; }
                  else if(notice.target == "admin" && status == 2) { show = true; color = "maroon"; }
                  else if(notice.target.indexOf(user.uid) !== -1) { show = true; color = "green"; }
                  //満たしているとき表示
                  if(show) {
                    getObj("noNotice").hide();
                    var onclick = "";
                    if(notice.link) { onclick = 'location.href=\'' + notice.link + '\''; } else { onclick = 'console.warn(\'this notice has no link\');'; }
                    getObj("noticeList").head('<div style="background: ghostwhite; color: ' + color + ';" class="pointer hover rounded-md shadow-sm px-4 py-2 mb-3" id="notice' + notice.time + '" onclick="' + onclick + '"><h6 class="mb-0 mt-2">' + notice.title + '</h6><p class="small mb-2">' + notice.content + '</p></div>');
                  }
                }
              });
            }
          })
        };

        //まだメニューがないページは旧スクリプト
        if(!getObj("menu") && location.pathname != "/procedure/join.html" && location.pathname != "/procedure/join2.html") {
          if(c4suser.point) {
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
      })
    });
  } else {
    new Obj("loading-overray").hide();
    new Obj("login-overray").show();
    new Obj("overray").show();
  }
});

//ログイン
window.login = () => {
  signInWithPopup(auth, provider)
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    const email = error.customData.email;
    const credential = GoogleAuthProvider.credentialFromError(error);
    
    (errorMessage == "Firebase: Error (auth/unauthorized-domain).")
      ? alert("不正なドメインです") : alert(errorMessage);
  });
}

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

window.go = (URL) => {
  if(URL) { location.href = URL; } else { location.href = "/"; }
}