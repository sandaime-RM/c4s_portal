import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, onChildAdded, push, remove, set, get, update } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getStorage, ref as ref_st, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-storage.js";
import { getObj, Obj } from "/script/methods.js"

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
const auth = getAuth();
const db = getDatabase(app);
const st = getStorage(app);

let user;
let status;
let data;

const categoryNames = ["書籍", "電子工作", "映像・写真", "3Dプリンター", "ケーブル・アダプタ", "部室用インテリア", "工具", "音響", "VR", "工作"];
let catSelected = Array(categoryNames.length).fill(false);

let editModal = new bootstrap.Modal(new Obj("editModal"));

$(() => {
  //カテゴリボタンを設置
  for (let i = 0; i < categoryNames.length; i++) {
    // 絞り込みボタン
    new Obj("cats").after('<h6 id="cat' + i + '">' + categoryNames[i] + '</h6>')
    new Obj("cat" + i).setAttribute("class", "unclicked");

    //onclick属性を追加
    new Obj("cat" + i).setAttribute("onclick", "setcats(" + i + ")")

    // 編集画面
    new Obj("catBtns_edit").after(`
      <input type="checkbox" class="btn-check" id="catBtn${i}_edit" autocomplete="off">
      <label class="btn btn-outline-secondary px-3 btn-sm rounded-pill mb-2" for="catBtn${i}_edit">${categoryNames[i]}</label>
    `);
  }
})

// ページをロード
onAuthStateChanged(auth, (snapshot) => {
  user = snapshot; if(!user) return;

  get(ref(db, "users/" + user.uid)).then((snapshot) => {
    if(snapshot.val()) { 
      get(ref(db, "admin-users/" + user.uid)).then((snapshot) => {
        if(snapshot.val()) { status = 2; } else { status = 1; }
      })
    }
    else { status = 0; }

    // データを取得(さすがにonValueじゃなくていいよね…？)
    get(ref(db, 'equips')).then((snapshot) => {
      data = snapshot.val();
      new Obj("totalNum").set(`総数：${Object.keys(data).length}`);
      
      showList();
      $("#overray").fadeOut();
    });
  });
})
// リストの表示
window.showList = () => {
  new Obj("list").set();

  data ? new Obj("noEquip").hide(): new Obj("noEquip").show();

  // カードを一枚ずつ追加
  Object.keys(data).forEach((key) => {    
    // 複数あるものは名前の横に数量を表示
    let equipname = data[key].name;
    if (data[key].number != 1) { equipname += `(×${data[key].number})`; }

    // 備品画像
    getImgLink(key).then((imgLink) => {
      // 管理者専用の編集ボタン
      let editBtn = (status == 2) ? 
      `<div class="position-absolute end-0 bottom-0">
        <div class="bi bi-info-circle m-3 pointer hover" style="line-height: 1em;" onclick="openModal('${key}')"></div>
      </div>`: "";
      // カードをHTMLに追加
      new Obj("list").after(`
        <div class="col-6 col-md-4 col-lg-3 mb-3 px-1 h-eq" id="equip${key}">
          <div class="bg-white shadow-sm rounded-md p-3 position-relative">
            <img src="${imgLink}" class="rounded-sm w-100 pointer hover"
              style="aspect-ratio: 1; object-fit: cover;" onclick="showPic('${key}')">
            <h5 class="mb-0 mt-3">${equipname}</h5>
            <p class="mb-3 text-secondary small text-justify">
              ${data[key].detail}
            </p>
            ${editBtn}
          </div>
        </div>
      `);
    });
  })
}
// カテゴリ切り替え
window.setcats = i => {
  let totalNum = 0;
  //いったん全部消す
  Object.keys(data).forEach((key) => { new Obj("equip" + key).hide(); })

  //変数の書き換え
  catSelected[i] = !catSelected[i];
  //HTML上での表示切替
  if(catSelected[i]) { getObj("cat" + i).setAttribute("class", "clicked"); }
  else { getObj("cat" + i).setAttribute("class", "unclicked"); }

  //表示するcatの番号リスト
  let displays = [];
  for (let i = 0; i < categoryNames.length; i++) {
    if(catSelected[i]) { displays.push(i); }
  }
  //それぞれの要素に対して表示・非表示の設定
  Object.keys(data).forEach((key) => { 
    let display = false;
    if(displays[0] === undefined) { display = true; }
    else {
      displays.forEach((n) => {
        if(data[key].category[n]) { display = true; }
      })
    }
    if(display) { new Obj("equip" + key).show(); totalNum++; }
  })
  
  new Obj("totalNum").set(`総数：${totalNum}`);
  (totalNum == 0)? new Obj("noEquip").show(): new Obj("noEquip").hide();
}
// 検索
window.search = () => {
  if(!new Obj("searchBox").value) {
    Object.keys(data).forEach((key) => { new Obj(`equip${key}`).show(); })
    return;
  }
  new Obj("searchBox").value = new Obj("searchBox").value.split("　").join(" ");
  let wordlist = new Obj("searchBox").value.split(" ");
  
  let totalNum = 0;
  //それぞれの要素に対して表示・非表示の設定
  Object.keys(data).forEach((key) => {
    let show = false;
    wordlist.forEach(word => {
      // 表示条件
      if (
        difLevel(word, data[key].name) < 3 ||
        data[key].name.indexOf(word) != -1 ||
        data[key].detail.indexOf(word) != -1
      ) show = true;
    })
    show ? new Obj(`equip${key}`).show() : new Obj(`equip${key}`).hide();
    if (show) totalNum++;
  })
  new Obj("totalNum").set(`総数：${totalNum}`);
  (totalNum == 0)? new Obj("noEquip").show(): new Obj("noEquip").hide();
}

// モーダルを開く(備品登録/編集画面)
window.openModal = (ID) => {
  if (ID) {
    let element = data[ID];
    new Obj("equipID_edit").value = ID;
    new Obj("equipName_edit").value = element.name;
    new Obj("equipPlace_edit").value = element.place;
    new Obj("equipNum_edit").value = element.number;
    if(element.imgs.file) {
      new Obj("deleteBtn_equipImg_edit").show("block");
      new Obj("equipImg_edit").hide();
      new Obj("deleteBtn_equipImg_edit").onclick = () => {
        if(confirm("画像を削除しますか？")) {
          new Obj("deleteBtn_equipImg_edit").hide();
          new Obj("equipImg_edit").show("block");
        }
      }
    } else {
      new Obj("deleteBtn_equipImg_edit").hide();
      new Obj("equipImg_edit").show("block");
    }
    new Obj("equipDetail_edit").value = element.detail;
    for (let i = 0; i < categoryNames.length; i++) {
      new Obj(`catBtn${i}_edit`).checked = element.category[i];
    }
    new Obj("delForm").show("block");
  } else {
    new Obj("equipID_edit").value = new Date().getTime().toString(16).toUpperCase();
    new Obj("equipName_edit").value = "";
    new Obj("equipPlace_edit").value = "部室";
    new Obj("equipNum_edit").value = 0;
    new Obj("deleteBtn_equipImg_edit").hide();
    new Obj("equipImg_edit").show("block");
    new Obj("equipImg_edit").value = '';
    new Obj("equipDetail_edit").value = "";
    for (let i = 0; i < categoryNames.length; i++) {
      new Obj(`catBtn${i}_edit`).checked = false;
    }
    new Obj("delForm").hide();
  }
  editModal.show();
}
// モーダルを閉じる(備品のアップロード)
window.closeModal = async (upload) => {
  if (upload) {
    // 不備チェック
    try {
      if (new Obj("equipName_edit").value === "") e ("名称くらいは入力してよ！怒");
      if (new Obj("equipPlace_edit").value === "") e ("保管場所が入力されていません");
      if (new Obj("equipNum_edit").value < 1) e ("数量が不正です");
      function e (msg) { throw new Error (msg); }
    } catch (error) {
      alert(error); return;
    }

    $("#loading").fadeIn();
    let itemID = new Obj("equipID_edit").value;
    // 画像を圧縮
    let equipImg = new Obj("equipImg_edit").files[0];
    let equipImg_compressed;
    if(equipImg) {
      equipImg_compressed = await new Compressor(equipImg, {
        maxHeight: 1000,
        convertSize: Infinity,
        success (snapshot) { return snapshot; },
        error (err) { console.log(err); }
      });
      // 画像をアップロード
      const fr = new FileReader();
      fr.readAsArrayBuffer(equipImg_compressed);
      const blob = new Blob([fr.equipImg_compressed]);
      await uploadBytes(ref_st(st, 'equips/' + equipImg.name), blob).catch((error) => {
        console.error(error);
      });
    } else if (data[itemID] && data[itemID].imgs.file) {
      equipImg = { name: data[itemID].imgs.file };
    } else {
      equipImg = { name: "noimage.svg" };
    }
    // カテゴリ
    let category = [];
    for(let i = 0; i < categoryNames.length; i++) { category[i] = new Obj(`catBtn${i}_edit`).checked; }

    // アップロード
    let newData = {
      name : new Obj("equipName_edit").value,
      detail : new Obj("equipDetail_edit").value,
      number : Number(new Obj("equipNum_edit").value),
      place : new Obj("equipPlace_edit").value,
      userId : user.uid,
      time : (new Date()).getTime(),
      category : category,
      imgs : {
        file: equipImg.name
      }
    }
    update(ref(db, `equips/${new Obj("equipID_edit").value}`), newData)
    .then(() => {
      data[new Obj("equipID_edit").value] = newData;
      showList();
      alert("保存しました");
      editModal.hide();
      $("#loading").fadeOut();
    })
    .catch((error) => {
      console.error(error);
      confirm("保存に失敗しました。再試行しますか？")? closeModal(true): editModal.hide(); $("#loading").fadeOut();
    });
  } else {
    if(confirm("編集内容を破棄しますか？")) editModal.hide();
  }
}

// 画像の拡大表示
window.showPic = (ID) => {
  new Obj("LargePic").src = data[ID].imgs.link;
  new Obj("LargePic").addEventListener("load", () => {
    $("#ImgOverray").fadeIn(150);
  })
}

// 備品の削除
window.delItem = () => {
  if(
    confirm(`${data[new Obj("equipID_edit").value].name}を削除してよろしいですか？`) &&
    confirm("本当に削除してもよろしいですか？")) {
    $("#loading").fadeIn();
    remove(ref(db, `equip/${new Obj("equipID_edit").value}`)).then(() => {
      delete data[new Obj("equipID_edit").value];
      showList();
      alert("削除しました");
      $("#loading").fadeOut();
    }).catch((error) => {
      console.error(error);
      (confirm("削除に失敗しました。再試行しますか？")) ? delItem() : $("#loading").fadeOut();
    })
  }
}

// 画像リンクを取得
const getImgLink = async (key) => {
  // 画像へのリンクはデータベースに保存しておく
  // ストレージ上に画像が存在しなければリンクを削除
  if (data[key].imgs.link) { return data[key].imgs.link; }
  else if (data[key].imgs.file) {
    let URL = await getDownloadURL(ref_st(st, `equips/${data[key].imgs.file}`)).catch(error => {
      console.error(error);
      remove(ref(db, `equips/${key}/imgs/link`));
    });
    await set(ref(db, `equips/${key}/imgs/link`), URL);
    data[key].imgs.link = URL;
    return URL;
  } else {
    alert("破損データがあるためページを開けません"); location.href = "/";
  }
}
//文字列の類似度チェック
const difLevel = (str1, str2) => {
  let r, c, cost, d = [];
 
  for (r = 0; r <= str1.length; r++) {
    d[r] = [r];
  }
  for (c = 0; c <= str2.length; c++) {
    d[0][c] = c;
  }
  for (r = 1; r <= str1.length; r++) {
    for (c = 1; c <= str2.length; c++) {
      cost = str1.charCodeAt(r-1) == str2.charCodeAt(c-1) ? 0: 1;
      d[r][c] = Math.min(d[r-1][c]+1, d[r][c-1]+1, d[r-1][c-1]+cost);
    }
  }

  let result = d[str1.length][str2.length]
  // return (10 - result) / 10;
  return result;
}