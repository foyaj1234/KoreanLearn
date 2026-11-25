/* ===== app.js — shared core: store, nav, helpers, PWA, font size ===== */

/* ---------- localStorage store ---------- */
const Store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem('kl_' + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('kl_' + key, JSON.stringify(value)); } catch (e) {}
  }
};

/* ---------- helpers ---------- */
function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* ---------- progress: learned / starred words ---------- */
const Progress = {
  learned: () => new Set(Store.get('learned', [])),
  starred: () => new Set(Store.get('starred', [])),

  toggleLearned(id) {
    const s = Progress.learned();
    if (s.has(id)) { s.delete(id); } else {
      s.add(id);
      Stats.logWordDay();               // count today's learning
      Stats.recomputeStreak();
      Stats.checkBadges();
    }
    Store.set('learned', [...s]);
    return s.has(id);
  },
  toggleStar(id) {
    const s = Progress.starred();
    s.has(id) ? s.delete(id) : s.add(id);
    Store.set('starred', [...s]);
    return s.has(id);
  },
  isLearned(id) { return Progress.learned().has(id); },
  isStarred(id) { return Progress.starred().has(id); }
};

/* ---------- streak, daily goal, badges ---------- */
const Stats = {
  logWordDay() {
    const days = Store.get('wordDays', {});
    const k = todayKey();
    days[k] = (days[k] || 0) + 1;
    Store.set('wordDays', days);
  },

  recomputeStreak() {
    // streak = consecutive days where at least 5 words were learned
    const days = Store.get('wordDays', {});
    let streak = 0;
    const d = new Date();
    for (;;) {
      const k = todayKey(d);
      if ((days[k] || 0) >= 5) { streak++; d.setDate(d.getDate() - 1); }
      else if (k === todayKey() && streak === 0) { d.setDate(d.getDate() - 1); } // today not yet complete, check yesterday
      else break;
    }
    Store.set('streak', streak);
    return streak;
  },

  getStreak() { return Store.get('streak', 0); },
  todayWords() { return (Store.get('wordDays', {})[todayKey()] || 0); },

  goal() { return Store.get('dailyGoal', 10); },
  setGoal(n) { Store.set('dailyGoal', n); },

  badges() {
    const learnedCount = Progress.learned().size;
    const streak = Stats.getStreak();
    const wordDays = Store.get('wordDays', {});
    const quizScores = Store.get('quizScores', []);
    const perfectQuiz = quizScores.some(s => s.score === s.total && s.total >= 10);
    return [
      { id: 'first-word',  icon: '🌱', name: 'প্রথম শব্দ',       desc: 'প্রথম শব্দ শিখুন',             earned: learnedCount >= 1 },
      { id: 'words-25',    icon: '📗', name: '২৫ শব্দ',           desc: '২৫টি শব্দ শিখুন',                earned: learnedCount >= 25 },
      { id: 'words-100',   icon: '📚', name: '১০০ শব্দ',          desc: '১০০টি শব্দ শিখুন',               earned: learnedCount >= 100 },
      { id: 'words-500',   icon: '🎓', name: '৫০০ শব্দ',          desc: '৫০০টি শব্দ শিখুন',               earned: learnedCount >= 500 },
      { id: 'streak-3',    icon: '🔥', name: '৩ দিনের স্ট্রিক',    desc: 'টানা ৩ দিন শেখা',               earned: streak >= 3 },
      { id: 'streak-7',    icon: '⚡', name: '৭ দিনের স্ট্রিক',    desc: 'টানা ৭ দিন শেখা',               earned: streak >= 7 },
      { id: 'streak-30',   icon: '🏆', name: '৩০ দিনের স্ট্রিক',   desc: 'টানা ৩০ দিন শেখা',              earned: streak >= 30 },
      { id: 'quiz-perfect',icon: '💯', name: 'পারফেক্ট কুইজ',      desc: '১০/১০ স্কোর করুন',              earned: perfectQuiz },
      { id: 'active-10d',  icon: '🗓',  name: '১০ দিন সক্রিয়',      desc: 'মোট ১০ দিন শেখা',               earned: Object.keys(wordDays).length >= 10 }
    ];
  },
  checkBadges() {
    const prev = new Set(Store.get('earnedBadges', []));
    const earnedNow = Stats.badges().filter(b => b.earned).map(b => b.id);
    earnedNow.forEach(id => {
      if (!prev.has(id)) toast('🏅 ব্যাজ অর্জিত: ' + Stats.badges().find(b => b.id === id).name);
    });
    Store.set('earnedBadges', earnedNow);
  }
};

/* ---------- toast ---------- */
function toast(msg, ms = 2200) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

/* ---------- font size control ---------- */
const FontSize = {
  sizes: [14, 15, 16, 17, 18, 20, 22],
  current() { return Store.get('fontSize', 16); },
  apply() { document.documentElement.style.setProperty('--font-base', FontSize.current() + 'px'); },
  change(dir) {
    const cur = FontSize.current();
    const idx = FontSize.sizes.indexOf(cur);
    let next = idx === -1 ? 1 : idx + dir;
    next = Math.max(0, Math.min(FontSize.sizes.length - 1, next));
    Store.set('fontSize', FontSize.sizes[next]);
    FontSize.apply();
    toast('ফন্ট সাইজ: ' + FontSize.sizes[next] + 'px');
    const ind = document.getElementById('font-indicator');
    if (ind) ind.textContent = FontSize.sizes[next] + 'px';
  }
};

/* ---------- vocab loading (shared) ---------- */
const vocabCache = {};

async function loadCategoryWords(catId) {
  if (vocabCache[catId]) return vocabCache[catId];
  const cat = CATEGORIES.find(c => c.id === catId);
  if (!cat) return [];
  try {
    const res = await fetch(cat.file);
    const words = await res.json();
    vocabCache[catId] = words;
    return words;
  } catch (e) {
    console.warn('failed to load', cat.file);
    return [];
  }
}

async function loadAllWords() {
  const all = [];
  for (const c of CATEGORIES) {
    const words = await loadCategoryWords(c.id);
    words.forEach(w => { w._cat = c; all.push(w); });
  }
  return all;
}

/* ---------- daily word (date-based) ---------- */
async function dailyWord() {
  const all = await loadAllWords();
  if (!all.length) return null;
  const key = todayKey();
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 9999991;
  return all[h % all.length];
}

/* ---------- nav builder ---------- */
const NAV_ITEMS = [
  { href: 'index.html',      bn: '🏠 হোম' },
  { href: 'vocabulary.html', bn: '📖 শব্দ' },
  { href: 'reading.html',    bn: '📄 পড়া' },
  { href: 'flashcard.html',  bn: '🃏 কার্ড' },
  { href: 'quiz.html',       bn: '❓ কুইজ' },
  { href: 'hangul.html',     bn: 'ㅎ হাঙ্গুল' },
  { href: 'stats.html',      bn: '📊 স্ট্যাটস' },
  { href: 'settings.html',  bn: '⚙️ সেটিংস' }
];

function buildNav() {
  const current = location.pathname.split('/').pop() || 'index.html';
  const links = NAV_ITEMS.map(n =>
    `<a href="${n.href}" class="${n.href === current ? 'active' : ''}">${n.bn}</a>`
  ).join('');
  document.body.insertAdjacentHTML('afterbegin', `
    <nav class="nav">
      <div class="nav-inner">
        <a class="brand" href="index.html"><span class="logo">한</span>KoreanLearn</a>
        <div class="nav-links">${links}</div>
      </div>
    </nav>
  `);

  // font-size buttons are injected per-page where .font-controls exists
  document.querySelectorAll('.font-controls').forEach(fc => {
    fc.innerHTML = `
      <button class="btn btn-icon" id="font-dec" title="ফন্ট ছোট করুন">A−</button>
      <span id="font-indicator">${FontSize.current()}px</span>
      <button class="btn btn-icon" id="font-inc" title="ফন্ট বড় করুন">A+</button>
    `;
    fc.querySelector('#font-dec').onclick = () => FontSize.change(-1);
    fc.querySelector('#font-inc').onclick = () => FontSize.change(1);
  });
}

/* ---------- backup export/import (used by settings) ---------- */
function exportBackup() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith('kl_')) {
      try { data[k] = JSON.parse(localStorage.getItem(k)); } catch (e) {}
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'koreanlearn-backup-' + todayKey() + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('ব্যাকআপ ডাউনলোড হয়েছে');
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      let n = 0;
      Object.entries(data).forEach(([k, v]) => {
        if (k.startsWith('kl_')) { localStorage.setItem(k, JSON.stringify(v)); n++; }
      });
      toast(n + 'টি ডেটা ইমপোর্ট হয়েছে');
      setTimeout(() => location.reload(), 900);
    } catch (e) { toast('ফাইলটি সঠিক JSON নয়'); }
  };
  reader.readAsText(file);
}

/* ---------- boot (every page) ---------- */
document.addEventListener('DOMContentLoaded', () => {
  FontSize.apply();
  buildNav();
  Stats.recomputeStreak();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
