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
let csvData = [];

var editting = -1;
var fullData = {};

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
    { getObj("year").head('<option value="'+i+'" selected>'+i+'年度</option>'); }
    else
    { getObj("year").head('<option value="'+i+'">'+i+'年度</option>'); }
  }

  //詳細の表示
  await onValue(ref(db, `money`), showList);
  await getObj("year").addEventListener('change', showList);

  setTimeout(() => { $("#overray").fadeOut(); }, 1000);
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
      new Obj("deleteBtn").hide();
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
      new Obj("deleteBtn").hide();
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

      if(data.price < 0) { new Obj("infoTitle").set('<span>出金情報</span>'); InNOut = "out"; }
      else { new Obj("infoTitle").set('<span>入金情報</span>'); InNOut = "in" }
      
      if(data.userId == user.uid) { new Obj("userName").value = c4suser.name; }
      else { await get(ref(db, "users/" + data.userId + "/name")).then(snapshot => { new Obj("userName").value = snapshot.val(); }); }
      new Obj("name").value = data.name;
      new Obj("amount").value = Math.abs(data.price);
      new Obj("date").value = data.date;
      new Obj("detail").value = data.detail;
      new Obj("detail").style.height = Math.max(data.detail.split('\n').length*1.75, 3.5) + "em";
      if(data.price < 0) {
        new Obj("liquidForm").show();
        if(data.liquid) { new Obj("payBtn-unset").show(); new Obj("payBtn-set").hide(); }
        else { new Obj("payBtn-unset").hide(); new Obj("payBtn-set").show(); }
        new Obj("receiptForm").hide();
      }
      else {
        new Obj("liquidForm").hide();
        new Obj("receiptForm").show();
      }
      new Obj("deleteBtn").show();

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

  //年度を3月スタートにする
  let saveFor = new Date(editingData.date).getFullYear();
  if(new Date(editingData.date).getMonth() < 2) { saveFor--; }

  await set(ref(db, `money/${saveFor}/${new Obj("key").value}`), editingData);
  alert("保存しました。"); closeModal(false); new Obj("year").value = saveFor;
}
// リストの表示・残高の表示
async function showList () {
  csvData = [];
  //リストを表示
  const year = Number(new Obj("year").value);
  await get(ref(db, `money/${year}`)).then(snapshot => {
    let keys = sortDataKeys(snapshot.val());
    fullData = snapshot.val();

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
      const element = snapshot.val()[key];
      //出金
      if(element.price < 0) {
        let paid;
        if(element.liquid) { paid = '<div class="text-secondary">精算済み</div>'; }
        else { paid = '<div class="text-danger"><i class="bi bi-exclamation-circle-fill"> </i>未精算</div>'; }
        list.before(`<div class="bg-white border border-primary shadow-sm rounded-md w-100 mx-auto mb-2 px-1 py-2 row pointer hover" onclick="openModal('${key}')"><div class="col-8"><h6 class="mb-0">${element.name}</h6><p class="text-secondary small mb-0">${DateText(new Date(element.date))}</p></div><div class="col-4"><h4 class="text-primary mb-0 text-end">${Number(element.price).toLocaleString()}</h4></div><hr class="mx-0 my-1"><div class="small text-center mx-0 row">${paid}</div></div>`);
      }
      //入金
      else {
        //部費収入(だいぶ原始的なやり方で判定しているので部費かどうかの項目を追加したい)
        if(element.name.split("部費支払い")[1] !== undefined) {
          list.before(`<div class="bg-white border border-success shadow-sm rounded-md w-95 mx-auto mb-2 px-1 py-1 row pointer hover" onclick="openModal('${key}')"><h6 class="col-4 text-end text-success mb-0">部費収入</h6><p class="col-4 text-center text-secondary small mb-0">${DateText(new Date(element.date))}</p><h6 class="col-4 text-success mb-0">+${Number(element.price).toLocaleString()}</h6></div>`)
        }
        else {
          list.before(`<div class="bg-white border border-success shadow-sm rounded-md w-100 mx-auto mb-2 px-1 py-2 row pointer hover" onclick="openModal('${key}')"><div class="col-8"><h6 class="mb-0">${element.name}</h6><p class="text-secondary small mb-0">${DateText(new Date(element.date))}</p></div><div class="col-4"><h4 class="text-success mb-0 text-end">+${Number(element.price).toLocaleString()}</h4></div></div>`)
        }
      }
      //CSVデータに追加
      let type;
      if(element.price < 0) { type = "支出"; } else { type = "収入"; }
      csvData.push([element.date, element.name, type, element.liquid, Math.abs(element.price), element.detail]);
    })
  });
  //残高の表示
  await get(ref(db, `money/${new Date().getFullYear()}`)).then(snapshot => {
    const data = snapshot.val();
    let goukei = 0;
    Object.keys(data).forEach(key => {
      goukei += Number(data[key].price);
    });
    new Obj("total").set(goukei.toLocaleString());
  });
  //作った二次元配列をCSV文字列に直す
  let CSVString = csvData.join('\r\n');
  //CSVのバイナリデータを作る
  new Obj("exportBtn").href = URL.createObjectURL(new Blob([CSVString], {type: "text/csv"}));
  // グラフの描画
  dispGraph();
}

//部費情報の削除
function delItem() {
  // 確認フォーム
  if (!confirm(`「${editingData.name}」の情報を削除してよろしいですか？`)) { return; }

  try {
    remove(ref(db, 'money/'+new Obj("year").value+"/"+new Obj("key").value))
    .then(() => { alert("削除しました"); });
  } catch (e) {
    console.error(e); alert(e);
  }
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
        var thisDate = new Date(labels[i]);
        thisDate.setDate(1);
        thisDate.setMonth(thisDate.getMonth() + 1);

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

//領収書発行
window.receipt = () => {
  var rNum = editting;
  var rTo = document.getElementById("toName").value;
  var rCnt = document.getElementById("name").value;
  var rMny = document.getElementById("amount").value;
  var rDt = document.getElementById("date").value;

  window.location.href = "receipt.html?num=" + rNum + "&to=" + rTo + "&cnt=" + rCnt + "&mny=" + rMny + "&dt=" + rDt;
}