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
      if(location.hostname == "localhost") { console.warn("ローカル環境です。入部ボタンは押下しないでください。"); }

      getObj("input-alert").hide();
      getObj("belong-tus").onclick = function tus() {
        getObj("department-tab").show();
        getObj("department-free-tab").hide();
      }
      getObj("belong-other").onclick = function other() {
        getObj("department-tab").hide();
        getObj("department-free-tab").show();
      }
      getObj("phoneNumber").value = user.phoneNumber;
      getObj("grade").value = 1;

      getObj("loading-overray").hide();
      $("#overray").fadeOut(2000);
    }
  });
});

//部員情報アップロード
export function upload() {
  //値の代入
  var data = {};

  data.name = getObj("name").value;
  data.nameKana = getObj("nameKana").value;
    if(getObj("gender-man").checked) { data.sex = "man"; }
    else if(getObj("gender-woman").checked) { data.sex = "woman"; }
    else if(getObj("gender-other").checked) { data.sex = "other"; }
  data.birth = getObj("birth").value;
    if(getObj("belong-tus").checked) {
      data.department = getObj("department").options[getObj("department").selectedIndex].text;
      data.departmentIndex = getObj("department").selectedIndex;
    }
    else {
      data.department = getObj("department-free").value; 
      data.departmentIndex = -1;
    }
  data.grade = Number(getObj("grade").value);
  data.studentNumber = getObj("studentNumber").value;
  data.phoneNumber = getObj("phoneNumber").value;
  data.detail = getObj("detail").value;

  data.role = "new";
  data.time = new Date().getTime();

  //不備チェック
  try {
    if(data.name) { getObj("name-alert").html = ""; } else { getObj("name-alert").html = "入力されていません"; e("name is null"); }
    if(data.nameKana) { getObj("nameKana-alert").html = ""; } else { getObj("nameKana").html = "入力されていません"; e("nameKana is null"); }
    if(data.sex) { getObj("gender-alert").html = ""; } else { getObj("gender-alert").html = "選択してください"; e("gender is not selected"); }
    if(data.birth) { getObj("birth-alert").html = ""; } else { getObj("birth-alert").html = "入力されていません"; e("birth is null"); }
    if(getObj("belong-tus").checked && data.departmentIndex == 33) { getObj("department-alert").html = "選択されていません"; e("department is null"); }
      else { getObj("department-alert").html = ""; }
    if(getObj("belong-other").checked && !data.department) { getObj("department-free-alert").html = "入力されていません"; e("department is null"); }
      else { getObj("department-free-alert").html = ""; }
    if(0 < data.grade) { getObj("grade-alert").html = ""; } else { getObj("grade-alert").html = "正しく入力されていません"; e("undefined grade"); }
    if(data.studentNumber) { getObj("studentNumber-alert").html = ""; } else { getObj("studentNumber-alert").html = "入力されていません"; e("student number is null"); }
    if(data.phoneNumber) { getObj("phoneNumber-alert").html = ""; } else { getObj("phoneNumber-alert").html = "入力されていません"; e("phone number is null"); }
    if(data.detail) { getObj("detail-alert").html = ""; } else { getObj("detail-alert").html = "必須項目です"; e("detail is null"); }
    function e (msg) { throw new Error(msg); }
  } catch (msg) { getObj("input-alert").show(); window.scroll({ top : 0 }); console.error(msg); return; }

  //アップロード処理
  $("#saving").fadeIn();
  if(location.hostname == "localhost") {
    console.table(data);
    setTimeout(() => {
      window.location.href = "join2.html";
    }, 6500);
  }
  else {
    set(ref(db, "users/" + user.uid), data).then(() => {
      setTimeout(() => {
        window.location.href = "join2.html";
      }, 6500);
    });
  }
}
window.upload = upload;