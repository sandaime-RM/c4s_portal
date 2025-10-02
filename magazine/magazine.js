import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getDatabase, ref, push, remove} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getObj, Obj, sortMembers } from "/script/methods.js";

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

//Modal
const modal = new bootstrap.Modal(document.getElementById('exampleModal'))

//メルマガ登録
function register() {
    //入力エラーチェック
    if(getObj("name").value == "") {
        alert("名前を入力してください。");
        return;
    }

    if(getObj("email").value == "" || getObj("email").value.indexOf("@") == -1) {
        alert("メールアドレスを正しく入力してください。");
        return;
    }

    //登録
    push(ref(db, "magazine/followers"), {
        name : getObj("name").value,
        email : getObj("email").value
    })
    .then(() => {
        console.log("Registration was done.");
        modal.show();
    })
}

window.register = register;
export{register}