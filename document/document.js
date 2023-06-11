// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, push, remove, set, get, update } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getStorage, ref as ref_st, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-storage.js";
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
const storage = getStorage();
var user;
var docData;
var urls = [];

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
    user = us;
});

window.onload = function() {
    get(ref(db, "document")).then((snapshot) => {
        document.getElementById("loading").style.display = "none";

        docData = snapshot.val();

        Object.keys(docData).forEach((key, index) => {
            var data = docData[key];

            const gsReference = ref_st(storage, "document/" + data.file);
    
            getDownloadURL(gsReference)
            .then(async function(url) {
                urls[index] = url;
            })
            .catch((err) => console.log(err));

            document.getElementById("documents").innerHTML = '<div class="card shadow-sm m-2 p-1" style="width: 18rem;"><div class="card-body"><h5 class="card-title">'+data.title+'</h5><h6 class="card-subtitle mb-2 text-muted">'+(new Date(data.date)).toLocaleString()+'</h6><p class="card-text small">'+data.detail+'</p><div class="m-1 px-0 py-2 row border rounded-3" style="cursor:pointer;" onclick="openFile('+index+')"><div class="col-2 text-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" style="color:#de0909" class="bi bi-file-earmark-pdf" viewBox="0 0 16 16"><path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/><path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193 11.744 11.744 0 0 1-.51-.858 20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822.024.111.054.227.09.346z"/></svg></div><div class="col-10 fw-bold">'+data.file+'</div></div><div class="position-absolute top-0 end-0 pe-2 pt-1" style="cursor: pointer;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-secondary bi bi-three-dots-vertical" viewBox="0 0 16 16"><path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg></div></div></div>' + document.getElementById("documents").innerHTML;
        });
    })
    .catch((error) => {
        document.getElementById("errorDoc").innerHTML = error;
        document.getElementById("loading").style.display = "none";
    });
}

//ファイルが変更された場合
function fileChanged() {
    var title = document.getElementById("title");
    var file = document.getElementById("file");

    if(title.value == "") {
        console.log(file.files[0].name);
        title.value = file.files[0].name.slice( 0, -4 );
    }
}

window.fileChanged = fileChanged;
export{fileChanged}


//アップロード
function upload() {
    var file = document.getElementById("file");

    if(!user) {alert("ログインが必須です。"); return;}

    //アップロード処理
    const fr = new FileReader()
    fr.readAsArrayBuffer(file.files[0])
    fr.onload = function() {
        // you can keep blob or save blob to another position
        const blob = new Blob([fr.result]);

        uploadBytes(ref_st(storage, 'document/' + file.files[0].name), blob).then((snapshot) => {
            push(ref(db, "document/"), {
                date : (new Date()).getTime(),
                user : user.displayName,
                file : file.files[0].name,
                title : document.getElementById("title").value,
                detail : document.getElementById("detail").value
            })
            alert("アップロード完了");
            window.location.reload();
        })
        .catch((error) => {
            console.error(error);
            document.getElementById("errorDoc").innerHTML = error;
        });
    }
}

window.upload = upload;
export{upload}

//ファイルを開く
function openFile(index) {
    document.location.href = urls[index];
}

window.openFile = openFile;
export{openFile}