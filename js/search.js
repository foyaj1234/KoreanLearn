/* ===== search.js — search across all categories (ko / bn / en / pron) ===== */

const SEARCH_LIMIT = 40;

async function runSearch(query) {
  const host = document.getElementById('search-results');
  const q = query.trim().toLowerCase();
  if (!q) { host.innerHTML = ''; return; }

  const all = await loadAllWords();
  const hits = all.filter(w =>
    w.ko.toLowerCase().includes(q) ||
    (w.pron || '').toLowerCase().includes(q) ||
    w.bn.toLowerCase().includes(q) ||
    w.en.toLowerCase().includes(q)
  ).slice(0, SEARCH_LIMIT);

  if (!hits.length) {
    host.innerHTML = '<p class="muted center">কিছু পাওয়া যায়নি। অন্য শব্দ দিয়ে খুঁজে দেখুন।</p>';
    return;
  }
  host.innerHTML = hits.map(w => `
    <div class="word-card">
      <div class="word-ko">${escapeHtml(w.ko)}</div>
      <div class="word-pron">(${escapeHtml(w.pron)})</div>
      <div class="word-meaning">${escapeHtml(w.bn)} <span class="en">/ ${escapeHtml(w.en)}</span></div>
      <div class="muted" style="font-size:0.8rem;margin-top:4px">📂 ${escapeHtml(w._cat.bn)}</div>
      <div class="word-actions">
        <button class="btn btn-icon search-speak" data-ko="${escapeHtml(w.ko)}">🔊</button>
      </div>
    </div>
  `).join('');
  host.querySelectorAll('.search-speak').forEach(b => {
    b.onclick = () => Speech.speak(b.dataset.ko);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('global-search');
  if (!input) return; // not this page
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => runSearch(input.value), 250);
  });
});
