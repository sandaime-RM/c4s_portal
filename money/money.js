import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getDatabase, push, set, ref, get, child, remove, onValue } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getObj, Obj, DateText, DateInput } from "/script/methods.js";

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

let user;
let c4suser;
let status;

let editted;
let editingData;
let InNOut;

var data, keys;
var editting = -1;
var fullData = {};
var first = true;
var exportData = [];

//ユーザー情報の取得
onAuthStateChanged(auth, async snapshot => {
  $("#overray").fadeIn();

  user = snapshot;
  await get(ref(db, "users/" + user.uid)).then(snapshot => { c4suser = snapshot.val(); })
  await get(ref(db, "admin-users/" + user.uid)).then(snapshot => { 
    if(snapshot.val()) { status = 2; } else { status = 1; }
  })

  //年度項目の追加＆詳細の表示
  for(var i = 2022; i <= new Date().getFullYear(); i++) {
    if(i == new Date().getFullYear()) 
    { getObj("year").head('<option value="'+i+'" selected>'+i+'年</option>'); }
    else
    { getObj("year").head('<option value="'+i+'">'+i+'年</option>'); }
  }

  //詳細の表示
  await onValue(ref(db, `money`), showList);
  await getObj("year").addEventListener('change', showList);

  $("#overray").fadeOut();
});

const infoModal = new bootstrap.Modal("#infoModal");
// モーダルを開く
window.openModal = async (key) => {
  new Obj("userName").value = c4suser.name
  new Obj("name").value = "";
  new Obj("amount").value = "";
  new Obj("date").value = DateInput();

  switch (key) {
    //入金モード
    case 'in'  :
      new Obj("infoTitle").set('<span class="text-success">入金</span>');
      new Obj("key").value = new Date().getTime().toString(16).toUpperCase();
      new Obj("receiptForm").show();
      new Obj("liquidForm").hide();
      InNOut = "in";
      editingData = {
        name : "",
        price : 0,
        detail : "",
        userId : user.uid,
        date : "",
        liquid : true,
        toName : ""
      }
      break;
    //出金モード
    case 'out' :
      new Obj("infoTitle").set('<span class="text-danger">出金</span>');
      new Obj("key").value = new Date().getTime().toString(16).toUpperCase();
      new Obj("receiptForm").hide();
      new Obj("liquidForm").hide();
      InNOut = "out";
      editingData = {
        name : "",
        price : 0,
        detail : "",
        userId : user.uid,
        date : "",
        liquid : false,
        toName : ""
      }
      break;
    //編集モード
    default:
      $("#loading").fadeIn();
      let data = await get(ref(db, "money/" + new Obj("year").value + "/" + key)).then(snapshot => { return snapshot.val(); });
      if(status != 2 && data.userId != user.uid) { alert("自分の登録したデータのみ編集できます"); $("#loading").fadeOut(); return; }

      new Obj("key").value = key;

      editingData = data;

      if(data.type == 1 || data.amount < 0) { new Obj("infoTitle").set('<span>出金情報</span>'); InNOut = "out"; }
      else { new Obj("infoTitle").set('<span>入金情報</span>'); InNOut = "in" }
      
      if(data.userId == user.uid) { new Obj("userName").value = c4suser.name; }
      else { await get(ref(db, "users/" + data.userId + "/name")).then(snapshot => { new Obj("userName").value = snapshot.val(); }); }
      new Obj("name").value = data.name;
      new Obj("amount").value = Math.abs(data.price);
      new Obj("date").value = data.date;
      new Obj("detail").value = data.detail;
      if(data.price < 0 || data.type == 1) {
        new Obj("liquidForm").show();
        if(data.liquid) { new Obj("payBtn-unset").show(); new Obj("payBtn-set").hide(); }
        else { new Obj("payBtn-unset").hide(); new Obj("payBtn-set").show(); }
        new Obj("receiptForm").hide();
      }
      else {
        new Obj("receiptForm").show();
      }

      $("#loading").fadeOut();
    break;
  }

  // 編集中なのにミスって閉じたら最悪なので、一文字でも編集したら閉じるときに確認ダイアログを出す
  editted = false;
  new Obj("name").addEventListener("input", () => {editted = true});
  new Obj("amount").addEventListener("input", () => {editted = true});
  new Obj("date").addEventListener("input", () => {editted = true});
  new Obj("detail").addEventListener("input", () => {editted = true});

  infoModal.show();
}
// モーダルを閉じる（引数があるときは確認ダイアログを出す）
window.closeModal = function closeModal (dialog) {
  if(dialog && editted) {
    let ans = confirm("入力内容を破棄しますか？");
    if(!ans) { return; }
  }
  infoModal.hide();
}
// 精算<->未精算
window.pay = async (i) => {
  switch (i) {
    // 未精査に戻す
    case 0:
      var ans = confirm("未精算に戻します。よろしいですか？");
      if(ans) {
        await set(ref(db, `money/${new Obj("year").value}/${new Obj("key").value}/liquid`), false);
        editingData.liquid = false;
        new Obj("payBtn-set").show();
        new Obj("payBtn-unset").hide();
      }
    break;
    // 清算済みにする
    case 1:
      var ans = confirm("この操作は元に戻せません。清算済みにしてよろしいですか？");
      if(ans) {
        let exist = await get(ref(db, `money/${new Obj("year").value}/${new Obj("key").value}`)).then(snapshot => { return snapshot.val(); });
        if(exist)
        { await set(ref(db, `money/${new Obj("year").value}/${new Obj("key").value}/liquid`), true); }
        editingData.liquid = true;
        new Obj("payBtn-set").hide();
        new Obj("payBtn-unset").show();
      }
    break;
  }
}
// 保存（アップロード）
window.save = async () => {
  //不備チェック
  if(!new Obj("name").value || !new Obj("amount").value || !new Obj("date").value) 
  { alert("入力されていない項目があります"); return; }
  if(new Obj("name").value.split("部費支払い")[1])
  { alert("項目名に「部費支払い」を含むことはできません"); return; }
  if(new Obj("amount").value < 0)
  { alert("金額が不正です"); return; }
  if(new Date(new Obj("date").value) > new Date(new Date().getTime() + (1000 * 60 * 60 * 48)))
  { alert("48時間以上先の情報を入力することはできません"); return; }

  editingData.name = new Obj("name").value;
  let price = Number(new Obj("amount").value);
  if(InNOut == "out") { price *= -1; }
  editingData.price = price;
  editingData.detail = new Obj("detail").value;
  editingData.date = new Obj("date").value;
  editingData.toName = new Obj("toName").value;

  await set(ref(db, `money/${new Obj("year").value}/${new Obj("key").value}`), editingData);
  alert("保存しました。"); closeModal(false);
}
// リストの表示・残高の表示
function showList () {
  //リストを表示
  const year = Number(new Obj("year").value);
  get(ref(db, `money/${year}`)).then(snapshot => {
    let keys = sortDataKeys(snapshot.val());
    function sortDataKeys (data) {
      let first = Object.keys(data)[0];
      Object.keys(data).forEach(key => {
        if(new Date(data[key].date) < new Date(data[first].date)) { first = key; }
      });
      delete data[first];
      if(Object.keys(data).length > 0)
      { return [first, ...sortDataKeys(data)]; }
      else
      { return [first]; }
    }
    console.log(keys)
    let list = new Obj("moneyList");
    list.set();
    keys.forEach(key => {
      const element = snapshot.val()[key];
      //出金
      if(element.price < 0 || element.type == 1) {
        let paid;
        if(element.liquid) { paid = '<div class="text-secondary">精算済み</div>'; }
        else { paid = '<div class="text-danger"><i class="bi bi-exclamation-circle-fill"> </i>未精算</div>'; }
        list.before(`<div class="bg-white border border-primary shadow-sm rounded-md w-100 mx-auto mb-2 px-1 py-2 row pointer" onclick="openModal('${key}')"><div class="col-8"><h6 class="mb-0">${element.name}</h6><p class="text-secondary small mb-0">${DateText(new Date(element.date))}</p></div><div class="col-4"><h4 class="text-primary mb-0 text-end">${Number(element.price).toLocaleString()}</h4></div><hr class="mx-0 my-1"><div class="small text-center mx-0 row">${paid}</div></div>`);
      }
      //入金
      else {
        //部費収入
        if(element.name.split("部費支払い")[1] !== undefined) {
          list.before(`<div class="bg-white border border-success shadow-sm rounded-md w-95 mx-auto mb-2 px-1 py-1 row pointer" onclick="openModal('${key}')"><h6 class="col-4 text-end text-success mb-0">部費収入</h6><p class="col-4 text-center text-secondary small mb-0">${DateText(new Date(element.date))}</p><h6 class="col-4 text-success mb-0">+${Number(element.price).toLocaleString()}</h6></div>`)
        }
        else {
          list.before(`<div class="bg-white border border-success shadow-sm rounded-md w-100 mx-auto mb-2 px-1 py-2 row pointer" onclick="openModal('${key}')"><div class="col-8"><h6 class="mb-0">${element.name}</h6><p class="text-secondary small mb-0">${DateText(new Date(element.date))}</p></div><div class="col-4"><h4 class="text-success mb-0 text-end">+${Number(element.price).toLocaleString()}</h4></div></div>`)
        }
      }
    })
  });
  //残高の表示
  get(ref(db, `money/${new Date().getFullYear()}`)).then(snapshot => {
    const data = snapshot.val();
    let goukei = 0;
    Object.keys(data).forEach(key => {
      goukei += Number(data[key].price);
    });
    new Obj("total").set(goukei.toLocaleString());
  });
  // グラフの描画
  dispGraph();
}

// 項目編集・保存
function upload() {
    var name = document.getElementById("name");
    var amount = document.getElementById("amount");
    //var itemImage = document.getElementById("itemImage");
    var detail = document.getElementById("detail");
    var type = 2;
    var liquid = true;
    var date = document.getElementById("dateForm");
    var toName = document.getElementById("toName");

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
        liquid : liquid,
        toName : toName.value
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

// 部費情報の表示
function dispMoneyInfo(e, index, key) {

    if(e.type == 2) {
        document.getElementById("moneyList").innerHTML = '<li class="list-group-item"><div class="row"><div class="col-2 text-primary fs-6"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" class="bi bi-box-arrow-in-down" viewBox="0 0 16 16" ><path fill-rule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/><path fill-rule="evenodd" d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg></div><div class="col-10"><div class="fw-normal">'+e.name+'</div><div class="row py-1"><div class="col-7 text-secondary small">'+e.date+'</div><div class="col-5 fw-bold fs-5 text-end">￥'+Number(e.price).toLocaleString()+'</div></div></div></div><div class="position-absolute top-0 end-0 px-2 py-1 pb-2" style="cursor:pointer;" data-bs-toggle="modal" data-bs-target="#exampleModal" onclick="openModal(\''+key+'\')"><img src="../icons/three-dots-vertical.svg"></div></li>' + document.getElementById("moneyList").innerHTML;
    } else {
        var liquid = "";
        if(e.liquid) {
            liquid = "<span class='text-success fw-bold'>清算済み</span>";
        } else {
            liquid = "<span class='text-danger fw-bold'>未精算</span>";
        }

        document.getElementById("moneyList").innerHTML = '<li class="list-group-item"><div class="row"><div class="col-2 text-danger fs-6"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" class="bi bi-box-arrow-up" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/><path fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 1.707V10.5a.5.5 0 0 1-1 0V1.707L5.354 3.854a.5.5 0 1 1-.708-.708l3-3z"/></svg></div><div class="col-10"><div class="fw-normal">'+e.name+'</div><div class="row py-1"><div class="col-7 text-secondary small">'+e.date+' '+liquid+'</div><div class="col-5 fw-bold fs-5 text-end">￥'+Number(e.price).toLocaleString()+'</div></div></div></div><div class="position-absolute top-0 end-0 px-2 py-1 pb-2" style="cursor:pointer;" data-bs-toggle="modal" data-bs-target="#exampleModal" onclick="openModal(\''+key+'\')"><img src="../icons/three-dots-vertical.svg"></div></li>' + document.getElementById("moneyList").innerHTML;
    }
}

async function dispList() {
    var total = 0;
    document.getElementById("moneyList").innerHTML = '<div class="text-center py-3"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    exportData = [["日付", "項目", "収入/支出", "清算済み", "金額", "備考"]];

    await get(ref(db, 'money')).then((snapshot) => {
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
        document.getElementById("nowtime").textContent = (new Date()).toLocaleString();

        //詳細表示
        if(!data) {
            document.getElementById("moneyList").innerHTML = "<div class='text-center text-secondary py-3'>データがありません</div>";
            return;
        } else {
            document.getElementById("moneyList").innerHTML = "";
            keys = Object.keys(data);
        }

        Object.keys(data).forEach((element, index) => {
            dispMoneyInfo(data[element], index, element);
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
      console.error(error);
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
    var toName = document.getElementById("toName");

    name.value = thisData.name;
    price.value = thisData.price;
    date.value = thisData.date;

    if(thisData.detail) {
        detail.value = thisData.detail;
    } else {
        detail.value = "";
    }

    if(thisData.toName) {
        toName.value = thisData.toName;
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
window.receipt = () => {
  var rNum = editting;
  var rTo = document.getElementById("toName").value;
  var rCnt = document.getElementById("name").value;
  var rMny = document.getElementById("amount").value;
  var rDt = document.getElementById("date").value;

  window.location.href = "receipt.html?num=" + rNum + "&to=" + rTo + "&cnt=" + rCnt + "&mny=" + rMny + "&dt=" + rDt;
}