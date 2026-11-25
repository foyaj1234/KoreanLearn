/* ===== hangul.js — hangul chart + "অক্ষর চেনো" game ===== */

function renderHangulChart() {
  const vowelsHost = document.getElementById('vowel-grid');
  const consHost = document.getElementById('consonant-grid');
  if (!vowelsHost) return;

  const cell = (h) => `
    <div class="hangul-cell" data-ko="${escapeHtml(h.ko)}">
      <div class="h-ko">${escapeHtml(h.ko)}</div>
      <div class="h-pron">${escapeHtml(h.pron)}</div>
    </div>`;

  vowelsHost.innerHTML = HANGUL.vowels.map(cell).join('');
  consHost.innerHTML = HANGUL.consonants.map(cell).join('');

  document.querySelectorAll('.hangul-cell').forEach(c => {
    c.onclick = () => Speech.speak(c.dataset.ko);
  });
}

/* ===== game: show a letter, choose its Bengali pronunciation ===== */
const HG_QUESTIONS = 8;
let hgState = { score: 0, qIndex: 0, current: null, options: [] };

function hgStartGame() {
  hgState = { score: 0, qIndex: 0, current: null, options: [] };
  document.getElementById('hg-game').classList.remove('hidden');
  hgNextQuestion();
}

function hgNextQuestion() {
  const all = [...HANGUL.vowels, ...HANGUL.consonants];
  const answer = all[Math.floor(Math.random() * all.length)];
  const others = all.filter(x => x.ko !== answer.ko).sort(() => Math.random() - 0.5).slice(0, 3);
  const options = [answer, ...others].sort(() => Math.random() - 0.5);
  hgState.current = answer;
  hgState.options = options;

  document.getElementById('hg-progress').textContent = `প্রশ্ন ${hgState.qIndex + 1} / ${HG_QUESTIONS}`;
  document.getElementById('hg-question').innerHTML = `<span class="q-ko">${escapeHtml(answer.ko)}</span>`;
  document.getElementById('hg-question').onclick = () => Speech.speak(answer.ko);
  document.getElementById('hg-options').innerHTML = options.map((o, i) =>
    `<button class="btn" data-i="${i}">${escapeHtml(o.pron)}</button>`
  ).join('');

  document.querySelectorAll('#hg-options .btn').forEach(btn => {
    btn.onclick = () => {
      const chosen = hgState.options[+btn.dataset.i];
      const correct = chosen.ko === hgState.current.ko;
      if (correct) {
        hgState.score++;
        btn.classList.add('correct');
      } else {
        btn.classList.add('wrong');
        document.querySelectorAll('#hg-options .btn').forEach((b, i) => {
          if (hgState.options[i].ko === hgState.current.ko) b.classList.add('correct');
        });
      }
      Speech.speak(hgState.current.ko);
      setTimeout(() => {
        hgState.qIndex++;
        if (hgState.qIndex >= HG_QUESTIONS) hgEndGame();
        else hgNextQuestion();
      }, correct ? 700 : 1300);
    };
  });
}

function hgEndGame() {
  document.getElementById('hg-question').innerHTML = `
    <div style="font-size:2rem">🎉</div>
    <div class="big-score">${hgState.score}/${HG_QUESTIONS}</div>
    <div class="muted">${hgState.score === HG_QUESTIONS ? 'অসাধারণ! সব ঠিক!' : 'ভালো হচ্ছে!'}</div>`;
  document.getElementById('hg-options').innerHTML = '';
  document.getElementById('hg-progress').textContent = 'খেলা শেষ';
  document.getElementById('hg-restart').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('vowel-grid')) return; // not this page
  renderHangulChart();
  document.getElementById('hg-start').onclick = () => {
    document.getElementById('hg-start').classList.add('hidden');
    document.getElementById('hg-restart').classList.add('hidden');
    hgStartGame();
  };
  document.getElementById('hg-restart').onclick = () => {
    document.getElementById('hg-restart').classList.add('hidden');
    hgStartGame();
  };
});
