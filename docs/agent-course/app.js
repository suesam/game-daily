const SNIPPETS = ["messages = [system, tool_schema, history, user]\ntokens = tokenizer.encode(serialize(messages))\nprint(len(tokens))","while not done:\n    observation = environment.observe()\n    if observation is None: return Failed('no_observation')\n    action = policy.decide(observation, agent_state)\n    result = environment.step(action)\n    if result.done: return Success(result.state)","def dispatch(call, registry, policy):\n    tool = registry.get(call.name)\n    if not tool: return ToolError('unknown_tool')\n    args = tool.schema.validate(call.args)\n    if not policy.allow(tool, args): return ToolError('denied')\n    return tool.execute(args)","memory.write(project, claim, source, valid_until)\nresults = memory.retrieve(project, query, now)\nfor item in results:\n    assert item.project == project","plan = planner.create(goal)\nfor step in plan.steps:\n    result = executor.run(step)\n    if not result.ok:\n        plan = replanner.update(plan, result)\n    if budget.exceeded(): return Failed('budget')","// Adapt provider output to stable ToolCall format\nconst normalized = modelAdapter.normalize(rawResult)\nconst result = await runtime.dispatch(normalized)\nsession.append({type:'tool/result',result})\n// Plugin dispose must unregister tools and listeners","if effect_log.is_committed(key):\n    return effect_log.result(key)\neffect_log.record_intent(key)\nresult = tool.execute(key)\neffect_log.mark_committed(key, result)\ncheckpoint.commit(run_state)","with trace.start_span('run') as run:\n    for step in agent_loop:\n        with trace.start_span('step') as span:\n            span.set_attribute('tool', step.tool)\n    report = eval_suite.evaluate(golden_cases, run)","tasks = {\n 'research': [],\n 'analysis': ['research'],\n 'writer': ['analysis'],\n}\nfor task in scheduler.ready(tasks):\n    result = worker.execute(task)\n    scheduler.commit(task, result)","POST /runs -> authorize -> enqueue\nGET /runs/{id} -> check ownership -> status\nworker -> lease -> resume checkpoint -> execute\non crash -> reconcile effects -> resume","input -> authorized run -> agent loop -> tools\n      -> event log/checkpoint -> evaluation\n      -> versioned report (trace, cost, evidence)"];

(function(){
"use strict";
const catalog=window.AGENT_COURSE;
const root=document.getElementById("main");
if(!catalog){root.textContent="缺少 curriculum.js";return;}
const days=catalog.days, key="agent-harness-academy-progress-v1";
const esc=x=>String(x==null?"":x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=s=>document.querySelector(s);
const iso=()=>new Date().toISOString();
const fresh=()=>({schema:key,activeDay:1,activeTab:"overview",activeLesson:0,theme:"light",createdAt:iso(),updatedAt:iso(),records:{}});
let state;
try{state=JSON.parse(localStorage.getItem(key)||"null");if(!state||state.schema!==key||typeof state.records!=="object")state=fresh();}catch(e){state=fresh();}
let grid={x:0,y:0,visible:true,trace:[]},scenario=0;
function record(day){
  const id=String(day);
  if(!state.records[id]||typeof state.records[id]!=="object")state.records[id]={read:[],answers:[],submitted:false,bestScore:0,lastScore:null,attempts:[],checks:[false,false,false],evidence:"",reflection:"",unclear:"",notes:"",confidence:3};
  const r=state.records[id];
  if(!Array.isArray(r.read))r.read=[];
  if(!Array.isArray(r.answers))r.answers=[];
  if(!Array.isArray(r.attempts))r.attempts=[];
  if(!Array.isArray(r.checks))r.checks=[false,false,false];
  return r;
}
function current(){return days.find(x=>x.day===Number(state.activeDay))||days[1];}
function status(d){
  const r=record(d.day);
  const reading=Math.min(1,r.read.length/d.topics.length);
  const quiz=Number(r.bestScore)>=.75?1:0;
  const lab=r.checks.slice(0,3).length===3&&r.checks.slice(0,3).every(Boolean)?1:0;
  const review=(r.reflection||"").trim().length>=24&&(r.evidence||"").trim().length>=8?1:0;
  return {reading,quiz,lab,review,ratio:(reading+quiz+lab+review)/4,done:reading===1&&quiz===1&&lab===1&&review===1};
}
function doneCount(){return days.filter(d=>d.day>0&&status(d).done).length;}
function save(){state.updatedAt=iso();try{localStorage.setItem(key,JSON.stringify(state));}catch(e){toast("本地空间不足，请及时导出记录");}}
function toast(msg){
  const el=$("#toast");el.textContent=msg;el.classList.add("visible");
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("visible"),2700);
}
function changeDay(day,tab){
  state.activeDay=day;state.activeTab=tab||"learn";state.activeLesson=0;scenario=0;
  save();render();window.scrollTo(0,0);$("#sidebar").classList.remove("open");
}
function updateNav(){
  $("#course-nav").innerHTML=days.map(d=>{
    const s=status(d);
    return '<button class="course-link '+(state.activeTab!=="overview"&&Number(state.activeDay)===d.day?"active ":"")+(s.done?"done":"")+'" data-action="day" data-day="'+d.day+'"><span class="course-num">'+String(d.day).padStart(2,"0")+'</span><span class="course-label">'+esc(d.title)+'</span></button>';
  }).join("");
  $("#side-summary").textContent=doneCount()+"/10";
  $("#overview-nav").classList.toggle("active",state.activeTab==="overview");
  $("#crumb-current").textContent=state.activeTab==="overview"?"学习看板":"Day "+state.activeDay+" · "+current().title;
  document.body.classList.toggle("dark",state.theme==="dark");
}
function insights(){
  const issues=[];
  for(const d of days.filter(x=>x.day>0)){
    const r=record(d.day);
    if(r.attempts.length&&Number(r.bestScore)<.75){
      const a=r.attempts[r.attempts.length-1];
      const wrong=d.quiz.filter((q,i)=>a.answers[i]!==q[2]).slice(0,2).map(q=>q[0]);
      issues.push({title:"Day "+d.day+" · 测验不足 75%",detail:"主要错题："+wrong.join("；")});
    }
    if(Number(r.confidence)<=2&&r.attempts.length)issues.push({title:"Day "+d.day+" · 自评低信心",detail:"建议补反例、源码阅读和可运行代码证据。"});
    if((r.unclear||"").trim())issues.push({title:"Day "+d.day+" · 待解决",detail:r.unclear.trim().slice(0,170)});
    if(r.attempts.length&&!status(d).lab)issues.push({title:"Day "+d.day+" · 实验尚未确认",detail:"已提交测验，但三项边界测试尚未全部由本人验证。"});
  }
  if(!issues.length)issues.push({title:"尚无可诊断的薄弱数据",detail:"完成部分测验、独立实验和主动反思后，这里会自动整理优先补课项。"});
  return issues.slice(0,14);
}
function overview(){
  const done=doneCount();
  const next=days.find(d=>d.day>0&&!status(d).done)||days[1];
  const tested=days.filter(d=>d.day>0&&record(d.day).attempts.length);
  const avg=tested.length?Math.round(tested.reduce((a,d)=>a+Number(record(d.day).lastScore||0),0)/tested.length*100)+"%":"—";
  let html='<p class="eyebrow">YOUR LEARNING SPACE / 自主学习工作台</p>';
  html+='<h1 class="page-title">建立你自己的<br>Agent / Harness 心智模型</h1>';
  html+='<p class="page-sub">Day 0–10 · 33 个知识单元 · 44 道可判分题 · 每阶段独立实践。自助学习，随时保存，最终导出记录进行专项复盘。</p>';
  html+='<section class="hero-brief"><div><div style="font-size:11px;letter-spacing:2px;color:#a6d2c8">CURRENT MAIN QUEST</div><h2>Day '+String(next.day).padStart(2,"0")+' · '+esc(next.title)+'</h2><p>'+esc(next.outcome)+'</p><div class="button-row"><button class="primary-btn" data-action="day" data-day="'+next.day+'">开始 / 继续 →</button></div></div><div class="hero-mini"><b>'+done+' / 10</b><span>自查完成阶段</span></div></section>';
  html+='<div class="stat-grid"><div class="stat-card"><span class="stat-lab">阶段完成</span><strong>'+done+' / 10</strong><small>Day 00 为选修</small></div><div class="stat-card"><span class="stat-lab">已做测验</span><strong>'+tested.length+' / 10</strong><small>实际提交的阶段</small></div><div class="stat-card"><span class="stat-lab">最近测验均分</span><strong>'+avg+'</strong><small>不等于真实代码能力</small></div></div>';
  html+='<div class="section-heading">全部课程 <small>可随时跳转，无强制时间限制</small></div><div class="course-grid">';
  for(const d of days){
    const s=status(d);
    html+='<button class="course-tile" data-action="day" data-day="'+d.day+'"><div class="tile-top"><span>DAY '+String(d.day).padStart(2,"0")+' · '+esc(d.level)+'</span><span>'+(s.done?"✓ 完成自查":s.ratio?"进行中":"未开始")+'</span></div><div class="tile-title">'+esc(d.title)+'</div><div class="tile-desc">'+esc(d.subtitle)+'</div><div class="mini-track"><b style="width:'+Math.round(s.ratio*100)+'%"></b></div></button>';
  }
  html+='</div><div class="section-heading">自动整理的复习建议 <small>依据本机填写的数据</small></div><div class="card">';
  html+=insights().map((x,i)=>'<div class="insight"><span class="insight-num">'+(i+1)+'</span><div class="insight-content"><strong>'+esc(x.title)+'</strong><p>'+esc(x.detail)+'</p></div></div>').join("");
  html+='<div class="button-row"><button class="outline-btn" data-action="copy-report">复制复盘摘要</button><button class="outline-btn" data-action="markdown">导出 Markdown</button><button class="primary-btn" data-action="export">下载学习记录 JSON ↓</button></div>';
  html+='<div class="small-help">答题与笔记只保存在本机浏览器。导出 JSON 后在 ChatGPT 中上传，我可以阅读全部记录并生成针对性补课计划。不会自动云同步。</div></div>';
  return html;
}
function dayHeader(d){
 const s=status(d);
 let html='<div class="stage-head"><div><p class="stage-num">DAY '+String(d.day).padStart(2,"0")+' / '+esc(d.level)+'</p><h1 class="page-title">'+esc(d.title)+'</h1><p class="page-sub">'+esc(d.subtitle)+'。<br><strong style="color:var(--text)">本阶段目标：</strong>'+esc(d.outcome)+'</p></div><div class="stage-counter">学习进度<strong>'+Math.round(s.ratio*100)+'%</strong><span>'+(s.done?"自查完成":"进行中")+'</span></div></div>';
 html+='<div class="progress-track"><b style="width:'+Math.round(s.ratio*100)+'%"></b></div><div class="tabs" role="tablist">';
 for(const t of [["learn","01 课程"],["quiz","02 测验"],["lab","03 实践"],["review","04 复盘"]]){
  html+='<button class="tab '+(state.activeTab===t[0]?"active":"")+'" data-action="tab" data-tab="'+t[0]+'">'+t[1]+'</button>';
 }
 return html+'</div>';
}
function lesson(d){
 const r=record(d.day);
 const n=Math.max(0,Math.min(d.topics.length-1,Number(state.activeLesson)||0));
 const t=d.topics[n],deep=window.AGENT_DEEP&&window.AGENT_DEEP[d.day]&&window.AGENT_DEEP[d.day][n];
 let html='<div class="lesson-list">';
 d.topics.forEach((x,i)=>{html+='<button class="lesson-chip '+(n===i?"active":"")+'" data-action="lesson" data-index="'+i+'">'+(r.read.includes(i)?"✓ ":"")+(i+1)+'. '+esc(x[0])+'</button>';});
 html+='</div><article class="concept-card deep-lesson"><div class="flex-row"><span class="pill">知识单元 '+(n+1)+' / '+d.topics.length+'</span><span class="pill gray">系统讲义 · 代码 · 推导 · 实验</span></div><h2>'+esc(t[0])+'</h2>';
 if(!deep){
   html+='<div class="callout">本节深入教学内容尚未加载，请检查章节数据文件；不会将几句话摘要冒充完整课程。</div><div class="explanation">'+esc(t[1])+'</div>';
 }else{
   html+='<section class="learning-goal"><strong>本节结束时你应该能够</strong><p>'+esc(deep.goal)+'</p></section>';
   html+='<div class="lecture-toc"><strong>本节内容</strong><span>4 段深入原理</span><span>逐步执行过程</span><span>代码示例</span><span>错因与挑战题</span></div>';
   html+='<div class="lecture-section-label">01 / DEEP DIVE · 深入理解</div>';
   deep.sections.forEach((section,i)=>{
      html+='<section class="lecture-section"><div class="lecture-index">'+String(i+1).padStart(2,"0")+'</div><div><h3>'+esc(section[0])+'</h3><p>'+esc(section[1])+'</p></div></section>';
   });
   html+='<div class="lecture-section-label">02 / EXECUTION · 一次完整的执行路径</div><div class="walkthrough">';
   deep.walk.forEach((step,i)=>{
      html+='<div class="walk-step"><span class="walk-number">'+String(i+1).padStart(2,"0")+'</span><div>'+esc(step)+'</div></div>';
   });
   html+='</div>';
   html+='<div class="lecture-section-label">03 / IMPLEMENTATION · 代码与机制</div>';
   html+='<p class="code-intro">'+esc(deep.kind)+'</p>';
   html+='<pre class="lecture-code"><code>'+esc(deep.code)+'</code></pre>';
   html+='<p class="small-help">运行代码前先阅读代码类型说明；标记为伪代码的内容用于架构推理，不保证可以直接执行。</p>';
   html+='<div class="lecture-section-label">04 / BOUNDARIES · 错误边界与反例</div>';
   html+='<div class="lecture-warning"><span class="warning-symbol">!</span><div><strong>常见误区</strong><p>'+esc(deep.traps)+'</p></div></div>';
   html+='<div class="case-box"><b>原有课程的快速示例</b><p>'+esc(t[2])+'</p></div>';
   html+='<div class="takeaway"><b>关键结论</b><p>'+esc(t[3])+'</p></div>';
   html+='<div class="lecture-section-label">05 / RECALL · 主动推理与答案</div>';
   html+='<div class="lecture-exercise"><strong>先独立回答</strong><p>'+esc(deep.exercise)+'</p><details><summary>查看参考解析（先思考再展开）</summary><p>'+esc(deep.answer)+'</p></details></div>';
 }
 html+='<div class="reading-complete"><div><strong>读完后再标记本节</strong><p>这只记录你已阅读；后面的知识测验、真实代码实践和学习复盘分别验收。</p></div><button class="outline-btn" data-action="mark-read" data-index="'+n+'">'+(r.read.includes(n)?"✓ 已记录阅读":"我读完了这一节")+'</button></div></article>';
 html+='<div class="step-nav"><button class="outline-btn" data-action="prev" '+(n===0?"disabled":"")+' >← 上一节</button><button class="primary-btn" data-action="'+(n===d.topics.length-1?"tab":"next")+'" data-tab="quiz">'+(n===d.topics.length-1?"开始本阶段测验 →":"下一节课程 →")+'</button></div>';
 return html;
}
function testView(d){
 const r=record(d.day);
 let html='<div class="quiz-head"><div><span class="pill gray">4 道单选 · 即时反馈</span><h2 class="section-heading" style="margin:10px 0">主动回忆与理解检查</h2></div><span class="pill">'+(r.submitted?"本次 "+Math.round(r.lastScore*100)+"%":"未提交")+'</span></div>';
 html+='<p class="page-sub">答案提交后显示正确选项及详细解释。保留每次尝试和错题，之后我可以根据导出的记录做复盘。</p>';
 d.quiz.forEach((q,i)=>{
   html+='<article class="quiz-card"><h3><span class="quiz-num">Q'+(i+1)+'</span>'+esc(q[0])+'</h3><div class="answers">';
   q[1].forEach((o,j)=>{
     let cls=(r.answers[i]===j?"selected ":"");
     if(r.submitted&&j===q[2])cls+="correct ";
     if(r.submitted&&r.answers[i]===j&&j!==q[2])cls+="incorrect ";
     html+='<button data-action="answer" data-q="'+i+'" data-opt="'+j+'" class="answer '+cls+'" '+(r.submitted?"disabled":"")+'><span class="letter">'+String.fromCharCode(65+j)+'</span><span>'+esc(o)+'</span></button>';
   });
   html+='</div>';
   if(r.submitted)html+='<div class="feedback '+(r.answers[i]===q[2]?"pass":"fail")+'"><strong>'+(r.answers[i]===q[2]?"✓ 理解正确":"✕ 需要补充")+'</strong> · 正确选项 '+String.fromCharCode(65+q[2])+'。'+esc(q[3])+'</div>';
   html+='</article>';
 });
 if(!r.submitted){
   const ready=d.quiz.every((_,i)=>Number.isInteger(r.answers[i]));
   html+='<div class="quiz-actionbar"><button class="primary-btn" data-action="grade" '+(ready?"":"disabled")+' >提交答案并查看解析</button><span class="small-help">请先选完 4 道题。</span></div>';
 }else{
   const correct=d.quiz.filter((q,i)=>r.answers[i]===q[2]).length;
   html+='<div class="quiz-results"><strong>'+Math.round(r.lastScore*100)+'%</strong><p>本次 '+correct+'/4 · 最佳 '+Math.round(r.bestScore*100)+'% · 已记录 '+r.attempts.length+' 次尝试</p></div>';
   html+='<div class="button-row"><button class="outline-btn" data-action="retake">重新答题</button><button class="primary-btn" data-action="tab" data-tab="lab">进入动手实验 →</button></div>';
 }
 return html;
}
function gridHTML(){
 let html='<div class="grid-demo">';
 for(let y=0;y<3;y++){
  for(let x=0;x<3;x++){
   let type=(x===grid.x&&y===grid.y?"agent":x===1&&y===1?"wall":"");
   let txt=x===grid.x&&y===grid.y?"◉":x===1&&y===1?"▦":x===2&&y===0?"⚑":"";
   html+='<div class="cell '+type+'">'+txt+'</div>';
  }
 }
 html+='</div><div class="small-help" style="text-align:center">State = ('+grid.x+','+grid.y+') · Observation = '+(grid.visible?"OK":"FAIL")+'</div>';
 return html;
}
function practice(d){
 const r=record(d.day);
 let html='<div class="card"><span class="pill">LAB · '+esc(d.lab.goal)+'</span><h3 style="margin-top:16px">实践目标</h3><p>'+esc(d.lab.task)+'</p>';
 html+='<div class="callout">以下内容是**教学情景模拟**。它不运行你自己的 Python，也不验证真实代码。实际编程和自动测试需要在本地 VS Code/Codex 完成，并在下方记录结果。</div><div class="divider"></div><h4>交互式控制流演示</h4>';
 if(d.day===1){
   html+='<div class="demo-holder"><div id="grid-area">'+gridHTML()+'</div><div><p class="small-help">你是决策器；方向按钮只是 Action 意图，环境决定能否移动。</p><div class="grid-controls"><span></span><button data-action="move" data-dir="up">↑</button><span></span><button data-action="move" data-dir="left">←</button><button data-action="move" data-dir="reset">↺</button><button data-action="move" data-dir="right">→</button><span></span><button data-action="move" data-dir="down">↓</button><span></span></div><div class="button-row"><button class="outline-btn" data-action="move" data-dir="auto">自动策略示范</button><button class="outline-btn" data-action="move" data-dir="observe">感知故障开关</button></div></div></div>';
 }else{
   html+='<div class="scenario-grid">'+d.lab.tests.map((t,i)=>'<button data-action="scenario" data-index="'+i+'" class="scenario-btn '+(scenario===i?"active":"")+'">'+(i+1)+'. '+esc(t)+'</button>').join("")+'</div><button class="outline-btn" data-action="run-demo">▶ 查看该情景的执行/判定过程</button>';
 }
 html+='<div class="console-title">● DEMO TRACE / 教学模拟</div><div id="console" class="mock-console">'+esc(d.day===1?grid.trace.join("\n")||"> 使用方向按钮提交一次 Action":"> 请选择情景，然后查看示范执行路径。")+'</div></div>';
 if(d.day===1)html+='<div class="card"><h3>完整可运行实验（含自动测试）</h3><p>你不必只看这段骨架；下面的 Python 实现了独立的 Environment、Policy、Runner，并为关键错误路径编写 7 个单元测试。</p><div class="button-row"><a class="outline-btn" href="labs/day01/README.md" target="_blank" rel="noopener">实验步骤 ↗</a><a class="outline-btn" href="https://github.com/suesam/game-daily/tree/main/docs/agent-course/labs/day01" target="_blank" rel="noopener">查看完整代码 ↗</a></div><p class="small-help">在本地执行 Python 测试并保存真实输出；网页模拟不会代替自动测试。</p></div>';
 html+='<div class="card"><div class="flex-row"><h3>参考代码骨架</h3><button class="outline-btn" data-action="copy-code">复制骨架</button></div><pre class="code-block">'+esc(SNIPPETS[d.day])+'</pre><p class="small-help">代码仅是接口草稿，不保证可运行。真正的 Done 需要补完代码并通过独立测试。</p></div>';
 html+='<div class="card"><h3>实验自查 · 3 项边界测试</h3><p>勾选只代表本人确认完成，不代表网站执行测试。留存运行命令、pytest 结果或 commit，便于后续审阅。</p>';
 d.lab.tests.forEach((test,i)=>{html+='<label class="checkbox-row"><input type="checkbox" data-field="check" data-index="'+i+'" '+(r.checks[i]?"checked":"")+'><span>'+esc(test)+'</span></label>';});
 html+='<label class="field-label" for="evidence">实验产物位置 / 测试日志 / GitHub commit</label><textarea class="editor" id="evidence" data-field="evidence" rows="3" placeholder="例如：lab/day01/，pytest 3 passed，commit 链接……">'+esc(r.evidence||"")+'</textarea><div class="button-row"><button class="primary-btn" data-action="tab" data-tab="review">进入学习复盘 →</button></div></div>';
 return html;
}
function review(d){
 const r=record(d.day),s=status(d);
 let html='<div class="card"><h3>自己解释原理，暴露不确定之处</h3><p>不抄课文，写出你自己的理解和实验发现。记录将导出用于之后的个性化补课。</p>';
 const fields=[
 ["reflection","我能够解释的内容（至少 24 字）","例如：模型输出的动作需要经 Harness 验证，Environment 才改变真实状态……"],
 ["unclear","我仍困惑的问题","越具体越好，甚至可以记录一个反例。"],
 ["notes","随堂笔记与改进想法","记录你想到的实现取舍或潜在 bug。"]
 ];
 fields.forEach(f=>{html+='<label class="field-label" for="'+f[0]+'">'+f[1]+'</label><textarea id="'+f[0]+'" data-field="'+f[0]+'" class="editor" rows="4" placeholder="'+f[2]+'">'+esc(r[f[0]]||"")+'</textarea>';});
 html+='<label class="field-label" for="confidence">自评理解程度</label><select id="confidence" data-field="confidence" class="editor" style="min-height:42px">';
 [[1,"1 · 很不确定"],[2,"2 · 只理解部分"],[3,"3 · 能解释主要原理"],[4,"4 · 能独立实现"],[5,"5 · 能设计测评与分析失败"]].forEach(([num,name])=>{html+='<option value="'+num+'" '+(Number(r.confidence)===num?"selected":"")+'>'+name+'</option>';});
 html+='</select><p class="small-help">文本自动保存在当前浏览器，不进行网络上传。</p></div>';
 html+='<div class="card"><div class="flex-row"><h3>阶段验收</h3><span class="pill '+(s.done?"":"gray")+'">'+(s.done?"✓ 已完成自查":"尚未达成全部条件")+'</span></div>';
 for(const item of [["全部 3 个单元已阅读",s.reading],["测验历史最佳成绩 ≥75%",s.quiz],["3 个实践测试已本人确认",s.lab],["反思至少 24 字且记录了实践证据",s.review]]){
   html+='<div class="flex-row" style="padding:10px 0;border-bottom:1px solid var(--line)"><span>'+item[0]+'</span><span class="pill '+(item[1]?"":"gray")+'">'+(item[1]?"✓ 达成":"待完成")+'</span></div>';
 }
 html+='<div class="button-row"><button class="outline-btn" data-action="copy-report">复制复盘摘要</button><button class="outline-btn" data-action="markdown">导出 Markdown</button><button class="primary-btn" data-action="export">导出完整 JSON</button></div><p class="small-help">这只是根据课程测验与本人确认状态的验收，不等于已通过第三方代码审查。下一次对话可以携带完整 JSON 进行独立复盘。</p></div>';
 return html;
}
function dayView(){
 const d=current();
 let html=dayHeader(d);
 if(state.activeTab==="quiz")html+=testView(d);
 else if(state.activeTab==="lab")html+=practice(d);
 else if(state.activeTab==="review")html+=review(d);
 else html+=lesson(d);
 html+='<div class="section-heading">参考课程与官方源码 <small>外部教材</small></div><div class="card">';
 d.sources.forEach(s=>{html+='<a class="source-link" href="'+esc(s[1])+'" target="_blank" rel="noopener noreferrer">'+esc(s[0])+' <span class="arrow">↗</span></a>';});
 return html+"</div>";
}
function render(){
 updateNav();
 root.innerHTML=state.activeTab==="overview"?overview():dayView();
}
function move(dir){
 if(dir==="reset"){grid={x:0,y:0,visible:true,trace:[]};}
 else if(dir==="observe"){grid.visible=!grid.visible;grid.trace.push("observe() -> "+(grid.visible?"ok":"unavailable"));}
 else if(!grid.visible){grid.trace.push("FAIL: no observation, action rejected");}
 else if(grid.x===2&&grid.y===0){grid.trace.push("DONE: target already reached");}
 else if(dir==="auto"){grid.x=2;grid.y=0;grid.trace.push("policy: right,right -> two accepted transitions -> DONE");}
 else{
   const delta={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir];
   if(!delta)return;
   const x=grid.x+delta[0],y=grid.y+delta[1];
   if(x<0||y<0||x>2||y>2||(x===1&&y===1))grid.trace.push("DENIED "+dir+": invalid location, state unchanged");
   else{
     grid.x=x;grid.y=y;grid.trace.push("COMMITTED "+dir+": state=("+x+","+y+")");
     if(x===2&&y===0)grid.trace.push("DONE: goal reached");
   }
 }
 const g=$("#grid-area");if(g)g.innerHTML=gridHTML();
 const o=$("#console");if(o)o.textContent=grid.trace.slice(-10).join("\n")||"> 提交动作";
}
function report(){
 const out=["# Agent / Harness 学习记录","导出时间："+new Date().toLocaleString(),"课程版本："+catalog.version,"完成阶段："+doneCount()+"/10",""];
 days.forEach(d=>{
   const r=record(d.day),s=status(d);
   if(!r.read.length&&!r.attempts.length&&!r.reflection&&!r.notes&&!r.unclear&&!r.evidence)return;
   out.push("## Day "+d.day+" · "+d.title,"完成度（自查）："+Math.round(s.ratio*100)+"%","单元已读："+r.read.length+"/"+d.topics.length,"测验尝试："+r.attempts.length+"，最佳："+Math.round(Number(r.bestScore)*100)+"%","实践自查："+r.checks.filter(Boolean).length+"/3","自评信心："+r.confidence+"/5","反思："+(r.reflection||""),"困惑："+(r.unclear||""),"实验："+(r.evidence||""),"笔记："+(r.notes||""),"");
 });
 out.push("## 待加强的方向");
 insights().forEach((x,i)=>out.push((i+1)+". "+x.title+" — "+x.detail));
 out.push("","备注：实验通过标记由学习者自查，网站没有运行实际 Python 代码。");
 return out.join("\n");
}
function download(text,name,mime){
 const url=URL.createObjectURL(new Blob([text],{type:mime}));
 const link=document.createElement("a");link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function exportJSON(){
 const payload={schema:key,courseVersion:catalog.version,exportedAt:iso(),clientState:state,diagnostics:insights(),report:report()};
 download(JSON.stringify(payload,null,2),"agent-harness-progress-"+iso().slice(0,10)+".json","application/json;charset=utf-8");
 toast("完整学习记录已下载，可上传至 ChatGPT 进行复盘");
}
document.addEventListener("input",e=>{
 const el=e.target,name=el.dataset.field;
 if(["reflection","unclear","notes","evidence"].includes(name)){record(state.activeDay)[name]=el.value;save();}
});
document.addEventListener("change",e=>{
 const el=e.target;
 if(el.dataset.field==="check"){record(state.activeDay).checks[Number(el.dataset.index)]=el.checked;save();toast("实践自查已保存");}
 if(el.dataset.field==="confidence"){record(state.activeDay).confidence=Number(el.value);save();}
});
document.addEventListener("click",async e=>{
 const btn=e.target.closest("[data-action]");
 if(!btn)return;
 const act=btn.dataset.action,d=current(),r=record(d.day);
 if(act==="menu"){$("#sidebar").classList.toggle("open");return;}
 if(act==="overview"){state.activeTab="overview";save();render();window.scrollTo(0,0);return;}
 if(act==="day"){changeDay(Number(btn.dataset.day),"learn");return;}
 if(act==="tab"){state.activeTab=btn.dataset.tab;save();render();window.scrollTo(0,0);return;}
 if(act==="theme"){state.theme=state.theme==="dark"?"light":"dark";save();render();return;}
 if(act==="lesson"){state.activeLesson=Number(btn.dataset.index);save();render();return;}
 if(act==="next"){state.activeLesson=Math.min(d.topics.length-1,state.activeLesson+1);save();render();return;}
 if(act==="prev"){state.activeLesson=Math.max(0,state.activeLesson-1);save();render();return;}
 if(act==="mark-read"){const i=Number(btn.dataset.index);if(!r.read.includes(i))r.read.push(i);save();render();toast("已记录阅读");return;}
 if(act==="answer"){if(!r.submitted){r.answers[Number(btn.dataset.q)]=Number(btn.dataset.opt);save();render();}return;}
 if(act==="grade"){
   if(!d.quiz.every((_,i)=>Number.isInteger(r.answers[i])))return;
   const correct=d.quiz.filter((q,i)=>r.answers[i]===q[2]).length;
   const result=correct/d.quiz.length;
   r.submitted=true;r.lastScore=result;r.bestScore=Math.max(Number(r.bestScore),result);
   r.attempts.push({at:iso(),answers:r.answers.slice(),correct,total:d.quiz.length,score:result});
   save();render();toast("测验已提交："+Math.round(result*100)+"%");return;
 }
 if(act==="retake"){r.answers=[];r.submitted=false;save();render();return;}
 if(act==="move"){move(btn.dataset.dir);return;}
 if(act==="scenario"){scenario=Number(btn.dataset.index);render();return;}
 if(act==="run-demo"){
   const out=$("#console");
   if(out)out.textContent=[
     "> Scenario "+(scenario+1)+" / "+d.lab.tests[scenario],
     "1. 设置初始状态和输入（确定性教学情景）",
     "2. 检查条件：权限、输入、状态或预算",
     "3. 根据机制选择拒绝、失败、恢复或提交",
     "4. 预期结果：保留 Trace 与错误证据",
     "",
     "提示：这不是实际 Python 测试；请在自己的代码里实现并保存测试日志。"
   ].join("\n");
   return;
 }
 if(act==="copy-code"){
   try{await navigator.clipboard.writeText(SNIPPETS[d.day]);toast("代码骨架已复制");}catch(e){toast("无法复制，请手动复制代码");}
   return;
 }
 if(act==="export"){exportJSON();return;}
 if(act==="markdown"){download(report(),"agent-harness-review-"+iso().slice(0,10)+".md","text/markdown;charset=utf-8");toast("Markdown 已下载");return;}
 if(act==="copy-report"){
   try{await navigator.clipboard.writeText(report());toast("复盘摘要已复制");}
   catch(e){download(report(),"agent-harness-review.md","text/markdown;charset=utf-8");toast("已下载 Markdown 摘要");}
   return;
 }
 if(act==="import"){$("#import-input").click();return;}
});
$("#import-input").addEventListener("change",async function(){
 const file=this.files&&this.files[0];if(!file)return;
 try{
   const obj=JSON.parse(await file.text());
   if(obj.schema!==key||!obj.clientState||!obj.clientState.records||typeof obj.clientState.records!=="object")throw Error("文件不是本课程导出的学习记录");
   if(!window.confirm("导入会覆盖本机的当前学习记录。请确认已经导出旧记录备份，是否继续？"))return;
   state=Object.assign(fresh(),obj.clientState,{schema:key});
   if(!days.some(d=>d.day===Number(state.activeDay)))state.activeDay=1;
   save();render();toast("导入成功");
 }catch(err){toast("无法导入："+err.message);}
 finally{this.value="";}
});
window.addEventListener("keydown",e=>{if(e.key==="Escape")$("#sidebar").classList.remove("open");});
render();
})();
