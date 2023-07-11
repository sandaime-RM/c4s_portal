import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, get, set, push } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
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

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
  user = us;
  window.scroll({ top : 0 });

  get(ref(db, "users/" + user.uid)).then((snapshot) =>{
    //部員登録済みはバイバイ
    if(snapshot.val() && location.hostname != "localhost") {
      alert("既に入部手続きを終えています。部員情報の更新は、アカウント画面からお願いします。");
      window.location.href = "/account";
    }
    //部員でない人ならスタート
    //ローカル環境のときも一応スタートさせる
    else {
      getObj("loading-overray").hide();
      $("#overray").fadeOut(2000);
    }
  });
});

//部員情報アップロード
function upload() {

    var name = document.getElementById("name");
    var nameKana = document.getElementById("nameKana");
    var detail = document.getElementById("detail");
    var number = document.getElementById("schoolNumber");
    var birth = document.getElementById("birth");
    var department = document.getElementById("department");
    var grade = document.getElementById("grade");
    var sex = document.getElementById("sex");
    var phoneNumber = document.getElementById("phoneNumber");
    var otherDepart = document.getElementById("otherDepart");

    var defective = false;
    var errorList = ""

    //空欄だったらエラー
    if(name.value == "") {defective = true; errorList += "氏名 ";}
    if(nameKana.value == "") {defective = true; errorList += "氏名（よみがな） ";}
    if(number.value == "") {defective = true; errorList +="学籍番号 ";}
    if(birth.value == "") {defective = true; errorList +="生年月日 ";}
    if(!grade.value) {defective = true; errorList += "学年 ";}
    if(phoneNumber.value == "") {defective = true; errorList += "電話番号 ";}

    if(defective) {
        document.getElementById("errorText").textContent = errorList;
        document.getElementById("error").style.display = "";

        return;
    }

    if(!user) {
        errorList += "未ログイン";
        document.getElementById("errorText").textContent = errorList;
        document.getElementById("error").style.display = "";
        return;
    }

    document.getElementById("Passed");

    set(ref(db, "users/" + user.uid), {
        name : name.value,
        nameKana : nameKana.value,
        detail : detail.value,
        studentNumber : number.value,
        birth : birth.value,
        grade : Number(grade.value),
        department : department.options[department.selectedIndex].text,
        departmentIndex : department.selectedIndex,
        sex : gender.value,
        otherDepart : otherDepart.value,
        phoneNumber : phoneNumber.value,
        time : (new Date()).getTime()
    })
    .then(() => {
        window.location.href = "join2.html";
    });
}

window.upload = upload;
export{upload}