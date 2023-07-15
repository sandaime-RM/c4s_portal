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
var fullData = {};
var first = true;
var exportData = [];

//部費情報の取得・表示
window.onload = function() {
    dispList();

    document.getElementById("year").addEventListener('change', dispList);

    var nowYear = (new Date()).getFullYear();

    for(var i=2022; i<=nowYear; i++) {
        if(i == nowYear) {
            document.getElementById("year").innerHTML = '<option value="'+i+'" selected>'+i+'年</option>' + document.getElementById("year").innerHTML;
        } else {
            document.getElementById("year").innerHTML = '<option value="'+i+'">'+i+'年</option>' + document.getElementById("year").innerHTML;
        }
    }
}

//項目編集・保存
function upload() {
    var name = document.getElementById("name");
    var amount = document.getElementById("amount");
    //var itemImage = document.getElementById("itemImage");
    var detail = document.getElementById("detail");
    var type = 2;
    var liquid = true;
    var date = document.getElementById("dateForm");

    document.getElementById("uploading").style.display = "";

    if(document.getElementById("type2").checked) {type = 1;}
    if(document.getElementById("seisan2").checked) {liquid = false;}
    
    const setData = {
        name : name.value,
        price : Number(amount.value),
        detail : detail.value,
        userId : user.uid,
        date : date.value,
        type : type,
        liquid : liquid
    }

    if(editting == -1) {
        push(ref(db, 'money/' + (new Date(date.value)).getFullYear()), setData)
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
    exportData = [["日付", "項目", "収入/支出", "清算済み", "金額", "備考"]];

    get(ref(db, 'money')).then((snapshot) => {
        document.getElementById("errorMoney").innerHTML = "";
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

            Object.assign(fullData, data2);
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
            pushExportData(data[element], index);
        });

        if(first) {
            dispGraph();
            first = false;
        }

        exportCSV();

        return;
    })
    .catch((error) => {
        document.getElementById("moneyList").innerHTML = "";
        document.getElementById("errorMoney").innerHTML = '<span class="text-danger small">'+error+'</span>';
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
    var date = document.getElementById("dateForm");

    name.value = thisData.name;
    price.value = thisData.price;
    date.value = thisData.date;

    if(thisData.detail) {
        detail.value = thisData.detail;
    } else {
        detail.value = "";
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

//推移グラフの表示
function dispGraph() {
    const ctx1 = document.getElementById('graphMoney');
    var date = new Date();
    var labels = [];
    var data = []

    for(var i=0; i<(Number(date.getFullYear()) - 2022); i++) {
        var year = i + 2022
        for(var j=1; j<=12; j++) {
            labels.push(year + "-" + j);
            data.push(0);
        }
    }

    for(var i=1; i<=(date.getMonth()+1); i++) {
        labels.push(date.getFullYear() + "-" + i);
        data.push(0);
    }

    for(var i=0; i < data.length; i++) {
        var thisDate = new Date(labels[i] + "-1");
        thisDate.setMonth(thisDate.getMonth() + 1);
        console.log(thisDate.toLocaleDateString);

        Object.keys(fullData).forEach((key, index) => {
            var dataDate = new Date(fullData[key].date);

            if(thisDate > dataDate) {
                if(fullData[key].type == 2) {
                    data[i]  += Number(fullData[key].price);
                } else {
                    data[i]  -= Number(fullData[key].price);
                }
            }
        });
    }

    data = data.slice(-12);
    labels = labels.slice(-12);

    console.log(data)

    new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '残高推移',
                data: data,
                fill: true,
                borderColor: '#f28005',
                backgroundColor : '#f0bb8180',
                tension: 0.1
            }]
        }
    });
}

//出力用データに追加
function pushExportData(pushData, index) {
    var dataType = "収入";

    if(pushData.type == 1) {
        dataType = "支出";
    }

    var liquid2 = false;
    if(pushData.liquid) {
        liquid2 = true;
    }

    exportData.push([pushData.date, pushData.name, dataType, liquid2, pushData.price, pushData.detail]);
}

//データを出力
function exportCSV() {
    console.log(exportData);

    //作った二次元配列をCSV文字列に直す。
    let csv_string  = ""; 
    for (let d of exportData) {
        csv_string += d.join(",");
        csv_string += '\r\n';
    }   

    //ファイル名の指定
    let file_name   = "test.csv";

    //CSVのバイナリデータを作る
    let blob        = new Blob([csv_string], {type: "text/csv"});
    let uri         = URL.createObjectURL(blob);

    document.getElementById("exportBtn").href = uri;
}

window.exportCSV = exportCSV;
export{exportCSV}


//領収書発行
function receipt() {
    var rNum = document.getElementById("number").value;
    var rTo = document.getElementById("toName").value;
    var rCnt = document.getElementById("name").value;
    var rMny = document.getElementById("amount").value;
    var rDt = document.getElementById("dateForm").value;

    if(document.getElementById("type2").checked) {
        alert("領収書は「入金」のみに発行できます。");
        return;
    }

    window.location.href = "receipt.html?num=" + rNum + "&to=" + rTo + "&cnt=" + rCnt + "&mny=" + rMny + "&dt=" + rDt;
}

window.receipt = receipt;
export{receipt}