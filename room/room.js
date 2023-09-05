// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, push, remove, set, get, update } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
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
var roomData;
var roomIds = [];
var editting = -1; //編集中の予約情報（-1の場合はなし）

//HTML要素
var bookList = document.getElementById("bookList");
var bookListFuture = document.getElementById("bookListFuture");
var editModal = new bootstrap.Modal(document.getElementById('exampleModal'));


//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
    user = us;

    //予約状況の取得
    get(ref(db, "rooms")).then((snapshot) => {
        roomData = snapshot.val();
        var dateNow = new Date();
        var pastNum = 0;
        var yesterday = new Date();
        yesterday.setDate( yesterday.getDate() -1 )
        var tomorrow = new Date();
        tomorrow.setDate( tomorrow.getDate() + 1 );

        //予約データを１つずつ表示
        Object.keys(roomData).slice().reverse().forEach((key, index) => {
            var room = roomData[key];
            var rdate = new Date(room.date);
            
            if(dateNow > rdate) {
                pastNum ++;
            }

            //これからのデータすべてと、過去のデータは最新20件を表示
            if(pastNum <= 20 || dateNow <= rdate) {
                var date = ('0' + (rdate.getMonth() + 1)).slice(-2) + "/" + ('0' + (rdate.getDate())).slice(-2);
                var dateCol = "dark";
                var status = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="my-1 bi bi-dash-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM4.5 7.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1h-7z"/></svg><div class="small">申請中</div>';
                var color = "secondary";
    
                //状態表示
                if(room.status == 1) {
                    color = "success"
                    status = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="my-1 bi bi-check-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg><div class="small">予約済</div>';
                }
    
                if(room.status == 2) {
                    color = "danger"
                    status = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="my-1 bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg><div class="small">不可</div>';
                }
    
                //表示
                if(yesterday > rdate) {
                    bookList.innerHTML += '<li class="list-group-item" style="cursor: pointer;" onclick="edit('+index+')"><div class="row"><div class="col-4"><div class="fs-5 fw-bold">'+date+'</div><div class="small">'+room.start+'～'+room.end+'</div></div><div class="col-5"><div class="fs-5 fw-bold">'+room.building+'</div><div>'+room.roomNum+'</div></div><div class="col-3 text-'+color+' text-center">'+status+'</div></div></li>';
                } else {
                    console.log(dateNow.getMonth(), dateNow.getDate())
                    console.log(rdate.getMonth(), rdate.getDate())
                    console.log(dateNow.getMonth() == rdate.getMonth(), rdate.getDate() == dateNow.getDate());

                    if(dateNow.getMonth() == rdate.getMonth() && rdate.getDate() == dateNow.getDate()) {
                        dateCol = "danger";
                        date = "今日";
                    }

                    if(tomorrow.getMonth() == rdate.getMonth() && rdate.getDate() == tomorrow.getDate()) {
                        date = "明日";
                    }
    
                    bookListFuture.innerHTML += '<li class="list-group-item" style="cursor: pointer;" onclick="edit('+index+')"><div class="row"><div class="col-4"><div class="fs-5 fw-bold text-'+dateCol+'">'+date+'</div><div class="small">'+room.start+'～'+room.end+'</div></div><div class="col-5"><div class="fs-5 fw-bold">'+room.building+'</div><div>'+room.roomNum+'</div></div><div class="col-3 text-'+color+' text-center">'+status+'</div></div></li>';
                }
            }
            
            roomIds.push(key);
        });
    });
});

//アップロード
function upload() {
    if(editting == -1) {
        push(ref(db, "rooms"), {
            date : (new Date(document.getElementById("rdate").value)).getTime(),
            start : document.getElementById("rstart").value,
            end : document.getElementById("rend").value,
            building : document.getElementById("rbuilding").value,
            roomNum : document.getElementById("rroomNum").value,
            status : document.getElementById("rstatus").selectedIndex
        })
        .then(() => {
            window.location.reload();
        });
    } else {
        set(ref(db, "rooms/" + roomIds[editting]), {
            date : (new Date(document.getElementById("rdate").value)).getTime(),
            start : document.getElementById("rstart").value,
            end : document.getElementById("rend").value,
            building : document.getElementById("rbuilding").value,
            roomNum : document.getElementById("rroomNum").value,
            status : document.getElementById("rstatus").selectedIndex
        })
        .then(() => {
            window.location.reload();
        });
    }
    
}

window.upload = upload;
export{upload}

//編集画面の表示
function edit(index) {
    var room = roomData[roomIds[index]];
    editting = index;

    document.getElementById("rdate").value = (new Date(room.date)).getFullYear() + "-" + ('0' + ((new Date(room.date)).getMonth() + 1)).slice(-2) + "-" + ('0' + (new Date(room.date)).getDate()).slice(-2);
    document.getElementById("rbuilding").value = room.building;
    document.getElementById("rroomNum").value = room.roomNum;
    document.getElementById("rstart").value = room.start;
    document.getElementById("rend").value = room.end;
    document.getElementById("rstatus").selectedIndex = room.status;
    editModal.show();
}

window.edit = edit;
export{edit}


//編集画面の初期化
function clearForm() {
    document.getElementById("rdate").value = "";
    document.getElementById("rbuilding").value = "講義棟";
    document.getElementById("rroomNum").value = "K409";
    document.getElementById("rstart").value = "18:00";
    document.getElementById("rend").value = "21:00";
    document.getElementById("rstatus").selectedIndex = 0;
}

window.clearForm = clearForm;
export{clearForm}


//予約情報の削除
function delItem() {
    if(editting == -1) {return;}

    var conf = confirm("この予約情報を削除しますか？");
    if(!conf) {return;}

    remove(ref(db, "rooms/" + roomIds[editting]))
    .then(() => {
        window.location.reload();
    })
}

window.delItem = delItem;
export{delItem}