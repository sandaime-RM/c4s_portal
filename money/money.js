// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getDatabase, push, set, ref, get, child, remove } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
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
var user;
var data, keys;
var editting = -1;

//部費情報の取得・表示
window.onload = function() {
    dispList();

    document.getElementById("year").addEventListener('change', dispList);
}

//項目編集・保存
function upload() {
    var name = document.getElementById("name");
    var amount = document.getElementById("amount");
    var itemImage = document.getElementById("itemImage");
    var detail = document.getElementById("detail");
    var type = 2;
    var liquid = true;
    var date = new Date();

    document.getElementById("uploading").style.display = "";

    if(document.getElementById("type2").checked) {type = 1;}
    if(document.getElementById("seisan2").checked) {liquid = false;}
    
    const setData = {
        name : name.value,
        price : Number(amount.value),
        detail : detail.value,
        userId : user.uid,
        date : date.toLocaleDateString(),
        type : type,
        liquid : liquid
    }

    if(editting == -1) {
        push(ref(db, 'money/' + date.getFullYear()), setData)
        .then(() => {
            window.location.reload();
        });
    } else {
        var year = document.getElementById("year").value;

        set(ref(db, 'money/' + year + "/" + keys[editting]), setData)
        .then(() => {
            window.location.reload();
        });
    }
    
}

window.upload = upload;
export{upload}

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
    user = us;
});

//部費情報の表示
function dispMoneyInfo(e, index) {

    if(e.type == 2) {
        document.getElementById("moneyList").innerHTML = '<li class="list-group-item"><div class="row"><div class="col-2 text-primary fs-6"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" class="bi bi-box-arrow-in-down" viewBox="0 0 16 16" ><path fill-rule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/><path fill-rule="evenodd" d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg></div><div class="col-10"><div class="fw-normal">'+e.name+'</div><div class="row py-1"><div class="col-7 text-secondary small">'+e.date+'</div><div class="col-5 fw-bold fs-5 text-end">￥'+Number(e.price).toLocaleString()+'</div></div></div></div><div class="position-absolute top-0 end-0 px-2 py-1 pb-2" style="cursor:pointer;" data-bs-toggle="modal" data-bs-target="#exampleModal" onclick="openInfo('+index+')"><img src="../icons/three-dots-vertical.svg"></div></li>' + document.getElementById("moneyList").innerHTML;
    } else {
        var liquid = "";
        if(e.liquid) {
            liquid = "<span class='text-success fw-bold'>清算済み</span>";
        } else {
            liquid = "<span class='text-danger fw-bold'>未精算</span>";
        }

        document.getElementById("moneyList").innerHTML = '<li class="list-group-item"><div class="row"><div class="col-2 text-danger fs-6"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" class="bi bi-box-arrow-up" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/><path fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 1.707V10.5a.5.5 0 0 1-1 0V1.707L5.354 3.854a.5.5 0 1 1-.708-.708l3-3z"/></svg></div><div class="col-10"><div class="fw-normal">'+e.name+'</div><div class="row py-1"><div class="col-7 text-secondary small">'+e.date+' '+liquid+'</div><div class="col-5 fw-bold fs-5 text-end">￥'+Number(e.price).toLocaleString()+'</div></div></div></div><div class="position-absolute top-0 end-0 px-2 py-1 pb-2" style="cursor:pointer;" data-bs-toggle="modal" data-bs-target="#exampleModal" onclick="openInfo('+index+')"><img src="../icons/three-dots-vertical.svg"></div></li>' + document.getElementById("moneyList").innerHTML;
    }
}

function dispList() {
    var total = 0;
    document.getElementById("moneyList").innerHTML = '<div class="text-center py-3"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    get(ref(db, 'money')).then((snapshot) => {
        data = snapshot.child(document.getElementById("year").value).val();

        //合計金額計算
        for(var i=2022; i<=(new Date()).getFullYear(); i++) {
            var data2 = snapshot.child(String(i)).val();

            if(!data2) {continue;}

            Object.keys(data2).forEach(element => {
                if(data2[element].type == 1) {
                    total -= Number(data2[element].price);
                } else {
                    total += Number(data2[element].price);
                }
            });
        }

        document.getElementById("total").textContent = total.toLocaleString();
        document.getElementById("date").textContent = (new Date()).toLocaleString();

        //詳細表示
        if(!data) {
            document.getElementById("moneyList").innerHTML = "<div class='text-center text-secondary py-3'>データがありません</div>";
            return;
        } else {
            document.getElementById("moneyList").innerHTML = "";
            keys = Object.keys(data);
        }

        Object.keys(data).forEach((element, index) => {
            dispMoneyInfo(data[element], index);
        });

        return;
    });
}

//部費情報の編集画面を表示
function openInfo(index) {
    var year = document.getElementById("year").value;
    var thisData = data[keys[index]];
    editting = index;

    var name = document.getElementById("name");
    var price = document.getElementById("amount");
    var detail = document.getElementById("detail");

    name.value = thisData.name;
    price.value = thisData.price;
    if(thisData.detail) {
        detail.value = thisData.detail;
    }

    if(thisData.type == 1) {
        document.getElementById("type2").checked = true;
    } else {
        document.getElementById("type1").checked = true;
    }

    if(thisData.liquid) {
        document.getElementById("seisan1").checked = true;
    } else {
        document.getElementById("seisan2").checked = true;
    }
}

window.openInfo = openInfo;
export{openInfo}

//部費情報の削除
function delItem() {
    var thisData = data[keys[editting]];
    var year = document.getElementById("year").value;
    var result = confirm("「" + thisData.name + "」の情報を削除してよろしいですか？");

    if(!result) {return;}

    remove(ref(db, 'money/' + year + "/" + keys[editting]))
    .then(() => {
        window.location.reload();
    });
}

window.delItem = delItem;
export{delItem}