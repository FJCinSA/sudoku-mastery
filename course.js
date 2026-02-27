// ═══════════════════════════════════════════════
// PUZZLE DATA
// ═══════════════════════════════════════════════

// CH0: Game Plan — from screenshot
const P0 = [
  [0,0,9, 3,0,0, 6,0,8],
  [1,0,5, 2,6,4, 9,3,0],
  [6,0,0, 0,0,0, 0,1,0],
  [0,0,0, 9,8,0, 1,5,6],
  [7,9,1, 0,4,0, 3,0,0],
  [0,5,6, 1,2,3, 7,9,4],
  [0,1,0, 8,3,7, 0,6,9],
  [0,6,0, 4,0,0, 0,2,1],
  [0,0,0, 2,5,1, 6,0,7],
];
// CH1: Classic sudoku — 4 naked singles
const P1 = [
  [5,3,0, 0,7,0, 0,0,0],
  [6,0,0, 1,9,5, 0,0,0],
  [0,9,8, 0,0,0, 0,6,0],
  [8,0,0, 0,6,0, 0,0,3],
  [4,0,0, 8,0,3, 0,0,1],
  [7,0,0, 0,2,0, 0,0,6],
  [0,6,0, 0,0,0, 2,8,0],
  [0,0,0, 4,1,9, 0,0,5],
  [0,0,0, 0,8,0, 0,7,9],
];
const NS1 = [{r:4,c:4,v:5},{r:6,c:5,v:7},{r:6,c:8,v:4},{r:7,c:7,v:3}];

// CH2: Hidden single — 8 only fits R1C8 in Box 3
const P2 = [
  [1,2,3, 4,5,6, 7,0,0],
  [4,5,6, 7,8,9, 0,1,2],
  [7,8,9, 1,2,3, 4,5,6],
  [2,3,4, 5,6,7, 8,9,1],
  [5,6,7, 8,9,1, 2,3,4],
  [8,9,1, 2,3,4, 5,6,7],
  [3,4,5, 6,7,8, 9,1,2],
  [6,7,8, 9,1,2, 3,4,5],
  [9,1,2, 3,4,5, 6,7,8],
];
// R1C8=hidden single (8), R1C9=naked single (9), R2C7 blocked

// CH3: Famous naked pair puzzle
const P3 = [
  [0,0,0, 2,6,0, 7,0,1],
  [6,8,0, 0,7,0, 0,9,0],
  [1,9,0, 0,0,4, 5,0,0],
  [8,2,0, 1,0,0, 0,4,0],
  [0,0,4, 6,0,2, 9,0,0],
  [0,5,0, 0,0,3, 0,2,8],
  [0,0,9, 3,0,0, 0,7,4],
  [0,4,0, 0,5,0, 0,3,6],
  [7,0,3, 0,1,8, 0,0,0],
];
// Verified: R8C4={7,9}, R8C6={7,9} → naked pair

// CH5: X-Wing — digit 7 in rows 2&6 (idx 1,5), cols 4&8 (idx 3,7)
const P5 = [
  [1,0,0, 0,0,0, 5,6,9],
  [4,9,2, 0,5,6, 1,0,8],
  [0,5,6, 1,0,9, 2,4,0],
  [0,0,9, 6,4,0, 8,0,1],
  [0,6,4, 0,1,0, 0,0,0],
  [2,1,8, 0,3,5, 6,0,4],
  [0,4,0, 5,0,0, 0,1,6],
  [9,0,5, 0,6,1, 4,0,2],
  [6,2,1, 0,0,0, 0,5,0],
];
// Verified: digit 7 in row2 cols {4,8} and row6 cols {4,8}

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════
function cands(board,r,c) {
  if (board[r][c]!==0) return new Set();
  const s=new Set([1,2,3,4,5,6,7,8,9]);
  for (let i=0;i<9;i++){s.delete(board[r][i]);s.delete(board[i][c]);}
  const br=3*Math.floor(r/3),bc=3*Math.floor(c/3);
  for (let dr=0;dr<3;dr++) for (let dc=0;dc<3;dc++) s.delete(board[br+dr][bc+dc]);
  return s;
}

function ntsHTML(cs, hi=[], bl=[], st=[]) {
  let h='<div class="nts">';
  for (let n=1;n<=9;n++) {
    const has=cs.has(n);
    if (!has) { h+='<span></span>'; continue; }
    const cls = st.includes(n)?'st':bl.includes(n)?'bl':hi.includes(n)?'hi':'';
    h+=`<span${cls?` class="${cls}"`:''}>${n}</span>`;
  }
  return h+'</div>';
}

function mkCell(board,r,c,extraClass='',onclick=null,overrideContent=null) {
  const v=board[r][c];
  const div=document.createElement('div');
  div.className='cell '+(v?'given':'empty')+(extraClass?' '+extraClass:'');
  div.dataset.r=r; div.dataset.c=c;
  if (overrideContent) div.innerHTML=overrideContent;
  else if (v) div.textContent=v;
  if (onclick) div.onclick=onclick;
  return div;
}

function fb(id,type,msg) {
  const el=document.getElementById(id);
  el.className=`fb ${type} show`;
  el.innerHTML=msg;
}

function mkNumpad(id, handler, digits=[1,2,3,4,5,6,7,8,9]) {
  const np=document.getElementById(id);
  np.innerHTML='';
  digits.forEach(n=>{
    const btn=document.createElement('button');
    btn.className='np-btn'; btn.textContent=n;
    btn.onclick=()=>handler(n);
    np.appendChild(btn);
  });
}

function complete(i) {
  document.getElementById(`badge${i}`).classList.add('show');
  const nx=document.getElementById(`next${i}`);
  if (nx) nx.disabled=false;
  done[i]=true; updateNav(); buildDots();
}

// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════
let cur=0;
const done=new Array(6).fill(false);
const NAMES=['The Game Plan','Naked Singles','Hidden Singles','Naked Pairs','Pointing Pairs','X-Wing'];

// ═══════════════════════════════════════════════
// BOARD 0 — GAME PLAN
// ═══════════════════════════════════════════════
function buildB0() {
  const brd=document.getElementById('board0');
  brd.innerHTML='';
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
    const div=mkCell(P0,r,c);
    div.id=`b0r${r}c${c}`;
    brd.appendChild(div);
  }
}

function wk(step) {
  // Reset
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
    const el=document.getElementById(`b0r${r}c${c}`);
    if (!el) continue;
    const v=P0[r][c];
    el.className='cell '+(v?'given':'empty');
    el.innerHTML='';
    if (v) el.textContent=v;
  }
  document.querySelectorAll('#wk0 .wk-step').forEach((el,i)=>{
    el.className='wk-step'+(i<step?' done':i===step?' active':'');
  });

  if (step===0) {
    // Highlight all givens — count context
    for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
      if (P0[r][c]) document.getElementById(`b0r${r}c${c}`).classList.add('step-hi');
    }
  } else if (step===1) {
    // Row 2 (idx 1) — R2C2 (c=1) is empty; show the near-complete row
    for (let c=0;c<9;c++) {
      const el=document.getElementById(`b0r1c${c}`);
      if (P0[1][c]) el.classList.add('step-hi');
      else { el.className='cell target'; el.innerHTML=`<span style="font-size:.55rem;color:var(--gold)">?</span>`; }
    }
    const lbl=document.getElementById('lbl0');
    if (lbl) lbl.textContent='Row 2: 8 of 9 digits filled — find the missing one';
  } else if (step===2) {
    // R4C8=5, R6C5=2, R7C6=7 — show as discovered naked singles with row/col highlights
    const ns = [[3,7,5,'R4C8'],[5,4,2,'R6C5'],[6,5,7,'R7C6']];
    ns.forEach(([r,c,v,lbl])=>{
      // Highlight the row to show what's already placed
      for (let i=0;i<9;i++) {
        const er=document.getElementById(`b0r${r}c${i}`);
        const ec=document.getElementById(`b0r${i}c${c}`);
        if (i!==c && er) er.classList.add('hl-row');
        if (i!==r && ec) ec.classList.add('hl-col');
      }
      const el=document.getElementById(`b0r${r}c${c}`);
      el.className='cell correct';
      el.textContent=v;
    });
    const lbl=document.getElementById('lbl0');
    if (lbl) lbl.textContent='Three naked singles found: R4C8=5, R6C5=2, R7C6=7';
  } else if (step===3||step===4) {
      for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
      if (!P0[r][c]) {
        const cs=cands(P0,r,c);
        const el=document.getElementById(`b0r${r}c${c}`);
        if (cs.size===1) { el.className='cell target'; el.innerHTML=ntsHTML(cs,[...cs]); }
        else if (cs.size>0) { el.className='cell annot'; el.innerHTML=ntsHTML(cs); }
      }
    }
    if (step===4) {
      for (let r=0;r<3;r++) for (let c=0;c<3;c++)
        document.getElementById(`b0r${r}c${c}`).classList.add('step-hi');
      const lbl=document.getElementById('lbl0');
      if (lbl) lbl.textContent='All candidates shown — ask "where can this digit go?" in each box';
      complete(0);
    }
  }
}

// ═══════════════════════════════════════════════
// BOARD 1 — NAKED SINGLES
// ═══════════════════════════════════════════════
let ns1sel=null, ns1count=0;

function buildB1() {
  const brd=document.getElementById('board1');
  brd.innerHTML='';
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
    const v=P1[r][c];
    const isNS=NS1.some(n=>n.r===r&&n.c===c);
    const div=mkCell(P1,r,c, isNS?'target':'');
    div.id=`b1r${r}c${c}`;
    if (isNS) div.onclick=()=>selNS1(r,c);
    brd.appendChild(div);
  }
  mkNumpad('np1',tryNS1);
  document.getElementById('prog1').textContent='0 of 4 naked singles placed';
}

function selNS1(r,c) {
  if (document.getElementById(`b1r${r}c${c}`).classList.contains('correct')) return;
  // Clear prior highlights
  for (let i=0;i<9;i++) for (let j=0;j<9;j++) {
    const el=document.getElementById(`b1r${i}c${j}`);
    if (!el) continue;
    el.classList.remove('hl-row','hl-col','hl-box','sel');
    if (NS1.some(n=>n.r===i&&n.c===j)&&!el.classList.contains('correct')) el.className='cell target';
  }
  ns1sel={r,c};
  const el=document.getElementById(`b1r${r}c${c}`);
  el.className='cell target sel';
  // Highlight unit
  const br=3*Math.floor(r/3),bc=3*Math.floor(c/3);
  for (let i=0;i<9;i++) {
    const er=document.getElementById(`b1r${r}c${i}`);
    const ec=document.getElementById(`b1r${i}c${c}`);
    if (er&&i!==c&&!er.classList.contains('correct'))  er.classList.add('hl-row');
    if (ec&&i!==r&&!ec.classList.contains('correct'))  ec.classList.add('hl-col');
  }
  for (let dr=0;dr<3;dr++) for (let dc=0;dc<3;dc++) {
    const eb=document.getElementById(`b1r${br+dr}c${bc+dc}`);
    if (eb&&!(br+dr===r&&bc+dc===c)&&!eb.classList.contains('correct')) eb.classList.add('hl-box');
  }
  const ns=NS1.find(n=>n.r===r&&n.c===c);
  document.getElementById('ex1p').innerHTML=`<strong>R${r+1}C${c+1} selected.</strong> Its row, col, and box block all digits except one. Which digit fits here?`;
  document.getElementById('fb1').className='fb';
}

function tryNS1(n) {
  if (!ns1sel) { fb('fb1','err','Select a gold cell on the board first.'); return; }
  const {r,c}=ns1sel;
  const ns=NS1.find(x=>x.r===r&&x.c===c);
  if (!ns) return;
  const el=document.getElementById(`b1r${r}c${c}`);
  if (n===ns.v) {
    el.className='cell correct'; el.textContent=n; el.onclick=null;
    ns1count++; ns1sel=null;
    for (let i=0;i<9;i++) for (let j=0;j<9;j++) {
      const e=document.getElementById(`b1r${i}c${j}`);
      if (e) e.classList.remove('hl-row','hl-col','hl-box','sel');
    }
    fb('fb1','ok',`✓ Correct! ${n} is the only digit that fits at R${r+1}C${c+1}.`);
    document.getElementById('prog1').textContent=`${ns1count} of 4 naked singles placed`;
    if (ns1count===4) {
      setTimeout(()=>complete(1),500);
    }
  } else {
    el.classList.add('wrong'); setTimeout(()=>el.classList.remove('wrong'),400);
    fb('fb1','err',`✗ Not ${n}. Check row ${r+1}, column ${c+1}, and the 3×3 box — what digits are already placed?`);
  }
}

// ═══════════════════════════════════════════════
// BOARD 2 — HIDDEN SINGLES
// ═══════════════════════════════════════════════
let hs2step=0; // 0=waiting for cell tap, 1=cell tapped, 2=done

function buildB2() {
  const brd=document.getElementById('board2');
  brd.innerHTML='';
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
    const v=P2[r][c];
    const isEmpty=v===0;
    const inBox3=r<3&&c>=6;
    let cls='';

    if (!isEmpty) cls=inBox3?'given step-hi':'given';
    else if (r===0&&c===7) cls='target'; // R1C8 — hidden single target
    else if (r===0&&c===8) cls='annot';  // R1C9
    else if (r===1&&c===6) cls='annot';  // R2C7
    else cls='empty';

    const div=document.createElement('div');
    div.className='cell '+cls;
    div.id=`b2r${r}c${c}`;

    if (!isEmpty) div.textContent=v;
    else if (r===0&&c===7) { div.innerHTML=ntsHTML(new Set([8,9]),[8]); div.onclick=()=>selHS2(); }
    else if (r===0&&c===8) div.innerHTML=ntsHTML(new Set([9]),[]);
    else if (r===1&&c===6) div.innerHTML=ntsHTML(new Set([3]),[]);

    brd.appendChild(div);
  }
  mkNumpad('np2',tryHS2);
}

function selHS2() {
  if (hs2step>0) return;
  hs2step=1;
  const el=document.getElementById('b2r0c7');
  el.className='cell target sel';
  // Highlight box3
  for (let r=0;r<3;r++) for (let c=6;c<9;c++) document.getElementById(`b2r${r}c${c}`).classList.add('step-hi');
  // Highlight row 1 outside box3
  for (let c=0;c<6;c++) document.getElementById(`b2r0c${c}`).classList.add('hl-row');
  // Column 7 highlight to show 8 already appears
  for (let r=3;r<9;r++) document.getElementById(`b2r${r}c7`).classList.add('hl-col');
  document.getElementById('ex2p').innerHTML='R1C8 selected ✓ — it is the only cell in Box 3 where 8 can go. Now tap <strong>8</strong> on the numpad to confirm.';
  fb('fb2','ok','R1C8 is the hidden single — the only cell in Box 3 that can hold digit 8.');
}

function tryHS2(n) {
  if (hs2step===0) { fb('fb2','err','First tap the gold cell on the board — find where 8 must go in Box 3.'); return; }
  if (n===8) {
    hs2step=2;
    const el=document.getElementById('b2r0c7');
    el.className='cell correct'; el.textContent=8; el.onclick=null;
    fb('fb2','ok','✓ Perfect! 8 is the hidden single. R1C9 is now a naked single (9) — it cascades.');
    setTimeout(()=>complete(2),500);
  } else {
    fb('fb2','err',`✗ Digit ${n} doesn't work. In Box 3, scan each empty cell for digit 8 — which cells are blocked, and why?`);
  }
}

// ═══════════════════════════════════════════════
// BOARD 3 — NAKED PAIRS
// ═══════════════════════════════════════════════
function buildB3() {
  const brd=document.getElementById('board3');
  brd.innerHTML='';
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
    const v=P3[r][c];
    const div=document.createElement('div');
    div.id=`b3r${r}c${c}`;
    if (v) {
      div.className='cell given'+(r===7?' step-hi':'');
      div.textContent=v;
    } else {
      const cs=cands(P3,r,c);
      if (r===7) {
        const isPair=(c===3||c===5);
        const isElim=(c===2||c===6)&&(cs.has(7)||cs.has(9));
        div.className='cell '+(isPair?'pair':isElim?'elim':'annot');
        if (cs.size>0) div.innerHTML=ntsHTML(cs,isPair?[7,9]:[],isPair?[]:(isElim?[7,9]:[]));
      } else {
        div.className='cell empty';
      }
    }
    brd.appendChild(div);
  }
  // Numpad — ask which digits are locked
  mkNumpad('np3',tryNP3,[7,9,2,5,3,4]);
}

function tryNP3(n) {
  if (n===7||n===9) {
    fb('fb3','ok',`✓ Correct! ${n} is part of the {7,9} naked pair. Both digits are locked to R8C4 and R8C6 — no other cell in Row 8 can hold 7 or 9.`);
    document.getElementById(`b3r7c3`).className='cell pair correct';
    document.getElementById(`b3r7c5`).className='cell pair correct';
    setTimeout(()=>complete(3),500);
  } else {
    fb('fb3','err',`✗ ${n} is not in the naked pair. Look at R8C4 and R8C6 — what two digits do they share exclusively?`);
  }
}

// ═══════════════════════════════════════════════
// BOARD 4 — POINTING PAIRS
// ═══════════════════════════════════════════════
let pp4done=false;

function buildB4() {
  const brd=document.getElementById('board4');
  brd.innerHTML='';
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
    const v=P3[r][c];
    const div=document.createElement('div');
    div.id=`b4r${r}c${c}`;
    const inBox1=r<3&&c<3;
    const cs=cands(P3,r,c);
    const isRow2Out=r===1&&c>=3;

    if (v) {
      div.className='cell given'+(inBox1?' step-hi':'');
      div.textContent=v;
    } else if (inBox1&&cs.has(3)) {
      div.className='cell point';
      div.innerHTML=ntsHTML(cs,[3]);
    } else if (isRow2Out&&cs.has(3)) {
      div.className='cell elim target';
      div.innerHTML=ntsHTML(cs,[],[3]);
      div.onclick=()=>tryPP4(r,c);
    } else {
      div.className='cell empty';
    }
    brd.appendChild(div);
  }
}

function tryPP4(r,c) {
  if (pp4done) return;
  pp4done=true;
  const el=document.getElementById(`b4r${r}c${c}`);
  el.className='cell correct'; el.textContent='✕'; el.onclick=null;
  fb('fb4','ok',`✓ R${r+1}C${c+1} correctly loses digit 3. The pointing pair in Box 1 guarantees 3 will land in Row 2 within Box 1 — so the rest of Row 2 is clear.`);
  setTimeout(()=>complete(4),500);
}

// ═══════════════════════════════════════════════
// BOARD 5 — X-WING
// ═══════════════════════════════════════════════
const XW_R=[1,5], XW_C=[3,7];
let xw5count=0;

function buildB5() {
  const brd=document.getElementById('board5');
  brd.innerHTML='';
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
    const v=P5[r][c];
    const div=document.createElement('div');
    div.id=`b5r${r}c${c}`;
    const isCorner=XW_R.includes(r)&&XW_C.includes(c)&&!v;
    const isElim=!XW_R.includes(r)&&XW_C.includes(c)&&!v&&cands(P5,r,c).has(7);

    if (v) {
      div.className='cell given';
      div.textContent=v;
    } else if (isCorner) {
      div.className='cell xwing';
      div.innerHTML=ntsHTML(cands(P5,r,c),[7]);
    } else if (isElim) {
      div.className='cell elim target';
      div.innerHTML=ntsHTML(cands(P5,r,c),[],[7]);
      div.onclick=()=>tryXW5(r,c);
    } else {
      div.className='cell empty';
    }
    brd.appendChild(div);
  }
  document.getElementById('prog5').textContent='Tap 2 red cells to complete';
}

function tryXW5(r,c) {
  const el=document.getElementById(`b5r${r}c${c}`);
  if (el.classList.contains('correct')) return;
  el.className='cell correct'; el.onclick=null;
  el.textContent='✕';
  xw5count++;
  document.getElementById('prog5').textContent=`${xw5count} of 2 elimination cells confirmed`;
  fb('fb5','ok',`✓ R${r+1}C${c+1} loses digit 7. The X-Wing in rows 2 & 6 locks 7 to cols 4 & 8 — everywhere else in those columns, 7 is impossible.`);
  if (xw5count>=2) {
    setTimeout(()=>complete(5),500);
  }
}

// ═══════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════
function go(idx) {
  document.querySelectorAll('.chapter').forEach(el=>el.classList.remove('active'));
  document.getElementById(idx<6?`ch${idx}`:'ch6').classList.add('active');
  cur=idx;
  updateNav(); buildDots();
  window.scrollTo({top:0,behavior:'smooth'});
}

function updateNav() {
  const nav=document.getElementById('nav');
  nav.innerHTML='';
  NAMES.forEach((name,i)=>{
    const btn=document.createElement('button');
    btn.className='nav-btn'+(i===cur?' active':'')+(done[i]?' done':'');
    btn.innerHTML=`<span class="nav-num">${i===0?'Intro':`Ch ${i}`}</span>${name}`;
    btn.onclick=()=>go(i);
    nav.appendChild(btn);
  });
}

function buildDots() {
  for (let ch=0;ch<6;ch++) {
    const el=document.getElementById(`dots${ch}`);
    if (!el) continue;
    el.innerHTML='';
    for (let i=0;i<6;i++) {
      const d=document.createElement('div');
      d.className='dot'+(done[i]?' done':'')+(i===ch?' cur':'');
      el.appendChild(d);
    }
  }
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
function init() {
  buildB0(); buildB1(); buildB2(); buildB3(); buildB4(); buildB5();
  updateNav(); buildDots();
}
init();