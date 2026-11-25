/* ===== KoreanLearn Categories =====
 * নতুন ক্যাটাগরি যোগ করতে: data/vocab/ ফোল্ডারে JSON ফাইল রেখে
 * নিচে এক লাইন যোগ করুন। বাকি সব পেজ নিজেই এটা দেখাবে।
 * file: data/vocab/ ফোল্ডারের JSON ফাইলের নাম (id-গুলো অবশ্যই ইউনিক হবে)
 */
const CATEGORIES = [
  { id: 'body',       bn: 'শরীরের অঙ্গ',  en: 'Body Parts',    icon: '🧍', file: 'data/vocab/body.json' },
  { id: 'fruits',     bn: 'ফলমূল',        en: 'Fruits',        icon: '🍎', file: 'data/vocab/fruits.json' },
  { id: 'vegetables', bn: 'শাকসবজি',      en: 'Vegetables',    icon: '🥕', file: 'data/vocab/vegetables.json' },
  { id: 'animals',    bn: 'পশু',          en: 'Animals',       icon: '🐯', file: 'data/vocab/animals.json' },
  { id: 'birds',      bn: 'পাখি',         en: 'Birds',         icon: '🐦', file: 'data/vocab/birds.json' },
  { id: 'verbs',      bn: 'দৈনন্দিন কাজ', en: 'Daily Verbs',  icon: '🏃', file: 'data/vocab/daily-verbs.json' },
  { id: 'family',     bn: 'পরিবার',       en: 'Family',        icon: '👪', file: 'data/vocab/family.json' },
  { id: 'colors',     bn: 'রং',           en: 'Colors',        icon: '🎨', file: 'data/vocab/colors.json' },
  { id: 'numbers',    bn: 'সংখ্যা',       en: 'Numbers',       icon: '🔢', file: 'data/vocab/numbers.json' },
  { id: 'food',       bn: 'খাবার',        en: 'Food',          icon: '🍚', file: 'data/vocab/food.json' },
  { id: 'clothing',   bn: 'পোশাক',        en: 'Clothing',      icon: '👕', file: 'data/vocab/clothing.json' },
  { id: 'vehicles',   bn: 'যানবাহন',      en: 'Vehicles',      icon: '🚌', file: 'data/vocab/vehicles.json' },
  { id: 'weather',    bn: 'আবহাওয়া',      en: 'Weather',       icon: '🌦', file: 'data/vocab/weather.json' },
  { id: 'home',       bn: 'বাড়ির জিনিস',  en: 'Household',     icon: '🏠', file: 'data/vocab/home.json' },
  { id: 'jobs',       bn: 'পেশা',         en: 'Professions',   icon: '👨‍⚕️', file: 'data/vocab/jobs.json' }
];
