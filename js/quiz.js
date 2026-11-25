/* ===== quiz.js — 10-question rounds: ko→meaning, meaning→ko, audio ===== */

const QUIZ_TYPES = [
  { id: 'ko2mean', bn: '🇰🇷 কোরিয়ান দেখে অর্থ' },
  { id: 'mean2ko', bn: 'অর্থ দেখে কোরিয়ান' },
  { id: 'audio',   bn: '🔊 সাউন্ড শুনে বাছাই' }
];

const QUIZ_LEN = 10;

let quizState = {
  type: 'ko2mean',
  cat: 'all',
  questions: [],
  idx: 0,
  score: 0,
  answered: false
};

function pickDistractors(pool, correct, n = 3) {
  const others = pool.filter(x => x.id !== correct.id);
  const shuffled = others.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function buildQuizQuestions() {
  let pool = quizState.cat === 'all' ? await loadAllWords() : await loadCategoryWords(quizState.cat);
  // exclude already-learned words is optional; keep all for variety
  const picked = pool.slice().sort(() => Math.random() - 0.5).slice(0, QUIZ_LEN);

  quizState.questions = picked.map(w => {
    const distract = pickDistractors(pool, w);
    const options = [w, ...distract].sort(() => Math.random() - 0.5);
    return { word: w, options, answerIdx: options.findIndex(o => o.id === w.id) };
  });
  quizState.idx = 0;
  quizState.score = 0;
}

function quizQuestionText(q) {
  const w = q.word;
  if (quizState.type === 'ko2mean') {
    return `<span class="q-ko">${escapeHtml(w.ko)}</span>
            <div class="muted">(${escapeHtml(w.pron)})</div>`;
  }
  if (quizState.type === 'mean2ko') {
    return `<span class="q-ko">🇧🇩 ${escapeHtml(w.bn)}</span>
            <div class="muted">🇬🇧 ${escapeHtml(w.en)}</div>`;
  }
  // audio quiz
  return `<button class="btn btn-accent" id="quiz-audio-btn">🔊 শুনুন</button>
          <div class="muted">সাউন্ড শুনে সঠিক শব্দটি বাছাই করুন</div>`;
}

function quizOptionHtml(q, o, i) {
  if (quizState.type === 'ko2mean') {
    return `🇧🇩 ${escapeHtml(o.bn)} · 🇬🇧 ${escapeHtml(o.en)}`;
  }
  return `<span class="q-ko" style="font-size:1.2rem">${escapeHtml(o.ko)}</span>`;
}

function renderQuizQuestion() {
  const host = document.getElementById('quiz-host');
  const q = quizState.questions[quizState.idx];
  if (!q) { renderQuizResult(); return; }

  host.innerHTML = `
    <div class="quiz-box">
      <div class="progress-bar"><div class="fill" style="width:${(quizState.idx / QUIZ_LEN) * 100}%"></div></div>
      <div class="muted">প্রশ্ন ${quizState.idx + 1} / ${QUIZ_LEN} · স্কোর ${quizState.score}</div>
      <div class="quiz-q mt-8">${quizQuestionText(q)}</div>
      <div class="quiz-options">
        ${q.options.map((o, i) => `<button class="btn" data-oi="${i}">${quizOptionHtml(q, o, i)}</button>`).join('')}
      </div>
      <div class="quiz-explanation hidden" id="quiz-exp"></div>
    </div>
  `;

  if (quizState.type === 'audio') {
    document.getElementById('quiz-audio-btn').onclick = () => Speech.speak(q.word.ko);
    // auto-play once
    setTimeout(() => Speech.speak(q.word.ko), 400);
  }

  quizState.answered = false;
  host.querySelectorAll('.quiz-options .btn').forEach(btn => {
    btn.onclick = () => {
      if (quizState.answered) return;
      quizState.answered = true;
      const oi = +btn.dataset.oi;
      const correct = oi === q.answerIdx;
      if (correct) quizState.score++;
      host.querySelectorAll('.quiz-options .btn').forEach((b, i) => {
        if (i === q.answerIdx) b.classList.add('correct');
        else if (i === oi) b.classList.add('wrong');
      });
      const exp = document.getElementById('quiz-exp');
      exp.classList.remove('hidden');
      const w = q.word;
      exp.innerHTML = `${correct ? '✅ সঠিক!' : '❌ সঠিক উত্তর: ' + escapeHtml(w.ko)} — ${escapeHtml(w.bn)} (${escapeHtml(w.en)})`;
      if (quizState.type !== 'audio') Speech.speak(w.ko);
      setTimeout(() => {
        quizState.idx++;
        renderQuizQuestion();
      }, correct ? 1000 : 1800);
    };
  });
}

function renderQuizResult() {
  // save score for badges
  const scores = Store.get('quizScores', []);
  scores.push({ date: todayKey(), type: quizState.type, score: quizState.score, total: QUIZ_LEN });
  Store.set('quizScores', scores);
  Stats.checkBadges();

  document.getElementById('quiz-host').innerHTML = `
    <div class="quiz-box quiz-result">
      <div>🎉 রাউন্ড শেষ!</div>
      <div class="big-score">${quizState.score}/${QUIZ_LEN}</div>
      <p class="muted">${quizState.score === QUIZ_LEN ? 'অসাধারণ! পারফেক্ট স্কোর! 💯' : quizState.score >= QUIZ_LEN * 0.7 ? 'খুব ভালো করেছেন! 👏' : 'আরেকবার চেষ্টা করুন — চলবে চলবে! 💪'}</p>
      <div class="word-actions mt-16" style="justify-content:center">
        <button class="btn btn-accent" id="quiz-again">🔁 আবার খেলুন</button>
      </div>
    </div>
  `;
  document.getElementById('quiz-again').onclick = startQuizRound;
}

function renderQuizChips() {
  const typeHost = document.getElementById('quiz-type-chips');
  typeHost.innerHTML = QUIZ_TYPES.map(t =>
    `<button class="chip ${quizState.type === t.id ? 'active' : ''}" data-type="${t.id}">${t.bn}</button>`
  ).join('');
  typeHost.querySelectorAll('.chip').forEach(ch => {
    ch.onclick = () => {
      quizState.type = ch.dataset.type;
      renderQuizChips();
      startQuizRound();
    };
  });

  const catHost = document.getElementById('quiz-cat-chips');
  catHost.innerHTML =
    `<button class="chip ${quizState.cat === 'all' ? 'active' : ''}" data-cat="all">🌍 সব ক্যাটাগরি</button>` +
    CATEGORIES.map(c =>
      `<button class="chip ${quizState.cat === c.id ? 'active' : ''}" data-cat="${c.id}">${c.icon} ${escapeHtml(c.bn)}</button>`
    ).join('');
  catHost.querySelectorAll('.chip').forEach(ch => {
    ch.onclick = () => {
      quizState.cat = ch.dataset.cat;
      renderQuizChips();
      startQuizRound();
    };
  });
}

async function startQuizRound() {
  document.getElementById('quiz-host').innerHTML = '<p class="muted center">প্রশ্ন তৈরি হচ্ছে…</p>';
  await buildQuizQuestions();
  if (!quizState.questions.length) {
    document.getElementById('quiz-host').innerHTML = '<p class="muted center">এই ক্যাটাগরিতে যথেষ্ট শব্দ নেই।</p>';
    return;
  }
  renderQuizQuestion();
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('quiz-host')) return; // not this page
  renderQuizChips();
  startQuizRound();
});
