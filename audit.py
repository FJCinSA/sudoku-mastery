#!/usr/bin/env python3
"""
Sudoku Mastery - Audit Script
Usage: GITHUB_TOKEN=your_token python3 audit.py
"""
import requests, base64, re, copy, os

TOKEN = os.environ.get('GITHUB_TOKEN')
if not TOKEN:
    print("Set GITHUB_TOKEN environment variable first.")
    print("Example: GITHUB_TOKEN=ghp_xxx python3 audit.py")
    exit(1)

REPO = 'FJCinSA/sudoku-mastery'
HDR  = {'Authorization': f'token {TOKEN}'}

print("Fetching files...")
js   = base64.b64decode(requests.get(f'https://api.github.com/repos/{REPO}/contents/course.js',   headers=HDR).json()['content']).decode()
html = base64.b64decode(requests.get(f'https://api.github.com/repos/{REPO}/contents/course.html', headers=HDR).json()['content']).decode()

issues = []

# 1. Syntax balance
for name, val in [('Braces',js.count('{')-js.count('}')),('Parens',js.count('(')-js.count(')')),('Brackets',js.count('[')-js.count(']'))]:
    print(f"  {name} balance: {val}")
    if val != 0: issues.append(f"{name} imbalance: {val}")
bt = js.count('`')
print(f"  Backticks: {bt} ({'EVEN OK' if bt%2==0 else 'ODD BROKEN'})")
if bt % 2 != 0: issues.append("Odd backtick count")

# 2. Non-ASCII in strings
SAFE = set('\u265f\u2715\u2191\u2717\u25c8')
in_str = None; bad = []
for i, ch in enumerate(js):
    if ch in ('`',"'",'"'):
        if in_str is None: in_str = ch
        elif in_str == ch: in_str = None
    if in_str and ord(ch) > 127 and ch not in SAFE:
        bad.append(f"L{js[:i].count(chr(10))+1} U+{ord(ch):04X}")
print(f"  Non-ASCII in strings: {len(bad)}")
if bad: issues.extend([f"Non-ASCII: {b}" for b in bad[:5]])

# 3. Functions
FUNCS = ['init','go','updateNav','buildDots','updateProgress','complete',
         'buildB0','buildB1','buildB2','buildB3','buildB4','buildB5',
         'initCoachUI','toggleCoach','sendMessage','proactiveCoach',
         'loadPerf','savePerf','recAttempt','cands','ntsHTML','mkCell','showFb']
missing = [f for f in FUNCS if f'function {f}' not in js]
print(f"  Missing functions: {missing if missing else 'NONE'}")
if missing: issues.append(f"Missing: {missing}")

# 4. HTML IDs
ids_html = set(re.findall(r'id="([^"]+)"', html))
get_ids  = set(re.findall(r"getElementById\('([^']+)'\)", js))
DYNAMIC  = {'coach-panel','coach-btn','coach-send','coach-input','coach-msgs','coach-context-label'}
BPFX     = ('b0r','b1r','b2r','b3r','b4r','b5r')
missing_ids = [i for i in get_ids if '$' not in i and i not in DYNAMIC
               and not any(i.startswith(p) for p in BPFX) and i not in ids_html]
print(f"  Missing HTML ids: {missing_ids if missing_ids else 'NONE'}")
if missing_ids: issues.append(f"Missing ids: {missing_ids}")

# 5. Puzzle validity
def valid(b):
    for r in range(9):
        v=[x for x in b[r] if x]
        if len(v)!=len(set(v)): return False, f"row {r+1}"
    for c in range(9):
        v=[b[r][c] for r in range(9) if b[r][c]]
        if len(v)!=len(set(v)): return False, f"col {c+1}"
    for br in range(3):
        for bc in range(3):
            v=[b[br*3+dr][bc*3+dc] for dr in range(3) for dc in range(3) if b[br*3+dr][bc*3+dc]]
            if len(v)!=len(set(v)): return False, f"box {br+1}{bc+1}"
    return True, "ok"

def parse(name):
    m = re.search(rf'const {name} = \[(.*?)\];', js, re.DOTALL)
    if not m: return None
    n = re.findall(r'\b\d\b', m.group(1))
    return [[int(n[r*9+c]) for c in range(9)] for r in range(9)]

def cands(b,r,c):
    if b[r][c]: return set()
    s=set(range(1,10))
    for i in range(9): s.discard(b[r][i]); s.discard(b[i][c])
    br,bc=3*(r//3),3*(c//3)
    for dr in range(3):
        for dc in range(3): s.discard(b[br+dr][bc+dc])
    return s

for name in ['P1','P2','P3','P5']:
    p = parse(name)
    if not p: issues.append(f"{name} not found"); continue
    ok, why = valid(p)
    empties = sum(1 for r in range(9) for c in range(9) if not p[r][c])
    print(f"  {name}: {'VALID' if ok else 'INVALID - '+why}, {empties} empty")
    if not ok: issues.append(f"{name} invalid: {why}")

# 6. HS2 sequential
P2 = parse('P2')
hs2_m = re.search(r'const HS2=\[(.*?)\];', js, re.DOTALL)
if P2 and hs2_m:
    cells = [(int(m[0]),int(m[1]),int(m[2])) for m in re.findall(r'r:(\d),c:(\d),v:(\d)', hs2_m.group(1))]
    b = copy.deepcopy(P2)
    ok = True
    for r,c,v in cells:
        cs = cands(b,r,c)
        if cs != {v}: ok=False; issues.append(f"HS2 R{r+1}C{c+1}={v} wrong")
        b[r][c] = v
    print(f"  HS2 sequential: {'OK' if ok else 'FAIL'}")

# 7. Ch4
ch4ok = 'isPointer=inB1&&c===2&&cs.has(2)' in js
print(f"  Ch4 pointing pair: {'OK' if ch4ok else 'MISSING'}")
if not ch4ok: issues.append("Ch4 logic missing")

# 8. ex3p
ex3p = 'id="ex3p"' in html
print(f"  id=ex3p in HTML: {'PRESENT' if ex3p else 'MISSING'}")
if not ex3p: issues.append("id=ex3p missing")

print()
print("=" * 40)
if issues:
    print(f"  {len(issues)} ISSUE(S) FOUND:")
    for i in issues: print(f"  [!] {i}")
else:
    print("  ALL CLEAN - safe to deploy")
print("=" * 40)
