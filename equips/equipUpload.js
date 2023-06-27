import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, onChildAdded, push, remove, set, get } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getStorage, ref as ref_st, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-storage.js";
import { getObj } from "/script/methods.js"

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
var user, data;
var equips = [];
var equipKeys = [];
var equipNum = 0;
var editting = -1;
const storage = getStorage(app);
const categories = 10; //カテゴリーの数
const categoryNames = ["書籍", "電子工作", "映像・写真", "3Dプリンター", "ケーブル・アダプタ", "部室用インテリア", "工具", "音響", "VR", "工作"];
var catSelected = Array(categoryNames.length).fill(false);
var loadingEquips = document.getElementById("loadingEquips");
var urls = [];

var photoModal = new bootstrap.Modal(document.getElementById('photoModal'))

//備品追加時に実行
window.onload = function() {
  //カテゴリボタンを設置
  for (let i = 0; i < categoryNames.length; i++) {
    getObj("cats").tail('<h6 id="cat' + i + '">' + categoryNames[i] + '</h6>')
    getObj("cat" + i).setAttribute("class", "unclicked");

    //onclick属性を追加
    getObj("cat" + i).setAttribute("onclick", "setcats(" + i + ")")
  }

  //リストの表示
  get(ref(db, 'equips')).then((snapshot) => {
    data = snapshot.val();

    loadingEquips.style.display = "none";
    
    //カテゴリを設定かつ画像を設定
    Object.keys(data).forEach((key) => {
      data[key].cat = -1;
      var imgname;
      var equipname = data[key].name;
      for (let i = 0; i < categoryNames.length; i++) {
        if(data[key].category[i]) { data[key].cat = i; imgname = "cat" + String(i); break; }
      }
      if (data[key].cat == -1) { imgname = "noimage"; } 
      if (data[key].number != 1) { equipname += "(x" + String(data[key].number) + ")"; }
      getObj("list").tail('<div class="col-lg-6 mb-1" style="display: flex;" id="equip' + key + '"><img class="rounded-3" src="cats/' + imgname + '.svg" style="width: 100px; height: 100px;"><div class="px-3" style="height: 100px;"><h5>' + equipname + '</h5><p class="mb-0">' + data[key].detail + '</p></div></div>');
    })

    getObj("equipLoader").hide();
    getObj("overray").hide();
  });

  //カテゴリ切り替え
  function setcats (i) {
    //いったん全部消してロード画面
    getObj("equipLoader").show();
    Object.keys(data).forEach((key) => { getObj("equip" + key).hide(); })

    //変数の書き換え
    catSelected[i] = !catSelected[i];
    //HTML上での表示切替
    if(catSelected[i]) { getObj("cat" + i).setAttribute("class", "clicked"); }
    else { getObj("cat" + i).setAttribute("class", "unclicked"); }

    //表示するcatの番号リスト
    var displays = [];
    for (let i = 0; i < categoryNames.length; i++) {
      if(catSelected[i]) { displays.push(i); }
    }
    //それぞれの要素に対して表示・非表示の設定
    Object.keys(data).forEach((key) => { 
      var display = false;
      if(displays[0] === undefined) { display = true; }
      else {
        displays.forEach((n) => {
          if(data[key].category[n]) { display = true; }
        })
      }
      if(display) { getObj("equip" + key).style.display = "flex"; }
    })

    //ロードを消して表示させる
    getObj("equipLoader").hide();
  }
  window.setcats = setcats;
}


//備品情報アップロード
function upload() {
    document.getElementById("uploading").style.display = "";

    var name = document.getElementById("name");
    var detail = document.getElementById("detail");
    var number = document.getElementById("number");
    var place = document.getElementById("place");
    var category = [];
    var finishPic = false;
    var finishDb = false;

    if(name == "") {alert("名称くらいは入力してよ！怒"); return;}

    for(var i = 1; i <= categories; i++) {
        if(document.getElementById("flexCheck" + i).checked) {
            category[i-1] = true;
        } else {
            category[i-1] = false;
        }
    }

    //画像の圧縮＆アップロード
    var files = document.getElementById("itemImage").files;
    var fileNameTop = (new Date()).getTime();
    var fileNames = [];

    for(var i=0; i<files.length; i++) {
        fileNames[i] = 'equips/' + fileNameTop + "_" + files[i].name;
    }

    if(editting != -1) {
        fileNames = fileNames.concat(equips[editting].imgs);
    }

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

                        uploadBytes(ref_st(storage, 'equips/' + fileNames[num]), blob).then((snapshot) => {
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

    var setData = {
        name : name.value,
        detail : detail.value,
        number : Number(number.value),
        place : place.value,
        userId : user.uid,
        time : (new Date()).getTime(),
        category : category,
        imgs : fileNames
    };

    //更新か追加か
    if(editting == -1) {
        push(ref(db, "equips"), setData)
        .then (() => {
            finishDb = true;
            if(finishDb && finishPic) {
                window.location.reload();
            }
        });
    } else {
        set(ref(db, 'equips/' + equipKeys[editting]), setData)
        .then (() => {
            finishDb = true;
            if(finishDb && finishPic) {
                window.location.reload();
            }
        });
    }
}

window.upload = upload;
export{upload}

//ユーザー情報の取得
onAuthStateChanged(auth, (us) => {
    user = us;
});

//備品情報の表示
function openInfo(num) {
    var name = document.getElementById("name");
    var detail = document.getElementById("detail");
    var number = document.getElementById("number");
    var place = document.getElementById("place");

    name.value = equips[num].name;
    detail.value = equips[num].detail;
    place.value = equips[num].place;
    number.value = equips[num].number;

    for(var i=1; i<=categories; i++) {
        document.getElementById("flexCheck"+i).checked = equips[num].category[i-1];
    }

    //画像表示
    document.getElementById("imgs").innerHTML = "";
    
    if(equips[num].imgs) {
        
        equips[num].imgs.forEach(function(img, index) {

            const gsReference = ref_st(storage, "equips/" + img);
    
            getDownloadURL(gsReference)
            .then(async function(url) {
                urls[index] = url;
                document.getElementById("imgs").innerHTML += "<img src='"+url+"' style='max-width:130px; max-height: 220px; object-fit: contain;' class='border rounded' onclick='openLargePhoto("+index+")'>";
            })
            .catch((err) => console.log(err));
        });
    }
    
    editting = num;
}

window.openInfo = openInfo;
export{openInfo}

//フォームの初期化
function clearForm() {
    var name = document.getElementById("name");
    var detail = document.getElementById("detail");
    var number = document.getElementById("number");
    var place = document.getElementById("place");

    document.getElementById("imgs").innerHTML = "";

    name.value = "";
    detail.value = "";
    place.value = "";
    number.value = "";

    for(var i=1; i<=categories; i++) {
        document.getElementById("flexCheck"+i).checked = false;
    }

    editting = -1;
}

window.clearForm = clearForm;
export{clearForm}

//備品の削除
function delItem() {
    var result = confirm("「"+equips[editting].name+"」を削除してよろしいですか？");

    if(!result) {return;}

    remove(ref(db, 'equips/' + equipKeys[editting]))
    .then(() => {
        window.location.reload();
    });
}

window.delItem = delItem;
export{delItem};


//備品リストの表示
function showList() {
    var totalNum = Object.keys(data).length;
    document.getElementById("equipsList").innerHTML = "";
    document.getElementById("equipsList2").innerHTML = "";

    //絞り込みの判定
    var categoryChecked = [];
    var noChecked = true;
    var skipped = 0;
    for(var i=1; i<=categories; i++) {
        categoryChecked[i-1] = document.getElementById("flex2Check" + i).checked;
        if(categoryChecked[i-1]) { noChecked = false; }
    }

    //備品ごとに処理
    Object.keys(data).forEach((e, i)=> {
        var equip = data[e];
        var key = e;

        //絞り込みから外れたら非表示（全部チェックしてなかったら、とりあえず表示）
        var show = false;
        if(!noChecked) {
            categoryChecked.forEach((checked, i) => {
                if(checked && equip.category[i]) {
                    show = true;
                }
            });
        } else {
            show = true;
        }

        if(!show) {skipped ++; return;}
    
        var category = "";
        equip.category.forEach((element, index) => {
            if(element) {
                category += "#" + categoryNames[index] + " ";
            }
        });

        var addTo = "equipsList";
        if(i > totalNum/2 && noChecked) { addTo = "equipsList2"; }
    
        document.getElementById(addTo).innerHTML += '<li class="list-group-item"><h5>'+equip.name+'</h5><div class="small text-primary">'+category+'</div><div class="row"><div class="col-4">数量 : '+equip.number+'</div><div class="col-4">場所 : '+equip.place+'</div></div><div class="position-absolute top-0 end-0 px-2 py-1 pb-2" style="cursor:pointer;" data-bs-toggle="modal" data-bs-target="#exampleModal" onclick="openInfo('+equipNum+')"><img src="../icons/three-dots-vertical.svg"></div></li>';
    
        equips[equipNum] = equip;
        equipKeys[equipNum] = key;
    
        equipNum ++;
    });

    document.getElementById("totalNum").textContent = "総数：" + (totalNum-skipped);
}

window.showList = showList;
export{showList}

//大きく画像を表示
function openLargePhoto(index) {
    document.getElementById("equipPhoto").src = urls[index];
    photoModal.show();
}

window.openLargePhoto = openLargePhoto;
export{openLargePhoto}