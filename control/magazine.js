import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, update, push, remove, set, get, onValue } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getObj, sortMembers } from "/script/methods.js";

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
const db = getDatabase(app);
const auth = getAuth();
var user;
var followers;
var mails;
var myName = "";

var adminusers;

//Modal
const modal = new bootstrap.Modal(document.getElementById('editMail'))

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
    user = us;

    //ローディング画面
    
    //管理者一覧を取得
    get(ref(db, "admin-users")).then((snapshot) => {
      adminusers = snapshot.val();
      //管理者権限のないゲストはアクセス拒否
      if(!adminusers[user.uid]) { if(!alert("管理者権限がありません")) { location.href = "/"; }}
      //でなければアクセス許可
      else { 
        get(ref(db, "users/" + user.uid + "/name")).then((snapshot) => {
          myName = snapshot.val();
          loadInfo();
        })
      }
    })
});

//登録者とメール一覧の表示
function loadInfo() {
    //とりあえず仮で即ローディング解除
    $("#overray").fadeOut();

    //登録者一覧の取得と表示
    onValue(ref(db, "magazine/followers"), (snapshot) => {
        followers = snapshot.val();

        getObj("followerList").innerHTML = "";

        Object.keys(followers).forEach((key, index) => {
            getObj("followerList").innerHTML += '<tr><td>'+(index+1)+'</td><td>'+followers[key].name+'</td><td>'+followers[key].email+'</td><td><button class="btn btn-danger py-0" onclick="delFollower('+index+')"><i class="bi bi-trash"></i></button></td></tr>';
        });
    });

    //メール一覧の取得と表示
    onValue(ref(db, "magazine/mails"), (snapshot2) => {
        mails = snapshot2.val();

        getObj("mailList").innerHTML = "";

        Object.keys(mails).forEach((key, index) => {
            getObj("mailList").innerHTML = '<tr><td>'+mails[key].date+'</td><td>'+mails[key].title+'</td><td>'+mails[key].sender+'</td><td><button class="btn btn-default py-0" onclick="openDetail('+index+')"><i class="bi bi-box-arrow-up-right"></i></button></td></tr>' + getObj("mailList").innerHTML;
        });
    })
}

//メールの送信
function send() {
    var ask = confirm("メールの配信をしてよろしいですか？内容をよくご確認ください。");

    if(!ask) { return; }

    var date = new Date();

    push(ref(db, "magazine/mails"), {
        title : getObj("mailTitle").value,
        content : getObj("mailContent").value,
        sender : myName,
        date : date.toLocaleString()
    })
    .then(() => {
      alert("配信しました。");
      modal.hide();
    })
}

window.send = send;
export{send}


//登録者の削除
function delFollower(num) {
    var key = Object.keys(followers)[num];

    var ask = confirm(followers[key].name + " さんのメルマガ登録を削除してもよろしいですか？");

    if(!ask) { return; }

    remove(ref(db, "magazine/followers/" + key))
    .then(() => {
        console.log("The follower was removed.");
    })
}

window.delFollower = delFollower
export{delFollower}