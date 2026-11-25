/* ===== vocab.js — vocabulary page: categories, cards, filters, lazy load ===== */

const PAGE_SIZE = 30;

let vocabState = {
  cat: 'body',          // current category id
  lang: 'both',         // 'both' | 'bn' | 'en'
  showLearned: true,
  shownCount: PAGE_SIZE
};

/* build category chips */
function renderVocabChips() {
  const host = document.getElementById('vocab-chips');
  if (!host) return;
  host.innerHTML = CATEGORIES.map(c =>
    `<button class="chip ${c.id === vocabState.cat ? 'active' : ''}" data-cat="${c.id}">
       ${c.icon} ${escapeHtml(c.bn)}
     </button>`
  ).join('');
  host.querySelectorAll('.chip').forEach(ch => {
    ch.onclick = () => {
      vocabState.cat = ch.dataset.cat;
      vocabState.shownCount = PAGE_SIZE;
      renderVocabChips();
      renderWords();
    };
  });
}

/* language filter buttons */
function renderLangFilter() {
  const host = document.getElementById('lang-filter');
  if (!host) return;
  const opts = [
    { id: 'both', label: 'বাংলা + ইংরেজি' },
    { id: 'bn',   label: 'শুধু বাংলা' },
    { id: 'en',   label: 'শুধু ইংরেজি' }
  ];
  host.innerHTML = opts.map(o =>
    `<button class="chip ${vocabState.lang === o.id ? 'active' : ''}" data-lang="${o.id}">${o.label}</button>`
  ).join('');
  host.querySelectorAll('.chip').forEach(ch => {
    ch.onclick = () => {
      vocabState.lang = ch.dataset.lang;
      renderLangFilter();
      renderWords();
    };
  });
}

function wordCardHtml(w) {
  const pron = `<div class="word-pron">(${escapeHtml(w.pron)})</div>`;
  let meaning = '';
  if (vocabState.lang === 'both') {
    meaning = `<div class="word-meaning">${escapeHtml(w.bn)} <span class="en">/ ${escapeHtml(w.en)}</span></div>`;
  } else if (vocabState.lang === 'bn') {
    meaning = `<div class="word-meaning">${escapeHtml(w.bn)}</div>`;
  } else {
    meaning = `<div class="word-meaning">${escapeHtml(w.en)}</div>`;
  }
  const learned = Progress.isLearned(w.id);
  const starred = Progress.isStarred(w.id);
  const exBlock = vocabState.lang === 'en'
    ? `<span class="ex-en">${escapeHtml(w.example.en)}</span>`
    : vocabState.lang === 'bn'
      ? `<span class="ex-bn">${escapeHtml(w.example.bn)}</span>`
      : `<span class="ex-bn">${escapeHtml(w.example.bn)}</span><span class="ex-en">${escapeHtml(w.example.en)}</span>`;

  return `
    <div class="word-card" data-id="${w.id}">
      <div class="word-ko">${escapeHtml(w.ko)}</div>
      ${pron}
      ${meaning}
      <div class="word-example">
        <span class="ex-ko">${escapeHtml(w.example.ko)}</span>
        ${exBlock}
      </div>
      <div class="word-actions">
        <button class="btn btn-icon act-speak" title="শুনুন">🔊</button>
        <button class="btn btn-icon act-star ${starred ? 'active-star' : ''}" title="কঠিন শব্দ">⭐</button>
        <button class="btn act-learn ${learned ? 'done-learn' : ''}">${learned ? '✅ শেখা হয়েছে' : '✅ শিখে ফেলেছি'}</button>
      </div>
    </div>`;
}

function bindWordCardActions(root) {
  root.querySelectorAll('.word-card').forEach(card => {
    const id = card.dataset.id;
    const ko = card.querySelector('.word-ko').textContent;
    card.querySelector('.act-speak').onclick = () => Speech.speak(ko);
    card.querySelector('.act-star').onclick = (e) => {
      const now = Progress.toggleStar(id);
      e.currentTarget.classList.toggle('active-star', now);
      toast(now ? '⭐ কঠিন শব্দে যোগ হলো' : 'কঠিন শব্দ থেকে বাদ গেলো');
    };
    card.querySelector('.act-learn').onclick = (e) => {
      const now = Progress.toggleLearned(id);
      e.currentTarget.classList.toggle('done-learn', now);
      e.currentTarget.textContent = now ? '✅ শেখা হয়েছে' : '✅ শিখে ফেলেছি';
      toast(now ? '🎉 শেখা হয়েছে!' : 'আবার শেখার তালিকায় ফিরলো');
    };
  });
}

async function renderWords() {
  const host = document.getElementById('vocab-list');
  if (!host) return;
  const words = await loadCategoryWords(vocabState.cat);
  if (!vocabState.showLearned) {
    const learned = Progress.learned();
    filtered = words.filter(w => !learned.has(w.id));
  }
  const visible = words.slice(0, vocabState.shownCount);
  host.innerHTML = visible.map(wordCardHtml).join('');
  bindWordCardActions(host);

  const moreBtn = document.getElementById('load-more');
  if (moreBtn) {
    const remaining = words.length - vocabState.shownCount;
    if (remaining > 0) {
      moreBtn.classList.remove('hidden');
      moreBtn.textContent = `আরও দেখাও (${remaining} বাকি)`;
    } else {
      moreBtn.classList.add('hidden');
    }
  }
  const count = document.getElementById('vocab-count');
  if (count) count.textContent = `${words.length}টি শব্দ`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('vocab-list')) return; // not this page

  renderVocabChips();
  renderLangFilter();

  const hideBtn = document.getElementById('toggle-learned');
  if (hideBtn) {
    hideBtn.onclick = () => {
      vocabState.showLearned = !vocabState.showLearned;
      vocabState.shownCount = PAGE_SIZE;
      hideBtn.textContent = vocabState.showLearned ? '🙈 শেখা শব্দ লুকাও' : '👁 শেখা শব্দ দেখাও';
      renderWords();
    };
  }

  const moreBtn = document.getElementById('load-more');
  if (moreBtn) {
    moreBtn.onclick = () => {
      vocabState.shownCount += PAGE_SIZE;
      renderWords();
    };
  }

  renderWords();
});
