// ── HERO MINI-BOARD ───────────────────────────────────────────────────────────
const heroData = [
  [5,3,0, 0,7,0, 0,0,0],
  [6,0,0, 1,9,5, 0,0,0],
  [0,9,8, 0,0,0, 0,6,0],
  [8,0,0, 0,6,0, 0,0,3],
  [4,0,0, 8,'★',3, 0,0,1],
  [7,0,0, 0,2,0, 0,0,6],
  [0,6,0, 0,0,0, 2,8,0],
  [0,0,0, 4,1,9, 0,0,5],
  [0,0,0, 0,8,0, 0,7,9],
];

const brd = document.getElementById('heroBoard');
heroData.forEach((row, r) => {
  row.forEach((v, c) => {
    const div = document.createElement('div');
    if (v === '★') {
      div.className = 'mc hi';
      div.textContent = '5';
    } else if (v) {
      div.className = 'mc g';
      div.textContent = v;
    } else {
      div.className = 'mc e';
    }
    brd.appendChild(div);
  });
});

// Animate cells cycling highlight
let frame = 0;
const cells = brd.querySelectorAll('.mc.g');
setInterval(() => {
  cells.forEach(c => c.classList.remove('hi', 'ns', 'dim'));
  const idx = frame % cells.length;
  cells[idx].classList.add('hi');
  frame++;
}, 1200);

// ── EMAIL SIGNUP ──────────────────────────────────────────────────────────────
function handleSignup() {
  const input = document.getElementById('signupEmail');
  const email = input.value.trim();
  if (!email || !email.includes('@')) {
    input.style.borderColor = '#c8732a';
    input.focus();
    setTimeout(() => input.style.borderColor = '', 1500);
    return;
  }
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('signupThanks').style.display = 'block';
  window.location.href = `mailto:sudokumasterycourse@gmail.com?subject=New signup&body=New subscriber: ${encodeURIComponent(email)}`;
}

document.getElementById('signupEmail').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') handleSignup();
});

// ── FADE-UP ON SCROLL ─────────────────────────────────────────────────────────
const fadeEls = document.querySelectorAll('.fade-up');
if ('IntersectionObserver' in window) {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  fadeEls.forEach(el => obs.observe(el));
} else {
  fadeEls.forEach(el => el.classList.add('visible'));
}
