export function getObj(id) { return document.getElementById(id); }
export function hide(id) { getObj(id).style.display = "none"; }
export function show(id) { getObj(id).style.display = "block"; }
export function addhead(id, HTML) { getObj(id).innerHTML = HTML + getObj(id).innerHTML; }
export function addtail(id, HTML) { getObj(id).innerHTML = getObj(id).innerHTML + HTML; }

//部員をソート(users:全ユーザーのデータ、keys:ソートしたい部員のIDリスト)
export function sortMembers(users, keys){
  var leaders = []
  var active_keys = [];
  var new_keys = [];
  var rest = keys;

  //部長を抽出
  rest.forEach((i) => {
    if(users[i].role == "leader") { leaders[leaders.length] = i; }
  });
  //副部長を抽出
  rest.forEach((i) => {
    if(users[i].role == "subleader") { leaders[leaders.length] = i; }
  });
  //会計を抽出
  rest.forEach((i) => {
    if(users[i].role == "treasurer") { leaders[leaders.length] = i; }
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