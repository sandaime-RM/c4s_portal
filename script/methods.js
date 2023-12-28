//画面上の要素をオブジェクトで取得
export class Obj {
  constructor(id) {
    let obj = document.getElementById(id);
    if(obj) {
      //表示・非表示
      obj.hide = function () { this.style.display = "none"; }
      obj.show = function (style) {
        if(style) { this.style.display = style; }
        else { this.style.display = "inherit"; }
      }
      //HTMLに追加
      obj.before = function ( HTML ) { this.innerHTML = HTML + this.innerHTML; }
      obj.after = function ( HTML ) { this.innerHTML += HTML; }
      obj.set = function ( HTML ) {
        if(HTML) { this.innerHTML = HTML; }
        else { this.innerHTML = ""; }
      }
      //onclick属性をaddeventlistenerで追加
      obj.tap = (f) => { this.onclick = f; }
    }
    return obj;
  }
}

export class Hizke {
  data; year; month; date; hour; minute;

  constructor(snapshot) {
    if(!snapshot) { this.data = new Date(); return; }
    this.data = new Date(snapshot);
    this.year = this.data.getFullYear();
    this.month = this.data.getMonth()+1;
    this.date = this.data.getDate();
    this.hour = this.data.getHours();
    this.minute = this.data.getMinutes();
  }

  DateInput() {
    return this.year + "-" + addzero(this.month.toString()) + "-" + addzero(this.date.toString());
    function addzero (str) { if(str[1]) { return String(str); } else { return addzero("0" + str); }}
  }

  DateText() {
    var dif = Math.round(new Date(DateInput(this.date)) - (new Date(DateInput(new Date()))) / 1000 / 60 / 60 / 24);
    switch (dif) {
      case 2: return "あさって";
      case 1: return "あした";
      case 0: return "きょう";
      case -1:return "きのう";
      case -2:return "おととい";
      default:
        if(-7 < dif && dif < 0) { return String(dif)+"日前"; }
        if(0 < dif && dif < 7)  { return String(dif)+"日後"; }
      break;
    }
    if(new Date().getFullYear() != this.year) {
      return String(this.year) + "年" + String(this.month) + "月" + String(this.date) + "日"
    }
    else {
      return String(this.month) + "月" + String(this.date) + "日"
    }
  }
}

// 非推奨、Objクラスを使用する
export function getObj(id) {
  var obj = document.getElementById(id);
  if(obj){
    //表示・非表示
    obj.hide = function () { this.style.display = "none"; }
    obj.show = function (style) {
      if(style) { this.style.display = style; }
      else { this.style.display = "inherit"; }
    }
    //HTMLに追加
    obj.head = function ( HTML ) { this.innerHTML = HTML + obj.innerHTML; }
    obj.tail = function ( HTML ) { this.innerHTML += HTML; }
    obj.html = function ( HTML ) {
      if(HTML) { this.innerHTML = HTML; }
      else { this.innerHTML = ""; }
    }
  }
  return obj;
}

// 非推奨、Hizkeクラスを使用する
export function DateText(date) {
  var dif = Math.round(new Date(DateInput(date)) - (new Date(DateInput(new Date()))) / 1000 / 60 / 60 / 24);
  switch (dif) {
    case 2: return "あさって";
    case 1: return "あした";
    case 0: return "きょう";
    case -1:return "きのう";
    case -2:return "おととい";
    default:
      if(-7 < dif && dif < 0) { return String(dif)+"日前"; }
      if(0 < dif && dif < 7)  { return String(dif)+"日後"; }
    break;
  }
  if(new Date().getFullYear() != date.getFullYear()) {
    return String(date.getFullYear()) + "年" + String(date.getMonth() + 1) + "月" + String(date.getDate()) + "日"
  }
  else {
    return String(date.getMonth() + 1) + "月" + String(date.getDate()) + "日"
  }
}

// 非推奨、Hizkeクラスを使用する
export function DateInput(input) {
  let date;
  if(!input) { date = new Date(); } else { date = new Date(input); }
  return date.getFullYear() + "-" + addzero((date.getMonth() + 1).toString()) + "-" + addzero(date.getDate().toString());
  function addzero (str) { if(str[1]) { return String(str); } else { return addzero("0" + str); }}
}

//部員をソート(users:全ユーザーのデータ、keys:ソートしたい部員のIDリスト)
export function sortMembers(users, keys){
  var leaders = [];
  var active_keys = [];
  var new_keys = [];
  var outsiders = [];
  var rest = keys;

  //部員ではないユーザー
  rest.forEach((i) => {
    if(!users[i]) {
      console.warn("ID:" + i + "は部員ではありません");
      outsiders.push(i);
    }
  });
  outsiders.forEach((element) => { 
    rest.splice(rest.indexOf(element), 1);
  });
  
  //部長を抽出
  rest.forEach((i) => {
    if(users[i].role == "leader") { leaders.push(i); }
  });
  //副部長を抽出
  rest.forEach((i) => {
    if(users[i].role == "subleader") { leaders.push(i); }
  });
  //会計を抽出
  rest.forEach((i) => {
    if(users[i].role == "treasurer") { leaders.push(i); }
  });
  leaders.forEach(element => {
    rest.splice(rest.indexOf(element),1);
  });
  //現役を抽出
  rest.forEach((i) => {
    if(users[i].role == "active") { active_keys.push(i); }
  });
  active_keys = sort_grade(users, active_keys);
  active_keys.forEach(element => {
    rest.splice(rest.indexOf(element),1);
  });
  //新入部員を抽出
  rest.forEach((i) => {
    if(users[i].role == "new") { new_keys.push(i); }
  });
  new_keys = sort_grade(users, new_keys);
  new_keys.forEach(element => {
    rest.splice(rest.indexOf(element),1);
  });

  return [...leaders, ...active_keys, ...new_keys, ...rest];

  //学年でソート:made by toyton
  function sort_grade(data, keys){
    var others = [];
    var fours = [];
    var threes = [];
    var twoes = [];
    var ones = [];
  
    keys.forEach(id => {
      switch (data[id].grade) {
        case 4: fours.push(id);   break;
        case 3: threes.push(id);  break;
        case 2: twoes.push(id);   break;
        case 1: ones.push(id);    break;
        default: others.push(id); break;
      }
    });
    return [...others, ...fours, ...threes, ...twoes, ...ones];
  }
}