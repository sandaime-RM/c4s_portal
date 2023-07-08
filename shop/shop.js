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
var items = {};

onAuthStateChanged(auth, (snapshot) => {
  user = snapshot;

  get(ref(db, "shop")).then((snapshot) => {
    items = snapshot.val();

    Object.keys(items).forEach((key) => {
      var pricetext = items[key].price;
      if(items[key].paytype) { pricetext += "円"; } else { pricetext += "pts"; }
      var styletext;
      if(items[key].style) { styletext = "レンタル"; } else { styletext = "販売"; }
      getObj("items").tail(
        '<div class="col hover" id="cardOf' + key + '"><div onclick="location.href=\'/shop/item.html?key=' + key + '\'" class="card h-100 position-relative" style="cursor: pointer;"><h6 class="price-' + items[key].paytype + '">' + pricetext + '</h6><img src="/img/noimage.svg" class="card-img-top itemimg" id="imgOf' + key + '"><div class="card-body"><h6 class="card-' + items[key].style + '">' + styletext + '</h6><h5 class="card-title">' + items[key].name + '</h5><p class="card-text" style="text-align: justify;">' + items[key].detail + '</p></div><div class="card-footer"><small class="text-muted">' + items[key].owner.name + '・' + DateText(new Date(items[key].time)) + '</small></div></div></div>'
      ); 
      if(items[key].img) {
        getURL(stref(storage, "store/" + items[key].img)).then((url) => {
          getObj("imgOf" + key).src = url;
        });
      }
    });

    $("#overray").fadeOut();
  });
});

window.onload = function () {
  getObj("all_tab").onclick = function () {
    Object.keys(items).forEach((key) => {
      getObj("cardOf" + key).show();
    });
    $("#all_tab").removeClass("unclicked").addClass("clicked");
    $("#uru_tab").removeClass("clicked").addClass("unclicked");
    $("#kas_tab").removeClass("clicked").addClass("unclicked");
  };
  getObj("uru_tab").onclick = function () {
    Object.keys(items).forEach((key) => {
      if(items[key].style) { getObj("cardOf" + key).hide(); }
      else { getObj("cardOf" + key).show(); }
    })
    $("#all_tab").removeClass("clicked").addClass("unclicked");
    $("#uru_tab").removeClass("unclicked").addClass("clicked");
    $("#kas_tab").removeClass("clicked").addClass("unclicked");
  };
  getObj("kas_tab").onclick = function () {
    Object.keys(items).forEach((key) => {
      if(items[key].style) { getObj("cardOf" + key).show(); }
      else { getObj("cardOf" + key).hide(); }
    })
    $("#all_tab").removeClass("clicked").addClass("unclicked");
    $("#uru_tab").removeClass("clicked").addClass("unclicked");
    $("#kas_tab").removeClass("unclicked").addClass("clicked");
  };
}