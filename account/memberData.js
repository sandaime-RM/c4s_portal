// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
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

    set(ref(db, "users/" + user.uid), {
        name : name.value,
        nameKana : nameKana.value,
        detail : detail.value,
        studentNumber : number.value,
        birth : birth.value,
        grade : Number(grade.value),
        department : department.options[department.selectedIndex].text,
        departmentIndex : department.selectedIndex,
        sex : sex.value,
        phoneNumber : phoneNumber.value,
        otherDepart : otherDepart.value,
        time : (new Date()).getTime()
    })
    .then(() => {
        alert("更新しました。");
    });
}

window.upload = upload;
export{upload}

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
    user = us;

    var name = document.getElementById("name");
    var nameKana = document.getElementById("nameKana");
    var detail = document.getElementById("detail");
    var number = document.getElementById("schoolNumber");
    var birth = document.getElementById("birth");
    var department = document.getElementById("department");
    var grade = document.getElementById("grade");
    var sex = document.getElementById("sex");
    var accountName = document.getElementById("userName");
    var accountIcon = document.getElementById("userIcon");
    var accountEmail = document.getElementById("userEmail");
    var phoneNumber = document.getElementById("phoneNumber");
    var otherDepart = document.getElementById("otherDepart");

    accountName.textContent = user.displayName;
    accountIcon.src = user.photoURL;
    accountEmail.textContent = user.email;

    get(ref(db, 'users/' + user.uid)).then((snapshot) => {
        var data = snapshot.val();

        phoneNumber.value = data.phoneNumber;
        name.value = data.name;
        nameKana.value = data.nameKana;
        detail.value = data.detail;
        number.value = data.studentNumber;
        birth.value = data.birth;
        grade.value = data.grade;
        otherDepart.value = data.otherDepart;
        department.selectedIndex = data.departmentIndex;
        sex.value = data.sex;

        if(data.buhiRecord) {
            var buhiRecord = data.buhiRecord;
            document.getElementById("buhiRecord").innerHTML = "";
    
            Object.keys(buhiRecord).forEach((key, index) => {
                document.getElementById("buhiRecord").innerHTML += '<li class="list-group-item"><span class="fw-bold mx-1">￥' + Number(buhiRecord[key].amount).toLocaleString() + '</span><span class="text-secondary mx-1 small">'+buhiRecord[key].date+' 記録者 : '+buhiRecord[key].recorderName+'</span></li>';
            });
        } else {
            document.getElementById("buhiRecord").innerHTML = '<p class="text-secondary small text-center py-2 mx-1">履歴はありません</p>';
        }
    });
});