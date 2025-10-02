import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, push, remove, set, get, update } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getStorage, ref as ref_st, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-storage.js";
import { getObj, DateText } from "/script/methods.js";

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
const storage = getStorage();

var user;
var docData;
var urls = [];
var docs = {};

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
  user = us;
});

$(function () {
  get(ref(db, "document")).then((snapshot) => {
    let data = snapshot.val();
    Object.keys(data).forEach((key) => {
      var info = data[key]
      getObj("docsList").head('<div class="w-95 mx-auto shadow-sm bg-white rounded-md p-4 mb-3 position-relative"><h5 class="mb-0">' + info.title + '</h5><p class="text-muted mb-0">' + DateText(new Date(info.date)) + '</p><p class="text-justify">' + info.detail + '</p><div class="rounded-sm border py-1 px-4 hover pointer" onclick="openFile(\'' + key + '\')"><h5 class="lh-lg mb-0" style="white-space: nowrap; overflow: clip;"><i class="bi bi-file-pdf text-danger"> </i>' + info.file + '</h5></div><h5 style="top: 10%; right: 7%;" class="adminonly position-absolute bi bi-pencil-square pointer text-secondary" onclick="edit(\'' + key + '\')"></h5></div>');

      getDownloadURL(ref_st(storage, "document/" + info.file)).then((URL) => { docs[key] = URL; });
    });

    /*
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

    });
    */
  }).then(() => { $("#overray").fadeOut(); })
  .catch((error) => {
    document.getElementById("errorDoc").innerHTML = error;
    document.getElementById("loading").style.display = "none";
  });
});

//ファイルをひらく
window.openFile = function openFile (key) {
  location.href = docs[key];
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
//window.openFile = function openFile(index) { document.location.href = urls[index]; }