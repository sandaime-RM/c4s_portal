import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, push, remove, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
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
const db = getDatabase(app);
const auth = getAuth();
var user = {};

//データベースのデータ格納用
var events = {};
var projects = {};
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
        start().then(end);
      });
    }
    else { status = 0; start().then(end); }
  })

  function end() { $("#overray").fadeOut(); };
});

//読み込み時に実行
window.start = async () => {
  //タブはデフォルトでイベント状態にする
  console.log(switchtab(0));

  //イベントリストを表示
  await get(ref(db, "event")).then((snapshot) => {
    events = snapshot.val();
    // onValue(ref(db, "event"), snapshot => { events = snapshot.val(); console.log(events)})

    if(!events) { getObj("noEvent").show(); }

    //イベントを日付順に並び替え
    function sortEvents (keys) {
      let top;
      if(!keys[0]) { return []; }
      keys.forEach(key => {
        if(!top || new Date(events[key].term.begin) < new Date(events[top].term.begin)) { top = key; }
      });
      return [keys.splice(keys.indexOf(top), 1), ...sortEvents(keys)];
    }

    sortEvents(Object.keys(events)).forEach(eventID => {
      var element = events[eventID];
      //終了していないイベントを表示
      if(new Date() < new Date(element.term.end)) {
        var eventcolor;
        var timecolor;
        if(new Date(element.term.begin) < new Date()) { eventcolor = "darkred"; timecolor = "text-danger"; } else { eventcolor = "green"; timecolor = "text-muted"}
        getObj("eventList_future").tail('<div class="col-lg-6 p-2"><div class="card w-100 shadow-sm position-relative" style="border-left: solid ' + eventcolor + ' 10px;"><div class="card-body"><h5 class="card-title">' + element.title + '</h5><h6 class="card-subtitle mb-2 ' + timecolor + '">' + Eventterm(element.term) + '<br>' + element.place + '</h6><p class="text-primary text-small m-0" style="height: 1.5em;">' + Tags(element.tags) + '</p><p class="card-text" style="height: 5em; text-align: justify;">' + element.description + '</p><div class="mt-2"><div class="h5 card-link d-flex justify-content-around mb-0 text-secondary"><div><a style="cursor: pointer;" id="eventAttend' + eventID + '" onclick="eventReaction(\'' + eventID + '\', \'attend\')"></a> <span id="AttendNum' + eventID + '"></span></div><div><a style="cursor: pointer;" id="eventAbsent' + eventID + '" onclick="eventReaction(\'' + eventID + '\', \'absent\')"></a> <span id="AbsentNum' + eventID + '"></span></div><div class="adminonly"><a style="cursor: pointer;" onclick="eventcontrol(\'' + eventID + '\', \'edit\')"><i class="bi bi-pencil-square"></i></a></div><div class="adminonly"><a style="cursor: pointer;" onclick="eventcontrol(\'' + eventID + '\', \'del\')"><i class="bi bi-trash"></i></a></div></div></div></div><div id="codeexist' + eventID + '" style="display: none;" class="position-absolute top-0 end-0 m-3"><h5><i class="bi bi-person-check-fill" style="color: lightgray;"></i></h5></div><div id="attended-check' + eventID + '" style="display: none;" class="position-absolute top-0 end-0 m-3"><h5><i class="bi bi-person-check-fill" style="color: green;"></i></h1></div></div></div>');
        
        //出席登録済みマーク
        if(element.attenders && element.attenders[user.uid]) { getObj("attended-check" + eventID).show(); }
        //出席コードが存在するマーク
        else if (element.code) { getObj("codeexist" + eventID).show(); }
        //出席・欠席ボタンの描画
        if(events[eventID].notice) { drawEventReaction(eventID, events[eventID].notice[user.uid]); }
        else { drawEventReaction(eventID, 0); }
        //出席・欠席の人数はリアルタイムで描画
        onValue(ref(db, "event/" + eventID + "/notice"), (snapshot) => {
          let attendnum = 0; let absentnum = 0;
          if(snapshot.val()) {
            Object.keys(snapshot.val()).forEach((element) => {
              let data = snapshot.val()[element];
              if(data == 1) { attendnum += 1; } else if(data == -1) { absentnum += 1; }
            });
          }
          if(attendnum == 0) { attendnum = ""; } if(absentnum == 0) { absentnum = ""; }
          getObj("AttendNum" + eventID).innerText = attendnum;
          getObj("AbsentNum" + eventID).innerText = absentnum;
        });
      }
      //終了済みのイベントを表示
      else{
        getObj("endEvents").head('<div class="col-lg-6 p-2"><div class="card w-100 shadow-sm position-relative" style="border-left: solid gray 10px;"><div class="card-body"><h5 class="card-title">' + element.title + '</h5><h6 class="card-subtitle mb-2 text-muted">' + Eventterm(element.term) + '<br>' + element.place + '</h6><p class="text-primary text-small m-0" style="height: 1.5em;">' + Tags(element.tags) + '</p><div class="mt-2 adminonly"><div class="h5 card-link d-flex justify-content-around mb-0 text-secondary"><div><a style="cursor: pointer;" onclick="eventcontrol(\'' + eventID + '\', \'edit\')"><i class="bi bi-pencil-square"></i></a></div><div><a style="cursor: pointer;" onclick="eventcontrol(\'' + eventID + '\', \'del\')"><i class="bi bi-trash"></i></a></div></div></div></div><div id="codeexist' + eventID + '" style="display: none;" class="position-absolute top-0 end-0 m-3"><h5><i class="bi bi-person-check-fill" style="color: lightgray;"></i></h5></div><div id="attended-check' + eventID + '" style="display: none;" class="position-absolute top-0 end-0 m-3"><h5><i class="bi bi-person-check-fill" style="color: green;"></i></h5></div></div></div>');
        
        //出席登録済みマーク
        if(element.attenders && element.attenders[user.uid]) { getObj("attended-check" + eventID).show(); }
        //出席者が存在するマーク
        else if (element.attenders) { getObj("codeexist" + eventID).show(); }
      }
    });
    //管理者以外は非表示にするもの
    var adminonly = document.getElementsByClassName("adminonly");
    Object.keys(adminonly).forEach(key => {
      if ( status == 2 ) { adminonly[key].style.display = "inherit"; } else { adminonly[key].style.display = "none"; }
    });
  });

  //企画リストを表示
  await get(ref(db, "projects")).then((snapshot) => {
    projects = snapshot.val();
    onValue(ref(db, "projects"), (snapshot) => { projects = snapshot.val(); })
    let projectsSub = snapshot.val();

    if(projects) {
      getObj("noProject").style.display = "none";

      sortTermKeys(projectsSub).forEach((projectID) => {
        getObj("projectList").innerHTML += '<div class="col-lg-6 p-2"><div class="card w-100 shadow-sm position-relative" style="border-right: solid indigo 10px;"><div class="card-body"><h5 class="card-title">'+projects[projectID].title+'</h5><h6 class="card-subtitle mb-2 text-muted">' + Projectterm(projects[projectID].term) + '</h6><p class="card-text" style="height: 5em;">'+projects[projectID].description+'</p><div class="mt-2"><div class="h5 card-link d-flex justify-content-around mb-0 text-secondary"><div style="cursor: pointer;" id="projectJoin' + projectID + '" onclick="projectReaction(`' + projectID + '`)"><i class="bi bi-person-plus"></i> <span id="JoinerNum' + projectID + '"></span></div><div class="adminonly"><a style="cursor: pointer;" onclick="projectcontrol(`'+projectID+'`, `edit`)"><i class="bi bi-pencil-square"></i></a></div><div class="adminonly"><a style="cursor: pointer;" onclick="projectcontrol(`'+projectID+'`, `del`)"><i class="bi bi-trash"></i></a></div></div></div></div></div></div>';

        //参加中の場合、チェック・アイコンに
        if(projects[projectID].joiners) {
          if(projects[projectID].joiners[user.uid]) {
            getObj("projectJoin" + projectID).html('<i class="bi bi-person-check-fill" style="color: indigo"> </i>');
          }

          //document.getElementById("JoinerNum" + projectID).textContent = (Object.keys(projects[projectID].joiners)).length;
        }
      })

      //管理者以外は非表示にするもの
      var adminonly = document.getElementsByClassName("adminonly");
      Object.keys(adminonly).forEach(key => {
        if ( status == 2 ) { adminonly[key].style.display = "inherit"; } else { adminonly[key].style.display = "none"; }
      });
    }
  })

  //期間をStringに変換（イベント用）
  function Eventterm(term) {
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

  //期間をStringに変換（企画用）
  function Projectterm(term) {
    var begin = new Date(term.begin); var end = new Date(term.end); var now = new Date();
    var output = "";

    if(now.getFullYear() < begin.getFullYear()) { output += begin.getFullYear() + "年"; }
    output += `${full(begin.getMonth() + 1)}月${full(begin.getDate())}日`;
    if(begin != end) {
      output += " - "
      if(begin.getFullYear() != end.getFullYear()) { output += `${end.getFullYear()}年`; }
      output +=`${full(end.getMonth() + 1)}月${full(end.getDate())}日`
    }
    function full(str) { return str; }

    return output;
  }

  //タグを文字列に変換、またまた再帰関数大活躍
  function Tags(tags) {
    if(tags[0]) { return "#" + tags.shift() + Tags(tags); }
    else{ return ""; }
  }
}

//タブ切り替え
window.switchtab = function switchtab(i) {
  var display = []; //eventtab, projecttab, event, project
  if(i) { display = ["none", "flex", "none", "block"]; }
  else  { display = ["flex", "none", "block", "none"]; }

  getObj("tab-event").style.display = display[2];
  getObj("tab-project").style.display = display[3];
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

  return display;
}

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
      getObj("attendList_title").hide();
      getObj("absentList_title").hide();
      getObj("attendersList_title").hide();
      getObj("attendList").innerHTML = "";
      getObj("absentList").innerHTML = "";
      getObj("attendersList").innerHTML = "";
        
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

        var attendNum = 0;
        var absentNum = 0;
        var registerNum = 0;

        if(data.notice){
          var keys = sortMembers(users, Object.keys(data.notice));
          keys.forEach((ID) => {
            if(data.notice[ID] == 1)
            {
              attendNum ++;
              getObj("attendList_title").show();
              getObj("attendList").tail('<li class="list-group-item"><span class="text-secondary">' + users[ID].studentNumber + '</span> <span class="h6">' + users[ID].name + '</span></li>'); 
            }
            if(data.notice[ID] == -1)
            {
              absentNum ++;
              getObj("absentList_title").show();
              getObj("absentList").tail('<li class="list-group-item"><span class="text-secondary">' + users[ID].studentNumber + '</span> <span class="h6">' + users[ID].name + '</span></li>');
            }
          })
        }
        if(data.attenders){
          getObj("attendersList_title").show();
          var keys = sortMembers(users, Object.keys(data.attenders));
          registerNum = keys.length;
          keys.forEach((ID) => {
            getObj("attendersList").tail('<li class="list-group-item"><span class="text-secondary">' + users[ID].studentNumber + '</span> <span class="h6">' + users[ID].name + '</span></li>');
          })
        }
        
        getObj("attendNum").innerHTML = attendNum + "人";
        getObj("absentNum").innerHTML = absentNum + "人";
        getObj("registerNum").innerHTML = registerNum + "人";

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

      get(ref(db, "event/" + eventID)).then((snapshot) => {
        var data = snapshot.val();
        if(!data) { data = {}; }
        if(!data.attenders) { data.attenders = ""; }
        if(!data.notice) { data.notice = ""; }
        set(ref(db, "event/" + eventID), {
          title : getObj("eventTitle").value,
          description : getObj("eventDescription").value,
          term : term,
          place : getObj("eventLocation").value,
          tags : tagtag(getObj("eventTags", false).value),
          code : getObj("eventCode").value,
          point : getObj("eventPoint").value,
          attenders : data.attenders,
          notice : data.notice
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
      var ans = confirm("本当に削除してよろしいですか？");
      if(ans) { 
        remove(ref(db, "event/" + eventID)).then(() => {
          alert("削除しました。");
          location.reload();
        })
      }
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

  //パスワードの表示/非表示の切り替え
  function toggleshowcode() {
    if(getObj("eventCode").type == "password"){
      getObj("eventCode").type = "text";
      getObj("eye").innerHTML = '<i class="bi bi-eye"></i>';

      alert("ログ保存 : " + user.displayName + "がパスワードを閲覧");
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
  if(status == 0) { alert("出席連絡には部員登録が必要です。"); return; }

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

//企画コントロール
window.projectcontrol = (projectID, type) => { 
  switch (type) {
    case "new":
      getObj("projectID").value = new Date().getTime().toString(16).toUpperCase();
      getObj("projectTitle").value = "";
      getObj("projectDescription").value = "";
      getObj("projectDateBegin").value = "";
      getObj("projectDateEnd").value = "";
      getObj("MemberListTitle").hide();
      getObj("MemberList").hide();

      new bootstrap.Modal(getObj("editprojectModal")).show();
    break;
    case "edit":
      get(ref(db, "projects/" + projectID)).then((snapshot) => {
        let data = snapshot.val();

        getObj("projectID").value = projectID;
        getObj("projectTitle").value = data.title;
        getObj("projectDescription").value = data.description;
        getObj("projectDateBegin").value = data.term.begin;
        getObj("projectDateEnd").value = data.term.end;
        getObj("MemberListTitle").show();
        getObj("MemberList").show();
        getObj("MemberList").innerHTML = "";
        
        if(data.joiners) {
          getObj("noMember").hide();
          Object.keys(data.joiners).forEach((ID) => {
            getObj("MemberList").tail('<li class="list-group-item"><span class="text-secondary">' + users[ID].studentNumber + '</span> <span class="h6">' + users[ID].name + '</span></li>');
          })
        }
        else { getObj("noMember").show(); }
  
        new bootstrap.Modal(getObj("editprojectModal")).show();
      })

      //日付の書式をちゃんとする
      function DateString(date) {
        return String(date.getFullYear()) + "-" + addzero(date.getMonth() + 1) + "-" + addzero(date.getDate())
    
        function addzero(str) {
          if(String(str).length < 2) { return addzero("0" + String(str)); }
          else { return String(str); }
        }
      }
    break;
    case "save":
      //不備チェック
      try {
        if(!getObj("projectTitle").value) { e("タイトルが入力されていません"); }
        if(!getObj("projectDateBegin").value || !getObj("projectDateEnd").value) { e("日付が必要です"); }
        if(new Date(getObj("projectDateEnd").value) < new Date(getObj("projectDateBegin").value)) { e("日付が不正です"); }
        function e (msg) { throw new Error (msg); }
      } catch (msg) {
        alert(msg); return;
      }
      let id = getObj("projectID").value;
      if(!projects) { projects = {}; }
      if(!projects[id]) { projects[id] = {}; }
      projects[id].title = getObj("projectTitle").value;
      projects[id].description = getObj("projectDescription").value;
      projects[id].term = {
        begin : getObj("projectDateBegin").value,
        end : getObj("projectDateEnd").value
      };

      set(ref(db, "projects/" + id), projects[id])
      .then(() => { alert("保存しました。"); location.reload(); });
    break;
    case "del":
      let ans = confirm("削除してよろしいですか？");
      if(ans) {
        remove(ref(db, "projects/" + projectID))
        .then(() => { alert("削除しました"); location.reload(); })
      }
    break;
  
    default: break;
  }
}

window.projectReaction = (ID) => {
  //メンバーから削除
  if(projects[ID].joiners && projects[ID].joiners[user.uid]) {
    remove(ref(db, `projects/${ID}/joiners/${user.uid}`)).then(() => { alert("メンバーから削除しました"); });
    getObj("projectJoin" + ID).html('<i class="bi bi-person-plus"> </i>');
    // document.getElementById("JoinerNum" + ID).textContent = Number(getObj("JoinerNum" + ID).html) - 1;
  }
  //メンバーに登録
  else {
    update(ref(db, `projects/${ID}/joiners`), { [user.uid]: true }).then(() => { alert("メンバーに登録しました") });
    getObj("projectJoin" + ID).html('<i class="bi bi-person-check-fill" style="color: indigo"> </i>');
    // document.getElementById("JoinerNum" + ID).textContent = Number(getObj("JoinerNum" + ID).html) + 1;
  }
}