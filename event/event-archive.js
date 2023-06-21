// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-analytics.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";
import { getDatabase, ref, push, remove, set, get } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js";
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
var user = {};

var reasons = ["内容に興味なし", "大学の授業・研究活動", "アルバイト", "他サークル", "体調不良", "帰省", "家庭の用事", "その他"];

//データベースのデータ格納用
var events = {};
var likeList = []; //自分が「いいね」してたらTrue
var eventId = [];
var editting = -1;
var reactions;
var likeNum = [];
var attendNum = [];
var attendList = [];
var absentNum = [];
var absentList = [];
var users = {};
var userAttend;
var edittingAbsent = -1;
var amount;

var absentModal = new bootstrap.Modal(document.getElementById('absentModal'));

//ユーザー状態(0:ゲスト、1:部員、2:管理者)
var status;

//ユーザー情報の取得
onAuthStateChanged(auth, (snapshot) => {
  user = snapshot;

  if(!user) { window.location.href = "/"; }
  else{
    get(ref(db, "users/" + user.uid)).then((snapshot) => {
      if(snapshot.val()) { 
        get(ref(db, "admin-users/" + user.uid)).then((snapshot) => {
          if(snapshot.val()) { status = 2; } else { status = 1; }
          if(status == 2) { get(ref(db, ("users"))).then((snapshot) => { users = snapshot.val(); })}
        });
      }
      else { status = 0; }
      start(function end() { document.getElementById("overray").style.display = "none"; });
    })
  }

  get(ref(db, "users/" + user.uid + "/attend")).then((snapshot) => {
    userAttend = snapshot.val();
    //attendCheck();
  });

  get(ref(db, "users/" + user.uid + "/point")).then((snapshot) => {
    amount = snapshot.val();
  });
});

//読み込み時に実行
export function start(callback) {
  //タブはデフォルトでイベント状態にする
  switchtab(0);

  //イベントリストを表示
  get(ref(db, "event")).then((snapshot) => {
    events = snapshot.val();

    if(!events) { document.getElementById("noEvent").style.display = "block"; }

    sorteventKeys(snapshot.val()).forEach(eventID => {
      var element = events[eventID];
      //終了していないイベントを表示
      if(new Date() < new Date(element.term.end)) {
        var eventcolor;
        var timecolor;
        if(new Date(element.term.begin) < new Date()) { eventcolor = "darkred"; timecolor = "text-danger"; } else { eventcolor = "green"; timecolor = "text-muted"}
        document.getElementById("eventList_future").innerHTML += 
        '<div class="col-lg-6 p-2"><div class="card w-100 shadow-sm position-relative" style="border-left: solid ' + eventcolor + ' 10px;"><div class="card-body"><h5 class="card-title">' + element.title + '</h5><h6 class="card-subtitle mb-2 ' + timecolor + '">' + TermString(element.term) + ' <span class="badge bg-secondary" id="codeexist' + eventID + '">出席登録あり</span><br>' + element.place + '</h6><p class="text-primary text-small m-0">' + Tags(element.tags) + '</p><p class="card-text" style="height: 5em;">' + element.description + '</p><div class="mt-2" style="display: none;" id="adminbtn' + eventID + '"><div class="h5 card-link d-flex justify-content-around mb-0 text-secondary"><div><a style="cursor: pointer;" onclick="eventcontrol(\'' + eventID + '\', \'edit\')"><i class="bi bi-pencil-square"></i></a></div><div><a style="cursor: pointer;" onclick="eventcontrol(\'' + eventID + '\', \'del\')"><i class="bi bi-trash"></i></a></div></div></div></div><div id="attended-check' + eventID + '" style="display: none;" class="position-absolute top-0 end-0"><h1><i class="bi bi-check" style="color: green;"></i></h1></div></div></div>';
        //出席コードがあるイベントはバッジを表示
        if(element.code) { document.getElementById("codeexist" + eventID).style.display = "inline"; }
        else { document.getElementById("codeexist" + eventID).style.display = "none"; }
        
        //出席登録済みのイベントはチェックボタンを表示
        if(element.attenders && element.attenders[user.uid]) { document.getElementById("attended-check" + eventID).style.display = "block"; }
        //管理者権限があれば編集ボタンを表示
        if(status == 2) { document.getElementById("adminbtn" + eventID).style.display = "block"; }
      }
      //終了済みのイベントを表示
      else{
        document.getElementById("endEvents").innerHTML =
        '<div class="col-lg-6 p-2"><div class="card w-100 shadow-sm position-relative" style="border-left: solid gray 10px;"><div class="card-body"><h5 class="card-title">' + element.title + '</h5><h6 class="card-subtitle mb-2 text-muted">' + TermString(element.term) + ' <span class="badge bg-secondary" id="codeexist' + eventID + '">出席登録者あり</span><br>' + element.place + '</h6><p class="text-primary text-small m-0">' + Tags(element.tags) + '</p><div class="mt-2" style="display: none;" id="adminbtn' + eventID + '"><div class="h5 card-link d-flex justify-content-around mb-0 text-secondary"><div><a style="cursor: pointer;" onclick="eventcontrol(\'' + eventID + '\', \'edit\')"><i class="bi bi-pencil-square"></i></a></div><div><a style="cursor: pointer;" onclick="eventcontrol(\'' + eventID + '\', \'del\')"><i class="bi bi-trash"></i></a></div></div></div></div><div id="attended-check' + eventID + '" style="display: none;" class="position-absolute top-0 end-0"><h1><i class="bi bi-check" style="color: green;"></i></h1></div></div></div>'
        + document.getElementById("endEvents").innerHTML;
        //出席コードがあったイベントはバッジを表示
        if(element.attenders) { document.getElementById("codeexist" + eventID).style.display = "inline"; }
        else { document.getElementById("codeexist" + eventID).style.display = "none"; }
        
        //出席登録済みのイベントはチェックボタンを表示
        if(element.attenders && element.attenders[user.uid]) { document.getElementById("attended-check" + eventID).style.display = "block"; }
        //管理者権限があれば編集ボタンを表示
        if(status == 2) { document.getElementById("adminbtn" + eventID).style.display = "block"; }
      }
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

  /*
    setTextareaSize();
    document.getElementById("detail").style.height = "120px";

    get(ref(db, "eventReactions")).then((snapshot) => {
        reactions = snapshot.val();
    });

    get(ref(db, "event")).then((snapshot) => {
        document.getElementById("loadingEvent").style.display = "none";

        if(snapshot.exists()) {
            //イベントリストの表示
            if(Object.keys(snapshot.val()).length != Object.keys(events).length) {
                document.getElementById("eventList").innerHTML = "";
                events = snapshot.val();

                Object.keys(events).forEach((key, index) => {
                    eventId[index] = key;

                    likeNum[key] = 0;
                    attendNum[key] = 0;
                    absentNum[key] = 0;

                    var likeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-secondary bi bi-suit-heart" viewBox="0 0 16 16"><path d="m8 6.236-.894-1.789c-.222-.443-.607-1.08-1.152-1.595C5.418 2.345 4.776 2 4 2 2.324 2 1 3.326 1 4.92c0 1.211.554 2.066 1.868 3.37.337.334.721.695 1.146 1.093C5.122 10.423 6.5 11.717 8 13.447c1.5-1.73 2.878-3.024 3.986-4.064.425-.398.81-.76 1.146-1.093C14.446 6.986 15 6.131 15 4.92 15 3.326 13.676 2 12 2c-.777 0-1.418.345-1.954.852-.545.515-.93 1.152-1.152 1.595L8 6.236zm.392 8.292a.513.513 0 0 1-.784 0c-1.601-1.902-3.05-3.262-4.243-4.381C1.3 8.208 0 6.989 0 4.92 0 2.755 1.79 1 4 1c1.6 0 2.719 1.05 3.404 2.008.26.365.458.716.596.992a7.55 7.55 0 0 1 .596-.992C9.281 2.049 10.4 1 12 1c2.21 0 4 1.755 4 3.92 0 2.069-1.3 3.288-3.365 5.227-1.193 1.12-2.642 2.48-4.243 4.38z"/></svg>';
                    var attendIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-secondary bi bi-check-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/></svg>';
                    var absentIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-secondary bi bi-x-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>';
                    var tagText = "";
                    var color = "#aaa";

                    likeList[index] = false;
                    attendList[index] = false;

                    //イベントのリアクション
                    if(reactions) {
                        if(reactions[key]) {
                            //いいねしてるかどうか＆いいね数
                            if(reactions[key].likes) {
                                likeNum[key] = Object.keys(reactions[key].likes).length;

                                Object.keys(reactions[key].likes).forEach((key2, index2) => {
                                    if(user != null) {
                                        if(key2 == user.uid) {
                                            likeList[index] = true;
                                            likeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-danger bi bi-suit-heart-fill" viewBox="0 0 16 16"><path d="M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1z"/></svg>';
                                        }
                                    }
                                });
                            }

                            //参加する
                            if(reactions[key].attend) {
                                attendNum[key] = Object.keys(reactions[key].attend).length;

                                Object.keys(reactions[key].attend).forEach((key2, index2) => {
                                    if(user != null) {
                                        if(key2 == user.uid) {
                                            attendList[index] = true;
                                            attendIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-primary bi bi-check-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>';
                                        }
                                    }
                                });
                            }

                            //不参加
                            if(reactions[key].absent) {
                                absentNum[key] = Object.keys(reactions[key].absent).length;

                                Object.keys(reactions[key].absent).forEach((key2, index2) => {
                                    if(user != null) {
                                        if(key2 == user.uid) {
                                            absentList[index] = true;
                                            absentIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-danger bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg>';
                                        }
                                    }
                                });
                            }
                        }
                    }
                    

                    if(events[key].tags) {
                        events[key].tags.forEach((tag, index3) => {
                            tagText += "#"+ tag + " ";
                        });
                    }

                    switch(events[key].type) {
                        case 0 :
                            color = '#3af';
                            break;
                        
                        case 1 :
                            color = '#b94047';
                            break;
                        
                        case 2 :
                            color = '#0a3';
                            break;
                        
                        case 3 :
                            color = '#eb0';
                            break;
                    }

                    if(events[key].end) {
                        document.getElementById("endEvents").innerHTML += '<div class="col-lg-4 px-3 py-2"><div class="card shadow-sm" style="border-left: 12px solid '+color+'; cursor:pointer; border-radius: 10px;"><div class="card-body"><div onclick="openInfo('+index+')" data-bs-toggle="modal" data-bs-target="#exampleModal"><h5 class="card-title">'+events[key].title+'</h5><h6 class="card-subtitle mb-2 text-muted small">'+events[key].date+'<br>'+events[key].place+'</h6><p class="card-text small" style="height: 8em;">'+events[key].description+'<br><span class="mx-1 text-primary">'+tagText+'</span></p></div><div class="card-link" style="text-decoration: none;"><span id="like_'+index+'" onclick="pushLike('+index+')">'+likeIcon+'</span><span class="text-secondary mx-1 me-3" id="num_'+index+'">'+likeNum[key]+'</span><span id="attend_'+index+'" onclick="pushAttend('+index+')">'+attendIcon+'</span><span class="text-secondary mx-1 me-3" id="num2_'+index+'">'+attendNum[key]+'</span><span id="absent_'+index+'" onclick="pushAbsent('+index+')">'+absentIcon+'</span><span class="text-secondary mx-1 me-2" id="num3_'+index+'">'+absentNum[key]+'</span></div><div class="position-absolute end-0 top-0" id="attended_'+index+'"><div></div></div></div>';
                    } else {
                        document.getElementById("eventList").innerHTML += '<div class="col-lg-4 px-3 py-2"><div class="card shadow-sm" style="border-left: 12px solid '+color+'; cursor:pointer; border-radius: 10px;"><div class="card-body"><div onclick="openInfo('+index+')" data-bs-toggle="modal" data-bs-target="#exampleModal"><h5 class="card-title">'+events[key].title+'</h5><h6 class="card-subtitle mb-2 text-muted small">'+events[key].date+'<br>'+events[key].place+'</h6><p class="card-text small" style="height: 8em;">'+events[key].description+'<br><span class="mx-1 text-primary">'+tagText+'</span></p></div><div class="card-link" style="text-decoration: none;"><span id="like_'+index+'" onclick="pushLike('+index+')">'+likeIcon+'</span><span class="text-secondary mx-1 me-3" id="num_'+index+'">'+likeNum[key]+'</span><span id="attend_'+index+'" onclick="pushAttend('+index+')">'+attendIcon+'</span><span class="text-secondary mx-1 me-3" id="num2_'+index+'">'+attendNum[key]+'</span><span id="absent_'+index+'" onclick="pushAbsent('+index+')">'+absentIcon+'</span><span class="text-secondary mx-1 me-2" id="num3_'+index+'">'+absentNum[key]+'</span></div><div class="position-absolute end-0 top-0" id="attended_'+index+'"><div></div></div></div>';
                    }
                });
            }
        } else {
            document.getElementById("noEvent").style.display = "";
        }
    })
    .catch((error) => {
        document.getElementById("errorEvent").innerHTML = error
    });
    */
}
window.start = start;

//イベント情報のアップロード
/*
function upload() {
    var tags = document.getElementById("tag").value.split(" ");

    var setData = {
        title : document.getElementById("title").value,
        date : document.getElementById("dateForm").value,
        place : document.getElementById("place").value,
        description : document.getElementById("detail").value,
        type : document.getElementById("type").selectedIndex,
        tags : tags,
        code : document.getElementById("attendNum").value,
        point : Number(document.getElementById("point").value),
        end : document.getElementById("ended").checked
    }

    if(editting == -1) {
        push(ref(db, "event"), setData)
        .then(() => {
            window.location.reload();
        });
    } else {
        set(ref(db, 'event/' + eventId[editting]), setData)
        .then(() => {
            window.location.reload();
        });
    }
}

window.upload = upload;
export{upload}
*/

/*
//フォームをクリア
function clearForm() {
    editting = -1;
    document.getElementById("title").value = "";
    document.getElementById("dateForm").value = "";
    document.getElementById("place").value = "";
    document.getElementById("detail").value = "";
    document.getElementById("point").value = "0";
    document.getElementById("type").selectedIndex = -1;
    document.getElementById("attendNum").value = "";
    document.getElementById("tag").value = "";
    document.getElementById("codeSet").style.display = "none";
}

window.clearForm = clearForm;
export{clearForm}
*/

/*
//イベント情報の表示
function openInfo(index) {
    editting = index;
    document.getElementById("title").value = events[eventId[index]].title;
    document.getElementById("dateForm").value = events[eventId[index]].date;
    document.getElementById("place").value = events[eventId[index]].place;
    document.getElementById("point").value = events[eventId[index]].point;
    document.getElementById("detail").value = events[eventId[index]].description;
    document.getElementById("type").selectedIndex = events[eventId[index]].type;
    //document.getElementById("attendNum").value = events[eventId[index]].code;
    document.getElementById("tag").value = events[eventId[index]].tags.join(' ');

    document.getElementById("detail").style.height = "120px";

    document.getElementById("heartList").innerHTML = "";
    document.getElementById("noHeart").style.display = "";

    document.getElementById("absentList").innerHTML = "";
    document.getElementById("noAbsent").style.display = "";

    document.getElementById("attendList").innerHTML = "";
    document.getElementById("noAttend").style.display = "";

    document.getElementById("totalAttended").textContent = "";
    if(reactions) {
        if(reactions[eventId[editting]]) {
            if(reactions[eventId[editting]].attended) {
                document.getElementById("totalAttended").textContent = Object.keys(reactions[eventId[editting]].attended).length + "人";
            }
        }
    }

    if(events[eventId[index]].code) {
        document.getElementById("codeSet").style.display = "";
    } else {
        document.getElementById("codeSet").style.display = "none";
    }
}

window.openInfo = openInfo;
export{openInfo}
*/

/*
//いいねを押す
function pushLike(index) {
    if(user == null) {return;}
    
    if(likeList[index]) {
        document.getElementById("like_"+index).innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-secondary bi bi-suit-heart" viewBox="0 0 16 16"><path d="m8 6.236-.894-1.789c-.222-.443-.607-1.08-1.152-1.595C5.418 2.345 4.776 2 4 2 2.324 2 1 3.326 1 4.92c0 1.211.554 2.066 1.868 3.37.337.334.721.695 1.146 1.093C5.122 10.423 6.5 11.717 8 13.447c1.5-1.73 2.878-3.024 3.986-4.064.425-.398.81-.76 1.146-1.093C14.446 6.986 15 6.131 15 4.92 15 3.326 13.676 2 12 2c-.777 0-1.418.345-1.954.852-.545.515-.93 1.152-1.152 1.595L8 6.236zm.392 8.292a.513.513 0 0 1-.784 0c-1.601-1.902-3.05-3.262-4.243-4.381C1.3 8.208 0 6.989 0 4.92 0 2.755 1.79 1 4 1c1.6 0 2.719 1.05 3.404 2.008.26.365.458.716.596.992a7.55 7.55 0 0 1 .596-.992C9.281 2.049 10.4 1 12 1c2.21 0 4 1.755 4 3.92 0 2.069-1.3 3.288-3.365 5.227-1.193 1.12-2.642 2.48-4.243 4.38z"/></svg>';

        likeList[index] = false;

        remove(ref(db, "eventReactions/" + eventId[index] + "/likes/" + user.uid));

        likeNum[eventId[index]] --;
    } else {
        document.getElementById("like_"+index).innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-danger bi bi-suit-heart-fill" viewBox="0 0 16 16"><path d="M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1z"/></svg>';

        likeList[index] = true;

        set(ref(db, "eventReactions/" + eventId[index] + "/likes/" + user.uid), true);

        likeNum[eventId[index]] ++;
    }

    document.getElementById("num_"+index).innerHTML = likeNum[eventId[index]];
}

window.pushLike = pushLike;
export{pushLike}
*/

/*
//テキストエリアの高さを自動調整
function setTextareaSize() {
    // textareaタグを全て取得
    const textareaEls = document.querySelectorAll("textarea");
  
    textareaEls.forEach((textareaEl) => {
      // デフォルト値としてスタイル属性を付与
      textareaEl.setAttribute("style", `height: ${textareaEl.scrollHeight}px;`);
      // inputイベントが発生するたびに関数呼び出し
      textareaEl.addEventListener("input", setTextareaHeight);
    });
  
    // textareaの高さを計算して指定する関数
    function setTextareaHeight() {
      this.style.height = "auto";
      this.style.height = `${this.scrollHeight}px`;
    }
  };
  */

  /*
//イベント情報の削除
function delItem() {
    if(editting == -1) {alert("現在開いているイベントは未保存です。"); return;}

    var result = confirm("「" + events[eventId[editting]].title + "」を削除してよろしいですか？");

    if(!result) {return;}

    remove(ref(db, "event/" + eventId[editting]))
    .then(() => {
        remove(ref(db, "eventReactions/" + eventId[editting]))
        window.location.reload();
    })
}

window.delItem = delItem;
export{delItem}
*/

/*
//いいね一覧の表示
function dispHeart() {
    if(!users) {
        get(ref(db, "users"))
        .then((snapshot) => {
            users = snapshot.val();
            dispHeart2();
        })
        .catch((error) => {
            document.getElementById("noHeart").textContent = error;
        })
    } else {
        dispHeart2();
    }
}

window.dispHeart = dispHeart;
export{dispHeart}
*/

//いいね一覧（実際に表示するのはこっち）
/*
function dispHeart2() {
    document.getElementById("heartList").innerHTML = "";

    if(reactions) {
        if(reactions[eventId[editting]]) {
            if(reactions[eventId[editting]].likes) {
                document.getElementById("noHeart").style.display = "none";

                Object.keys(reactions[eventId[editting]].likes).forEach((key, i) => {
                    if(users[key]) {
                        document.getElementById("heartList").innerHTML += '<li class="list-group-item"><h6>'+users[key].name + '<span class="text-secondary mx-1">' + users[key].studentNumber + '</span></h6><div class="small text-secondary">'+users[key].department+' '+users[key].grade+'年</div></li>';
                    }
                });
            }
        }
    }
}
*/

/*
//参加ボタンを押したら
function pushAttend(index) {
    if(user == null) {return;}
    
    if(attendList[index]) {
        document.getElementById("attend_"+index).innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-secondary bi bi-check-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/></svg>';

        attendList[index] = false;

        remove(ref(db, "eventReactions/" + eventId[index] + "/attend/" + user.uid));

        attendNum[eventId[index]] --;
    } else {
        document.getElementById("attend_"+index).innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-primary bi bi-check-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>';

        attendList[index] = true;

        set(ref(db, "eventReactions/" + eventId[index] + "/attend/" + user.uid), true);

        attendNum[eventId[index]] ++;
    }

    document.getElementById("num2_"+index).innerHTML = attendNum[eventId[index]];
}

window.pushAttend = pushAttend;
export{pushAttend}
*/

//出席登録
/*
function attend() {
    document.getElementById("errorAttend").innerHTML = "";

    if(document.getElementById("code").value == "") {
        return;
    }

    var code = document.getElementById("code").value;
    var successed = false;

    Object.keys(events).forEach((key, index) => {
        if(code == Number(events[key].code)) {
            successed = true;

            if(userAttend) {
                if(userAttend[key]) {
                    alert("既に出席登録しています。");
                    return;
                }
            }

            set(ref(db, "eventReactions/" + key + "/attended/" + user.uid), true);

            set(ref(db, "users/" + user.uid + "/attend/" + key), {
                date : (new Date()).getTime(),
                title : events[key].title
            })
            .then(() => {
                document.getElementById("pointText").textContent = "";

                if(events[key].point) {
                    amount += events[key].point;
                    set(ref(db, "users/" + user.uid + "/point/"), amount);
                    push(ref(db, "users/" + user.uid + "/pointHistory/"+ (new Date()).getFullYear() + "/"), {
                        date : (new Date()).getTime(),
                        mode : 1,
                        amount : events[key].point,
                        title : events[key].title+" への出席登録"
                    });

                    document.getElementById("pointText").textContent = events[key].point+"pt 受け取りました";
                }

                document.getElementById("success").style.display = "";
                document.getElementById("successText").textContent = events[key].title;
                document.getElementById("attendBtn").disabled = true;
            });
        }
    });

    if(!successed) {
        document.getElementById("errorAttend").innerHTML = "入力された出席コードは無効です。";
    }
}

window.attend = attend;
export{attend}
*/

/*
//出席済みかの確認
function attendCheck() {
    if(!user) {return;}
    
    Object.keys(events).forEach((key, index) => {
        var attended = "";
        //出席登録済みか確認
        if(userAttend) {
            if(userAttend[key]) {
                attended = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" class="text-success bi bi-check mx-2 my-2" viewBox="4 3 7 10"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg>';
    
                document.getElementById("attended_"+index).innerHTML = attended;
            }
        }
    });
}
*/

/*
//不参加ボタンを押したら
function pushAbsent(index) {
    if(user == null) {return;}
    
    if(absentList[index]) {
        document.getElementById("absent_"+index).innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-secondary bi bi-x-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>';

        absentList[index] = false;

        remove(ref(db, "eventReactions/" + eventId[index] + "/absent/" + user.uid));

        absentNum[eventId[index]] --;
    } else {
        document.getElementById("absent_"+index).innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-danger bi bi-x-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg>';

        absentList[index] = true;

        set(ref(db, "eventReactions/" + eventId[index] + "/absent/" + user.uid), true);

        absentNum[eventId[index]] ++;

        absentModal.show();
        edittingAbsent = index;
    }

    document.getElementById("num3_"+index).innerHTML = absentNum[eventId[index]];
}

window.pushAbsent = pushAbsent;
export{pushAbsent}
*/

/*
//欠席理由送信
function absent() {
    if(!user) {alert("ログインしてください。"); return;}

    if(edittingAbsent == -1) {return;}

    set(ref(db, "eventReactions/" + eventId[edittingAbsent] + "/absent/" + user.uid), {
        reason : document.getElementById("absentReason").selectedIndex,
        detail : document.getElementById("absentDetail").value
    })
    .then(() => {
        alert("送信しました。");
        absentModal.hide();
    });
}

window.absent = absent;
export{absent}
*/

/*
//不参加一覧の表示
function dispAbsent() {
    if(!users) {
        get(ref(db, "users"))
        .then((snapshot) => {
            users = snapshot.val();
            dispAbsent2();
        })
        .catch((error) => {
            document.getElementById("noAbsent").textContent = error;
        })
    } else {
        dispAbsent2();
    }
}

window.dispAbsent = dispAbsent;
export{dispAbsent}
*/

/*
//不参加一覧（実際に表示するのはこっち）
function dispAbsent2() {
    document.getElementById("absentList").innerHTML = "";

    if(reactions) {
        if(reactions[eventId[editting]]) {
            if(reactions[eventId[editting]].absent) {
                document.getElementById("noAbsent").style.display = "none";

                Object.keys(reactions[eventId[editting]].absent).forEach((key, i) => {
                    if(users[key]) {
                        document.getElementById("absentList").innerHTML += '<li class="list-group-item"><h6>'+users[key].name + '<span class="text-secondary mx-1">' + users[key].studentNumber + '</span></h6><div class="small text-secondary">'+users[key].department+' '+users[key].grade+'年</div><div class="small">理由：'+reasons[reactions[eventId[editting]].absent[key].reason]+'<span class="mx-2 text-secondary">'+reactions[eventId[editting]].absent[key].detail+'</span></div></li>';
                    }
                });
            }
        }
    }
}
*/

//参加者一覧の表示
/*
function dispAttend() {
    if(!users) {
        get(ref(db, "users"))
        .then((snapshot) => {
            users = snapshot.val();
            dispAttend2();
        })
        .catch((error) => {
            document.getElementById("noAttend").textContent = error;
        })
    } else {
        dispAttend2();
    }
}

window.dispAttend = dispAttend;
export{dispAttend}
*/

/*
//参加者一覧（実際に表示するのはこっち）
function dispAttend2() {
    document.getElementById("attendList").innerHTML = "";

    if(reactions) {
        if(reactions[eventId[editting]]) {
            if(reactions[eventId[editting]].attend) {
                document.getElementById("noAttend").style.display = "none";

                Object.keys(reactions[eventId[editting]].attend).forEach((key, i) => {
                    if(users[key]) {
                        document.getElementById("attendList").innerHTML += '<li class="list-group-item"><h6>'+users[key].name + '<span class="text-secondary mx-1">' + users[key].studentNumber + '</span></h6><div class="small text-secondary">'+users[key].department+' '+users[key].grade+'年</div></li>';
                    }
                });
            }
        }
    }
}
*/

/*
//出席済み一覧の表示
function dispAttended() {
    if(!users) {
        get(ref(db, "users"))
        .then((snapshot) => {
            users = snapshot.val();
            dispAttended2();
        })
        .catch((error) => {
            document.getElementById("noAttended").textContent = error;
        })
    } else {
        dispAttended2();
    }
}

window.dispAttended = dispAttended;
export{dispAttended}
*/

/*
//出席済み一覧（実際に表示するのはこっち）
function dispAttended2() {
    document.getElementById("attendedList").innerHTML = "";

    if(reactions) {
        if(reactions[eventId[editting]]) {
            if(reactions[eventId[editting]].attended) {
                document.getElementById("noAttended").style.display = "none";

                Object.keys(reactions[eventId[editting]].attended).forEach((key, i) => {
                    if(users[key]) {
                        document.getElementById("attendedList").innerHTML += '<li class="list-group-item"><h6>'+users[key].name + '<span class="text-secondary mx-1">' + users[key].studentNumber + '</span></h6><div class="small text-secondary">'+users[key].department+' '+users[key].grade+'年</div></li>';
                    }
                });
            }
        }
    }
}
*/

//タブ切り替え
export function switchtab(i) {
  var display = []; //eventtab, projecttab, event, project
  if(i) { display = ["none", "flex", "none", "block"]; }
  else  { display = ["flex", "none", "block", "none"]; }

  document.getElementById("tab-event").style.display = display[0];
  document.getElementById("tab-project").style.display = display[1];
  document.getElementById("event").style.display = display[2];
  document.getElementById("project").style.display = display[3];
  document.getElementById("addEventBtn").style.display = display[2];
  document.getElementById("addProjectBtn").style.display = display[3];
}
window.switchtab = switchtab;

var editeventModal = new bootstrap.Modal(document.getElementById("editeventModal"));
//イベントコントロール
export function eventcontrol(eventID, type) {
  if(status != 2) { alert("管理者権限がありません"); return; }
  switch (type) {
    //新規作成
    case "new":
      document.getElementById("eventID").value = new Date().getTime().toString(16).toUpperCase();
      document.getElementById("eventTitle").value = "";
      document.getElementById("eventDescription").value = "";
      document.getElementById("eventDescription").style.height = "8em";
      document.getElementById("eventDateRadio-allday").checked = true;
      document.getElementById("eventDateRadio-time").checked = false;
      alldaytab(true, true);
      document.getElementById("eventDateBegin").value = DateString(new Date(), true);
      document.getElementById("eventDateEnd").value = DateString(new Date(), true);
      document.getElementById("eventDate").value = DateString(new Date(), true);
      document.getElementById("eventTimeBegin").value = "18:05";
      document.getElementById("eventTimeEnd").value = "20:00";
      document.getElementById("eventLocation").value = "";
      document.getElementById("eventTags").value = "";
      document.getElementById("eventCode").value = "";
      document.getElementById("eventCode").type = "password";
      document.getElementById("eye").innerHTML = '<i class="bi bi-eye-slash"></i>';
      document.getElementById("eventPoint").value = 300;
        
      editeventModal.show();
    break;
    //編集する
    case "edit":
      get(ref(db, "event/" + eventID)).then((snapshot) => {
        var data = snapshot.val();
        document.getElementById("eventID").value = eventID;
        document.getElementById("eventTitle").value = data.title;
        document.getElementById("eventDescription").value = data.description;
        document.getElementById("eventDescription").style.height = "8em";
        document.getElementById("eventDateRadio-allday").checked = data.term.allday;
        document.getElementById("eventDateRadio-time").checked = !data.term.allday;
        alldaytab(data.term.allday, true);
        document.getElementById("eventDateBegin").value = DateString(new Date(data.term.begin), true);
        document.getElementById("eventDateEnd").value = DateString(new Date(data.term.end), true);
        document.getElementById("eventDate").value = DateString(new Date(data.term.begin), true);
        if(!data.term.allday) {
          document.getElementById("eventTimeBegin").value = DateString(new Date(data.term.begin), false);
          document.getElementById("eventTimeEnd").value = DateString(new Date(data.term.end), false);
        }
        document.getElementById("eventLocation").value = data.place;
        document.getElementById("eventTags").value = tagtag(data.tags, true);
        document.getElementById("eventCode").value = data.code;
        document.getElementById("eventCode").type = "password";
        document.getElementById("eye").innerHTML = '<i class="bi bi-eye-slash"></i>';
        document.getElementById("eventPoint").value = data.point;
        if(data.attenders){
          document.getElementById("attendersList").innerHTML = "";
          Object.keys(data.attenders).forEach((ID) => {
            document.getElementById("attendersList").innerHTML +=
            '<li class="list-group-item"><span class="text-secondary">' + users[ID].studentNumber + '</span> <span class="h6">' + users[ID].name + '</span></li>'
          })
        }
        
        editeventModal.show();
      })
    break;
    //保存する
    case "save":
      eventID = document.getElementById("eventID").value;
      //不備チェック
      try {
        if(!document.getElementById("eventTitle").value) { e("タイトルが入力されていません") }
        if(document.getElementById("eventDateRadio-allday").checked && new Date(document.getElementById("eventDateBegin").value) > new Date(document.getElementById("eventDateEnd").value)) { e("日付が不正です"); }
        if(document.getElementById("eventDateRadio-time").checked && new Date("1983-04-15 " + document.getElementById("eventTimeBegin").value) > new Date("1983-04-15 " + document.getElementById("eventTimeEnd").value)) { e("時刻が不正です"); }
        if(!document.getElementById("eventDateBegin").value || !document.getElementById("eventDate")) { e("日付が入力されていません") }
        if(!document.getElementById("eventDateBegin").value && (!document.getElementById("eventTimeBegin").value || !document.getElementById("eventTimeEnd").value)) { e("日時が入力されていません"); }
        if(document.getElementById("eventDateBegin").value && !document.getElementById("eventDateEnd").value) {
          document.getElementById("eventDateEnd").value = document.getElementById("eventDateBegin").value
        }
        if(document.getElementById("eventTimeBegin") && !document.getElementById("eventTimeEnd")) {
          document.getElementById("eventTimeEnd").value = DateString(new Date(document.getElementById("eventTimeEnd").value) + (1000 * 60 * 60)); 
        }
        if(document.getElementById("eventPoint").value < 0) { e("出席するとポイント奪われるとか何考えてるんですか"); }
        function e(msg) { throw new Error(msg); }
      } catch (error) {
        alert(error); return;
      }

      //日付は先にセット
      var term = {};
      if(document.getElementById("eventDateRadio-allday").checked){
        term = {
          allday : true,
          begin : document.getElementById("eventDateBegin").value,
          end : document.getElementById("eventDateEnd").value
        }
      }
      else{
        term = {
          allday : false,
          begin : document.getElementById("eventDate").value + " " + document.getElementById("eventTimeBegin").value,
          end : document.getElementById("eventDate").value + " " + document.getElementById("eventTimeEnd").value
        }
      }

      get(ref(db, "event/" + eventID + "/attenders")).then((snapshot) => {
        set(ref(db, "event/" + eventID), {
          title : document.getElementById("eventTitle").value,
          description : document.getElementById("eventDescription").value,
          term : term,
          place : document.getElementById("eventLocation").value,
          tags : tagtag(document.getElementById("eventTags", false).value),
          code : document.getElementById("eventCode").value,
          point : document.getElementById("eventPoint").value,
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
    if(!start && allday == document.getElementById("eventDateRadio-allday").checked) { return; }
    if(allday){
      document.getElementById("eventDateTab-allday").style.display = "flex";
      document.getElementById("eventDateTab-time").style.display = "none";
      if(!start){
        document.getElementById("eventDateBegin").value = DateString(new Date(document.getElementById("eventDate").value), true);
        document.getElementById("eventDateEnd").value = DateString(new Date(document.getElementById("eventDate").value), true);
      }
    }
    else {
      document.getElementById("eventDateTab-allday").style.display = "none";
      document.getElementById("eventDateTab-time").style.display = "flex";
      if(!start){
        document.getElementById("eventDate").value = DateString(new Date(document.getElementById("eventDateBegin").value), true);
        if(!document.getElementById("eventTimeBegin").value && !document.getElementById("eventTimeEnd").value){
          document.getElementById("eventTimeBegin").value = "18:05";
          document.getElementById("eventTimeEnd").value = "20:00";
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
    if(document.getElementById("eventCode").type == "password"){
      document.getElementById("eventCode").type = "text";
      document.getElementById("eye").innerHTML = '<i class="bi bi-eye"></i>';
    }
    else {
      document.getElementById("eventCode").type = "password";
      document.getElementById("eye").innerHTML = '<i class="bi bi-eye-slash"></i>';
    }
  }
  window.toggleshowcode = toggleshowcode;
}
window.eventcontrol = eventcontrol;