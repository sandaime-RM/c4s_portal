import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, get, set, update, onValue, push } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getObj } from "/script/methods.js";

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

var user = {};
var c4suser = {};
var data;

var ranks;
//jsonファイルを読み込み
fetch("/script/variable.json").then((data) => { return data.json(); }).then((json) => {
  ranks = json.ranks;
});

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
  user = us;

  getObj("userPic").src = user.photoURL;
  getObj("userName").html(user.displayName);
  getObj("userEmail").html(user.email);

  get(ref(db, "users/" + user.uid)).then((snapshot) => {
    c4suser = snapshot.val();

    //部員
    if(c4suser) {
      getObj("c4suserName").html(c4suser.name);
      var roles = { leader : "部長", subleader : "副部長", treasurer : "会計", active : "現役", new : "新入部員", other : "外部" };
      getObj("c4suserRole").html(roles[c4suser.role]);
      
      onValue(ref(db, "users/" + user.uid + "/point"), (snapshot) => { repoint(snapshot.val()); });

      getObj("name").value = c4suser.name;
      getObj("nameKana").value = c4suser.nameKana;
      var genders = { man : "男性", woman : "女性", other : "その他" };
      getObj("gender").value = genders[c4suser.sex];
      getObj("birth").value = c4suser.birth;
      getObj("department").value = c4suser.department;
      getObj("grade").value = c4suser.grade;
      getObj("studentNumber").value = c4suser.studentNumber;
      getObj("phoneNumber").value = c4suser.phoneNumber;
      getObj("detail").value = c4suser.detail;

      if(c4suser.nickname) {
        getObj("nickname").value = c4suser.nickname;
      }
    }
    //外部
    else {

    }

    //部費支払い記録表時
    if(c4suser.buhiRecord) {
      var buhiRecord = c4suser.buhiRecord;
      document.getElementById("buhiRecord").innerHTML = "";

      Object.keys(buhiRecord).forEach((key, index) => {
          document.getElementById("buhiRecord").innerHTML += '<li class="list-group-item"><span class="fw-bold mx-1">￥' + Number(buhiRecord[key].amount).toLocaleString() + '</span><span class="text-secondary mx-1 small">'+buhiRecord[key].date+' 記録者 : '+buhiRecord[key].recorderName+'</span></li>';
      });
    } else {
        document.getElementById("buhiRecord").innerHTML = '<p class="text-secondary small text-center py-2 mx-1">履歴はありません</p>';
    }

    //イベント出席記録表時
    if(c4suser.attend) {
        var attends = c4suser.attend;
        document.getElementById("attendHistory").innerHTML = "";

        Object.keys(attends).forEach((key, index) => {
            document.getElementById("attendHistory").innerHTML += '<li class="list-group-item"><span class="fw-bold mx-1">' + attends[key].title + '</span><span class="text-secondary mx-1 small">'+(new Date(attends[key].date)).toLocaleString()+'</span></li>';
        });
    } else {
        document.getElementById("attendHistory").innerHTML = '<p class="text-secondary small text-center py-2 mx-1">履歴はありません</p>';
    }

    //ストア購入履歴
    var storeHistory = c4suser.storeHistory;
    if(storeHistory) {
      document.getElementById("storeHistory").innerHTML = "";

      Object.keys(storeHistory).forEach((key, index) => {
        document.getElementById("storeHistory").innerHTML += '<li class="list-group-item"><span class="fw-bold mx-1">' + storeHistory[key].itemName + '<span class="text-secondary mx-1">×'+storeHistory[key].num+'</span></span><span class="text-secondary mx-1 small">'+(new Date(storeHistory[key].date)).toLocaleString()+'</span></li>';
      });
    }
    
    $("#overray").fadeOut();
  });

});

//プロフィールのポイント画面を更新(トップページから移植)
function repoint(amount) {
  c4suser.point = amount;
  getObj("pointnum").innerText = amount;
  var ranknum = ranks.basis.length - 1;
  //0以下または未定義なら0にリセット
  if ( amount < ranks.basis[0] || !amount) { set(ref(db, "users/" + user.uid + "/point"), 0); amount = 0; }
  //最高ランクなら最高ランク表示にする
  if ( ranks.basis.slice(-1)[0] <= amount ) {
    getObj("pointbar" + String(ranks.name.length - 1)).style.width = "100%";
    getObj("pointbar" + String(ranks.name.length - 1)).style.display = "block";
    getObj("pointbar" + String(ranks.name.length - 1)).style.backgroundColor = ranks.color[ranknum];
    getObj("restpoint").innerHTML = '<p style="color: darkred;">最高ランク会員</p>';
    for (let i = 0; i < ranks.name.length - 1; i++) {
      getObj("pointbar" + String(i)).style.display = "none";
    }
  }
  //それ以外ならランク番号を取得
  else{
    getObj("pointbar" + String(ranks.name.length - 1)).style.display = "none";
    for (let i = 0; i < ranks.basis.length; i++) { if(ranks.basis[i] <= amount) { ranknum = i; } }
    getObj("restpoint").innerHTML = '<p>' + ranks.name[ranknum+1] + 'まであと<span style="color: darkred; font-weight: bold;">' + String(ranks.basis[ranknum+1] - amount) + '</span>pt</p>';
    for (let i = 0; i < ranks.color.length - 1; i++) {
      var bar = getObj("pointbar" + String(i));
      bar.style.backgroundColor = ranks.color[i];
      var ratio = (amount - ranks.basis[i]) / ranks.basis.slice(-1)[0];
      ratio = Math.max(ratio, 0);
      ratio = Math.min(ratio, (ranks.basis[i+1] - ranks.basis[i]) / ranks.basis.slice(-1)[0]);
      bar.style.width = String(ratio * 100) + "%";
      bar.style.display = "block";
    }
  }
  getObj("ranktext").innerText = ranks.name[ranknum];
  getObj("ranktext").style.backgroundColor = ranks.color[ranknum];
}

//部員情報の更新ボタンが押されたとき
window.upload = function upload () {  
  let grade = Number(getObj("grade").value);
  let phoneNumber = getObj("phoneNumber").value;
  let detail = getObj("detail").value;
  let nickname = getObj("nickname").value;

  //不備チェック
  if(!grade || grade < 1) { 
    alert("学年を正しく入力してください"); return;
  }
  if(!phoneNumber) {
    alert("電話番号は必須です"); return;
  }

  //特に変更なければ何もしない
  if(grade == c4suser.grade && phoneNumber == c4suser.phoneNumber && detail == c4suser.detail && nickname == c4suser.nickname) {
    return;
  }

  update(ref(db, "users/" + user.uid), {
    grade : grade,
    phoneNumber : phoneNumber,
    detail : detail,
    nickname : nickname
  })
  .then(() => {
    alert("保存しました"); location.reload();
  });

  // set(ref(db, "users/" + user.uid + "/grade"), grade).then(() => {
  //   set(ref(db, "users/" + user.uid + "/phoneNumber"), phoneNumber).then(() => {
  //     set(ref(db, "users/" + user.uid + "/detail"), detail).then(() => {
  //       alert("保存しました"); location.reload(); 
  //     })
  //   })
  // })
}

//その他の情報を更新
window.offer = function offer () {
  let ans = confirm("変更申請を送信しますか？");
  if(ans) { 
    push(ref(db, "notice"), {
      title : "部員情報の変更申請",
      content : c4suser.name + "さんが部員情報を変更するようです。ここをクリックしてメールを送信し、変更する情報を確認してください。",
      target : "admin",
      time : new Date().getTime(),
      dead : new Date().getTime() + 1000 * 60 * 60 * 24 * 30,
      link : "mailto:" + c4suser.studentNumber + "@ed.tus.ac.jp"
    }).then(() => {
      alert("送信しました。");
    })
  }
}