import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getDatabase, push, set, ref, get, child, remove, onValue } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getObj, Obj, DateText, DateInput, Hizke } from "/script/methods.js";

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

var editting = -1;
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
    { new Obj("year").before('<option value="'+i+'" selected>'+i+'年度</option>'); }
    else
    { new Obj("year").before('<option value="'+i+'">'+i+'年度</option>'); }
  }

  //詳細の表示
  await onValue(ref(db, "money"), showList);
  await new Obj("year").addEventListener('change', showList);

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
      let data = await get(ref(db, `money/${new Obj("year").value}/${key}`)).then(snapshot => { return snapshot.val(); });
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

  //2月までは前の年に入れるようにしたい

  await set(ref(db, `money/${new Obj("year").value}/${new Obj("key").value}`), editingData);
  alert("保存しました。"); closeModal(false);
}
// リストの表示・残高の表示
async function showList () {
  let data;
  //リストを表示
  data = await get(ref(db, `money/${new Obj("year").value}`)).then(snapshot => { return snapshot.val(); });
  console.log(data)
  let keys = sortDataKeys(data);
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
  let list = new Obj("moneyList");
  list.set();
  keys.forEach(key => {
    const element = data[key];
    console.log(element)
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
  //残高の表示
  data = await get(ref(db, `money/${new Date().getFullYear()}`)).then(snapshot => { return snapshot.val(); });
  let goukei = 0;
  Object.keys(data).forEach(key => {
    goukei += Number(data[key].price);
  });
  new Obj("total").set(goukei.toLocaleString());
  get(ref(db, `money/${new Date().getFullYear()}`)).then(snapshot => {
  });
  // グラフの描画
  dispGraph();
}

//推移グラフの表示
async function dispGraph() {
  let fullData = await get(ref(db, "money")).then(snapshot => { return snapshot.val(); });
  //グラフに描画する月を決定
  let labelData = [];
  labelData[0] = {};
  labelData[0].year = new Date().getFullYear();
  labelData[0].month = new Date().getMonth() + 2;
  if(labelData[0].month == 13) { labelData[0].month = 1; } else { labelData[0].year -= 1; }
  //横軸の目盛（年-月）を生成
  let labels = [];
  for (let i = 0; i < 12; i++) {
    labels[i] = `${labelData[i].year}-${labelData[i].month}`;
    if(i < 11) {
      labelData[i+1] = {};
      if(labelData[i].month < 12) { labelData[i+1].year = labelData[i].year; labelData[i+1].month = labelData[i].month+1; }
      else { labelData[i+1].year = labelData[i].year+1; labelData[i+1].month = 1; }
    }
  }
  //データを一つのオブジェクトにまとめる
  let organized;
  Object.keys(fullData).forEach(year => {
    let element = fullData[year];
    Object.keys(element).forEach(month => {
      organized[`${year}-${month}`] = element[month];
    })
  })
  console.log(organized);
  return;

  const ctx1 = document.getElementById('graphMoney');
  var date = new Date();
  var data = [];

  for(var i=0; i<(Number(date.getFullYear()) - 2022); i++) {
    // var year = i + 2022
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

    Object.keys(fullData).forEach((key, index) => {
      var dataDate = new Date(fullData[key].date);

      if(thisDate > dataDate)
      { data[i] += Number(fullData[key].price) }
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