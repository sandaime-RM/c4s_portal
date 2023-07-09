import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, push, remove, set, get, onValue } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getStorage, ref as stref, uploadBytes, getDownloadURL as getURL } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-storage.js";
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

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const auth = getAuth();
const storage = getStorage();

var user = {};
var c4suser = {};
var item = {};

onAuthStateChanged(auth, (snapshot) => {
  user = snapshot;
  get(ref(db, "users/" + user.uid)).then((snapshot) => { c4suser = snapshot.val(); })
});

window.onload = function () {
  let key = new URL(location.href).searchParams.get("key");
  if(!key) { location.href = "/shop"; }

  //描画
  get(ref(db, "shop/" + key)).then((snapshot) => {
    item = snapshot.val(); 

    //商品詳細の描画
    getObj("itemName").innerText = item.name;
    getObj("itemOwner").innerText = item.owner.name;
    getObj("itemDetail").innerText = item.detail;
    getObj("itemDate").innerText = DateText(new Date(item.time));
    var tan_i = ["pts", "円"];
    getObj("itemPrice").innerText = item.price + tan_i[item.paytype];
    if(item.style) { getObj("kas_mark").show("block"); } else { getObj("kas_mark").hide(); }

    //いいねボタンの設置
    getObj("loveBtn").onclick = love;
    getObj("loveBtnActive").onclick = love;
    function love () {
      //いいね取り消し
      if(item.loves && item.loves[user.uid]) {
        getObj("loveBtnActive").hide();
        getObj("loveBtn").show("inline");
        getObj("loveNum").innerText = Number(getObj("loveNum").innerText) - 1;
        set(ref(db, "shop/" + key + "/loves/" + user.uid), null);
        item.loves[user.uid] = null;
      }
      //いいね登録
      else { 
        getObj("loveBtnActive").show("inline");
        getObj("loveBtn").hide();
        getObj("loveNum").innerText = Number(getObj("loveNum").innerText) + 1;
        set(ref(db, "shop/" + key + "/loves/" + user.uid), true);
        if(!item.loves) { item.loves = {}; }
        item.loves[user.uid] = true;
      }
      if(getObj("loveNum").innerText == 0) { getObj("loveNum").style.opacity = 0; }
      else { getObj("loveNum").style.opacity = 1; }
    }
    if(item.loves) {
      getObj("loveNum").innerText = Object.keys(item.loves).length;
      getObj("loveNum").style.opacity = 1;
      if(item.loves[user.uid]) { getObj("loveBtnActive").show("inline"); }
      else { getObj("loveBtn").show("inline"); }
    }
    else { getObj("loveBtn").show("inline"); getObj("loveNum").style.opacity = 0; }

    //コメント描画
    if(item.comments) {
      getObj("commentNum").innerText = Object.keys(item.comments).length;
      getObj("commentNum").style.opacity = 1;
    }
    else { 
      getObj("commentNum").style.opacity = 0;
    }
    onValue(ref(db, "shop/" + key + "/comments"), (data) => {
      getObj("comments").html("");
      if(data.val()) {
        item.comments = data.val();
        Object.keys(item.comments).forEach((id) => {
          var comment = item.comments[id];
          getObj("comments").head('<li class="list-group-item"><h6>' + comment.name + '・' + DateText(new Date(comment.time)) + '</h6><p class="mb-0">' + comment.msg + '</p></li>');
        });
      }
    });
    function send () {
      let msg = getObj("commentInput").value;
      set(ref(db, "shop/" + key + "/comments/" + new Date().getTime().toString(16).toUpperCase()), {
        uid : user.uid,
        name : c4suser.name,
        time : new Date().getTime(),
        msg : msg
      }).then(() => {
        getObj("commentInput").value = "";
      });
    }
    window.send = send;

    //画像描画
    if(item.img) {
      getURL(stref(storage, "store/" + item.img)).then((src) => {
        getObj("itemImg").src = src;
        $("#overray").fadeOut();
      });
    }
    else { $("#overray").fadeOut(); }
  });
}

//購入処理
export function buy() {
  let boolean = window.confirm(item.name + "を購入しますか？");
  if(!boolean) { return; }
  alert("購入は旧ページからお願いします");
  location.href = "/store"
}
window.buy = buy;