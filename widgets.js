// ── QR WIDGET ────────────────────────────────────────────────────────────────
function toggleQR() {
  var p = document.getElementById('qrPanel');
  p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

// ── FEEDBACK WIDGET ───────────────────────────────────────────────────────────
var masteryRating = 0;

function toggleMasteryFeedback() {
  var p = document.getElementById('fbPanel');
  p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

function setMasteryRating(val) {
  masteryRating = val;
  document.querySelectorAll('#fbStars span').forEach(function(s) {
    s.style.color = parseInt(s.dataset.v) <= val ? '#c8a96e' : '#2a261a';
  });
}

function submitMasteryFeedback() {
  var suggestion = document.getElementById('fbText').value.trim();
  var thanks = document.getElementById('fbThanks');
  if (!masteryRating && !suggestion) {
    thanks.textContent = 'Please select a star rating first.';
    thanks.style.color = '#c8732a';
    thanks.style.display = 'block';
    return;
  }
  document.getElementById('fbSubmitBtn').style.display = 'none';
  thanks.textContent = '✓ Thanks — your feedback helps improve the course';
  thanks.style.color = '#5a9a5a';
  thanks.style.display = 'block';
  var stars = '★'.repeat(masteryRating) + '☆'.repeat(5 - masteryRating);
  var body = 'Tool: Sudoku Mastery\nRating: ' + stars + ' (' + masteryRating + '/5)\n\nSuggestion: ' + (suggestion || 'None');
  window.location.href = 'mailto:sudokumasterycourse@gmail.com?subject=Sudoku Mastery Feedback&body=' + encodeURIComponent(body);
}
