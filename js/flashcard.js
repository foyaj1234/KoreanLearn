/* ===== flashcard.js — flashcards with simple spaced repetition ===== */

let fcState = {
  cards: [],
  idx: 0,
  flipped: false,
  source: 'body'      // category id or 'starred'
};

/* simple SRS: wrongCount high → card shown more often.
   weights: new=1, wrong1=2, wrong2+=3; learned cards get weight 0.3 */
function srsSort(cards) {
  const srs = Store.get('srs', {});
  const rand = () => Math.random();
  return cards
    .map(c => {
      const s = srs[c.id] || { wrong: 0 };
      const weight = 1 + s.wrong * 2;
      return { ...c, _priority: rand() * weight };
    })
    .sort((a, b) => b._priority - a._priority);
}

function recordSrs(id, known) {
  const srs = Store.get('srs', {});
  const s = srs[id] || { wrong: 0 };
  if (known) s.wrong = Math.max(0, s.wrong - 1);
  else s.wrong = s.wrong + 1;
  srs[id] = s;
  Store.set('srs', srs);
}

async function buildFcDeck() {
  let cards = [];
  if (fcState.source === 'starred') {
    const starred = Progress.starred();
    const all = await loadAllWords();
    cards = all.filter(w => starred.has(w.id));
  } else {
    cards = await loadCategoryWords(fcState.source);
  }
  if (!cards.length) return;
  fcState.cards = srsSort(cards);
  fcState.idx = 0;
  fcState.flipped = false;
  renderCard();
}

function renderCard() {
  const w = fcState.cards[fcState.idx];
  if (!w) {
    document.getElementById('fc-host').innerHTML = '<p class="muted center">কার্ড পাওয়া যায়নি।</p>';
    return;
  }
  document.getElementById('fc-host').innerHTML = `
    <div class="flashcard-wrap">
      <div class="flashcard ${fcState.flipped ? 'flipped' : ''}" id="fc-card">
        <div class="flashcard-face flashcard-front">
          <div class="fc-ko">${escapeHtml(w.ko)}</div>
          <button class="btn btn-icon mt-16" id="fc-speak">🔊</button>
          <div class="fc-tip">কার্ডে ট্যাপ করে উল্টান</div>
        </div>
        <div class="flashcard-face flashcard-back">
          <div class="fc-mean">${escapeHtml(w.bn)}<span class="en">${escapeHtml(w.en)}</span></div>
          <div class="fc-tip">কার্ডে ট্যাপ করে সামনে ফেরো</div>
        </div>
      </div>
    </div>
    <div class="fc-controls">
      <button class="btn" id="fc-know">😀 জানি</button>
      <button class="btn" id="fc-dontknow">😕 জানি না</button>
    </div>
  `;

  document.getElementById('fc-card').onclick = () => {
    fcState.flipped = !fcState.flipped;
    document.getElementById('fc-card').classList.toggle('flipped', fcState.flipped);
  };
  document.getElementById('fc-speak').onclick = (e) => {
    e.stopPropagation();
    Speech.speak(w.ko);
  };
  document.getElementById('fc-know').onclick = () => {
    recordSrs(w.id, true);
    nextCard();
  };
  document.getElementById('fc-dontknow').onclick = () => {
    recordSrs(w.id, false);
    nextCard();
  };
}

function nextCard() {
  fcState.idx++;
  if (fcState.idx >= fcState.cards.length) {
    buildFcDeck();      // loop with re-shuffled (SRS weighted) deck
    toast('🔄 ডেক আবার শাফল হলো');
    return;
  }
  fcState.flipped = false;
  renderCard();
}

function renderFcChips() {
  const host = document.getElementById('fc-chips');
  if (!host) return;
  const opts = [
    { id: 'starred', bn: '⭐ আমার কঠিন শব্দ' },
    ...CATEGORIES.map(c => ({ id: c.id, bn: c.icon + ' ' + c.bn }))
  ];
  host.innerHTML = opts.map(o =>
    `<button class="chip ${fcState.source === o.id ? 'active' : ''}" data-src="${o.id}">${o.bn}</button>`
  ).join('');
  host.querySelectorAll('.chip').forEach(ch => {
    ch.onclick = () => {
      fcState.source = ch.dataset.src;
      renderFcChips();
      buildFcDeck();
    };
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('fc-host')) return; // not this page
  renderFcChips();
  buildFcDeck();
});
