/* ===== stats.js — stats page: today/week/month, 7-day chart, badges ===== */

function renderStats() {
  const days = Store.get('wordDays', {});
  const totalWords = Progress.learned().size;
  const streak = Stats.getStreak();

  // today / week / month totals (words learned)
  const sumRange = (nDays) => {
    let sum = 0;
    const d = new Date();
    for (let i = 0; i < nDays; i++) {
      sum += days[todayKey(d)] || 0;
      d.setDate(d.getDate() - 1);
    }
    return sum;
  };

  document.getElementById('stat-today').textContent = days[todayKey()] || 0;
  document.getElementById('stat-week').textContent = sumRange(7);
  document.getElementById('stat-month').textContent = sumRange(30);
  document.getElementById('stat-total').textContent = totalWords;
  document.getElementById('stat-streak').textContent = streak + ' দিন';

  // 7-day bar chart (pure CSS)
  const labels = [], values = [];
  const d = new Date();
  d.setDate(d.getDate() - 6);
  for (let i = 0; i < 7; i++) {
    labels.push(String(d.getDate()) + '/' + (d.getMonth() + 1));
    values.push(days[todayKey(d)] || 0);
    d.setDate(d.getDate() + 1);
  }
  const max = Math.max(...values, 1);
  document.getElementById('chart-bars').innerHTML = values.map((v, i) => `
    <div class="chart-col">
      <div class="bar-val">${v}</div>
      <div class="bar" style="height:${Math.max(4, (v / max) * 100)}%"></div>
      <div class="bar-label">${labels[i]}</div>
    </div>
  `).join('');

  // daily goal progress
  const goal = Stats.goal();
  const today = days[todayKey()] || 0;
  document.getElementById('goal-progress').innerHTML = `
    <div class="progress-bar"><div class="fill" style="width:${Math.min(100, (today / goal) * 100)}%"></div></div>
    <div class="muted">আজকের গোল: ${today} / ${goal} শব্দ</div>
  `;

  // badges
  const badges = Stats.badges();
  document.getElementById('badge-grid').innerHTML = badges.map(b => `
    <div class="badge-item ${b.earned ? 'earned' : ''}">
      <div class="b-icon">${b.icon}</div>
      <div class="b-name">${b.name}</div>
      <div class="b-desc">${b.desc}</div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('stat-today')) return; // not this page
  Stats.recomputeStreak();
  renderStats();
});
