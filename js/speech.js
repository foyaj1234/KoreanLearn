/* ===== speech.js — Korean TTS via Web Speech API ===== */
const Speech = {
  speed: 0.9,
  speeds: { slow: 0.6, normal: 0.9, fast: 1.1 },
  koVoice: null,
  checked: false,
  currentUtterQueue: [],
  queueIndex: 0,
  onSentence: null, // callback(index) when reading sentences
  speaking: false,

  getVoices() { return window.speechSynthesis ? speechSynthesis.getVoices() : []; },

  findKoVoice() {
    if (Speech.checked && Speech.koVoice !== undefined) return Speech.koVoice;
    const vs = Speech.getVoices();
    Speech.koVoice = vs.find(v => v.lang === 'ko-KR') || vs.find(v => v.lang && v.lang.startsWith('ko')) || null;
    return Speech.koVoice;
  },

  ready(cb) {
    if (!window.speechSynthesis) { cb(false); return; }
    const v = Speech.findKoVoice();
    if (speechSynthesis.getVoices().length) { cb(!!v); return; }
    // voices load async
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      const ok = !!Speech.findKoVoice();
      if (ok || speechSynthesis.getVoices().length || tries > 20) {
        clearInterval(t); Speech.checked = true; cb(ok);
      }
    }, 150);
  },

  setSpeed(name) {
    Speech.speed = Speech.speeds[name] || 0.9;
  },

  speak(text, onend) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    Speech.speaking = true;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = Speech.speed;
    const v = Speech.findKoVoice();
    if (v) u.voice = v;
    u.onend = u.onerror = () => { Speech.speaking = false; if (onend) onend(); };
    speechSynthesis.speak(u);
  },

  stop() {
    if (window.speechSynthesis) speechSynthesis.cancel();
    Speech.speaking = false;
    Speech.queueIndex = 0;
    if (Speech.onSentence) Speech.onSentence(-1);
  },

  /* speak sentences one by one, highlighting current one */
  speakSentences(sentences, onIndex, onDone) {
    if (!window.speechSynthesis || !sentences.length) { if (onDone) onDone(); return; }
    speechSynthesis.cancel();
    Speech.onSentence = onIndex;
    let i = 0;
    const next = () => {
      if (i >= sentences.length) {
        onIndex(-1);
        Speech.speaking = false;
        if (onDone) onDone();
        return;
      }
      onIndex(i);
      const u = new SpeechSynthesisUtterance(sentences[i]);
      u.lang = 'ko-KR';
      u.rate = Speech.speed;
      const v = Speech.findKoVoice();
      if (v) u.voice = v;
      u.onend = u.onerror = () => { i++; next(); };
      speechSynthesis.speak(u);
    };
    Speech.speaking = true;
    next();
  }
};

/* show a warning banner once if no Korean voice found */
function checkKoreanVoiceNotice() {
  const host = document.getElementById('voice-notice');
  if (!host) return;
  Speech.ready(ok => {
    if (!ok) {
      host.innerHTML = '<div class="notice notice-warn">📢 আপনার ডিভাইসে কোরিয়ান ভয়েস ইনস্টল করুন (Settings → Text-to-Speech → Korean)। উচ্চারণ শুনতে পারছি না।</div>';
    }
  });
}

/* shared speed-control UI builder */
function buildSpeedControls() {
  document.querySelectorAll('.speed-controls').forEach(sc => {
    sc.innerHTML = `
      <button class="btn btn-icon speed-btn" data-speed="slow">🐢 0.6x</button>
      <button class="btn btn-icon speed-btn active" data-speed="normal">▶ 0.9x</button>
      <button class="btn btn-icon speed-btn" data-speed="fast">🐇 1.1x</button>
    `;
    sc.querySelectorAll('.speed-btn').forEach(b => {
      b.onclick = () => {
        Speech.setSpeed(b.dataset.speed);
        sc.querySelectorAll('.speed-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        toast('স্পিড: ' + b.textContent.trim());
      };
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  buildSpeedControls();
  checkKoreanVoiceNotice();
  if (window.speechSynthesis) {
    speechSynthesis.onvoiceschanged = () => { Speech.checked = false; Speech.findKoVoice(); };
  }
});
