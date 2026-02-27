// ═══════════════════════════════════════════════════════════════════════
// SUDOKU MASTERY — Intelligent Course Engine v3
// AI Grandmaster Coach · Performance Tracking · Adaptive Feedback
// ═══════════════════════════════════════════════════════════════════════

// ── PUZZLE DATA ──────────────────────────────────────────────────────

const P0 = [
  [0,0,9,3,0,0,6,0,8],[1,0,5,2,6,4,9,3,0],[6,0,0,0,0,0,0,1,0],
  [0,0,0,9,8,0,1,5,6],[7,9,1,0,4,0,3,0,0],[0,5,6,1,2,3,7,9,4],
  [0,1,0,8,3,7,0,6,9],[0,6,0,4,0,0,0,2,1],[0,0,0,2,5,1,6,0,7],
];
const P1 = [
  [5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],
  [8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],
  [0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9],
];
const NS1 = [{r:4,c:4,v:5},{r:6,c:5,v:7},{r:6,c:8,v:4},{r:7,c:7,v:3}];
const P2 = [
  [1,2,3,4,5,6,7,0,0],[4,5,6,7,8,9,0,1,2],[7,8,9,1,2,3,4,5,6],
  [2,3,4,5,6,7,8,9,1],[5,6,7,8,9,1,2,3,4],[8,9,1,2,3,4,5,6,7],
  [3,4,5,6,7,8,9,1,2],[6,7,8,9,1,2,3,4,5],[9,1,2,3,4,5,6,7,8],
];
const P3 = [
  [0,0,0,2,6,0,7,0,1],[6,8,0,0,7,0,0,9,0],[1,9,0,0,0,4,5,0,0],
  [8,2,0,1,0,0,0,4,0],[0,0,4,6,0,2,9,0,0],[0,5,0,0,0,3,0,2,8],
  [0,0,9,3,0,0,0,7,4],[0,4,0,0,5,0,0,3,6],[7,0,3,0,1,8,0,0,0],
];
const P5 = [
  [1,0,0,0,0,0,5,6,9],[4,9,2,0,5,6,1,0,8],[0,5,6,1,0,9,2,4,0],
  [0,0,9,6,4,0,8,0,1],[0,6,4,0,1,0,0,0,0],[2,1,8,0,3,5,6,0,4],
  [0,4,0,5,0,0,0,1,6],[9,0,5,0,6,1,4,0,2],[6,2,1,0,0,0,0,5,0],
];

// ── CONSTANTS ────────────────────────────────────────────────────────

const TECH = ['Game Plan','Naked Singles','Hidden Singles','Naked Pairs','Pointing Pairs','X-Wing'];
const TECH_DESC = [
  'The expert checklist: how to read any new puzzle',
  'Cells where only one digit fits — pure elimination',
  'Digits that can only go in one cell within a unit',
  'Two cells, same two candidates, both locked',
  'A digit confined to one row/col within a box',
  'Rectangle pattern that locks a digit across two columns',
];

// ── PERFORMANCE TRACKING ─────────────────────────────────────────────

const PERF_KEY = 'sm-perf-v2';

function defaultPerf() {
  return { chapters: Array.from({length:6},(_,i)=>({
    name:TECH[i], attempts:0, errors:0, hints:0,
    timeMs:0, completed:false, sessions:0,
  })), totalSessions:0, firstSeen:Date.now() };
}

let perf = defaultPerf();
let chStartTime = null;

function loadPerf() {
  try {
    const raw = localStorage.getItem(PERF_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s.chapters) s.chapters.forEach((ch,i) => Object.assign(perf.chapters[i],ch));
      if (s.totalSessions) perf.totalSessions = s.totalSessions;
      if (s.firstSeen) perf.firstSeen = s.firstSeen;
    }
    perf.totalSessions++;
    savePerf();
  } catch(e) {}
}

function savePerf() {
  try { localStorage.setItem(PERF_KEY, JSON.stringify(perf)); } catch(e) {}
}

function recAttempt(i, ok) {
  perf.chapters[i].attempts++;
  if (!ok) perf.chapters[i].errors++;
  savePerf();
  if (!ok && perf.chapters[i].errors > 0 && perf.chapters[i].errors % 3 === 0) {
    proactiveCoach(i);
  }
}

function recHint(i)     { perf.chapters[i].hints++;     savePerf(); }
function recComplete(i) { perf.chapters[i].completed=true; savePerf(); }
function recEnter(i)    { perf.chapters[i].sessions++;  chStartTime=Date.now(); savePerf(); }
function recLeave(i)    {
  if (chStartTime) { perf.chapters[i].timeMs+=Date.now()-chStartTime; chStartTime=null; savePerf(); }
}

function accuracy(i) {
  const ch = perf.chapters[i];
  if (!ch.attempts) return null;
  return Math.round((1-ch.errors/ch.attempts)*100);
}

function buildPerfSummary() {
  const lines = perf.chapters.map((ch,i) => {
    const acc = accuracy(i);
    const mins = Math.round(ch.timeMs/60000);
    if (!ch.sessions) return null;
    return `${TECH[i]}: ${ch.completed?'(done)':'in progress'}, ${ch.attempts} attempts, ${ch.errors} errors${acc!==null?`, ${acc}% accuracy`:''}${ch.hints?' '+ch.hints+' hints':''}${mins?' ~'+mins+'min':''}`;
  }).filter(Boolean);
  return lines.length ? lines.join('\n') : 'Brand new learner — no history yet.';
}

// ── AUDIO ────────────────────────────────────────────────────────────

let _ac=null;
function getAC() { if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)(); return _ac; }
function tone(f,type,dur,vol,delay=0){
  try{const ctx=getAC(),o=ctx.createOscillator(),g=ctx.createGain();
    o.connect(g);g.connect(ctx.destination);o.type=type;o.frequency.value=f;
    const t=ctx.currentTime+delay;g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+dur);
    o.start(t);o.stop(t+dur+.05);}catch(e){}
}
const SND={
  tap:()=>tone(440,'sine',.06,.06),
  ok: ()=>{tone(523,'sine',.1,.12);tone(659,'sine',.12,.12,.09);tone(784,'sine',.16,.10,.18);},
  err:()=>{tone(220,'sawtooth',.18,.10);tone(196,'sawtooth',.2,.08,.1);},
  win:()=>[523,659,784,1047].forEach((f,i)=>tone(f,'sine',.22,.12,i*.13)),
};

// ── CONFETTI ─────────────────────────────────────────────────────────

function burst(){
  const cols=['#c8a96e','#e2c070','#f0d898','#5a9a5a','#c8732a','#5a8fc8'];
  for(let i=0;i<26;i++){
    const b=document.createElement('div'),sz=5+Math.random()*8;
    b.style.cssText=`position:fixed;z-index:9999;pointer-events:none;width:${sz}px;height:${sz}px;background:${cols[i%6]};border-radius:${Math.random()>.5?'50%':'2px'};left:${25+Math.random()*50}vw;top:45vh;transform:rotate(${Math.random()*360}deg);transition:all 1.4s cubic-bezier(.2,1,.3,1);opacity:1;`;
    document.body.appendChild(b);
    requestAnimationFrame(()=>{b.style.top=(8+Math.random()*65)+'vh';b.style.left=(5+Math.random()*90)+'vw';b.style.transform=`rotate(${Math.random()*720}deg) scale(.2)`;b.style.opacity='0';});
    setTimeout(()=>b.remove(),1600);
  }
}

// ── HELPERS ──────────────────────────────────────────────────────────

function cands(board,r,c){
  if(board[r][c]!==0)return new Set();
  const s=new Set([1,2,3,4,5,6,7,8,9]);
  for(let i=0;i<9;i++){s.delete(board[r][i]);s.delete(board[i][c]);}
  const br=3*Math.floor(r/3),bc=3*Math.floor(c/3);
  for(let dr=0;dr<3;dr++)for(let dc=0;dc<3;dc++)s.delete(board[br+dr][bc+dc]);
  return s;
}
function ntsHTML(cs,hi=[],bl=[],st=[]){
  let h='<div class="nts">';
  for(let n=1;n<=9;n++){
    if(!cs.has(n)){h+='<span></span>';continue;}
    const cls=st.includes(n)?'st':bl.includes(n)?'bl':hi.includes(n)?'hi':'';
    h+=`<span${cls?` class="${cls}"`:''}>${n}</span>`;
  }
  return h+'</div>';
}
function mkCell(board,r,c,extra='',fn=null,html=null){
  const v=board[r][c],div=document.createElement('div');
  div.className='cell '+(v?'given':'empty')+(extra?' '+extra:'');
  div.dataset.r=r;div.dataset.c=c;
  if(html)div.innerHTML=html;else if(v)div.textContent=v;
  if(fn)div.onclick=fn;
  return div;
}
function showFb(id,type,msg){
  const el=document.getElementById(id);if(!el)return;
  el.className=`fb ${type} show`;el.innerHTML=msg;
}
function mkNumpad(id,handler,digits=[1,2,3,4,5,6,7,8,9]){
  const np=document.getElementById(id);if(!np)return;
  np.innerHTML='';
  digits.forEach(n=>{
    const btn=document.createElement('button');
    btn.className='np-btn';btn.textContent=n;
    btn.onclick=()=>{pressBtn(btn);handler(n);};
    np.appendChild(btn);
  });
}
function pressBtn(btn){
  btn.classList.remove('pressed');void btn.offsetWidth;btn.classList.add('pressed');
  setTimeout(()=>btn.classList.remove('pressed'),160);
}

// ── STATE ─────────────────────────────────────────────────────────────

let cur=0;
const done=new Array(6).fill(false);

// ── NAVIGATION ───────────────────────────────────────────────────────

function go(idx){
  SND.tap();recLeave(cur);
  document.querySelectorAll('.chapter').forEach(el=>el.classList.remove('active'));
  const t=document.getElementById(idx<6?`ch${idx}`:'ch6');if(t)t.classList.add('active');
  cur=Math.min(idx,6);recEnter(cur);
  updateNav();buildDots();updateProgress();
  window.scrollTo({top:0,behavior:'smooth'});
  updateCoachContext();
}
function updateNav(){
  const nav=document.getElementById('nav');if(!nav)return;
  nav.innerHTML='';
  TECH.forEach((name,i)=>{
    const btn=document.createElement('button');
    const acc=accuracy(i);
    btn.className='nav-btn'+(i===cur?' active':'')+(done[i]?' done':'');
    btn.innerHTML=`<span class="nav-num">${i===0?'Intro':`Ch ${i}`}</span>${name}${done[i]?` <span class="nav-chk">✓</span>`:''}${acc!==null&&!done[i]?`<span class="nav-acc">${acc}%</span>`:''}`;
    btn.onclick=()=>go(i);nav.appendChild(btn);
  });
}
function buildDots(){
  for(let ch=0;ch<6;ch++){
    const el=document.getElementById(`dots${ch}`);if(!el)continue;el.innerHTML='';
    for(let i=0;i<6;i++){
      const d=document.createElement('div');
      d.className='dot'+(done[i]?' done':'')+(i===ch?' cur':'');
      d.title=TECH[i];d.onclick=()=>go(i);el.appendChild(d);
    }
  }
}
function updateProgress(){
  const pct=Math.round(done.filter(Boolean).length/6*100);
  const fill=document.getElementById('prog-fill');if(fill)fill.style.width=pct+'%';
}

// ── COMPLETE CHAPTER ─────────────────────────────────────────────────

function complete(i){
  if(done[i])return;
  done[i]=true;recComplete(i);SND.win();burst();
  const b=document.getElementById(`badge${i}`);if(b)b.classList.add('show');
  const nx=document.getElementById(`next${i}`);if(nx)nx.disabled=false;
  updateNav();buildDots();updateProgress();
}

// ── KEYBOARD ─────────────────────────────────────────────────────────

document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(e.key>='1'&&e.key<='9'){
    const n=parseInt(e.key);
    const np=document.querySelector('.chapter.active .numpad');
    if(np){const btn=[...np.querySelectorAll('.np-btn')].find(b=>+b.textContent===n);if(btn){pressBtn(btn);btn.click();}}
  }
  if(e.key==='ArrowRight'&&cur<5)go(cur+1);
  if(e.key==='ArrowLeft'&&cur>0)go(cur-1);
  if(e.key==='Escape')closeCoach();
});

// ═══════════════════════════════════════════════════════════════════════
// AI GRANDMASTER COACH
// ═══════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are Magnus  -  a Sudoku grandmaster and world-class educator built into the Sudoku Mastery course. You have encyclopaedic knowledge of every Sudoku technique from naked singles to Swordfish and beyond.

Your role:
- Coach learners through the interactive course
- Answer any Sudoku question with precision and depth
- Reference their personal performance history to give specific, targeted advice
- Be direct, insightful, and occasionally witty  -  like a brilliant coach, not a textbook
- Use concrete notation (R1C1, Box 3, etc.) when demonstrating techniques
- When someone is struggling, diagnose WHY  -  not just what they got wrong

You know these techniques deeply: Naked Singles, Hidden Singles, Naked Pairs/Triples, Pointing Pairs/Triples, Box-Line Reduction, X-Wing, Swordfish, XY-Wing, Skyscraper, and more advanced patterns.

Tone: confident, direct, warm when needed. Never condescending. Never vague.
Length: match the question  -  short sharp answers for quick questions, detailed for complex ones.`;

let chatHistory = [];
let coachOpen = false;
let pendingAlert = false;

function toggleCoach(){
  coachOpen=!coachOpen;
  const panel=document.getElementById('coach-panel');
  const btn=document.getElementById('coach-btn');
  if(coachOpen){
    panel.classList.add('open');
    btn.classList.remove('has-alert');
    pendingAlert=false;
    updateBadge(0);
    // First time greeting
    if(chatHistory.length===0) sendGreeting();
    setTimeout(()=>document.getElementById('coach-input')?.focus(),300);
  } else {
    panel.classList.remove('open');
  }
}
function closeCoach(){
  coachOpen=false;
  document.getElementById('coach-panel')?.classList.remove('open');
}

function updateCoachContext(){
  const ctx=document.getElementById('coach-context-label');
  if(ctx) ctx.innerHTML=`Currently in: <span>${TECH[Math.min(cur,5)]}</span>`;
}

function alertCoach(){
  if(coachOpen)return;
  pendingAlert=true;
  const btn=document.getElementById('coach-btn');
  btn.classList.add('has-alert');
  updateBadge(1);
}

function updateBadge(n){
  const badge=document.querySelector('#coach-btn .coach-badge');
  if(badge){badge.textContent=n;badge.style.display=n>0?'flex':'none';}
}

function sendGreeting(){
  const chName=TECH[Math.min(cur,5)];
  const sessionNum=perf.totalSessions;
  const hasHistory=perf.chapters.some(ch=>ch.sessions>1);
  let greeting;
  if(!hasHistory||sessionNum<=1){
    greeting=`Welcome to Sudoku Mastery. I'm Magnus  -  your Sudoku coach. I've watched thousands of learners get stuck at Medium puzzles, and I know exactly why. Ask me anything  -  techniques, why something didn't work, what to try next. I'm here.`;
  } else {
    const weak=perf.chapters.reduce((w,ch,i)=>{
      if(!ch.completed||!ch.attempts)return w;
      const acc=accuracy(i);if(acc===null)return w;
      return(!w||acc<accuracy(w))?i:w;
    },null);
    if(weak!==null){
      const acc=accuracy(weak);
      greeting=`Good to see you back. Your ${TECH[weak]} accuracy is at ${acc}%  -  that's the one to crack. What's tripping you up there?`;
    } else {
      greeting=`Welcome back. You're in ${chName} now. What do you need?`;
    }
  }
  appendMsg('coach',greeting);
  chatHistory.push({role:'assistant',content:greeting});
}

async function proactiveCoach(chIdx){
  const ch=perf.chapters[chIdx];
  const techName=TECH[chIdx];
  const msg=`I see you've hit ${ch.errors} errors on ${techName}. Want me to diagnose what's going wrong? Just ask  -  or I can walk you through the exact mental model that makes this technique click.`;
  appendMsg('coach',msg,true);
  chatHistory.push({role:'assistant',content:msg});
  alertCoach();
}

async function sendMessage(text){
  if(!text.trim())return;
  const input=document.getElementById('coach-input');
  const sendBtn=document.getElementById('coach-send');
  input.value='';input.style.height='36px';
  sendBtn.disabled=true;

  // Add user message
  appendMsg('user',text);
  chatHistory.push({role:'user',content:text});

  // Show typing
  const typingEl=showTyping();

  // Build full context for the AI
  const contextMsg=`LEARNER PERFORMANCE PROFILE:\n${buildPerfSummary()}\n\nCURRENT CHAPTER: ${TECH[Math.min(cur,5)]}  -  ${TECH_DESC[Math.min(cur,5)]}\n\nLEARNER'S QUESTION: ${text}`;

  // Replace last user message with context-enriched version for API
  const messagesForAPI=[
    ...chatHistory.slice(0,-1), // everything before last user msg
    {role:'user',content:contextMsg}
  ];

  try {
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:400,
        system:SYSTEM_PROMPT,
        messages:messagesForAPI,
      })
    });
    const data=await res.json();
    const reply=data.content?.[0]?.text||"I'm having trouble connecting right now. Try again in a moment.";
    typingEl.remove();
    appendMsg('coach',reply);
    chatHistory.push({role:'assistant',content:reply});
    // Keep history manageable
    if(chatHistory.length>20) chatHistory=chatHistory.slice(-18);
  } catch(err) {
    typingEl.remove();
    const errMsg="Connection issue — make sure you're online. Your question was good though, try again.";
    appendMsg('coach',errMsg);
    chatHistory.push({role:'assistant',content:errMsg});
  }
  sendBtn.disabled=false;
  setTimeout(()=>input.focus(),100);
}

function appendMsg(role, text, proactive=false){
  const msgs=document.getElementById('coach-msgs');if(!msgs)return;
  const wrap=document.createElement('div');
  wrap.className=`msg ${role}${proactive?' proactive':''}`;
  const avatar=document.createElement('div');avatar.className='msg-avatar';
  avatar.textContent=role==='coach'?'♟':'◈';
  const bubble=document.createElement('div');bubble.className='msg-bubble';
  bubble.innerHTML=text.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
  wrap.appendChild(avatar);wrap.appendChild(bubble);
  msgs.appendChild(wrap);
  msgs.scrollTop=msgs.scrollHeight;
}

function showTyping(){
  const msgs=document.getElementById('coach-msgs');if(!msgs)return null;
  const wrap=document.createElement('div');wrap.className='msg coach';
  const avatar=document.createElement('div');avatar.className='msg-avatar';avatar.textContent='♟';
  const bubble=document.createElement('div');bubble.className='typing-bubble';
  [1,2,3].forEach(()=>{const d=document.createElement('div');d.className='typing-dot';bubble.appendChild(d);});
  wrap.appendChild(avatar);wrap.appendChild(bubble);
  msgs.appendChild(wrap);msgs.scrollTop=msgs.scrollHeight;
  return wrap;
}

function sendQuick(txt){
  const input=document.getElementById('coach-input');
  if(input){input.value=txt;sendMessage(txt);}
}

// ── COACH PANEL SETUP ────────────────────────────────────────────────

function initCoachUI(){
  // Build floating button
  const btn=document.createElement('div');
  btn.id='coach-btn';btn.title='Ask your Sudoku coach';btn.innerHTML='♟<span class="coach-badge">0</span>';
  btn.onclick=toggleCoach;document.body.appendChild(btn);

  // Build chat panel
  const panel=document.createElement('div');panel.id='coach-panel';
  panel.innerHTML=`
    <div class="coach-head">
      <div class="coach-avatar">♟</div>
      <div><div class="coach-name">Magnus</div><div class="coach-status">Sudoku Grandmaster</div></div>
      <button class="coach-close" onclick="closeCoach()" title="Close">✕</button>
    </div>
    <div class="coach-context">Currently in: <span id="coach-context-label">${TECH[0]}</span></div>
    <div id="coach-msgs"></div>
    <div class="coach-quick">
      <button class="quick-btn" onclick="sendQuick('Why am I getting this wrong?')">Why am I failing?</button>
      <button class="quick-btn" onclick="sendQuick('Explain this technique again')">Explain this</button>
      <button class="quick-btn" onclick="sendQuick('Give me a tip for this chapter')">Tip</button>
      <button class="quick-btn" onclick="sendQuick('What should I focus on next?')">What next?</button>
    </div>
    <div class="coach-input-row">
      <input id="coach-input" type="text" placeholder="Ask anything about Sudoku..." autocomplete="off" maxlength="300">
      <button id="coach-send" onclick="sendFromInput()">↑</button>
    </div>`;
  document.body.appendChild(panel);

  // Enter key to send
  setTimeout(()=>{
    const inp=document.getElementById('coach-input');
    if(inp) inp.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendFromInput();}});
  },100);

  updateCoachContext();
}

function sendFromInput(){
  const inp=document.getElementById('coach-input');
  if(inp&&inp.value.trim()) sendMessage(inp.value.trim());
}

// ═══════════════════════════════════════════════════════════════════════
// CHAPTERS
// ═══════════════════════════════════════════════════════════════════════

// ── CH0 — GAME PLAN ──────────────────────────────────────────────────

function buildB0(){
  const brd=document.getElementById('board0');if(!brd)return;
  brd.innerHTML='';
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){const div=mkCell(P0,r,c);div.id=`b0r${r}c${c}`;brd.appendChild(div);}
}
function wk(step){
  SND.tap();
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const el=document.getElementById(`b0r${r}c${c}`);if(!el)continue;
    const v=P0[r][c];el.className='cell '+(v?'given':'empty');el.innerHTML='';if(v)el.textContent=v;
  }
  document.querySelectorAll('#wk0 .wk-step').forEach((el,i)=>{
    el.className='wk-step'+(i<step?' done':i===step?' active':'');
  });
  const lbl=document.getElementById('lbl0');
  if(step===0){
    for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(P0[r][c])document.getElementById(`b0r${r}c${c}`).classList.add('step-hi');
    if(lbl)lbl.textContent='Step 1 — count clues: which digits appear most?';
  }else if(step===1){
    for(let c=0;c<9;c++){const el=document.getElementById(`b0r1c${c}`);if(P0[1][c])el.classList.add('step-hi');else{el.className='cell target';el.innerHTML=`<span style="font-size:.55rem;color:var(--gold)">?</span>`;}}
    if(lbl)lbl.textContent='Step 2 — Row 2 has 8 digits placed, one slot empty';
  }else if(step===2){
    [[3,7,5],[5,4,2],[6,5,7]].forEach(([r,c,v])=>{
      for(let i=0;i<9;i++){const er=document.getElementById(`b0r${r}c${i}`);const ec=document.getElementById(`b0r${i}c${c}`);if(i!==c&&er)er.classList.add('hl-row');if(i!==r&&ec)ec.classList.add('hl-col');}
      const el=document.getElementById(`b0r${r}c${c}`);el.className='cell correct';el.textContent=v;
    });
    if(lbl)lbl.textContent='Step 3 — three naked singles drop: R4C8=5, R6C5=2, R7C6=7';
  }else if(step===3||step===4){
    for(let r=0;r<9;r++)for(let c=0;c<9;c++)if(!P0[r][c]){
      const cs=cands(P0,r,c);const el=document.getElementById(`b0r${r}c${c}`);
      if(cs.size===1){el.className='cell target';el.innerHTML=ntsHTML(cs,[...cs]);}
      else if(cs.size>0){el.className='cell annot';el.innerHTML=ntsHTML(cs);}
    }
    if(step===4){
      for(let r=0;r<3;r++)for(let c=0;c<3;c++)document.getElementById(`b0r${r}c${c}`).classList.add('step-hi');
      if(lbl)lbl.textContent='Step 5 — ask "where?" in each box: hidden singles appear';
      complete(0);
    }else{if(lbl)lbl.textContent='Step 4 — pencil marks reveal cells with one candidate';}
  }
}

// ── CH1 — NAKED SINGLES ──────────────────────────────────────────────

let ns1sel=null,ns1count=0;

function buildB1(){
  const brd=document.getElementById('board1');if(!brd)return;
  brd.innerHTML='';ns1sel=null;ns1count=0;
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const isNS=NS1.some(n=>n.r===r&&n.c===c);
    const div=mkCell(P1,r,c,isNS?'target':'');div.id=`b1r${r}c${c}`;
    if(isNS)div.onclick=()=>selNS1(r,c);brd.appendChild(div);
  }
  mkNumpad('np1',tryNS1);
  const p=document.getElementById('prog1');if(p)p.textContent='0 of 4 naked singles placed';
  const ep=document.getElementById('ex1p');if(ep)ep.innerHTML='Four gold cells are naked singles. <strong>Tap one</strong>, then tap the digit that belongs there. Keyboard 1–9 works too.';
}
function selNS1(r,c){
  if(document.getElementById(`b1r${r}c${c}`).classList.contains('correct'))return;
  SND.tap();
  for(let i=0;i<9;i++)for(let j=0;j<9;j++){
    const el=document.getElementById(`b1r${i}c${j}`);if(!el)continue;
    el.classList.remove('hl-row','hl-col','hl-box','sel');
    if(NS1.some(n=>n.r===i&&n.c===j)&&!el.classList.contains('correct'))el.className='cell target';
  }
  ns1sel={r,c};
  const el=document.getElementById(`b1r${r}c${c}`);el.className='cell target sel';
  const br=3*Math.floor(r/3),bc=3*Math.floor(c/3);
  for(let i=0;i<9;i++){
    const er=document.getElementById(`b1r${r}c${i}`);const ec=document.getElementById(`b1r${i}c${c}`);
    if(er&&i!==c&&!er.classList.contains('correct'))er.classList.add('hl-row');
    if(ec&&i!==r&&!ec.classList.contains('correct'))ec.classList.add('hl-col');
  }
  for(let dr=0;dr<3;dr++)for(let dc=0;dc<3;dc++){
    const eb=document.getElementById(`b1r${br+dr}c${bc+dc}`);
    if(eb&&!(br+dr===r&&bc+dc===c)&&!eb.classList.contains('correct'))eb.classList.add('hl-box');
  }
  document.getElementById('ex1p').innerHTML=`<strong>R${r+1}C${c+1} selected.</strong> Row, column and box are highlighted  -  count what's placed. Only one digit isn't there. Which is it?`;
  document.getElementById('fb1').className='fb';
}
function tryNS1(n){
  if(!ns1sel){showFb('fb1','err','Tap a gold cell first.');SND.err();return;}
  const{r,c}=ns1sel;const ns=NS1.find(x=>x.r===r&&x.c===c);if(!ns)return;
  const el=document.getElementById(`b1r${r}c${c}`);
  if(n===ns.v){
    SND.ok();recAttempt(1,true);
    el.className='cell correct';el.textContent=n;el.onclick=null;
    ns1count++;ns1sel=null;
    for(let i=0;i<9;i++)for(let j=0;j<9;j++){const e=document.getElementById(`b1r${i}c${j}`);if(e)e.classList.remove('hl-row','hl-col','hl-box','sel');}
    showFb('fb1','ok',`(done) Correct  -  ${n} is the only digit that fits at R${r+1}C${c+1}.`);
    document.getElementById('prog1').textContent=`${ns1count} of 4 naked singles placed`;
    if(ns1count===4)setTimeout(()=>complete(1),400);
  }else{
    SND.err();recAttempt(1,false);
    el.classList.add('wrong');setTimeout(()=>el.classList.remove('wrong'),400);
    showFb('fb1','err',`(x) Not ${n}. Look at what's already in the row, column, and box  -  eliminate them one by one.`);
  }
}

// ── CH2 — HIDDEN SINGLES ─────────────────────────────────────────────

const HS2=[
  {r:0,c:7,v:8,prompt:'Where in <strong>Box 3</strong> (top-right) can digit <strong>8</strong> go?',hint:'Digit 8 exists in the rows and columns of every other empty cell in Box 3 — only R1C8 is clear.'},
  {r:0,c:8,v:9,prompt:'Now find digit <strong>9</strong> — where must it go in Box 3?',hint:'R1C8 is taken. Check each remaining empty cell in Box 3 against its row and column for digit 9.'},
  {r:1,c:6,v:3,prompt:'Last one: digit <strong>3</strong> — only one cell in Box 3 can hold it.',hint:'Digit 3 appears in rows or columns blocking every other empty cell. Only R2C7 survives.'},
];
let hs2idx=0,hs2sel=-1;
const P2live=P2.map(r=>[...r]);

function buildB2(){
  const brd=document.getElementById('board2');if(!brd)return;
  brd.innerHTML='';hs2idx=0;hs2sel=-1;P2.forEach((row,r)=>row.forEach((_,c)=>{P2live[r][c]=P2[r][c];}));
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const v=P2[r][c];const inB3=r<3&&c>=6;const isT=HS2.some(t=>t.r===r&&t.c===c);
    let cls=v?(inB3?'given step-hi':'given'):(isT?(r===0&&c===7?'target':'empty'):'empty');
    const div=document.createElement('div');div.className='cell '+cls;div.id=`b2r${r}c${c}`;
    if(v)div.textContent=v;
    else if(r===0&&c===7){div.innerHTML=ntsHTML(new Set([8,9]),[8]);div.onclick=()=>selHS2(0);}
    else if(r===0&&c===8)div.innerHTML=ntsHTML(new Set([9,3]),[9]);
    else if(r===1&&c===6)div.innerHTML=ntsHTML(new Set([3]),[3]);
    brd.appendChild(div);
  }
  mkNumpad('np2',tryHS2);renderHS2();
}
function renderHS2(){
  const t=HS2[hs2idx];if(!t)return;
  document.getElementById('ex2p').innerHTML=t.prompt+' — tap the gold cell, then confirm with the numpad.';
  document.getElementById('fb2').className='fb';
  HS2.forEach((tg,i)=>{
    const el=document.getElementById(`b2r${tg.r}c${tg.c}`);if(!el||P2live[tg.r][tg.c])return;
    el.className='cell '+(i===hs2idx?'target':'empty');if(i===hs2idx)el.onclick=()=>selHS2(i);
  });
}
function selHS2(i){
  if(hs2idx!==i){showFb('fb2','err','Follow the prompt — find the current digit first.');SND.err();return;}
  SND.tap();hs2sel=i;const t=HS2[i];
  const el=document.getElementById(`b2r${t.r}c${t.c}`);el.className='cell target sel';
  for(let r=0;r<3;r++)for(let c=6;c<9;c++){const b=document.getElementById(`b2r${r}c${c}`);if(b&&!b.classList.contains('correct'))b.classList.add('step-hi');}
  for(let c=0;c<6;c++)document.getElementById(`b2r${t.r}c${c}`)?.classList.add('hl-row');
  for(let r=3;r<9;r++)document.getElementById(`b2r${r}c${t.c}`)?.classList.add('hl-col');
  document.getElementById('ex2p').innerHTML=`(done) R${t.r+1}C${t.c+1} selected  -  it's the only cell in Box 3 that can hold <strong>${t.v}</strong>. Confirm on the numpad.`;
  showFb('fb2','ok',`R${t.r+1}C${t.c+1} is the hidden single for digit ${t.v}.`);
}
function tryHS2(n){
  if(hs2sel!==hs2idx){showFb('fb2','err','Tap the gold cell on the board first.');SND.err();return;}
  const t=HS2[hs2idx];
  if(n===t.v){
    SND.ok();recAttempt(2,true);P2live[t.r][t.c]=n;
    const el=document.getElementById(`b2r${t.r}c${t.c}`);el.className='cell correct';el.textContent=n;el.onclick=null;
    document.querySelectorAll('#board2 .cell').forEach(c=>c.classList.remove('hl-row','hl-col','step-hi','sel'));
    hs2idx++;hs2sel=-1;
    if(hs2idx<HS2.length){showFb('fb2','ok',`(done) Digit ${n} placed  -  find the next hidden single.`);renderHS2();}
    else{showFb('fb2','ok','✓ All three hidden singles found!');setTimeout(()=>complete(2),400);}
  }else{
    SND.err();recAttempt(2,false);
    showFb('fb2','err',`(x) Not ${n}. ${t.hint}`);
  }
}

// ── CH3 — NAKED PAIRS ────────────────────────────────────────────────

let np3phase=0,np3tapped=new Set();

function buildB3(){
  const brd=document.getElementById('board3');if(!brd)return;
  brd.innerHTML='';np3phase=0;np3tapped=new Set();
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const v=P3[r][c];const div=document.createElement('div');div.id=`b3r${r}c${c}`;
    if(v){div.className='cell given'+(r===7?' step-hi':'');div.textContent=v;}
    else{
      const cs=cands(P3,r,c);
      if(r===7){
        const isPair=(c===3||c===5);const isElim=(c===2||c===6)&&(cs.has(7)||cs.has(9));
        div.className='cell '+(isPair?'pair':isElim?'elim':'annot');
        if(cs.size>0)div.innerHTML=ntsHTML(cs,isPair?[7,9]:[],isPair?[]:(isElim?[7,9]:[]));
        if(isPair){div.style.cursor='pointer';div.onclick=()=>tapPair3(c);}
      }else div.className='cell empty';
    }
    brd.appendChild(div);
  }
  mkNumpad('np3',tryNP3,[7,9,2,5,3,4]);
  document.getElementById('ex3p').innerHTML='Two cells in Row 8 share exactly the same two candidates — the naked pair. <strong>Tap both blue cells</strong> to confirm you see them, then tap one of the locked digits.';
  document.getElementById('fb3').className='fb';
}
function tapPair3(c){
  if(np3phase>0)return;SND.tap();np3tapped.add(c);
  document.getElementById(`b3r7c${c}`).classList.add('sel');
  if(np3tapped.size===2){np3phase=1;showFb('fb3','ok','Both pair cells selected ✓ — now tap one of the two locked digits.');document.getElementById('ex3p').innerHTML='R8C4 and R8C6 each hold exactly {7,9} — same pair, exclusively. <strong>Tap 7 or 9</strong> to confirm the lock.';}
  else showFb('fb3','ok','First cell confirmed ✓ — now tap the second blue cell.');
}
function tryNP3(n){
  if(np3phase===0){showFb('fb3','err','First tap both blue pair cells on the board.');SND.err();recAttempt(3,false);return;}
  if(n===7||n===9){
    SND.ok();recAttempt(3,true);
    showFb('fb3','ok',`(done) Correct! {7,9} is locked to R8C4 and R8C6. Every other cell in Row 8 loses both digits.`);
    document.getElementById(`b3r7c3`).className='cell pair correct';
    document.getElementById(`b3r7c5`).className='cell pair correct';
    setTimeout(()=>complete(3),400);
  }else{
    SND.err();recAttempt(3,false);
    showFb('fb3','err',`(x) ${n} is not in the pair. Look at R8C4 and R8C6  -  they have only two candidates each, and they match.`);
  }
}

// ── CH4 — POINTING PAIRS ─────────────────────────────────────────────

let pp4hits=0;const PP4E=[];

function buildB4(){
  const brd=document.getElementById('board4');if(!brd)return;
  brd.innerHTML='';pp4hits=0;PP4E.length=0;
  // Pointing pair: digit 2 in Box 1 is confined to column 3 (c===2)
  // Pointing cells: R2C3 {2,5} and R3C3 {2,7}
  // Elimination cell: R8C3 — loses candidate 2
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const v=P3[r][c];const div=document.createElement('div');div.id=`b4r${r}c${c}`;
    const inB1=r<3&&c<3;const cs=cands(P3,r,c);
    const isPointer=inB1&&c===2&&cs.has(2);       // R2C3 and R3C3
    const isElim=r>=3&&c===2&&!v&&cs.has(2);       // R8C3 (and any other col-3 cells outside box 1 with cand 2)
    if(v){div.className='cell given'+(inB1?' step-hi':'');div.textContent=v;}
    else if(isPointer){div.className='cell point';div.innerHTML=ntsHTML(cs,[2]);}
    else if(isElim){PP4E.push({r,c});div.className='cell elim target';div.innerHTML=ntsHTML(cs,[],[2]);div.onclick=()=>tryPP4(r,c);}
    else{div.className='cell '+(cs.size>0&&inB1?'annot':'empty');if(cs.size>0&&inB1)div.innerHTML=ntsHTML(cs);}
    brd.appendChild(div);
  }
  document.getElementById('ex4p').innerHTML=`Digit 2 in Box 1 is locked to Column 3 (orange cells). <strong>${PP4E.length} red cell${PP4E.length!==1?'s':''}</strong> in Col 3 outside Box 1 must lose digit 2. Tap ${PP4E.length===1?'it':'each one'}.`;
  document.getElementById('fb4').className='fb';
  const pr=document.getElementById('prog4');if(pr)pr.textContent=`0 of ${PP4E.length} eliminations`;
}
function tryPP4(r,c){
  const el=document.getElementById(`b4r${r}c${c}`);if(el.classList.contains('correct'))return;
  SND.ok();recAttempt(4,true);
  el.className='cell correct';el.textContent='✕';el.onclick=null;
  pp4hits++;
  const pr=document.getElementById('prog4');if(pr)pr.textContent=`${pp4hits} of ${PP4E.length} eliminations`;
  showFb('fb4','ok',`(done) R${r+1}C${c+1} loses digit 2. The pointing pair in Box 1 locks digit 2 inside Column 3, clearing it from everything below.`);
  if(pp4hits>=PP4E.length)setTimeout(()=>complete(4),400);
}

// ── CH5 — X-WING ─────────────────────────────────────────────────────

const XWR=[1,5],XWC=[3,7];
let xw5c=0,xw5t=0;

function buildB5(){
  const brd=document.getElementById('board5');if(!brd)return;
  brd.innerHTML='';xw5c=0;xw5t=0;
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const v=P5[r][c];const div=document.createElement('div');div.id=`b5r${r}c${c}`;
    const isCorner=XWR.includes(r)&&XWC.includes(c)&&!v;
    const isElim=!XWR.includes(r)&&XWC.includes(c)&&!v&&cands(P5,r,c).has(7);
    if(v){div.className='cell given';div.textContent=v;}
    else if(isCorner){div.className='cell xwing';div.innerHTML=ntsHTML(cands(P5,r,c),[7]);}
    else if(isElim){xw5t++;div.className='cell elim target';div.innerHTML=ntsHTML(cands(P5,r,c),[],[7]);div.onclick=()=>tryXW5(r,c);}
    else div.className='cell empty';
    brd.appendChild(div);
  }
  const pr=document.getElementById('prog5');if(pr)pr.textContent=`Tap all ${xw5t} red elimination cells`;
  document.getElementById('fb5').className='fb';
}
function tryXW5(r,c){
  const el=document.getElementById(`b5r${r}c${c}`);if(el.classList.contains('correct'))return;
  SND.ok();recAttempt(5,true);
  el.className='cell correct';el.onclick=null;el.textContent='✕';
  xw5c++;
  const pr=document.getElementById('prog5');if(pr)pr.textContent=`${xw5c} of ${xw5t} confirmed`;
  showFb('fb5','ok',`(done) R${r+1}C${c+1} loses digit 7. The X-Wing locks 7 to cols ${XWC[0]+1} & ${XWC[1]+1}  -  cleared everywhere else in those columns.`);
  if(xw5c>=xw5t)setTimeout(()=>complete(5),400);
}

// ── INIT ─────────────────────────────────────────────────────────────

function init(){
  loadPerf();
  buildB0();buildB1();buildB2();buildB3();buildB4();buildB5();
  updateNav();buildDots();updateProgress();
  initCoachUI();
  go(0);
}
init();
