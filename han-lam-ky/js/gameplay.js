// Hán Lâm Ký (汉林记) — gameplay.js
// Module ES hoàn chỉnh: chỉ thao tác DOM + dữ liệu học tập + localStorage.
// Không dùng Three.js, không phụ thuộc thư viện ngoài.
// Giao diện tiếng Việt, nội dung học chữ giản thể + Pinyin có dấu thanh.
// © Nông Quang Vinh

export const RANKS = ['学童', '童生', '秀才', '举人', '贡士', '进士'];

const RANK_THRESHOLDS = [0, 100, 250, 450, 700, 1000];

const SAVE_KEY = 'hanlamky_save_v1';

// ---------------------------------------------------------------------------
// Nội dung học — 3 nhiệm vụ
// Mỗi nhiệm vụ có 1 câu hỏi trắc nghiệm 4 lựa chọn.
// Đáp án đúng là nghĩa tiếng Việt của từ/câu chính.
// ---------------------------------------------------------------------------
export const QUESTS = [
  {
    id: 'hello',
    npc: 'teacher',
    npcId: 'teacher',
    title: 'Chào hỏi đầu tiên',
    hanzi: '你好',
    pinyin: 'Nǐ hǎo',
    meaning: 'Xin chào',
    exampleHanzi: '你好！你叫什么名字？',
    examplePinyin: 'Nǐ hǎo! Nǐ jiào shénme míngzi?',
    exampleMeaning: 'Xin chào! Bạn tên là gì?',
    example: {
      hanzi: '你好！你叫什么名字？',
      pinyin: 'Nǐ hǎo! Nǐ jiào shénme míngzi?',
      meaning: 'Xin chào! Bạn tên là gì?'
    },
    xp: 50,
    question: '你好 (Nǐ hǎo) — Câu này có nghĩa là gì?',
    options: ['Xin chào', 'Tạm biệt', 'Tôi không hiểu', 'Bao nhiêu tiền?'],
    choices: ['Xin chào', 'Tạm biệt', 'Tôi không hiểu', 'Bao nhiêu tiền?'],
    correctIndex: 0,
    answerIndex: 0,
    answer: 'Xin chào',
    correctAnswer: 'Xin chào'
  },
  {
    id: 'bun',
    npc: 'seller',
    npcId: 'seller',
    title: 'Mua bánh bao',
    hanzi: '我要一个包子',
    pinyin: 'Wǒ yào yí gè bāozi',
    meaning: 'Tôi muốn một cái bánh bao',
    exampleHanzi: '我要一个包子，谢谢！',
    examplePinyin: 'Wǒ yào yí gè bāozi, xièxie!',
    exampleMeaning: 'Tôi muốn một cái bánh bao, cảm ơn!',
    example: {
      hanzi: '我要一个包子，谢谢！',
      pinyin: 'Wǒ yào yí gè bāozi, xièxie!',
      meaning: 'Tôi muốn một cái bánh bao, cảm ơn!'
    },
    xp: 80,
    question: '我要一个包子 (Wǒ yào yí gè bāozi) — Câu này có nghĩa là gì?',
    options: ['Tạm biệt', 'Tôi muốn một cái bánh bao', 'Tôi không hiểu', 'Bao nhiêu tiền?'],
    choices: ['Tạm biệt', 'Tôi muốn một cái bánh bao', 'Tôi không hiểu', 'Bao nhiêu tiền?'],
    correctIndex: 1,
    answerIndex: 1,
    answer: 'Tôi muốn một cái bánh bao',
    correctAnswer: 'Tôi muốn một cái bánh bao'
  },
  {
    id: 'thanks',
    npc: 'courier',
    npcId: 'courier',
    title: 'Lời cảm ơn',
    hanzi: '谢谢',
    pinyin: 'Xièxie',
    meaning: 'Cảm ơn',
    exampleHanzi: '谢谢老师！',
    examplePinyin: 'Xièxie lǎoshī!',
    exampleMeaning: 'Cảm ơn thầy!',
    example: {
      hanzi: '谢谢老师！',
      pinyin: 'Xièxie lǎoshī!',
      meaning: 'Cảm ơn thầy!'
    },
    xp: 50,
    question: '谢谢 (Xièxie) — Câu này có nghĩa là gì?',
    options: ['Tạm biệt', 'Tôi không hiểu', 'Cảm ơn', 'Bao nhiêu tiền?'],
    choices: ['Tạm biệt', 'Tôi không hiểu', 'Cảm ơn', 'Bao nhiêu tiền?'],
    correctIndex: 2,
    answerIndex: 2,
    answer: 'Cảm ơn',
    correctAnswer: 'Cảm ơn'
  }
];

// ---------------------------------------------------------------------------
// Hệ thống cấp bậc khoa cử
// ---------------------------------------------------------------------------
export function getRank(xp) {
  const value = typeof xp === 'number' && Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  let index = 0;
  for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
    if (value >= RANK_THRESHOLDS[i]) index = i;
  }
  const nextXp = index + 1 < RANK_THRESHOLDS.length ? RANK_THRESHOLDS[index + 1] : null;
  return { name: RANKS[index], index, nextXp };
}

// ---------------------------------------------------------------------------
// Lưu / tải tiến trình — localStorage key 'hanlamky_save_v1'
// ---------------------------------------------------------------------------
export function loadSave() {
  const defaults = { playerName: 'Học trò', xp: 0, completed: [], currentQuest: null };
  try {
    if (typeof localStorage === 'undefined') return { ...defaults, completed: [] };
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...defaults, completed: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...defaults, completed: [] };
    return {
      playerName: typeof parsed.playerName === 'string' && parsed.playerName.trim()
        ? parsed.playerName
        : defaults.playerName,
      xp: typeof parsed.xp === 'number' && Number.isFinite(parsed.xp) ? Math.max(0, Math.floor(parsed.xp)) : 0,
      completed: Array.isArray(parsed.completed)
        ? parsed.completed.filter((id) => typeof id === 'string')
        : [],
      currentQuest: typeof parsed.currentQuest === 'string' || parsed.currentQuest === null
        ? parsed.currentQuest
        : null
    };
  } catch (_err) {
    return { ...defaults, completed: [] };
  }
}

export function saveGame(state) {
  if (!state || typeof state !== 'object') return;
  try {
    if (typeof localStorage === 'undefined') return;
    const data = {
      playerName: typeof state.playerName === 'string' ? state.playerName : 'Học trò',
      xp: typeof state.xp === 'number' && Number.isFinite(state.xp) ? Math.max(0, Math.floor(state.xp)) : 0,
      completed: Array.isArray(state.completed) ? state.completed : [],
      currentQuest: typeof state.currentQuest === 'string' || state.currentQuest === null
        ? state.currentQuest
        : null
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (_err) {
    // Không có localStorage hoặc bị chặn: bỏ qua lặng lẽ, không làm vỡ game.
  }
}

// ---------------------------------------------------------------------------
// Đối thoại với NPC
// ---------------------------------------------------------------------------
const NPCS = {
  teacher: {
    npcName: 'Thầy đồ',
    greetingNew: 'Chào con! Ta là thầy đồ làng Thanh Khê. Muốn học tiếng Trung, trước hết phải biết chào hỏi. Hãy học câu “你好” (Nǐ hǎo) — Xin chào — rồi trả lời câu hỏi của ta nhé.',
    greetingDone: 'Tốt lắm! Con đã chào hỏi rất lễ phép. “你好” — Xin chào — là câu đầu tiên trên con đường khoa cử của con.',
    hint: 'Hãy nghe thầy đọc “你好” rồi chọn nghĩa đúng: Xin chào.'
  },
  seller: {
    npcName: 'Cô bán bánh',
    greetingNew: 'Bánh bao nóng hổi đây! Muốn mua bánh thì phải biết nói tiếng Trung chứ. Học câu “我要一个包子” (Wǒ yào yí gè bāozi) — Tôi muốn một cái bánh bao — rồi nói với cô nhé.',
    greetingDone: 'Cảm ơn cháu! Bánh bao của cháu đây, còn nóng hổi. Nói tiếng Trung giỏi lắm, lần sau lại ghé nhé!',
    hint: 'Hãy nghe cô đọc “我要一个包子” rồi chọn nghĩa đúng: Tôi muốn một cái bánh bao.'
  },
  courier: {
    npcName: 'Anh đưa thư',
    greetingNew: 'Chào bạn! Tôi vừa đưa thư khắp làng Thanh Khê, mệt mà vui. Người có lễ nghĩa thì không quên nói “谢谢” (Xièxie) — Cảm ơn. Bạn học câu này giúp tôi nhé.',
    greetingDone: 'Cảm ơn bạn nhiều lắm! Một lời “谢谢” nhỏ thôi mà làm ngày đưa thư của tôi vui hẳn lên.',
    hint: 'Hãy nghe anh đọc “谢谢” rồi chọn nghĩa đúng: Cảm ơn.'
  }
};

const QUEST_BY_NPC = {
  teacher: 'hello',
  seller: 'bun',
  courier: 'thanks'
};

export function getDialogue(npcId, state) {
  const npc = NPCS[npcId] || null;
  const completed = state && Array.isArray(state.completed) ? state.completed : [];
  if (!npc) {
    return {
      npcName: 'Người làng',
      greeting: 'Chào bạn! Làng Thanh Khê luôn chào đón người ham học.',
      quest: null,
      hint: 'Hãy trò chuyện với thầy đồ, cô bán bánh và anh đưa thư trong làng.'
    };
  }
  const questId = QUEST_BY_NPC[npcId] || null;
  const quest = questId ? QUESTS.find((q) => q.id === questId) || null : null;
  const done = quest ? completed.includes(quest.id) : false;
  return {
    npcName: npc.npcName,
    greeting: done ? npc.greetingDone : npc.greetingNew,
    quest: done ? null : quest,
    hint: npc.hint
  };
}

// ---------------------------------------------------------------------------
// Sổ học tập — trả về chuỗi HTML
// ---------------------------------------------------------------------------
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderStudyBook(state) {
  const completed = state && Array.isArray(state.completed) ? state.completed : [];
  const items = QUESTS.map((quest) => {
    const done = completed.includes(quest.id);
    const status = done ? 'Hoàn thành' : 'Chưa làm';
    return (
      '<article class="study-item' + (done ? ' study-item--done' : '') + '">' +
      '<h3>' + escapeHtml(quest.title) + ' — ' + status + '</h3>' +
      '<p class="study-hanzi">' + escapeHtml(quest.hanzi) + '</p>' +
      '<p class="study-pinyin">' + escapeHtml(quest.pinyin) + '</p>' +
      '<p class="study-meaning">Nghĩa: ' + escapeHtml(quest.meaning) + '</p>' +
      '<p class="study-example">Ví dụ: ' + escapeHtml(quest.exampleHanzi) + ' (' + escapeHtml(quest.examplePinyin) + ') — ' + escapeHtml(quest.exampleMeaning) + '</p>' +
      '<p class="study-xp">Thưởng: ' + quest.xp + ' XP</p>' +
      '</article>'
    );
  }).join('\n');

  return (
    '<section class="study-book">' +
    '<h2>Sổ học tập</h2>' +
    items +
    '<div class="font-test">' +
    '<p>Tiếng Việt đầy đủ dấu: ă â ê ô ơ ư đ. Hành trình học tập bắt đầu từ những chữ cái đầu tiên.</p>' +
    '<p>你好！欢迎来到汉林记。我要学习中文。谢谢老师！</p>' +
    '<p>Nǐ hǎo! Huānyíng lái dào Hàn Lín Jì. Wǒ yào xuéxí Zhōngwén. Xièxie lǎoshī!</p>' +
    '</div>' +
    '</section>'
  );
}

// ---------------------------------------------------------------------------
// Phát âm tiếng Trung
// ---------------------------------------------------------------------------
export function speakChinese(text) {
  try {
    if (typeof window === 'undefined') return;
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance === 'undefined') return;
    if (typeof text !== 'string' || !text) return;
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  } catch (_err) {
    // Không có speechSynthesis hoặc bị chặn: không lỗi, không làm vỡ game.
  }
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
export function updateHUD(state) {
  try {
    if (typeof document === 'undefined') return;
    const safe = state && typeof state === 'object' ? state : {};
    const xp = typeof safe.xp === 'number' && Number.isFinite(safe.xp) ? Math.max(0, Math.floor(safe.xp)) : 0;
    const completed = Array.isArray(safe.completed) ? safe.completed : [];
    const rank = getRank(xp);

    const nameEl = document.getElementById('hud-name');
    if (nameEl) nameEl.textContent = typeof safe.playerName === 'string' && safe.playerName ? safe.playerName : 'Học trò';

    const rankEl = document.getElementById('hud-rank');
    if (rankEl) rankEl.textContent = rank.name;

    const xpEl = document.getElementById('hud-xp');
    if (xpEl) xpEl.textContent = 'XP: ' + xp;

    const fillEl = document.getElementById('xp-fill');
    if (fillEl) {
      let percent = 100;
      if (rank.nextXp !== null) {
        const base = RANK_THRESHOLDS[rank.index];
        const span = rank.nextXp - base;
        percent = span > 0 ? Math.max(0, Math.min(100, ((xp - base) / span) * 100)) : 100;
      }
      fillEl.style.width = percent + '%';
    }

    const listEl = document.getElementById('quest-list');
    if (listEl) {
      listEl.innerHTML = QUESTS.map((quest) => {
        const done = completed.includes(quest.id);
        return '<li>' + escapeHtml(quest.title) + ' — ' + (done ? 'Hoàn thành' : 'Chưa làm') + '</li>';
      }).join('');
    }
  } catch (_err) {
    // DOM chưa sẵn sàng: bỏ qua lặng lẽ.
  }
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
let toastTimer = null;

export function showToast(msg) {
  try {
    if (typeof document === 'undefined') return;
    const toast = document.getElementById('toast');
    if (!toast) return;
    if (toastTimer !== null) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    toast.textContent = typeof msg === 'string' ? msg : String(msg == null ? '' : msg);
    toast.style.display = 'block';
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.style.display = 'none';
      toast.classList.remove('show');
      toastTimer = null;
    }, 2500);
  } catch (_err) {
    // Không có phần tử #toast: bỏ qua lặng lẽ.
  }
}
