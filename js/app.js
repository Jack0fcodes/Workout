(()=>{const $=id=>document.getElementById(id);let session=null,startedAt=0;
window.showToast=msg=>{const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(window._toastTimer);window._toastTimer=setTimeout(()=>t.classList.remove("show"),2200)};
const workoutTemplate={name:"Shoulders & Arms",level:"Beginner",equipment:"Dumbbells",location:"Home",warmup:"Complete arm circles and shoulder rotations",exercises:[
{name:"Dumbbell Shoulder Press",detail:"Front and side shoulders",reps:"10–12 reps",rest:90,sets:3},
{name:"Dumbbell Lateral Raise",detail:"Wider side shoulders",reps:"10–12 reps",rest:60,sets:3},
{name:"Dumbbell Bicep Curl",detail:"Biceps",reps:"10–12 reps",rest:60,sets:3},
{name:"Hammer Curl",detail:"Biceps and forearms",reps:"10–12 reps",rest:60,sets:3},
{name:"Overhead Triceps Extension",detail:"Back of arms",reps:"10–12 reps",rest:60,sets:3}
]};
function dateLabel(){return new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric"}).format(new Date())}
function stats(){const h=Store.get().history;$("workoutCount").textContent=h.length;$("trainingTime").textContent=Math.round(h.reduce((a,b)=>a+(b.duration||0),0)/60)+"m";$("streak").textContent=streak(h);$("recentWorkouts").innerHTML=h.length?h.slice(0,8).map((x,i)=>'<div class="history-item"><div class="history-item-info"><strong>'+x.name+'</strong><div class="muted">'+new Date(x.date).toLocaleDateString()+' · '+Math.round(x.duration/60)+' min</div></div><button type="button" class="delete-activity" data-delete-activity="'+i+'" aria-label="Delete '+x.name+' activity" title="Delete activity">×</button></div>').join(""):"No workouts yet";$("recentWorkouts").querySelectorAll("[data-delete-activity]").forEach(btn=>btn.onclick=()=>{const index=Number(btn.dataset.deleteActivity);if(!window.confirm("Delete this workout activity? It will also be removed from your progress calendar."))return;Store.update(d=>d.history.splice(index,1));stats();renderCalendar();showToast("Activity deleted")});const clear=$("clearActivities");if(clear)clear.onclick=()=>{if(!h.length)return;if(!window.confirm("Delete all workout activity and clear your progress calendar? This cannot be undone."))return;Store.update(d=>{d.history=[]});stats();renderCalendar();showToast("All activity deleted")}}

let calendarMode="year",calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);
function dateKey(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function workoutCounts(){const map=new Map();Store.get().history.forEach(item=>{const d=new Date(item.date),k=dateKey(d);map.set(k,(map.get(k)||0)+1)});return map}
function renderCalendar(){
 const today=new Date();today.setHours(0,0,0,0);const counts=workoutCounts();
 $("monthCalendar").hidden=calendarMode!=="month";$("yearCalendar").hidden=calendarMode!=="year";
 $("monthViewButton").classList.toggle("active",calendarMode==="month");$("yearViewButton").classList.toggle("active",calendarMode==="year");
 if(calendarMode==="month"){
  const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate();
  $("monthLabel").textContent=new Intl.DateTimeFormat(undefined,{month:"long",year:"numeric"}).format(first);
  $("monthNext").disabled=y===today.getFullYear()&&m===today.getMonth();
  let cells="";for(let i=0;i<first.getDay();i++)cells+='<span class="month-day blank"></span>';
  let active=0;
  for(let day=1;day<=days;day++){
   const date=new Date(y,m,day);date.setHours(0,0,0,0);const count=counts.get(dateKey(date))||0,future=date>today,isToday=date.getTime()===today.getTime();
   if(count&&!future)active++;
   const level=count===0?0:count===1?2:count===2?3:4;
   const cls="month-day level-"+(future?0:level)+(isToday?" is-today":"")+(count?" has-workout":"");
   cells+='<div class="'+cls+'" title="'+dateKey(date)+": "+(count?count+" workout(s)":"No workout")+'"><span>'+day+'</span>'+(count?'<small>'+count+'×</small>':'')+'</div>';
  }
  $("monthGrid").innerHTML=cells;
  $("activitySummary").textContent=active+" workout days this month";
 }else{
  const year=today.getFullYear();
  const first=new Date(year,0,1);first.setDate(first.getDate()-first.getDay());
  const last=new Date(year,11,31);
  const names=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const weekCount=Math.ceil((Math.ceil((last-first)/86400000)+1)/7);
  let weeks="",months="",active=0;
  // Anchor each label to the week containing the month's first day.
  for(let m=0;m<12;m++){
   const monthStart=new Date(year,m,1);
   const col=Math.floor((monthStart-first)/86400000/7)+1;
   months+='<span style="grid-column:'+col+'">'+names[m]+'</span>';
  }
  for(let w=0;w<weekCount;w++){
   const sunday=new Date(first);sunday.setDate(first.getDate()+w*7);
   let cells="";
   for(let d=0;d<7;d++){
    const date=new Date(sunday);date.setDate(sunday.getDate()+d);date.setHours(0,0,0,0);
    const inYear=date.getFullYear()===year;
    if(!inYear){cells+='<span class="contribution-cell is-blank" aria-hidden="true"></span>';continue}
    const count=counts.get(dateKey(date))||0,future=date>today;
    if(count&&!future)active++;
    const level=future||!count?0:count===1?2:count===2?3:4;
    const current=date.getTime()===today.getTime();
    cells+='<span class="contribution-cell level-'+level+(current?" is-today":"")+'" title="'+dateKey(date)+": "+(count?count+" workout(s)":"No workout")+'" aria-label="'+dateKey(date)+": "+(count?count+" workout(s)":"No workout")+'"></span>';
   }
   weeks+='<div class="contribution-week">'+cells+'</div>';
  }
  $("contributionMonths").innerHTML=months;$("contributionGrid").innerHTML=weeks;
  $("activitySummary").textContent=active+" workout days in the last 12 months";
 }
}
function streak(h){const days=[...new Set(h.map(x=>new Date(x.date).toDateString()))].sort((a,b)=>new Date(b)-new Date(a));let n=0,d=new Date();d.setHours(0,0,0,0);if(days[0]!==d.toDateString())d.setDate(d.getDate()-1);while(days.includes(d.toDateString())){n++;d.setDate(d.getDate()-1)}return n}
function start(){session={name:workoutTemplate.name,warmupDone:false,exercises:workoutTemplate.exercises.map(e=>({...e,done:Array(e.sets).fill(false),weights:Array(e.sets).fill("")}))};startedAt=Date.now();document.body.classList.add("workout-mode");renderWorkout()}
function counts(){const done=session.exercises.reduce((n,e)=>n+e.done.filter(Boolean).length,0);const total=session.exercises.reduce((n,e)=>n+e.sets,0);return {done,total,percent:Math.round(done/total*100)}}
function renderWorkout(){const root=$("workoutSummary");root.innerHTML='<div class="session-header"><div class="session-title-group"><h2>'+session.name+'</h2></div><div class="session-header-actions"><span class="session-count" id="sessionCount">0/'+session.exercises.reduce((n,e)=>n+e.sets,0)+'</span><button type="button" class="session-close" id="exitWorkout" aria-label="Exit workout and return home" title="Return home">×</button></div></div><div class="progress-track"><span id="progressFill"></span></div><div class="progress-caption"><span>Workout progress</span><span id="progressPercent">0%</span></div><section class="warmup-row"><h3>Warm-up · 3–5 minutes</h3><label class="warmup-check"><input id="warmupDone" type="checkbox"> <span>'+workoutTemplate.warmup+'</span></label></section><div class="exercise-list">'+session.exercises.map((e,i)=>'<article class="exercise-row"><div class="exercise-heading"><h3>'+(i+1)+'. '+e.name+'</h3><span class="rest-pill">'+e.rest+' sec rest</span></div><p class="exercise-detail">'+e.detail+' · '+e.reps+'</p><div class="set-grid">'+e.done.map((v,j)=>'<button type="button" class="set-tile '+(v?'is-done':'')+'" data-set="'+i+':'+j+'" aria-pressed="'+v+'"><span class="set-dot">'+(v?'✓':'')+'</span><span>Set '+(j+1)+'</span></button>').join("")+'</div><details class="form-video"><summary><span>Watch form</span><a class="youtube-direct" data-youtube-direct="'+i+'" href="https://www.youtube.com/results?search_query='+encodeURIComponent(e.name+' proper form')+'" target="_blank" rel="noopener noreferrer" aria-label="Open '+e.name+' on YouTube" title="Open on YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"/></svg></a></summary><div class="form-video-tools"><button type="button" class="secondary-button" data-find-video="'+i+'">Find on YouTube</button><input type="url" inputmode="url" placeholder="Paste YouTube video link" aria-label="YouTube video link for '+e.name+'" data-video-url="'+i+'"><button type="button" class="secondary-button" data-save-video="'+i+'">Save</button><button type="button" class="secondary-button" data-clear-video="'+i+'">Clear</button></div><div class="form-video-player" data-video-player="'+i+'"></div></details></article>').join("")+'</div><div class="rest-panel" id="restPanel" hidden><div><span class="rest-panel-label">REST TIMER</span><strong id="timerValue">01:00</strong></div><div class="timer-actions"><button class="secondary-button" id="timerPause">Pause</button><button class="secondary-button" id="timerSkip">Skip</button></div></div><div class="workout-footer"><div class="completion-line"><strong>Workout complete</strong><strong class="completion-value" id="completionValue">0%</strong></div><div class="progress-track footer-track"><span id="footerProgress"></span></div><div class="action-row"><button class="primary-button" id="finishWorkout">Finish workout</button><button class="secondary-button" id="cancelWorkout">Reset</button></div></div>';
function youtubeVideoId(value){try{const u=new URL(value);const host=u.hostname.replace(/^www\./,"").replace(/^m\./,"");let id="";if(host==="youtu.be")id=u.pathname.split("/").filter(Boolean)[0]||"";else if(host==="youtube.com"||host==="youtube-nocookie.com"){if(u.pathname==="/watch")id=u.searchParams.get("v")||"";else{const p=u.pathname.split("/").filter(Boolean);if(["embed","shorts","live"].includes(p[0]))id=p[1]||""}}return /^[\w-]{11}$/.test(id)?id:""}catch{return ""}}
function showFormVideo(index,id){const target=$("workoutSummary").querySelector('[data-video-player="'+index+'"]');if(!target)return;target.innerHTML="";if(!id)return;const frame=document.createElement("iframe");frame.src="https://www.youtube-nocookie.com/embed/"+id+"?rel=0";frame.title="Exercise form demonstration";frame.loading="lazy";frame.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";frame.allowFullscreen=true;frame.referrerPolicy="strict-origin-when-cross-origin";target.appendChild(frame);const link=document.createElement("a");link.href="https://www.youtube.com/watch?v="+id;link.target="_blank";link.rel="noopener noreferrer";link.textContent="Open on YouTube";target.appendChild(link)}
function bindFormVideos(){
 const saved=Store.get().formVideos||{};
 const defaults={
  "Dumbbell Shoulder Press":"https://www.youtube.com/watch?v=qEwKCR5JCog",
  "Dumbbell Lateral Raise":"https://www.youtube.com/watch?v=PzsMitRdI_8",
  "Dumbbell Bicep Curl":"https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
  "Hammer Curl":"https://www.youtube.com/watch?v=TwD-YGVP4Bk",
  "Overhead Triceps Extension":"https://www.youtube.com/watch?v=T1EO7u2n7WU"
 };
 session.exercises.forEach((exercise,index)=>{
  const input=$("workoutSummary").querySelector('[data-video-url="'+index+'"]');
  const url=saved[exercise.name]||defaults[exercise.name]||"";
  const id=youtubeVideoId(url);
  const direct=$("workoutSummary").querySelector('[data-youtube-direct="'+index+'"]');
  if(input)input.value=saved[exercise.name]||"";
  if(direct)direct.href=id?"https://www.youtube.com/watch?v="+id:"https://www.youtube.com/results?search_query="+encodeURIComponent(exercise.name+" proper form short");
  if(id)showFormVideo(index,id);
  const find=$("workoutSummary").querySelector('[data-find-video="'+index+'"]');
  if(find)find.onclick=()=>window.open("https://www.youtube.com/results?search_query="+encodeURIComponent(exercise.name+" proper form short demonstration"),"_blank");
  const save=$("workoutSummary").querySelector('[data-save-video="'+index+'"]');
  if(save)save.onclick=()=>{
   const value=input.value.trim(),videoId=youtubeVideoId(value);
   if(!videoId){showToast("Paste a valid YouTube link");return}
   Store.update(d=>{d.formVideos=d.formVideos||{};d.formVideos[exercise.name]=value});
   const link=$("workoutSummary").querySelector('[data-youtube-direct="'+index+'"]');
   if(link)link.href="https://www.youtube.com/watch?v="+videoId;
   showFormVideo(index,videoId);showToast("Form video saved")
  };
  const clear=$("workoutSummary").querySelector('[data-clear-video="'+index+'"]');
  if(clear)clear.onclick=()=>{
   Store.update(d=>{d.formVideos=d.formVideos||{};delete d.formVideos[exercise.name]});
   if(input)input.value="";
   const fallback=youtubeVideoId(defaults[exercise.name]||"");
   const link=$("workoutSummary").querySelector('[data-youtube-direct="'+index+'"]');
   if(link)link.href=fallback?"https://www.youtube.com/watch?v="+fallback:"https://www.youtube.com/results?search_query="+encodeURIComponent(exercise.name+" proper form short");
   showFormVideo(index,fallback);showToast("Custom form video removed")
  };
 });
}
bindFormVideos();
$("exitWorkout").onclick=()=>{if(counts().done>0&&!window.confirm("Exit this workout? Your current sets will not be saved."))return;RestTimer.skip();session=null;document.body.classList.remove("workout-mode");home();showToast("Returned home")};
$("warmupDone").checked=session.warmupDone;$("warmupDone").onchange=e=>{session.warmupDone=e.target.checked};
root.querySelectorAll("[data-set]").forEach(btn=>btn.onclick=()=>{const [i,j]=btn.dataset.set.split(":").map(Number);const wasDone=session.exercises[i].done[j];session.exercises[i].done[j]=!wasDone;btn.classList.toggle("is-done",!wasDone);btn.setAttribute("aria-pressed",String(!wasDone));btn.querySelector(".set-dot").textContent=wasDone?"":"✓";updateProgress();if(!wasDone){$("restPanel").hidden=false;RestTimer.start(session.exercises[i].rest)}else RestTimer.skip()});
$("timerPause").onclick=()=>RestTimer.pause();$("timerSkip").onclick=()=>{$("restPanel").hidden=true;RestTimer.skip()};
$("finishWorkout").onclick=finish;$("cancelWorkout").onclick=()=>{RestTimer.skip();session=null;document.body.classList.remove("workout-mode");home();showToast("Workout reset")};updateProgress()}
function updateProgress(){const c=counts();$("sessionCount").textContent=c.done+"/"+c.total;$("progressPercent").textContent=c.percent+"%";$("completionValue").textContent=c.percent+"%";$("progressFill").style.width=c.percent+"%";$("footerProgress").style.width=c.percent+"%"}
function finish(){const duration=Math.max(0,Math.round((Date.now()-startedAt)/1000));Store.update(d=>d.history.unshift({name:session.name,date:new Date().toISOString(),duration,exercises:session.exercises,warmupDone:session.warmupDone}));RestTimer.skip();session=null;document.body.classList.remove("workout-mode");home();showToast("Workout saved")}
function home(){$("workoutSummary").innerHTML='<div class="empty-state"><span class="empty-icon">＋</span><h3>No workout</h3><button class="primary-button" id="startSampleButton">Start workout</button></div>';$("startSampleButton").onclick=start;stats();renderCalendar()}
$("todayDate").textContent=dateLabel();$("startSampleButton").onclick=start;$("themeButton").onclick=()=>showToast("Dark appearance");$("monthViewButton").onclick=()=>{calendarMode="month";renderCalendar()};$("yearViewButton").onclick=()=>{calendarMode="year";renderCalendar()};$("monthPrev").onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderCalendar()};$("monthNext").onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderCalendar()};stats();renderCalendar();if("serviceWorker"in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("./sw.js").catch(()=>{})})();