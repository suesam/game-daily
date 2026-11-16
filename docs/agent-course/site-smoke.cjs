const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const path = require("node:path");
const base = __dirname;
const curriculum = fs.readFileSync(path.join(base, "curriculum.js"), "utf8");
const app = fs.readFileSync(path.join(base, "app.js"), "utf8");
const deepScripts = ["chapters-0-3.js","chapters-4-7.js","chapters-8-10.js"].map(file=>fs.readFileSync(path.join(base,file),"utf8"));
const store = {};
const localStorage = {getItem:k=>store[k]||null, setItem:(k,v)=>{store[k]=v}};
function boot(){
  const nodes = new Map(), listeners = {};
  function node(key){
    key = key.replace(/^#/, "");
    if(!nodes.has(key))nodes.set(key,{innerHTML:"",textContent:"",value:"",files:[],dataset:{},classList:{toggle(){},remove(){},add(){}},addEventListener(type,cb){listeners[key+":"+type]=cb},click(){},remove(){}});
    return nodes.get(key);
  }
  const document={getElementById:node,querySelector:node,addEventListener:(type,cb)=>listeners[type]=cb,body:{classList:{toggle(){}},appendChild(){}},createElement:()=>({click(){},remove(){}})};
  const window={addEventListener(){},scrollTo(){},confirm(){return true},navigator:{clipboard:{writeText:async()=>{}}}};
  const ctx={window,document,localStorage,console,setTimeout:()=>1,clearTimeout(){},URL:{createObjectURL(){return"blob:test"},revokeObjectURL(){}},Blob:class{}};
  vm.runInNewContext(curriculum,ctx,{filename:"curriculum.js"});
  for(const script of deepScripts)vm.runInNewContext(script,ctx,{filename:"deep-chapters.js"});
  vm.runInNewContext(app,ctx,{filename:"app.js"});
  return {
    html:()=>node("main").innerHTML,
    data:()=>window.AGENT_COURSE,
    deep:()=>window.AGENT_DEEP,
    click:(action,params={})=>listeners.click({target:{closest(){return {dataset:{action,...params}}}}}),
    input:(field,value)=>listeners.input({target:{dataset:{field},value}})
  };
}
(async()=>{
  const page=boot();
  const deep=page.deep();
  assert.equal(Object.values(deep).reduce((n,a)=>n+a.length,0),33);
  for(const day of page.data().days){
    assert.equal(deep[day.day].length,3);
    for(const section of deep[day.day]){
      assert.equal(section.sections.length,4);
      assert.ok(section.code.length>=110,"missing code walkthrough Day "+day.day);
      assert.ok(section.walk.length>=4,"missing execution walkthrough Day "+day.day);
      assert.ok(section.exercise.length>=20&&section.answer.length>=20,"missing analysis exercise Day "+day.day);
    }
  }
  assert.match(page.html(),/课程/);
  assert.equal(page.data().days.length,11);
  assert.equal(page.data().days.reduce((s,d)=>s+d.topics.length,0),33);
  assert.equal(page.data().days.reduce((s,d)=>s+d.quiz.length,0),44);
  assert.match(page.html(),/Agent \/ Harness 心智模型/);
  await page.click("day",{day:"1"});
  assert.match(page.html(),/Agent 本质与核心循环/);
  assert.match(page.html(),/深入理解/);
  assert.match(page.html(),/一次完整的执行路径/);
  assert.match(page.html(),/主动推理与答案/);
  await page.click("tab",{tab:"quiz"});
  for(const [i,opt] of [1,2,1,1].entries())await page.click("answer",{q:String(i),opt:String(opt)});
  await page.click("grade");
  assert.match(page.html(),/本次 100%/);
  await page.click("tab",{tab:"review"});
  page.input("reflection","模型提交的行动意图需要经过 Harness 和 Environment 的校验与状态提交才能形成实际效果。");
  page.input("unclear","还想理解 Tool 与 Environment 的事务职责区别");
  const another=boot();
  await another.click("day",{day:"1"});
  await another.click("tab",{tab:"quiz"});
  assert.match(another.html(),/本次 100%/);
  assert.match(store["agent-harness-academy-progress-v1"],/Tool 与 Environment/);
  console.log("Agent Academy smoke: 11 days, 33 full lessons, 132 deep sections, code/walkthrough/recall, 44 quizzes; UI/navigation/grading/records/reload PASS");
})().catch(e=>{console.error(e);process.exit(1)});
