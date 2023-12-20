import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, update, push, remove, set, get } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getObj, sortMembers } from "/script/methods.js";

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

var userModal = new bootstrap.Modal(getObj('exampleModal'));

var adminusers;

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
  user = us;

  //ローディング画面
  
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
  $("#overray").fadeOut();

  //部費支払い一覧(あとでタームごとに管理できるようにする)
  var date = new Date();
  getObj("endDate").value = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
  getObj("startDate").value = "2023-04-01";

  //CSVデータ作成用
  toCsvData = [["名前", "名前（ふりがな）", "学籍番号", "学部学科", "大学名・学部学科（他大学）", "学年", "性別", "誕生日", "電話番号"]];

  //ユーザー一覧をソート:by toyton
  userKeys = sortMembers(users, Object.keys(users));

  var date = new Date();
  totalMembers = userKeys.length;

  //パラメータにIDがあれば、そのユーザーを表示
  if(getParam("id")) {
    let userIndex = userKeys.indexOf(getParam("id"));
    if(userIndex != -1) {
        openInfo(userIndex);
        userModal.show();
    }
  }

  userKeys.forEach((key, i) => {
    //引退・退部した部員
    if(users[key].status == 1 || users[key].status == 2) {
        noExit = false;
        var role = "引退";
        if(users[key].status == 1) {role = "退部";}

        totalMembers --;

        getObj("exitMembers").innerHTML += '<li class="list-group-item" onclick="openInfo('+i+')" data-bs-toggle="modal" data-bs-target="#exampleModal"><h6>'+users[key].name + '<span class="badge bg-danger mx-1">'+role+'</span></h6><span class="text-secondary small mx-1">'+users[key].nameKana+' ' + users[key].studentNumber + '</span></li>';
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
    if(!users[key].nickname) {users[key].nickname = "";}

    //リストに表示
    getObj("memberList").innerHTML += '<li class="list-group-item" onclick="openInfo('+i+')" data-bs-toggle="modal" data-bs-target="#exampleModal"><h6>'+users[key].name + '<span class="text-secondary mx-1">' + users[key].nickname + '</span>' + roles + '</h6><div class="small text-secondary">'+users[key].department+' '+users[key].grade+'年 '+sex+' '+age+'歳</div>'+tags+'</li>'
    
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
  //     getObj("buhiList").innerHTML += '<li class="list-group-item">'+buhi.name+'<span class="fw-bold mx-1">￥' + Number(buhi.amount).toLocaleString() + '</span><span class="text-secondary mx-1 small">'+buhi.date+' 記録者 : '+buhi.recorderName+'</span></li>';
  // });

  getObj("totalMoney").textContent = buhiTotal.toLocaleString();

  create_csv(toCsvData);

  //引退・退部部員がいる
  if(!noExit) {
      getObj("noExit").style.display = "none";
  }

  getObj("totalMember").innerHTML = '合計 ' + totalMembers + "人";

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
                        getObj("needTrans").innerHTML += '<li style="cursor:pointer;" data-bs-toggle="modal" data-bs-target="#transModal" class="list-group-item" onclick="openItemInfo('+index + ","+ index2 + ')"><div><span class="fw-bold">'+storeData[key].name+'<span class="text-secondary mx-1">×'+itemTask[key2].num+'</span></span></div><div class="text-secondary small">購入者：<span id="buyerName">'+itemTask[key2].userName+'</span> さん<br>購入日時：<span id="boughtDate">'+(new Date(itemTask[key2].date)).toLocaleString()+'</span></div></li>';
                    } else {
                        getObj("noExit2").style.display = "none";
                        
                        getObj("otherTransactions").innerHTML += '<li style="cursor:pointer;" data-bs-toggle="modal" data-bs-target="#transModal" class="list-group-item" onclick="openItemInfo('+index + ","+ index2 + ')"><div><span class="fw-bold">'+storeData[key].name+'<span class="text-secondary mx-1">×'+itemTask[key2].num+'</span></span></div><div class="text-secondary small">購入者：<span id="buyerName">'+itemTask[key2].userName+'</span> さん<br>購入日時：<span id="boughtDate">'+(new Date(itemTask[key2].date)).toLocaleString()+'</span></div></li>';
                    }
                });
            });
        });
    });
}

//部員情報の表示
function openInfo(i) {
    getObj("mbName").textContent = users[userKeys[i]].name;
    getObj("mbYomi").textContent = users[userKeys[i]].nameKana;

    if(users[userKeys[i]].status == 1 || users[userKeys[i]].status == 2) {
      //退部引退した人
      getObj("mbPR").textContent = users[userKeys[i]].reason;
      getObj("detailTitle").textContent = "退部理由";

      getObj("mbBirth").textContent = "---------" + "生";
      getObj("mbTel").textContent = "----------";
      getObj("mbSex").textContent = "----";
      getObj("mbDepartment").textContent = "----------";
      getObj("mbNickname").textContent = "----------";
      getObj("mbGrade").textContent = "-- 年生";
    } else {
      //在籍している人
      getObj("mbBirth").textContent = users[userKeys[i]].birth + "生";
      getObj("mbTel").textContent = users[userKeys[i]].phoneNumber;
      getObj("mbNickname").textContent = users[userKeys[i]].nickname;
  
      var sex = "男性";
      if(users[userKeys[i]].sex == "woman") { sex = "女性"; }
  
      getObj("mbSex").textContent = sex;
      getObj("mbDepartment").textContent = users[userKeys[i]].department;
      getObj("mbGrade").textContent = users[userKeys[i]].grade + "年生";
      getObj("mbPR").textContent = users[userKeys[i]].detail;
      getObj("detailTitle").textContent = "自己PR";
    }
    
    getObj("mbStudentNumber").textContent = users[userKeys[i]].studentNumber;
    getObj("role1").checked = adminusers[userKeys[i]];

    //役職を表示
    getObj("role2").value = users[userKeys[i]].role;

    if(users[userKeys[i]].buhiRecord) {
        var buhiRecord = users[userKeys[i]].buhiRecord;
        getObj("buhiRecord").innerHTML = "";

        buhiKeys = Object.keys(buhiRecord);

        Object.keys(buhiRecord).forEach((key, index) => {
            getObj("buhiRecord").innerHTML += '<li class="list-group-item"><span class="fw-bold mx-1">￥' + Number(buhiRecord[key].amount).toLocaleString() + '</span><span class="text-secondary mx-1 small">'+buhiRecord[key].date+' 記録者 : '+buhiRecord[key].recorderName+'</span><div class="position-absolute top-50 end-0 translate-middle-y"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" onclick="deleteBuhi('+i+', '+index+')" class="mx-2 bi bi-x-lg text-secondary" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z"/><path fill-rule="evenodd" d="M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z"/></svg></div></li>';
        });
    } else {
        getObj("buhiRecord").innerHTML = '<p class="text-secondary small text-center py-2 mx-1">履歴はありません</p>';
    }

    getObj("accessRecord").innerHTML = "";
    if(users[userKeys[i]].accessHistory) {
        var accessRecord = users[userKeys[i]].accessHistory;

        Object.keys(accessRecord).slice().reverse().forEach((key, index) => {
            if(index < 30) {
                getObj("accessRecord").innerHTML += (new Date(accessRecord[key].date)).toLocaleString() + " " + accessRecord[key].path + "<br>";
            }
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
    let bom  = new Uint8Array([0xef, 0xbb, 0xbf]);
    let blob = new Blob([bom, csv_string], {type: "text/csv"});
    let uri  = URL.createObjectURL(blob);

    getObj("exportBtn").href = uri;
}

//ユーザー情報の保存
function upload() {
    if(getObj("buhiPrice").value) {
        push(ref(db, "users/" + userKeys[editting] + "/buhiRecord/"), {
            date : getObj("buhiDate2").value,
            amount : Number(getObj("buhiPrice").value),
            recorderName : users[user.uid].name
        });

        push(ref(db, "money/" + (new Date(getObj("buhiDate2").value)).getFullYear()), {
            date : getObj("buhiDate2").value,
            price : Number(getObj("buhiPrice").value),
            detail : "部費支払い記録による自動追加です。",
            name : "部費支払い (" + users[userKeys[editting]].name+" さん)",
            type : 2,
            liquid : true,
            userId : user.uid
        })
        .then(() => {
            if(getObj("receipt").checked) {
                window.location.href = "receipt.html?price="+Number(getObj("buhiPrice").value)+"&given=" + Number(getObj("buhiPrice").value) + "&title="+"部費支払い (" + users[userKeys[editting]].name+" さん)";
            }
        });
    }

    //役職を登録
    set(ref(db, "users/" + userKeys[editting] + "/role"), getObj("role2").value)

    set(ref(db, "admin-users/" + userKeys[editting]), getObj("role1").checked).then(() => {
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
    var startDate = getObj("startDate");
    var endDate = getObj("endDate");

    if(!startDate || !endDate) {return;}

    var startDate2 = new Date(startDate.value);
    var endDate2 = new Date(endDate.value);
    buhiTotal = 0;
    var paidNum= 0;
    var notPaidNum = 0;
    var buhiUids = [];

    getObj("buhiList").innerHTML = "";
    getObj("buhiNotList").innerHTML = "";

    buhiList.forEach((buhi, il) => {
        var buhiDate = new Date(buhi.date);
        if(startDate2 < buhiDate && endDate2 > buhiDate) {
            getObj("buhiList").innerHTML += '<li class="list-group-item">'+buhi.name+'<span class="fw-bold mx-1">￥' + Number(buhi.amount).toLocaleString() + '</span><span class="text-secondary mx-1 small">'+buhi.date+' 記録者 : '+buhi.recorderName+'</span></li>';

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
            getObj("buhiNotList").innerHTML += '<li class="list-group-item">'+users[key].studentNumber+' ' + users[key].name + '<div class="small text-secondary">'+users[key].department+' '+users[key].grade+'年</div></li>';
        }
    });

    getObj("notBuhiNum").textContent = notPaidNum + "人";
    getObj("totalMoney").textContent = buhiTotal.toLocaleString();
    getObj("buhiRatio").textContent = Math.floor(paidNum/totalMembers*1000)/10;
}

window.reshowBuhi = reshowBuhi;
export{reshowBuhi}


//ストア取引情報の表示
function openItemInfo(itemNum, num) {
    var itemKey = Object.keys(storeTasks)[itemNum];
    var NumKey = Object.keys(storeTasks[itemKey])[num];

    edittingStore = [itemKey, NumKey]

    getObj("itemName").textContent = storeData[itemKey].name;
    getObj("itemUserName").textContent = storeTasks[itemKey][NumKey].userName;
    getObj("itemEmail").innerHTML = "<a href='mailto:"+storeTasks[itemKey][NumKey].email+"'>" + storeTasks[itemKey][NumKey].email +"</a>";
    getObj("itemDate").textContent = (new Date(storeTasks[itemKey][NumKey].date)).toLocaleString();
    getObj("itemMessage").textContent = storeTasks[itemKey][NumKey].message;
    getObj("itemNum").textContent = storeTasks[itemKey][NumKey].num;
    getObj("itemPaidPrice").textContent = storeTasks[itemKey][NumKey].paidPrice;

    if(storeTasks[itemKey][NumKey].done) {
        getObj("transEnd").checked = true;
    } else {
        getObj("transEnd").checked = false;
    }
}

window.openItemInfo = openItemInfo;
export{openItemInfo}

//ストア取引情報の更新
function storeUpload() {
    update(ref(db, "storePay/" + edittingStore[0] + "/" + edittingStore[1]), {
        done : getObj("transEnd").checked
    }).then(() => {
        alert("保存しました。");
    });
}

window.storeUpload = storeUpload;
export{storeUpload}


/**
 * Get the URL parameter value
 *
 * @param  name {string} パラメータのキー文字列
 * @return  url {url} 対象のURL文字列（任意）
 */
function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

//タブ切り替え
window.tab = index => {
  let tablist = ["member", "dashboard", "buhi", "shop", "magazine"];

  if (index == 1) { location.href = "members.html"; return; }
  if (index == 4) { location.href = "magazine.html"; return; }
  
  for (let i = 0; i < tablist.length; i++) {
    const tabname = tablist[i];
    if(index == i) { getObj(tabname).show("block"); } else { getObj(tabname).hide(); }
  }

  location.href = "#header";
}