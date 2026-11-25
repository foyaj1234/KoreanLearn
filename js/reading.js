/* ===== reading.js — random paragraph, word popup, sentence audio, quiz ===== */

let readingState = {
  paragraphs: [],
  current: null,
  seen: [],           // ids already shown in this session
  level: 'all',
  showBn: false,
  showEn: false,
  quizAnswered: {}
};

const LEVELS = [
  { id: 'all',         bn: 'সব লেভেল' },
  { id: 'beginner',    bn: 'শুরুর' },
  { id: 'intermediate', bn: 'মাঝারি' },
  { id: 'advanced',    bn: 'উন্নত' }
];

async function loadParagraphs() {
  if (readingState.paragraphs.length) return;
  const res = await fetch('data/paragraphs.json');
  readingState.paragraphs = await res.json();
}

function pickRandomParagraph() {
  let pool = readingState.paragraphs;
  if (readingState.level !== 'all') pool = pool.filter(p => p.level === readingState.level);
  let unseen = pool.filter(p => !readingState.seen.includes(p.id));
  if (!unseen.length) {           // all seen → reset, but avoid immediate repeat
    const prev = readingState.current && readingState.current.id;
    readingState.seen = [];
    unseen = pool;
    if (unseen.length > 1 && prev) unseen = unseen.filter(p => p.id !== prev);
  }
  const p = unseen[Math.floor(Math.random() * unseen.length)];
  readingState.current = p;
  readingState.seen.push(p.id);
  readingState.quizAnswered = {};
  return p;
}

/* split Korean text into sentences */
function splitSentences(ko) {
  return ko.split(/(?<=[.!?])\s+/).filter(s => s.trim());
}

/* split a sentence into clickable words */
function sentenceToWordSpans(sentence, idx) {
  return sentence.split(/(\s+)/).map(tok => {
    if (!tok.trim()) return tok;
    const clean = tok.replace(/[.,!?]/g, '');
    return `<span class="ko-word" data-word="${escapeHtml(clean)}">${escapeHtml(tok)}</span>`;
  }).join('');
}

let allWordIndex = null;
async function getWordIndex() {
  if (allWordIndex) return allWordIndex;
  const all = await loadAllWords();
  const map = {};
  all.forEach(w => {
    if (!map[w.ko]) map[w.ko] = w;
  });
  allWordIndex = map;
  return map;
}

/* popup on word click */
async function showWordPopup(word, x, y) {
  const old = document.querySelector('.word-popup');
  if (old) old.remove();
  const map = await getWordIndex();
  const w = map[word] || null;

  const el = document.createElement('div');
  el.className = 'word-popup';
  if (w) {
    el.innerHTML = `
      <div class="pop-ko">${escapeHtml(w.ko)}</div>
      <div class="pop-pron">(${escapeHtml(w.pron)})</div>
      <div class="pop-mean">🇧🇩 ${escapeHtml(w.bn)} · 🇬🇧 ${escapeHtml(w.en)}</div>
      <div class="mt-8"><button class="btn btn-icon pop-speak">🔊 শুনুন</button></div>
    `;
    el.querySelector('.pop-speak').onclick = () => Speech.speak(w.ko);
  } else {
    el.innerHTML = `
      <div class="pop-ko">${escapeHtml(word)}</div>
      <div class="pop-notfound">অর্থ পাওয়া যায়নি — এই শব্দটি ভোকাবুলারিতে নেই।</div>
      <div class="mt-8"><button class="btn btn-icon pop-speak">🔊 শুনুন</button></div>
    `;
    el.querySelector('.pop-speak').onclick = () => Speech.speak(word);
  }

  // positioning: keep on screen
  el.style.left = '0'; el.style.top = '0';
  document.body.appendChild(el);
  const r = el.getBoundingClientRect();
  const left = Math.min(Math.max(10, x - r.width / 2), window.innerWidth - r.width - 10);
  const top = y + 12 + r.height > window.innerHeight ? y - r.height - 10 : y + 12;
  el.style.left = left + 'px';
  el.style.top = top + 'px';
  setTimeout(() => {
    const closer = (ev) => {
      if (!el.contains(ev.target)) { el.remove(); document.removeEventListener('click', closer); }
    };
    document.addEventListener('click', closer);
  }, 30);
}

function renderParagraph(p) {
  const host = document.getElementById('para-host');
  const sentences = splitSentences(p.ko);

  host.innerHTML = `
    <div class="para-text" id="para-text">
      ${sentences.map((s, i) =>
        `<span class="sentence" data-i="${i}">${sentenceToWordSpans(s, i)}</span> `
      ).join('')}
    </div>
    <div class="word-actions mt-16">
      <button class="btn btn-accent" id="para-play">▶ পুরোটা শোনো</button>
      <button class="btn" id="para-stop">⏹ থামাও</button>
      <button class="btn" id="para-replay">🔁 আবার শোনো</button>
    </div>
    <div class="word-actions mt-8">
      <button class="btn" id="toggle-bn">🇧🇩 বাংলা অনুবাদ</button>
      <button class="btn" id="toggle-en">🇬🇧 ইংরেজি অনুবাদ</button>
    </div>
    <div class="translation hidden" id="tr-bn">
      <div class="tr-ko-label">বাংলা অনুবাদ</div>
      <p>${escapeHtml(p.bn)}</p>
    </div>
    <div class="translation hidden" id="tr-en">
      <div class="tr-ko-label">English translation</div>
      <p class="en-tr">${escapeHtml(p.en)}</p>
    </div>
    <div class="section-title">📝 বোঝার পরীক্ষা</div>
    <div id="para-quiz"></div>
  `;

  const paraText = document.getElementById('para-text');
  paraText.querySelectorAll('.ko-word').forEach(span => {
    span.onclick = (e) => {
      e.stopPropagation();
      showWordPopup(span.dataset.word, e.clientX, e.clientY);
    };
  });

  const onIndex = (i) => {
    paraText.querySelectorAll('.sentence').forEach((el, idx) => {
      el.classList.toggle('speaking', idx === i);
    });
  };
  const play = () => Speech.speakSentences(sentences, onIndex);
  document.getElementById('para-play').onclick = play;
  document.getElementById('para-replay').onclick = play;
  document.getElementById('para-stop').onclick = () => Speech.stop();

  document.getElementById('toggle-bn').onclick = () => {
    readingState.showBn = !readingState.showBn;
    document.getElementById('tr-bn').classList.toggle('hidden', !readingState.showBn);
  };
  document.getElementById('toggle-en').onclick = () => {
    readingState.showEn = !readingState.showEn;
    document.getElementById('tr-en').classList.toggle('hidden', !readingState.showEn);
  };

  renderParaQuiz(p);
}

function renderParaQuiz(p) {
  const host = document.getElementById('para-quiz');
  host.innerHTML = p.quiz.map((q, qi) => `
    <div class="quiz-box mb-16" data-qi="${qi}">
      <div class="quiz-q"><span class="q-ko">${escapeHtml(q.q)}</span></div>
      <div class="quiz-options">
        ${q.options.map((op, oi) => `<button class="btn" data-oi="${oi}">${escapeHtml(op)}</button>`).join('')}
      </div>
      <div class="quiz-explanation hidden"></div>
    </div>
  `).join('');

  host.querySelectorAll('.quiz-box').forEach(box => {
    const qi = +box.dataset.qi;
    const q = p.quiz[qi];
    box.querySelectorAll('.quiz-options .btn').forEach(btn => {
      btn.onclick = () => {
        if (readingState.quizAnswered[qi] !== undefined) return;
        const oi = +btn.dataset.oi;
        const correct = oi === q.answer;
        readingState.quizAnswered[qi] = correct;
        box.querySelectorAll('.quiz-options .btn').forEach((b, i) => {
          if (i === q.answer) b.classList.add('correct');
          else if (i === oi) b.classList.add('wrong');
        });
        const exp = box.querySelector('.quiz-explanation');
        exp.classList.remove('hidden');
        exp.innerHTML = (correct ? '✅ সঠিক! ' : '❌ ভুল। ') + `${escapeHtml(q.expBn)} <span class="en-tr">(${escapeHtml(q.expEn)})</span>`;
        toast(correct ? '✅ সঠিক!' : '❌ ভুল — ' + escapeHtml(q.options[q.answer]));
      };
    });
  });
}

function renderReadingChips() {
  const host = document.getElementById('level-chips');
  if (!host) return;
  host.innerHTML = LEVELS.map(l =>
    `<button class="chip ${readingState.level === l.id ? 'active' : ''}" data-level="${l.id}">${l.bn}</button>`
  ).join('');
  host.querySelectorAll('.chip').forEach(ch => {
    ch.onclick = () => {
      readingState.level = ch.dataset.level;
      renderReadingChips();
      nextParagraph();
    };
  });
}

async function nextParagraph() {
  await loadParagraphs();
  await getWordIndex();          // preload word index for popups
  const p = pickRandomParagraph();
  renderParagraph(p);
  const title = document.getElementById('para-title');
  if (title) title.textContent = p.title || '';
  const lvl = document.getElementById('para-level');
  if (lvl) lvl.textContent = LEVELS.find(l => l.id === p.level).bn + ' লেভেল';
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('para-host')) return; // not this page
  renderReadingChips();
  document.getElementById('next-para-btn').onclick = nextParagraph;
  nextParagraph();
});
