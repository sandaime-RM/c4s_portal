import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, push, remove, set, get, onValue } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { Obj } from "/script/methods.js";

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

onAuthStateChanged(auth, snapshot => {
  user = snapshot;
  if(!user) { location.href = "/"; }
  get(ref(db, `users/${user.uid}`)).then(snapshot => { 
    c4suser = snapshot.val(); 
    if(!c4suser) { location.href = "/"; }
    clear();
    $("#overray").fadeOut();
  });
})

window.clear = () => {
  new Obj("type").value = 0;
  new Obj("adress").value = `${c4suser.studentNumber}@ed.tus.ac.jp`;
  new Obj("name").value = c4suser.name;
  new Obj("content").value = "";
}

window.send = () => {
  if(!new Obj("adress").value) {
    alert("メールアドレスを入力してください"); return;
  }
  if(!new Obj("adress").value.split("@")[1]) {
    alert("正しいメールアドレスを入力してください"); return;
  }
  if(!new Obj("content").value) {
    alert("お問い合わせ内容を入力してください"); return;
  }

  if(confirm("この内容で送信しますか？")) {
    $("#overray").fadeIn();
    let data = {
      type: new Obj("type").value,
      email: new Obj("adress").value,
      name: new Obj("name").value,
      uid: user.uid,
      content: new Obj("content").value,
      solved: false
    }
    push(ref(db, "contact/"), data).then(() => {
      alert("送信しました");
      location.href = "/procedure";
    });
  }
}