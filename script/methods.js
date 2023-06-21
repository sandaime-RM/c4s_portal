export function getObj(id) { return document.getElementById(id); }
export function hide(id) { getObj(id).style.display = "none"; }
export function show(id) { getObj(id).style.display = "block"; }
export function addhead(id, HTML) { getObj(id).innerHTML += HTML; }
export function addtail(id, HTML) { getObj(id).innerHTML = HTML + getObj(id).innerHTML; }