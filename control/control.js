// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, onChildAdded, push, remove, set, get } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
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
var users;
var editting = -1;
var toCsvData = []; //CSV変換用のデータ
var buhiKeys = [];
var buhiList = [];
var noExit = true;

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
    user = us;
});

//読み込み時に実行
window.onload = function() {
    toCsvData = [["名前", "名前（ふりがな）", "学籍番号", "学部学科", "大学名・学部学科（他大学）", "学年", "性別", "誕生日", "電話番号", "自己PR"]];

    get(ref(db, 'users')).then((snapshot) => {
        document.getElementById("loadingControl").style.display = "none";
        users = snapshot.val();
        userKeys = Object.keys(users);
        var date = new Date();

        document.getElementById("totalMember").innerHTML = '合計 ' + userKeys.length + "人";

        Object.keys(users).forEach((key, i) => {
            if(key == "admin-users") {return;}

            //引退・退部した部員
            if(users[key].status == 1 || users[key].status == 2) {
                noExit = false;
                var role = "引退";
                if(users[key].status == 1) {role = "退部";}

                document.getElementById("exitMembers").innerHTML += '<li class="list-group-item" onclick="openInfo('+i+')" data-bs-toggle="modal" data-bs-target="#exampleModal"><h6>'+users[key].name + '<span class="badge bg-danger mx-1">'+role+'</span></h6><span class="text-secondary small mx-1">'+users[key].nameKana+' ' + users[key].studentNumber + '</span></li>';
                return;
            }

            var sex = "女性";
            if(users[key].sex == "man") {sex="男性";}

            var tags = "";
            var roles = "";
            if(users[key].fields) {
                tags = '<div class="text-primary small">';
                users[key].fields.forEach(element => {
                    tags += '<span class="mx-1">'+element+'</span>';
                });
                tags += '</div>';
            }

            if(users["admin-users"][key]) {
                roles += '<span class="badge bg-secondary mx-1">管理者</span>';
            }

            var age = 0;
            var birth = new Date(users[key].birth);
            age = Math.floor((date - birth) / (86400000 * 365));

            document.getElementById("memberList").innerHTML += '<li class="list-group-item" onclick="openInfo('+i+')" data-bs-toggle="modal" data-bs-target="#exampleModal"><h6>'+users[key].name + '<span class="text-secondary mx-1">' + users[key].studentNumber + '</span>' + roles + '</h6><div class="small text-secondary">'+users[key].department+' '+users[key].grade+'年 '+sex+' '+age+'歳</div>'+tags+'</li>'
            
            toCsvData.push([users[key].name, users[key].nameKana, users[key].studentNumber, users[key].department, users[key].otherDepart, users[key].grade, users[key].sex, users[key].birth, String(users[key].phoneNumber), users[key].detail]);


            var buhiRecords = users[key].buhiRecord;

            if(buhiRecords) {
                Object.keys(buhiRecords).forEach((key2, ib) => {
                    buhiRecords[key2].name = users[key].name;
                    buhiList = buhiList.concat(buhiRecords[key2]);
                });   
            }
        });

        console.log(buhiList);


        buhiList.sort(
            (x, y) => ((new Date(y.date)).getTime()) - ((new Date(x.date)).getTime()),
        )

        buhiList.forEach((buhi, il) => {
            document.getElementById("buhiList").innerHTML += '<li class="list-group-item">'+buhi.name+'<span class="fw-bold mx-1">￥' + Number(buhi.amount).toLocaleString() + '</span><span class="text-secondary mx-1 small">'+buhi.date+' 記録者 : '+buhi.recorderName+'</span></li>';
        });

        create_csv(toCsvData);

        //引退・退部部員がいる
        if(!noExit) {
            document.getElementById("noExit").style.display = "none";
        }
    })
    .catch((error) => {
        document.getElementById("loadingControl").style.display = "none";
        document.getElementById("errorControl").innerHTML = '<span class="text-danger small">'+error+'</span>';
    });
}

//部員情報の表示
function openInfo(i) {
    document.getElementById("mbName").textContent = users[userKeys[i]].name;
    document.getElementById("mbYomi").textContent = users[userKeys[i]].nameKana;

    if(users[userKeys[i]].status == 1 || users[userKeys[i]].status == 2) {
        document.getElementById("mbPR").textContent = users[userKeys[i]].reason;
        document.getElementById("detailTitle").textContent = "退部理由";
    } else {
        document.getElementById("mbBirth").textContent = users[userKeys[i]].birth + "生";
        document.getElementById("mbTel").textContent = users[userKeys[i]].phoneNumber;
    
        var sex = "男性";
        if(users[userKeys[i]].sex == "woman") {
            sex = "女性";
        }
    
        document.getElementById("mbSex").textContent = sex;
        document.getElementById("mbDepartment").textContent = users[userKeys[i]].department;
        document.getElementById("mbGrade").textContent = users[userKeys[i]].grade + "年生";
        document.getElementById("mbPR").textContent = users[userKeys[i]].detail;
        document.getElementById("detailTitle").textContent = "自己PR";
    }
    
    
    document.getElementById("mbStudentNumber").textContent = users[userKeys[i]].studentNumber;

    if(users["admin-users"][userKeys[i]]) {
        document.getElementById("role1").checked = true;
    } else {
        document.getElementById("role1").checked = false;
    }

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

    editting = i;
}

window.openInfo = openInfo;
export{openInfo}


//現在スタックされているデータをCSVに変換してダウンロードする
function create_csv(data){

    console.log(data);

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

//役職情報の保存
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

    if(document.getElementById("role1").checked) {
        set(ref(db, "users/admin-users/" + userKeys[editting]), true)
        .then(() => {
            //window.location.reload();
            alert("保存しました");
        });
    } else {
        set(ref(db, "users/admin-users/" + userKeys[editting]), false)
        .then(() => {
            //window.location.reload();
            alert("保存しました");
        });
    }
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