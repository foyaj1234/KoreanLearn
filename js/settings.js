/* ===== settings.js — font size, daily goal, backup export/import, reset ===== */

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('goal-input')) return; // not this page

  // daily goal
  const goalInput = document.getElementById('goal-input');
  goalInput.value = Stats.goal();
  document.getElementById('goal-save').onclick = () => {
    const n = parseInt(goalInput.value, 10);
    if (isNaN(n) || n < 1) { toast('১ বা তার বেশি লিখুন'); return; }
    Stats.setGoal(n);
    toast('ডেইলি গোল সেভ হলো: ' + n + ' শব্দ');
  };

  // backup
  document.getElementById('export-btn').onclick = exportBackup;
  document.getElementById('import-btn').onclick = () => {
    const f = document.getElementById('import-file');
    if (!f.files.length) { toast('আগে JSON ফাইল বাছাই করুন'); return; }
    importBackup(f.files[0]);
  };

  // reset
  document.getElementById('reset-btn').onclick = () => {
    if (confirm('সব প্রোগ্রেস মুছে যাবে। নিশ্চিত?')) {
      Object.keys(localStorage).filter(k => k.startsWith('kl_')).forEach(k => localStorage.removeItem(k));
      toast('সব ডেটা মুছে ফেলা হলো');
      setTimeout(() => location.reload(), 900);
    }
  };
});
