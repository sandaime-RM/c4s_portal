// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, update, push, remove, set, get } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { sortMembers } from "/script/methods.js";
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
var userKeys = [];
var users = {};
var editting = -1;
var toCsvData = []; //CSV変換用のデータ
var buhiKeys = [];
var buhiList = [];
var noExit = true;
var buhiTotal = 0;
var totalMembers = 0;
var storeTasks, storeData;
var edittingStore = ["", ""];

var adminusers;

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
  user = us;

  //ローディング画面
  document.getElementById("overray").style.display = "block";
  
  //管理者一覧を取得
  get(ref(db, "admin-users")).then((snapshot) => {
    adminusers = snapshot.val();
    //管理者権限のないゲストはアクセス拒否
    if(!adminusers[user.uid]) { if(!alert("管理者権限がありません")) { location.href = "/"; }}
    //でなければアクセス許可
    else { 
      //ユーザー情報を全取得
      get(ref(db, "users")).then((snapshot) => {
        users = snapshot.val()
        restart();
      })
    }
  })
});

function restart() {
  //とりあえず仮で即ローディング解除
  document.getElementById("overray").style.display = "none";

  //部費支払い一覧(あとでタームごとに管理できるようにする)
  var date = new Date();
  document.getElementById("endDate").value = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
  document.getElementById("startDate").value = "2023-04-01";

  //CSVデータ作成用
  toCsvData = [["名前", "名前（ふりがな）", "学籍番号", "学部学科", "大学名・学部学科（他大学）", "学年", "性別", "誕生日", "電話番号"]];

  //ユーザー一覧をソート:by toyton
  userKeys = sortMembers(users, Object.keys(users));

  var date = new Date();
  totalMembers = userKeys.length;

  userKeys.forEach((key, i) => {
    //引退・退部した部員
    if(users[key].status == 1 || users[key].status == 2) {
        noExit = false;
        var role = "引退";
        if(users[key].status == 1) {role = "退部";}

        totalMembers --;

        document.getElementById("exitMembers").innerHTML += '<li class="list-group-item" onclick="openInfo('+i+')" data-bs-toggle="modal" data-bs-target="#exampleModal"><h6>'+users[key].name + '<span class="badge bg-danger mx-1">'+role+'</span></h6><span class="text-secondary small mx-1">'+users[key].nameKana+' ' + users[key].studentNumber + '</span></li>';
        return;
    }

    var sex = "女性";
    if(users[key].sex == "man") {sex="男性";}

    var tags = "";
    var roles = "";
    if(users[key].role) {
        var role = users[key].role;
        
        //幹部はバッジをつける
        switch (role) {
          case "leader":
            roles += '<span class="mx-1 badge bg-primary">部長</span>';
            break;
          case "subleader":
            roles += '<span class="mx-1 badge bg-primary">副部長</span>';
            break;
          case "treasurer":
            roles += '<span class="mx-1 badge bg-primary">会計</span>';
            break;
          default:
            break;
        }

        //新入部員もバッジをつける
        if(role == "new"){
          roles += '<i class="bi bi-stars" style="color: orange;"></i>'
        }
    }

    if(adminusers[key]) {
        roles += '<span class="badge bg-secondary mx-1">管理者</span>';
    }

    var age = 0;
    var birth = new Date(users[key].birth);
    age = Math.floor((date - birth) / (86400000 * 365));

    //リストに表示
    document.getElementById("memberList").innerHTML += '<li class="list-group-item" onclick="openInfo('+i+')" data-bs-toggle="modal" data-bs-target="#exampleModal"><h6>'+users[key].name + '<span class="text-secondary mx-1">' + users[key].studentNumber + '</span>' + roles + '</h6><div class="small text-secondary">'+users[key].department+' '+users[key].grade+'年 '+sex+' '+age+'歳</div>'+tags+'</li>'
    
    toCsvData.push([users[key].name, users[key].nameKana, users[key].studentNumber, users[key].department, users[key].otherDepart, users[key].grade, sex, users[key].birth, String(users[key].phoneNumber)]);

    var buhiRecords = users[key].buhiRecord;

    if(buhiRecords) {
      Object.keys(buhiRecords).forEach((key2, ib) => {
        buhiRecords[key2].name = users[key].name;
        buhiRecords[key2].uid = key;
        buhiList = buhiList.concat(buhiRecords[key2]);
        buhiTotal += Number(buhiRecords[key2].amount);
      });  
    }
  });

  buhiList.sort(
      (x, y) => ((new Date(y.date)).getTime()) - ((new Date(x.date)).getTime()),
  )

  // buhiList.forEach((buhi, il) => {
  //     document.getElementById("buhiList").innerHTML += '<li class="list-group-item">'+buhi.name+'<span class="fw-bold mx-1">￥' + Number(buhi.amount).toLocaleString() + '</span><span class="text-secondary mx-1 small">'+buhi.date+' 記録者 : '+buhi.recorderName+'</span></li>';
  // });

  document.getElementById("totalMoney").textContent = buhiTotal.toLocaleString();

  create_csv(toCsvData);

  //引退・退部部員がいる
  if(!noExit) {
      document.getElementById("noExit").style.display = "none";
  }

  document.getElementById("totalMember").innerHTML = '合計 ' + totalMembers + "人";

    //ストアの取引情報の表示
    get(ref(db, "store")).then((snapshot2) => {
        storeData = snapshot2.val();

        get(ref(db, "storePay")).then((snapshot) => {
            storeTasks = snapshot.val();
    
            Object.keys(storeTasks).forEach((key, index) => {
                var itemTask = storeTasks[key];
    
                Object.keys(itemTask).forEach((key2, index2) => {
                    //取引完了済みかどうか
                    if(!itemTask[key2].done) {
                        document.getElementById("needTrans").innerHTML += '<li style="cursor:pointer;" data-bs-toggle="modal" data-bs-target="#transModal" class="list-group-item" onclick="openItemInfo('+index + ","+ index2 + ')"><div><span class="fw-bold">'+storeData[key].name+'<span class="text-secondary mx-1">×'+itemTask[key2].num+'</span></span></div><div class="text-secondary small">購入者：<span id="buyerName">'+itemTask[key2].userName+'</span> さん<br>購入日時：<span id="boughtDate">'+(new Date(itemTask[key2].date)).toLocaleString()+'</span></div></li>';
                    } else {
                        document.getElementById("noExit2").style.display = "none";
                        
                        document.getElementById("otherTransactions").innerHTML += '<li style="cursor:pointer;" data-bs-toggle="modal" data-bs-target="#transModal" class="list-group-item" onclick="openItemInfo('+index + ","+ index2 + ')"><div><span class="fw-bold">'+storeData[key].name+'<span class="text-secondary mx-1">×'+itemTask[key2].num+'</span></span></div><div class="text-secondary small">購入者：<span id="buyerName">'+itemTask[key2].userName+'</span> さん<br>購入日時：<span id="boughtDate">'+(new Date(itemTask[key2].date)).toLocaleString()+'</span></div></li>';
                    }
                });
            });
        });
    });
}

//部員情報の表示
function openInfo(i) {
    document.getElementById("mbName").textContent = users[userKeys[i]].name;
    document.getElementById("mbYomi").textContent = users[userKeys[i]].nameKana;

    if(users[userKeys[i]].status == 1 || users[userKeys[i]].status == 2) {
      //退部引退した人
      document.getElementById("mbPR").textContent = users[userKeys[i]].reason;
      document.getElementById("detailTitle").textContent = "退部理由";

      document.getElementById("mbBirth").textContent = "---------" + "生";
      document.getElementById("mbTel").textContent = "----------";
      document.getElementById("mbSex").textContent = "----";
      document.getElementById("mbDepartment").textContent = "----------";
      document.getElementById("mbGrade").textContent = "-- 年生";
    } else {
      //在籍している人
      document.getElementById("mbBirth").textContent = users[userKeys[i]].birth + "生";
      document.getElementById("mbTel").textContent = users[userKeys[i]].phoneNumber;
  
      var sex = "男性";
      if(users[userKeys[i]].sex == "woman") { sex = "女性"; }
  
      document.getElementById("mbSex").textContent = sex;
      document.getElementById("mbDepartment").textContent = users[userKeys[i]].department;
      document.getElementById("mbGrade").textContent = users[userKeys[i]].grade + "年生";
      document.getElementById("mbPR").textContent = users[userKeys[i]].detail;
      document.getElementById("detailTitle").textContent = "自己PR";
    }
    
    document.getElementById("mbStudentNumber").textContent = users[userKeys[i]].studentNumber;
    document.getElementById("role1").checked = adminusers[userKeys[i]];

    //役職を表示
    document.getElementById("role2").value = users[userKeys[i]].role;

    if(users[userKeys[i]].buhiRecord) {
        var buhiRecord = users[userKeys[i]].buhiRecord;
        document.getElementById("buhiRecord").innerHTML = "";

        buhiKeys = Object.keys(buhiRecord);

        Object.keys(buhiRecord).forEach((key, index) => {
            document.getElementById("buhiRecord").innerHTML += '<li class="list-group-item"><span class="fw-bold mx-1">￥' + Number(buhiRecord[key].amount).toLocaleString() + '</span><span class="text-secondary mx-1 small">'+buhiRecord[key].date+' 記録者 : '+buhiRecord[key].recorderName+'</span><div class="position-absolute top-50 end-0 translate-middle-y"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" onclick="deleteBuhi('+i+', '+index+')" class="mx-2 bi bi-x-lg text-secondary" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z"/><path fill-rule="evenodd" d="M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z"/></svg></div></li>';
        });
    } else {
        document.getElementById("buhiRecord").innerHTML = '<p class="text-secondary small text-center py-2 mx-1">履歴はありません</p>';
    }

    document.getElementById("accessRecord").innerHTML = "";
    if(users[userKeys[i]].accessHistory) {
        var accessRecord = users[userKeys[i]].accessHistory;

        Object.keys(accessRecord).forEach((key, index) => {
            document.getElementById("accessRecord").innerHTML = (new Date(accessRecord[key].date)).toLocaleString() + " " + accessRecord[key].path + "<br>" + document.getElementById("accessRecord").innerHTML;
        });
    }

    editting = i;
}

window.openInfo = openInfo;
export{openInfo}


//現在スタックされているデータをCSVに変換してダウンロードする
function create_csv(data){

    console.table(data);

    //作った二次元配列をCSV文字列に直す。
    let csv_string  = ""; 
    for (let d of data) {
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

//ユーザー情報の保存
function upload() {
    if(document.getElementById("buhiPrice").value) {
        push(ref(db, "users/" + userKeys[editting] + "/buhiRecord/"), {
            date : document.getElementById("buhiDate2").value,
            amount : Number(document.getElementById("buhiPrice").value),
            recorderName : users[user.uid].name
        });

        push(ref(db, "money/" + (new Date(document.getElementById("buhiDate2").value)).getFullYear()), {
            date : document.getElementById("buhiDate2").value,
            price : Number(document.getElementById("buhiPrice").value),
            detail : "部費支払い記録による自動追加です。",
            name : "部費支払い (" + users[userKeys[editting]].name+" さん)",
            type : 2,
            liquid : true,
            userId : user.uid
        });
    }

    //役職を登録
    set(ref(db, "users/" + userKeys[editting] + "/role"), document.getElementById("role2").value)

    set(ref(db, "admin-users/" + userKeys[editting]), document.getElementById("role1").checked).then(() => {
      alert('保存しました');
    })
}

window.upload = upload;
export{upload}

//部員情報の削除
function delItem() {
    var result = confirm(users[userKeys[editting]].name + " さんの情報を完全に削除しますが、よろしいですか？");

    if(!result) {return;}

    remove(ref(db, "users/" + userKeys[editting]))
    .then(() => {
        window.location.reload();
    });
}

window.delItem = delItem;
export{delItem}

//部費情報の削除
function deleteBuhi(member, buhi) {
    var result = confirm(users[userKeys[member]].name + " さんの選択された部費支払い情報を削除しますが、よろしいですか？");

    if(!result) {return;}

    remove(ref(db, "users/" + userKeys[editting] + "/buhiRecord/" + buhiKeys[buhi]))
    .then(() => {
        window.location.reload();
    });
}

window.deleteBuhi = deleteBuhi;
export{deleteBuhi}


//部員の退部処理
function exit() {
    var result = confirm(users[userKeys[editting]].name + " さんの情報を退部させますが、よろしいですか？（名前と学籍番号のみ保持されます）");

    if(!result) {return;}

    var userData = users[userKeys[editting]];

    var setData = {
        name : userData.name,
        nameKana : userData.nameKana,
        studentNumber : userData.studentNumber,
        time : (new Date()).getTime(),
        status : 1, //status 1 : 途中退部者
        reason : "（管理者による退部処理）",
    }

    if(userData.buhiRecord) {
        setData.buhiRecord = userData.buhiRecord;
    }

    if(userData.point) {
        setData.point = userData.point;
    }

    if(userData.pointHistory) {
        setData.pointHistory = userData.pointHistory;
    }

    set(ref(db, "users/" + userKeys[editting]), setData)
    .then(() => {
        alert("退部処理をしました。");
        window.location.reload();
    });
}

window.exit = exit;
export{exit}


//部費情報を指定期間に絞って表示
function reshowBuhi() {
    var startDate = document.getElementById("startDate");
    var endDate = document.getElementById("endDate");

    if(!startDate || !endDate) {return;}

    var startDate2 = new Date(startDate.value);
    var endDate2 = new Date(endDate.value);
    buhiTotal = 0;
    var paidNum= 0;
    var notPaidNum = 0;
    var buhiUids = [];

    document.getElementById("buhiList").innerHTML = "";
    document.getElementById("buhiNotList").innerHTML = "";

    buhiList.forEach((buhi, il) => {
        var buhiDate = new Date(buhi.date);
        if(startDate2 < buhiDate && endDate2 > buhiDate) {
            document.getElementById("buhiList").innerHTML += '<li class="list-group-item">'+buhi.name+'<span class="fw-bold mx-1">￥' + Number(buhi.amount).toLocaleString() + '</span><span class="text-secondary mx-1 small">'+buhi.date+' 記録者 : '+buhi.recorderName+'</span></li>';

            buhiTotal += buhi.amount;
            paidNum ++;
            buhiUids.push(buhi.uid);
        }
    });

    Object.keys(users).forEach((key) => {
        if(users[key].status == 1 || users[key].status == 2) {
            return;
        }

        if(buhiUids.indexOf(key) == -1) {
            notPaidNum ++;
            document.getElementById("buhiNotList").innerHTML += '<li class="list-group-item">'+users[key].studentNumber+' ' + users[key].name + '<div class="small text-secondary">'+users[key].department+' '+users[key].grade+'年</div></li>';
        }
    });

    document.getElementById("notBuhiNum").textContent = notPaidNum + "人";
    document.getElementById("totalMoney").textContent = buhiTotal.toLocaleString();
    document.getElementById("buhiRatio").textContent = Math.floor(paidNum/totalMembers*1000)/10;
}

window.reshowBuhi = reshowBuhi;
export{reshowBuhi}


//ストア取引情報の表示
function openItemInfo(itemNum, num) {
    var itemKey = Object.keys(storeTasks)[itemNum];
    var NumKey = Object.keys(storeTasks[itemKey])[num];

    edittingStore = [itemKey, NumKey]

    document.getElementById("itemName").textContent = storeData[itemKey].name;
    document.getElementById("itemUserName").textContent = storeTasks[itemKey][NumKey].userName;
    document.getElementById("itemEmail").innerHTML = "<a href='mailto:"+storeTasks[itemKey][NumKey].email+"'>" + storeTasks[itemKey][NumKey].email +"</a>";
    document.getElementById("itemDate").textContent = (new Date(storeTasks[itemKey][NumKey].date)).toLocaleString();
    document.getElementById("itemMessage").textContent = storeTasks[itemKey][NumKey].message;
    document.getElementById("itemNum").textContent = storeTasks[itemKey][NumKey].num;
    document.getElementById("itemPaidPrice").textContent = storeTasks[itemKey][NumKey].paidPrice;

    if(storeTasks[itemKey][NumKey].done) {
        document.getElementById("transEnd").checked = true;
    } else {
        document.getElementById("transEnd").checked = false;
    }
}

window.openItemInfo = openItemInfo;
export{openItemInfo}

//ストア取引情報の更新
function storeUpload() {
    update(ref(db, "storePay/" + edittingStore[0] + "/" + edittingStore[1]), {
        done : document.getElementById("transEnd").checked
    }).then(() => {
        alert("保存しました。");
    });
}

window.storeUpload = storeUpload;
export{storeUpload}