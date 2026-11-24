(()=>{const $=id=>document.getElementById(id);let session=null,startedAt=0,calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);
window.showToast=msg=>{const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(window._toastTimer);window._toastTimer=setTimeout(()=>t.classList.remove("show"),2200)};
const workoutTemplate={name:"Shoulders & Arms",level:"Beginner",equipment:"Dumbbells",location:"Home",warmup:"Complete arm circles and shoulder rotations",exercises:[
{name:"Dumbbell Shoulder Press",detail:"Front and side shoulders",reps:"10–12 reps",rest:90,sets:3},
{name:"Dumbbell Lateral Raise",detail:"Wider side shoulders",reps:"10–12 reps",rest:60,sets:3},
{name:"Dumbbell Bicep Curl",detail:"Biceps",reps:"10–12 reps",rest:60,sets:3},
{name:"Hammer Curl",detail:"Biceps and forearms",reps:"10–12 reps",rest:60,sets:3},
{name:"Overhead Triceps Extension",detail:"Back of arms",reps:"10–12 reps",rest:60,sets:3}
]};
function dateLabel(){return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric"}).format(new Date())}
function stats(){const h=Store.get().history;$("workoutCount").textContent=h.length;$("trainingTime").textContent=Math.round(h.reduce((a,b)=>a+(b.duration||0),0)/60)+"m";$("streak").textContent=streak(h);$("recentWorkouts").innerHTML=h.length?h.slice(0,4).map(x=>'<div class="history-item"><strong>'+x.name+'</strong><div class="muted">'+new Date(x.date).toLocaleDateString()+' · '+Math.round(x.duration/60)+' min</div></div>').join(""):"No workouts yet"}

function dateKey(y,m,d){return y+"-"+String(m+1).padStart(2,"0")+"-"+String(d).padStart(2,"0")}
function renderCalendar(){
 const year=calendarCursor.getFullYear(),month=calendarCursor.getMonth();
 const firstDay=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate();
 const today=new Date();today.setHours(0,0,0,0);
 const completed=new Set(Store.get().history.map(item=>{const d=new Date(item.date);return dateKey(d.getFullYear(),d.getMonth(),d.getDate())}));
 $("calendarMonth").textContent=new Intl.DateTimeFormat(undefined,{month:"long",year:"numeric"}).format(calendarCursor);
 $("calendarPrev").disabled=year===2020&&month===0;
 $("calendarNext").disabled=year===today.getFullYear()&&month===today.getMonth();
 let cells="";
 for(let i=0;i<firstDay;i++)cells+='<span class="calendar-day blank"></span>';
 for(let day=1;day<=days;day++){
  const date=new Date(year,month,day);date.setHours(0,0,0,0);
  const key=dateKey(year,month,day),done=completed.has(key),past=date<today,isToday=date.getTime()===today.getTime();
  const cls="calendar-day"+(done?" completed":(!done&&past?" missed":""))+(isToday?" today":"");
  const mark=done?"✓":(!done&&past?"×":day);
  cells+='<span class="'+cls+'" aria-label="'+key+(done?", workout completed":(!done&&past?", missed workout":""))+'">'+mark+'</span>';
 }
 $("calendarGrid").innerHTML=cells;
}
function streak(h){const days=[...new Set(h.map(x=>new Date(x.date).toDateString()))].sort((a,b)=>new Date(b)-new Date(a));let n=0,d=new Date();d.setHours(0,0,0,0);if(days[0]!==d.toDateString())d.setDate(d.getDate()-1);while(days.includes(d.toDateString())){n++;d.setDate(d.getDate()-1)}return n}
function start(){session={name:workoutTemplate.name,warmupDone:false,exercises:workoutTemplate.exercises.map(e=>({...e,done:Array(e.sets).fill(false),weights:Array(e.sets).fill("")}))};startedAt=Date.now();document.body.classList.add("workout-mode");renderWorkout()}
function counts(){const done=session.exercises.reduce((n,e)=>n+e.done.filter(Boolean).length,0);const total=session.exercises.reduce((n,e)=>n+e.sets,0);return {done,total,percent:Math.round(done/total*100)}}
function renderWorkout(){const root=$("workoutSummary");root.innerHTML='<div class="session-header"><div><h2>'+session.name+'</h2><p>Beginner · Dumbbells · Home</p></div><span class="session-count" id="sessionCount">0/'+session.exercises.reduce((n,e)=>n+e.sets,0)+'</span></div><div class="progress-track"><span id="progressFill"></span></div><div class="progress-caption"><span>Workout progress</span><span id="progressPercent">0%</span></div><section class="warmup-row"><h3>Warm-up · 3–5 minutes</h3><label class="warmup-check"><input id="warmupDone" type="checkbox"> <span>'+workoutTemplate.warmup+'</span></label></section><div class="exercise-list">'+session.exercises.map((e,i)=>'<article class="exercise-row"><div class="exercise-heading"><h3>'+(i+1)+'. '+e.name+'</h3><span class="rest-pill">'+e.rest+' sec rest</span></div><p class="exercise-detail">'+e.detail+' · '+e.reps+'</p><div class="set-grid">'+e.done.map((v,j)=>'<button type="button" class="set-tile '+(v?'is-done':'')+'" data-set="'+i+':'+j+'" aria-pressed="'+v+'"><span class="set-dot">'+(v?'✓':'')+'</span><span>Set '+(j+1)+'</span></button>').join("")+'</div></article>').join("")+'</div><div class="rest-panel" id="restPanel" hidden><div><span class="rest-panel-label">REST TIMER</span><strong id="timerValue">01:00</strong></div><div class="timer-actions"><button class="secondary-button" id="timerPause">Pause</button><button class="secondary-button" id="timerSkip">Skip</button></div></div><div class="workout-footer"><div class="completion-line"><strong>Workout complete</strong><strong class="completion-value" id="completionValue">0%</strong></div><div class="progress-track footer-track"><span id="footerProgress"></span></div><div class="action-row"><button class="primary-button" id="finishWorkout">Finish workout</button><button class="secondary-button" id="cancelWorkout">Reset</button></div></div>';
$("warmupDone").checked=session.warmupDone;$("warmupDone").onchange=e=>{session.warmupDone=e.target.checked};
root.querySelectorAll("[data-set]").forEach(btn=>btn.onclick=()=>{const [i,j]=btn.dataset.set.split(":").map(Number);const wasDone=session.exercises[i].done[j];session.exercises[i].done[j]=!wasDone;btn.classList.toggle("is-done",!wasDone);btn.setAttribute("aria-pressed",String(!wasDone));btn.querySelector(".set-dot").textContent=wasDone?"":"✓";updateProgress();if(!wasDone){$("restPanel").hidden=false;RestTimer.start(session.exercises[i].rest)}else RestTimer.skip()});
$("timerPause").onclick=()=>RestTimer.pause();$("timerSkip").onclick=()=>{$("restPanel").hidden=true;RestTimer.skip()};
$("finishWorkout").onclick=finish;$("cancelWorkout").onclick=()=>{RestTimer.skip();session=null;document.body.classList.remove("workout-mode");home();showToast("Workout reset")};updateProgress()}
function updateProgress(){const c=counts();$("sessionCount").textContent=c.done+"/"+c.total;$("progressPercent").textContent=c.percent+"%";$("completionValue").textContent=c.percent+"%";$("progressFill").style.width=c.percent+"%";$("footerProgress").style.width=c.percent+"%"}
function finish(){const duration=Math.max(0,Math.round((Date.now()-startedAt)/1000));Store.update(d=>d.history.unshift({name:session.name,date:new Date().toISOString(),duration,exercises:session.exercises,warmupDone:session.warmupDone}));RestTimer.skip();session=null;document.body.classList.remove("workout-mode");home();showToast("Workout saved")}
function home(){$("workoutSummary").innerHTML='<div class="empty-state"><span class="empty-icon">＋</span><h3>No workout</h3><button class="primary-button" id="startSampleButton">Start workout</button></div>';$("startSampleButton").onclick=start;stats();renderCalendar()}
$("todayDate").textContent=dateLabel();$("startSampleButton").onclick=start;$("themeButton").onclick=()=>showToast("Dark appearance");$("calendarPrev").onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderCalendar()};
$("calendarNext").onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderCalendar()};
stats();renderCalendar();if("serviceWorker"in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("./sw.js").catch(()=>{})})();