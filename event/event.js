import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, push, remove, set, get } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
import { getObj, sortMembers } from "/script/methods.js";

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
var user = {};

//データベースのデータ格納用
var events = {};
var users = {};

//ユーザー状態(0:ゲスト、1:部員、2:管理者)
var status;

//ユーザー情報の取得
onAuthStateChanged(auth, (snapshot) => {
  user = snapshot;

  get(ref(db, "users/" + user.uid)).then((snapshot) => {
    if(snapshot.val()) { 
      get(ref(db, "admin-users/" + user.uid)).then((snapshot) => {
        if(snapshot.val()) { status = 2; } else { status = 1; }
        if(status == 2) { get(ref(db, ("users"))).then((snapshot) => { users = snapshot.val(); })}
        start(end);
      });
    }
    else { status = 0; start(end); }
  })

  function end() { getObj("overray").hide(); }
});

//読み込み時に実行
export function start(callback) {
  //タブはデフォルトでイベント状態にする
  switchtab(0);

  //イベントリストを表示
  get(ref(db, "event")).then((snapshot) => {
    events = snapshot.val();

    if(!events) { getObj("noEvent").show(); }

    sorteventKeys(snapshot.val()).forEach(eventID => {
      var element = events[eventID];
      //終了していないイベントを表示
      if(new Date() < new Date(element.term.end)) {
        var eventcolor;
        var timecolor;
        if(new Date(element.term.begin) < new Date()) { eventcolor = "darkred"; timecolor = "text-danger"; } else { eventcolor = "green"; timecolor = "text-muted"}
        getObj("eventList_future").tail('<div class="col-lg-6 p-2"><div class="card w-100 shadow-sm position-relative" style="border-left: solid ' + eventcolor + ' 10px;"><div class="card-body"><h5 class="card-title">' + element.title + '</h5><h6 class="card-subtitle mb-2 ' + timecolor + '">' + TermString(element.term) + '<br>' + element.place + '</h6><p class="text-primary text-small m-0">' + Tags(element.tags) + '</p><p class="card-text" style="height: 5em;">' + element.description + '</p><div class="mt-2"><div class="h5 card-link d-flex justify-content-around mb-0 text-secondary"><div><a style="cursor: pointer;" id="eventAttend' + eventID + '" onclick="eventReaction(\'' + eventID + '\', \'attend\')"></a></div><div><a style="cursor: pointer;" id="eventAbsent' + eventID + '" onclick="eventReaction(\'' + eventID + '\', \'absent\')"></a></div><div class="adminonly"><a style="cursor: pointer;" onclick="eventcontrol(\'' + eventID + '\', \'edit\')"><i class="bi bi-pencil-square"></i></a></div><div class="adminonly"><a style="cursor: pointer;" onclick="eventcontrol(\'' + eventID + '\', \'del\')"><i class="bi bi-trash"></i></a></div></div></div></div><div id="codeexist' + eventID + '" style="display: none;" class="position-absolute top-0 end-0 m-3"><h5><i class="bi bi-person-check-fill" style="color: lightgray;"></i></h5></div><div id="attended-check' + eventID + '" style="display: none;" class="position-absolute top-0 end-0 m-3"><h5><i class="bi bi-person-check-fill" style="color: darkred;"></i></h1></div></div></div>');
                
        //出席登録済みのイベントはチェックボタンを表示
        if(element.attenders && element.attenders[user.uid]) { getObj("attended-check" + eventID).show(); }
        //出席登録してないけどコードがある場合はコードあるよを表示
        else if (element.code) { getObj("codeexist" + eventID).show(); }
        //出席・欠席ボタンの描画
        if(events[eventID].notice) { drawEventReaction(eventID, events[eventID].notice[user.uid]); }
        else { drawEventReaction(eventID, 0); }
      }
      //終了済みのイベントを表示
      else{
        getObj("endEvents").head('<div class="col-lg-6 p-2"><div class="card w-100 shadow-sm position-relative" style="border-left: solid gray 10px;"><div class="card-body"><h5 class="card-title">' + element.title + '</h5><h6 class="card-subtitle mb-2 text-muted">' + TermString(element.term) + '<br>' + element.place + '</h6><p class="text-primary text-small m-0">' + Tags(element.tags) + '</p><div class="mt-2 adminonly"><div class="h5 card-link d-flex justify-content-around mb-0 text-secondary"><div><a style="cursor: pointer;" onclick="eventcontrol(\'' + eventID + '\', \'edit\')"><i class="bi bi-pencil-square"></i></a></div><div><a style="cursor: pointer;" onclick="eventcontrol(\'' + eventID + '\', \'del\')"><i class="bi bi-trash"></i></a></div></div></div></div><div id="codeexist' + eventID + '" style="display: none;" class="position-absolute top-0 end-0 m-3"><h5><i class="bi bi-person-check-fill" style="color: lightgray;"></i></h5></div><div id="attended-check' + eventID + '" style="display: none;" class="position-absolute top-0 end-0 m-3"><h5><i class="bi bi-person-check-fill" style="color: green;"></i></h5></div></div></div>');
        
        //出席登録済みのイベントはチェックを表示
        if(element.attenders && element.attenders[user.uid]) { getObj("attended-check" + eventID).show(); }
        //出席登録してないけど出席者がいる場合はコードあったよを表示
        else if (element.attenders) { getObj("codeexist" + eventID).show(); }
      }
    });
    //管理者以外は非表示にするもの
    var adminonly = document.getElementsByClassName("adminonly");
    Object.keys(adminonly).forEach(key => {
      if ( status == 2 ) { adminonly[key].style.display = "inherit"; } else { adminonly[key].style.display = "none"; }
    });

    callback();
  });

  //選択ソートでイベントを時系列順に並び替え
  function sorteventKeys(data) {
    var minkey = Object.keys(data)[0];
    Object.keys(data).forEach((key) => {
      if(new Date(data[key].term.begin) < new Date(data[minkey].term.begin)) { minkey = key; }
    });
    delete data[minkey];
    if(0 < Object.keys(data).length) { return [minkey, ...sorteventKeys(data)]; }
    else { return [minkey]; }
  }

  //期間をStringに変換
  function TermString(term) {
    var begin = new Date(term.begin); var end = new Date(term.end); var now = new Date();
    var allday = term.allday;
    var output = "";

    if(begin.getFullYear() != end.getFullYear()) { output += begin.getFullYear() + "年"; }
    output += begin.getMonth() + 1 + "月" + begin.getDate() + "日";

    //終日の予定は日付だけ
    if(allday){
      if(begin.getFullYear() != end.getFullYear() || begin.getMonth() != end.getMonth() || begin.getDate() != end.getDate()) {
        output += " - ";
        if(begin.getFullYear() != end.getFullYear()) { output += end.getFullYear() + "年"; }
        output += end.getMonth() + 1 + "月" + end.getDate() + "日";
      }
    }
    //時刻が含まれる場合はそれも出力
    else{
      output += " " + full(begin.getHours()) + ":" + full(begin.getMinutes());
      output += " - ";
      if(begin.getFullYear() != end.getFullYear()) { output += end.getFullYear() + "年"; }
      if(begin.getFullYear() != end.getFullYear() || begin.getMonth() != end.getMonth() || begin.getDate() != end.getDate()) {
        output += end.getMonth() + 1 + "月" + end.getDate() + "日 ";
      }
      output += full(end.getHours()) + ":" + full(end.getMinutes());
    }

    //開催中には末尾に(開催中)をつける
    if(begin < now && now < end) { output += "(開催中!)"; }

    return output;

    function full(str) { str = String(str); if(str.length < 2) { return full("0" + str); } else { return str; } }
  }

  //タグを文字列に変換、またまた再帰関数大活躍、これ完全にOCaml
  function Tags(tags) {
    if(tags[0]) { return "#" + tags.shift() + Tags(tags); }
    else{ return ""; }
  }
}
window.start = start;

//タブ切り替え
export function switchtab(i) {
  var display = []; //eventtab, projecttab, event, project
  if(i) { display = ["none", "flex", "none", "block"]; }
  else  { display = ["flex", "none", "block", "none"]; }

  getObj("tab-event").style.display = display[0];
  getObj("tab-project").style.display = display[1];
  getObj("event").style.display = display[2];
  getObj("project").style.display = display[3];
  if(status == 2){
    getObj("addEventBtn").style.display = display[2];
    getObj("addProjectBtn").style.display = display[3];
  }
  else{
    getObj("addEventBtn").style.display = "none";
    getObj("addProjectBtn").style.display = "none";
  }
}
window.switchtab = switchtab;

var editeventModal = new bootstrap.Modal(getObj("editeventModal"));
//イベントコントロール
export function eventcontrol(eventID, type) {
  if(status != 2) { alert("管理者権限がありません"); return; }
  switch (type) {
    //新規作成
    case "new":
      getObj("eventID").value = new Date().getTime().toString(16).toUpperCase();
      getObj("eventTitle").value = "";
      getObj("eventDescription").value = "";
      getObj("eventDescription").style.height = "8em";
      getObj("eventDateRadio-allday").checked = true;
      getObj("eventDateRadio-time").checked = false;
      alldaytab(true, true);
      getObj("eventDateBegin").value = DateString(new Date(), true);
      getObj("eventDateEnd").value = DateString(new Date(), true);
      getObj("eventDate").value = DateString(new Date(), true);
      getObj("eventTimeBegin").value = "18:05";
      getObj("eventTimeEnd").value = "20:00";
      getObj("eventLocation").value = "";
      getObj("eventTags").value = "";
      getObj("eventCode").value = "";
      getObj("eventCode").type = "password";
      getObj("eye").innerHTML = '<i class="bi bi-eye-slash"></i>';
      getObj("eventPoint").value = 300;
        
      editeventModal.show();
    break;
    //編集する
    case "edit":
      get(ref(db, "event/" + eventID)).then((snapshot) => {
        var data = snapshot.val();
        getObj("eventID").value = eventID;
        getObj("eventTitle").value = data.title;
        getObj("eventDescription").value = data.description;
        getObj("eventDescription").style.height = "8em";
        getObj("eventDateRadio-allday").checked = data.term.allday;
        getObj("eventDateRadio-time").checked = !data.term.allday;
        alldaytab(data.term.allday, true);
        getObj("eventDateBegin").value = DateString(new Date(data.term.begin), true);
        getObj("eventDateEnd").value = DateString(new Date(data.term.end), true);
        getObj("eventDate").value = DateString(new Date(data.term.begin), true);
        if(!data.term.allday) {
          getObj("eventTimeBegin").value = DateString(new Date(data.term.begin), false);
          getObj("eventTimeEnd").value = DateString(new Date(data.term.end), false);
        }
        getObj("eventLocation").value = data.place;
        getObj("eventTags").value = tagtag(data.tags, true);
        getObj("eventCode").value = data.code;
        getObj("eventCode").type = "password";
        getObj("eye").innerHTML = '<i class="bi bi-eye-slash"></i>';
        getObj("eventPoint").value = data.point;

        getObj("attendList").innerHTML = "";
        getObj("absentList").innerHTML = "";
        getObj("attendersList").innerHTML = "";
        getObj("attendList_title").hide();
        getObj("absentList_title").hide();
        getObj("attendersList_title").hide();
        if(data.notice){
          var keys = sortMembers(users, Object.keys(data.notice));
          keys.forEach((ID) => {
            if(data.notice[ID] == 1)
            {
              getObj("attendList_title").show();
              getObj("attendList").tail('<li class="list-group-item"><span class="text-secondary">' + users[ID].studentNumber + '</span> <span class="h6">' + users[ID].name + '</span></li>'); 
            }
            if(data.notice[ID] == -1)
            {
              getObj("absentList_title").show();
              getObj("absentList").tail('<li class="list-group-item"><span class="text-secondary">' + users[ID].studentNumber + '</span> <span class="h6">' + users[ID].name + '</span></li>');
            }
          })
        }
        if(data.attenders){
          getObj("attendersList").show();
          var keys = sortMembers(users, Object.keys(data.attenders));
          keys.forEach((ID) => {
            getObj("attendersList").tail('<li class="list-group-item"><span class="text-secondary">' + users[ID].studentNumber + '</span> <span class="h6">' + users[ID].name + '</span></li>');
          })
        }
        
        editeventModal.show();
      })
    break;
    //保存する
    case "save":
      eventID = getObj("eventID").value;
      //不備チェック
      try {
        if(!getObj("eventTitle").value) { e("タイトルが入力されていません") }
        if(getObj("eventDateRadio-allday").checked && new Date(getObj("eventDateBegin").value) > new Date(getObj("eventDateEnd").value)) { e("日付が不正です"); }
        if(getObj("eventDateRadio-time").checked && new Date("1983-04-15 " + getObj("eventTimeBegin").value) > new Date("1983-04-15 " + getObj("eventTimeEnd").value)) { e("時刻が不正です"); }
        if(!getObj("eventDateBegin").value || !getObj("eventDate")) { e("日付が入力されていません") }
        if(!getObj("eventDateBegin").value && (!getObj("eventTimeBegin").value || !getObj("eventTimeEnd").value)) { e("日時が入力されていません"); }
        if(getObj("eventDateBegin").value && !getObj("eventDateEnd").value) {
          getObj("eventDateEnd").value = getObj("eventDateBegin").value
        }
        if(getObj("eventTimeBegin") && !getObj("eventTimeEnd")) {
          getObj("eventTimeEnd").value = DateString(new Date(getObj("eventTimeEnd").value) + (1000 * 60 * 60)); 
        }
        if(getObj("eventPoint").value < 0) { e("出席するとポイント奪われるとか何考えてるんですか"); }
        function e(msg) { throw new Error(msg); }
      } catch (error) {
        alert(error); return;
      }

      //日付は先にセット
      var term = {};
      if(getObj("eventDateRadio-allday").checked){
        term = {
          allday : true,
          begin : getObj("eventDateBegin").value,
          end : getObj("eventDateEnd").value
        }
      }
      else{
        term = {
          allday : false,
          begin : getObj("eventDate").value + " " + getObj("eventTimeBegin").value,
          end : getObj("eventDate").value + " " + getObj("eventTimeEnd").value
        }
      }

      get(ref(db, "event/" + eventID + "/attenders")).then((snapshot) => {
        set(ref(db, "event/" + eventID), {
          title : getObj("eventTitle").value,
          description : getObj("eventDescription").value,
          term : term,
          place : getObj("eventLocation").value,
          tags : tagtag(getObj("eventTags", false).value),
          code : getObj("eventCode").value,
          point : getObj("eventPoint").value,
          attenders : snapshot.val()
        })
        .catch((error) => {
          alert(error.message);
          return;
        }).then(() => {
          alert("保存しました");
          location.reload();
        })
      })
    break;
    //削除する
    case "del":
      alert("イベント削除機能はありません。データベースを操作してください。");
    break;
    default: console.error("undefined type of edit function"); break;
  }

  //タグ(配列) <-> タグ(String)の変換
  //第二引数trueで順方向、falseで逆方向の変換
  function tagtag(tag, direction){
    if(direction){
      if(tag[0]){
        if(tag[1]){ return tag.shift() + " " + tagtag(tag, true); }
        else{ return tag[0]; }
      }
      else { return ""; }
    }
    else{ return String(tag).split(' '); }
  }

  //終日・時刻ありを切り替える
  function alldaytab(allday, start) {
    if(!start && allday == getObj("eventDateRadio-allday").checked) { return; }
    if(allday){
      getObj("eventDateTab-allday").style.display = "flex";
      getObj("eventDateTab-time").style.display = "none";
      if(!start){
        getObj("eventDateBegin").value = DateString(new Date(getObj("eventDate").value), true);
        getObj("eventDateEnd").value = DateString(new Date(getObj("eventDate").value), true);
      }
    }
    else {
      getObj("eventDateTab-allday").style.display = "none";
      getObj("eventDateTab-time").style.display = "flex";
      if(!start){
        getObj("eventDate").value = DateString(new Date(getObj("eventDateBegin").value), true);
        if(!getObj("eventTimeBegin").value && !getObj("eventTimeEnd").value){
          getObj("eventTimeBegin").value = "18:05";
          getObj("eventTimeEnd").value = "20:00";
        }
      }
    }
  }
  window.alldaytab = alldaytab;

  //日付の書式をちゃんとする
  function DateString(data, date) {
    if(date){ return String(data.getFullYear()) + "-" + addzero(data.getMonth() + 1) + "-" + addzero(data.getDate()) }
    else{ return addzero(data.getHours()) + ":" + addzero(data.getMinutes()) }

    function addzero(str) {
      if(String(str).length < 2) { return addzero("0" + String(str)); }
      else { return String(str); }
    }
  }
  window.DateString = DateString;

  //パスワードの表示/非表示の切り替え
  function toggleshowcode() {
    if(getObj("eventCode").type == "password"){
      getObj("eventCode").type = "text";
      getObj("eye").innerHTML = '<i class="bi bi-eye"></i>';
    }
    else {
      getObj("eventCode").type = "password";
      getObj("eye").innerHTML = '<i class="bi bi-eye-slash"></i>';
    }
  }
  window.toggleshowcode = toggleshowcode;
}
window.eventcontrol = eventcontrol;

//出席・欠席ボタン
export function eventReaction(eventID, type) {
  //欠席で-1、出席で1、未入力は0またはundefined
  if(!events[eventID].notice) { events[eventID].notice = {}; events[eventID].notice[user.uid] = 0; }

  switch (type) {
    //出席ボタン
    case "attend":
      //出席取り消し
      if(events[eventID].notice[user.uid] == 1) {
        events[eventID].notice[user.uid] = 0
        remove(ref(db, "event/" + eventID + "/notice/" + user.uid)).then(() => { alert(events[eventID].title + " への出席連絡を取り消しました。"); })
      }
      //出席連絡
      else {
        events[eventID].notice[user.uid] = 1;
        set(ref(db, "event/" + eventID + "/notice/" + user.uid), 1).then(() => { alert(events[eventID].title + " に出席連絡しました。"); })
      }
    break;
    //欠席ボタン
    case "absent":
      //欠席取り消し
      if(events[eventID].notice[user.uid] == -1) {
        events[eventID].notice[user.uid] = 0;
        remove(ref(db, "event/" + eventID + "/notice/" + user.uid)).then(() => { alert(events[eventID].title + " への欠席連絡を取り消しました。"); })
      }
      //欠席連絡
      else {
        events[eventID].notice[user.uid] = -1;
        set(ref(db, "event/" + eventID + "/notice/" + user.uid), -1).then(() => { alert(events[eventID].title + " に欠席連絡しました。"); })
      }
    break;
    default: console.error("undefined type of reaction function"); break;
  }

  drawEventReaction(eventID, events[eventID].notice[user.uid]);
}
window.eventReaction = eventReaction;

//出席・欠席ボタンを描画
export function drawEventReaction (eventID, attend) {
  switch (attend) {
    case -1:
      getObj("eventAttend" + eventID).innerHTML = '<i class="bi bi-check-circle"></i>';
      getObj("eventAbsent" + eventID).innerHTML = '<i class="bi bi-x-circle-fill" style="color: darkred;"></i>';
    break;
    case 1:
      getObj("eventAttend" + eventID).innerHTML = '<i class="bi bi-check-circle-fill" style="color: green;"></i>';
      getObj("eventAbsent" + eventID).innerHTML = '<i class="bi bi-x-circle"></i>';
    break;
    default:
      getObj("eventAttend" + eventID).innerHTML = '<i class="bi bi-check-circle"></i>';
      getObj("eventAbsent" + eventID).innerHTML = '<i class="bi bi-x-circle"></i>';
    break;
  }
}
window.drawEventReaction = drawEventReaction;