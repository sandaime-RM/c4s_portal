export function getObj(id) {
  var obj = document.getElementById(id);
  if(obj){
    obj.hide = function () { this.style.display = "none"; }
    obj.show = function (style) {
      if(style) { this.style.display = style; }
      else { this.style.display = "inherit"; }
    }
    obj.head = function ( HTML ) { this.innerHTML = HTML + obj.innerHTML; }
    obj.tail = function ( HTML ) { this.innerHTML += HTML; }
    obj.html = function ( HTML ) {
      if(HTML) { this.innerHTML = HTML; }
      else { this.innerHTML = ""; }
    }
  }
  return obj;
}

//日付計算
export function DateText(date) {
  var dif = Math.floor((new Date() - date) / 1000 / 60 / 60 / 24);
  if(dif < 7){
    if(new Date().getDate() == date.getDate()){ return "きょう"; }
    else if(new Date().getDate() - (1000 * 60 * 60 * 24) == date.getDate()){ return "きのう"; }
    else if(new Date().getDate() - (1000 * 60 * 60 * 24 * 2) == date.getDate()){ return "おととい"; }
    else{ return String(dif) + "日前"; }
  }
  else if(new Date().getFullYear() != date.getFullYear()) {
    return String(date.getFullYear()) + "年" + String(date.getMonth() + 1) + "月" + String(date.getDate()) + "日"
  }
  else{
    return String(date.getMonth() + 1) + "月" + String(date.getDate()) + "日"
  }
}

//transform date object into date text for input "type = date"
export function DateInput(date) {
  return date.getFullYear() + addzero(date.getMonth() + 1) + addzero(date.getDate());
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