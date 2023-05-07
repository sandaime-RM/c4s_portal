// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getStorage, ref as ref_st, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-storage.js";
import { getDatabase, ref, get, set, update, push } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
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
var user, storeData;
var editting = -1;

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
    user = us;
    restart();
});


window.onload = function() {
    restart();
}

//商品情報の読み込み
function restart() {

    get(ref(db, "store")).then((snapshot) => {
        storeData = snapshot.val();
        document.getElementById("loadingStore").style.display = "none";
        document.getElementById("itemList").innerHTML = "";

        Object.keys(storeData).forEach((key, index) => {
            var priceText = "￥" + storeData[key].price;
            if(storeData[key].payType == 0) {
                priceText = storeData[key].price + " pt";
            }

            if(storeData[key].img) {
                storeData[key].urls = [];

                storeData[key].img.forEach(function(img, index2) {
                    const gsReference = ref_st(storage, "store/" + img);
            
                    getDownloadURL(gsReference)
                    .then(async function(url) {
                        storeData[key].urls.push(url);
                        if(index2 == 0) {
                            document.getElementById("img_" + index).src = url;
                        }
                    })
                    .catch((err) => console.log(err));
                });
            }
            
            document.getElementById("itemList").innerHTML += '<div class="card shadow-sm mx-2 my-2" style="width: 18rem; cursor: pointer;"><img id="img_'+index+'" class="card-img-top" alt="..."><div class="card-body"><h5 class="card-title">'+storeData[key].name+'</h5><p class="card-text small mb-1">'+storeData[key].detail+'</p><div class="text-end fw-bold fs-5 mb-2">'+priceText+'</div></div></div>';
        });
    });
}

//商品のアップロード
function upload() {
    var name = document.getElementById("title");
    var price = document.getElementById("price");
    var payType = document.getElementById("type");
    var mode = document.getElementById("buyRent");
    var num2 = document.getElementById("num");
    var detail = document.getElementById("detail");
    var tag = document.getElementById("tag").value.split(" ");
    var img = document.getElementById("img");
    var fileNames = [];
    var date = new Date()
    var finishDb = false;
    var finishPic = false;

    Object.keys(img.files).forEach((key, index) => {
        fileNames.push(date.getTime() + "_" + index + "_" + img.files[key].name);
    });

    var files = img.files;

    if(files.length != 0) {
        var num = 0;

        for(let file of files) {
            console.time();
            //圧縮処理
            new Compressor(file, {
                // Compressorのオプション
                maxHeight: 1000,
                convertSize: Infinity,
                success(result) {
                    console.timeEnd()
                    console.log(result)

                    //アップロード処理
                    const fr = new FileReader()
                    fr.readAsArrayBuffer(result)
                    fr.onload = function() {
                        // you can keep blob or save blob to another position
                        const blob = new Blob([fr.result]);

                        uploadBytes(ref_st(storage, 'store/' + fileNames[num]), blob).then((snapshot) => {
                            num ++;

                            console.log("画像アップロード状況 ("+ num + "/" + files.length +")");
                            if(num == files.length) {
                                finishPic = true;

                                if(finishDb && finishPic) {
                                    window.location.reload();
                                }
                            }
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                    }
                },
                error(err) {
                // エラー時のメッセージ
                console.log(err.message);
                },
            });
            
        };
    } else {
        finishPic = true;
    }


    //データベースへのアップロード
    var setData = {
        name : name.value,
        price : Number(price.value),
        payType : payType.selectedIndex,
        mode : mode.selectedIndex,
        num : Number(num2.value),
        detail : detail.value,
        tag : tag,
        img : fileNames
    };

    if(editting == -1) {
        push(ref(db, "store"), setData)
        .then(() => {
            finishDb = true;

            if(finishDb && finishPic) {
                window.location.reload();
            }
        });
    }
}

window.upload = upload;
export{upload}

//フォームをクリア
function clearForm() {
    var name = document.getElementById("title");
    var price = document.getElementById("price");
    var payType = document.getElementById("type");
    var mode = document.getElementById("buyRent");
    var num2 = document.getElementById("num");
    var detail = document.getElementById("detail");
    var tag = document.getElementById("tag").value.split(" ");
    var img = document.getElementById("img");

    name.value = "";
    detail.value = "";
    tag.value = "";
    img.value = null;
    price.value = null;
    num2.value = null;
    payType.selectedIndex = 0;
    mode.selectedIndex = 0;
}

window.clearForm = clearForm;
export{clearForm}