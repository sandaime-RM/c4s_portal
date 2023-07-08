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
var item = {};

onAuthStateChanged(auth, (snapshot) => {
  user = snapshot;
});

window.onload = function () {
  let key = new URL(location.href).searchParams.get("key");
  if(!key) { location.href = "/shop"; }

  get(ref(db, "shop/" + key)).then((snapshot) => {
    item = snapshot.val(); 

    getObj("itemName").innerText = item.name;
    getObj("itemOwner").innerText = item.owner.name;
    getObj("itemDetail").innerText = item.detail;
    getObj("itemDate").innerText = DateText(new Date(item.time));
    var tan_i = ["pts", "円"];
    getObj("itemPrice").innerText = item.price + tan_i[item.paytype];
    if(item.style) { getObj("kas_mark").show("block"); } else { getObj("kas_mark").hide(); }
    if(item.img) {
      getURL(stref(storage, "store/" + item.img)).then((src) => {
        getObj("itemImg").src = src;
        $("#overray").fadeOut();
      });
    }
    else { $("#overray").fadeOut(); }
  });
}