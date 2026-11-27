// Hán Lâm Ký (汉林记) — gameplay.js
// Module ES hoàn chỉnh: chỉ thao tác DOM + dữ liệu học tập + localStorage.
// Không dùng Three.js, không phụ thuộc thư viện ngoài, không dùng file GLB.
// Giao diện tiếng Việt, nội dung học chữ giản thể + Pinyin có dấu thanh.
// © Nông Quang Vinh
//
// QUYẾT ĐỊNH ĐÃ CHỐT (Vinh, 27/11 — áp dụng ngay):
//  (a) KHÔNG chặn quiz 你好: các bài vỡ lòng Bài 0–5 là bài học TỰ CHỌN
//      trong Sổ học tập; gặp thầy đồ vẫn mở quiz 你好 ngay như cũ.
//      Không có cờ gating nào trong file này.
//  (b) Chuẩn HSK 3.0 cho nội dung từ HSK 2 trở lên. HSK 1 theo HSK 3.0
//      là 300 từ (HSK 2.0 chỉ có 150 từ — không dùng số đó nữa).
//      Mọi chỗ hiển thị chuẩn HSK đều dùng hằng HSK_VERSION dưới đây.
//  (c) Cấp bậc khoa cử CHỈ đổi khi đỗ kỳ thi trong trường thi
//      (gradeExam đậu → rankIndex + 1). XP chỉ là điểm tích lũy,
//      một mình XP KHÔNG đủ lên cấp.
//
// CÁCH NỐI VỚI main.js (parent cần làm, gameplay.js không tự sửa main.js):
//  - answerQuiz() nhánh trả lời SAI: gọi recordWrongAnswer(state, q.id)
//    để lần sau getDialogue('teacher') nhắc lại lỗi sai đó.
//  - openDialogue('teacher'): gọi blackboardForLesson(lessonId) rồi
//    env.setBlackboardText(hanzi, pinyin); gọi teacher.setMode(
//    teacherModeFor(state, lessonId)) để thầy đổi tư thế giảng.
//  - Nút nghe từng thanh điệu (Bài 1): gọi speakTone('ma', 1..4 | 0).
//  - Sau khi đóng overlay thi: lắng nghe sự kiện window
//    'hanlamky:exam-done' (detail {rankIndex, passed, score, total})
//    rồi nạp lại state bằng loadSave() — vì sitAtExamDesk tự đọc/ghi
//    save, còn biến state trong main.js không tự cập nhật.

export const RANKS = ['学童', '童生', '秀才', '举人', '贡士', '进士'];

// Chuẩn HSK đang dùng trong game. Đổi một chỗ này là đổi mọi chỗ hiển thị.
export const HSK_VERSION = 'HSK 3.0';

// Khung số từ theo HSK 3.0 (tra cứu ngày 27/11). Chỉ là KHUNG cấp độ;
// nội dung chi tiết HSK 2 trở lên chưa build theo HSK 3.0.
export const HSK_LEVELS_3_0 = [
  { level: 1, words: 300 },
  { level: 2, words: 500 },
  { level: 3, words: 1000 },
  { level: 4, words: 2000 },
  { level: 5, words: 3600 },
  { level: 6, words: 5400 },
  { level: 7, words: 11000 }
];

// Ngưỡng XP cũ — CHỈ dùng cho tương thích ngược / probe của main.js
// (getRank({xp: 99999}) phải trả cấp cao nhất để main.js nhận ra chế độ
// object). KHÔNG dùng để thăng cấp: cấp bậc thật nằm ở state.rankIndex
// và chỉ tăng khi đỗ thi (xem gradeExam).
const RANK_THRESHOLDS = [0, 100, 250, 450, 700, 1000];

const SAVE_KEY = 'hanlamky_save_v1';

// Spaced repetition: sai >= 2 lần thì "cần ôn", hẹn ôn sau 1 ngày;
// ôn đúng thì hẹn lại sau 3 ngày (dùng Date.now(), mốc thời gian thực).
const DAY_MS = 24 * 60 * 60 * 1000;
const REVIEW_WRONG_THRESHOLD = 2;

function rankFromXp(xp) {
  const value = typeof xp === 'number' && Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  let index = 0;
  for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
    if (value >= RANK_THRESHOLDS[i]) index = i;
  }
  const nextXp = index + 1 < RANK_THRESHOLDS.length ? RANK_THRESHOLDS[index + 1] : null;
  return { name: RANKS[index], index, nextXp };
}

// ---------------------------------------------------------------------------
// Nội dung học — nhiệm vụ cũ (giữ nguyên id/xp) + nhiệm vụ hỏi đường mới
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
  },
  {
    id: 'askway',
    npc: 'courier',
    npcId: 'courier',
    title: 'Hỏi đường đến trường',
    hanzi: '请问，去学校怎么走？',
    pinyin: 'Qǐngwèn, qù xuéxiào zěnme zǒu?',
    meaning: 'Xin hỏi, đi đến trường học như thế nào?',
    exampleHanzi: '请问，去学校怎么走？一直走就到了。',
    examplePinyin: 'Qǐngwèn, qù xuéxiào zěnme zǒu? Yìzhí zǒu jiù dào le.',
    exampleMeaning: 'Xin hỏi, đi đến trường học như thế nào? Cứ đi thẳng là tới.',
    example: {
      hanzi: '请问，去学校怎么走？一直走就到了。',
      pinyin: 'Qǐngwèn, qù xuéxiào zěnme zǒu? Yìzhí zǒu jiù dào le.',
      meaning: 'Xin hỏi, đi đến trường học như thế nào? Cứ đi thẳng là tới.'
    },
    xp: 80,
    question: '请问，去学校怎么走？ (Qǐngwèn, qù xuéxiào zěnme zǒu?) — Câu này có nghĩa là gì?',
    options: ['Xin hỏi, đi đến trường học như thế nào?', 'Xin chào, bạn tên là gì?', 'Tôi muốn một cái bánh bao', 'Cảm ơn thầy rất nhiều'],
    choices: ['Xin hỏi, đi đến trường học như thế nào?', 'Xin chào, bạn tên là gì?', 'Tôi muốn một cái bánh bao', 'Cảm ơn thầy rất nhiều'],
    correctIndex: 0,
    answerIndex: 0,
    answer: 'Xin hỏi, đi đến trường học như thế nào?',
    correctAnswer: 'Xin hỏi, đi đến trường học như thế nào?'
  }
];

// ---------------------------------------------------------------------------
// Giáo trình vỡ lòng — thầy đồ giảng trong lớp, trước nhiệm vụ 你好.
// Bài học TỰ CHỌN trong Sổ học tập (Vinh chốt 27/11: KHÔNG chặn quiz 你好).
// Mỗi bài có 1 quiz riêng; trả lời đúng trong hội thoại thầy đồ thì
// main.js cộng XP và ghi id bài vào state.completed như nhiệm vụ thường.
// ---------------------------------------------------------------------------
export const LESSONS = [
  {
    id: 'lesson-pinyin-0',
    title: 'Bài 0 — Pinyin là gì',
    intro: 'Trước khi học chữ Hán, con phải biết Pinyin: cách viết âm đọc của tiếng Trung bằng chữ cái Latinh.',
    explanation: 'Một âm tiết tiếng Trung gồm 3 phần: thanh mẫu (phụ âm đầu) + vận mẫu (phần vần) + thanh điệu (giọng lên xuống). Tiếng Trung có 21 thanh mẫu, 36 vận mẫu, ghép lại thành khoảng 400 âm tiết. Ví dụ: b (thanh mẫu) + a (vận mẫu) = ba, thêm thanh điệu sẽ thành bā, bá, bǎ, bà với nghĩa khác nhau.',
    hanzi: '拼音',
    pinyin: 'Pīnyīn',
    meaning: 'Pinyin — cách ghi âm tiếng Trung bằng chữ Latinh',
    example: { hanzi: 'b + a = ba', pinyin: 'b + a = ba', meaning: 'Thanh mẫu b ghép với vận mẫu a thành âm tiết ba.' },
    xp: 30,
    quiz: {
      question: 'Một âm tiết tiếng Trung gồm những thành phần nào?',
      options: ['Thanh mẫu + vận mẫu + thanh điệu', 'Chỉ có thanh mẫu', 'Chỉ có vận mẫu', 'Chữ Hán + Pinyin'],
      correctIndex: 0,
      whyWrong: 'Một âm tiết = thanh mẫu + vận mẫu + thanh điệu. Ví dụ: b (thanh mẫu) + a (vận mẫu) = ba, thêm thanh điệu thành bā, bá, bǎ, bà.'
    }
  },
  {
    id: 'lesson-tones-1',
    title: 'Bài 1 — Bốn thanh điệu + thanh nhẹ',
    intro: 'Thanh điệu đổi nghĩa của từ. Cùng âm "ma" mà đọc khác giọng thì nghĩa khác hẳn — nghe kỹ từng thanh dưới đây.',
    explanation: 'Tiếng Trung có 4 thanh điệu chính: thanh 1 ngang cao (mā), thanh 2 đi lên (má), thanh 3 xuống rồi lên (mǎ), thanh 4 đi xuống mạnh (mà). Ngoài ra còn có thanh nhẹ, đọc nhẹ và ngắn, không đánh dấu (ma trong 吗). Dấu thanh đặt theo thứ tự ưu tiên: a trước, rồi đến e, rồi đến o; nếu không có a/e/o thì đánh lên nguyên âm cuối (ví dụ iu → iù, ui → uì).',
    hanzi: 'mā má mǎ mà ma',
    pinyin: 'mā má mǎ mà ma',
    meaning: '妈 mẹ — 麻 cây gai — 马 ngựa — 骂 mắng — 吗 trợ từ hỏi (thanh nhẹ)',
    example: { hanzi: '妈妈骑马吗？', pinyin: 'Māma qí mǎ ma?', meaning: 'Mẹ cưỡi ngựa à?' },
    xp: 30,
    // Mỗi lựa chọn nghe là một chuỗi riêng — UI gắn nút nghe gọi speakTone('ma', tone).
    tones: [
      { syllable: 'mā', tone: 1, base: 'ma', hanzi: '妈', pinyin: 'mā', meaning: 'mẹ' },
      { syllable: 'má', tone: 2, base: 'ma', hanzi: '麻', pinyin: 'má', meaning: 'cây gai; tê' },
      { syllable: 'mǎ', tone: 3, base: 'ma', hanzi: '马', pinyin: 'mǎ', meaning: 'ngựa' },
      { syllable: 'mà', tone: 4, base: 'ma', hanzi: '骂', pinyin: 'mà', meaning: 'mắng' },
      { syllable: 'ma', tone: 0, base: 'ma', hanzi: '吗', pinyin: 'ma', meaning: 'trợ từ hỏi (thanh nhẹ)' }
    ],
    quiz: {
      question: 'mǎ (thanh 3) có nghĩa là gì?',
      options: ['Ngựa (马)', 'Mẹ (妈)', 'Mắng (骂)', 'Cây gai (麻)'],
      correctIndex: 0,
      whyWrong: 'mā 妈 là mẹ, má 麻 là cây gai, mǎ 马 là ngựa, mà 骂 là mắng. Thanh điệu đổi nghĩa hoàn toàn — hãy nghe lại từng thanh bằng nút nghe.'
    }
  },
  {
    id: 'lesson-initials-easy-2',
    title: 'Bài 2 — Thanh mẫu dễ: b p m f / d t n l / g k h',
    intro: 'Thanh mẫu là phụ âm đầu của âm tiết. Nhóm dễ nhất là ba nhóm này — đọc gần giống tiếng Việt.',
    explanation: 'Nhóm môi b p m f: đọc bằng hai môi (b như "b", p bật hơi mạnh, m như "m", f như "ph"). Nhóm đầu lưỡi d t n l: đầu lưỡi chạm lợi trên (d như "t", t bật hơi mạnh, n như "n", l như "l"). Nhóm cuống lưỡi g k h: âm bật từ cuống họng (g như "c", k bật hơi mạnh, h như "h" nhưng khò khè hơn). Phân biệt cặp bật hơi / không bật hơi: b–p, d–t, g–k.',
    hanzi: 'b p m f d t n l g k h',
    pinyin: 'b p m f d t n l g k h',
    meaning: 'Nhóm thanh mẫu dễ: môi, đầu lưỡi, cuống lưỡi',
    example: { hanzi: '爸爸妈妈都很好。', pinyin: 'Bàba māma dōu hěn hǎo.', meaning: 'Bố mẹ đều rất khỏe.' },
    xp: 30,
    quiz: {
      question: 'Thanh mẫu nào sau đây thuộc nhóm môi (b p m f)?',
      options: ['b', 'd', 'g', 'j'],
      correctIndex: 0,
      whyWrong: 'b p m f là nhóm môi; d t n l là nhóm đầu lưỡi; g k h là nhóm cuống lưỡi. Hãy ôn lại Bài 2.'
    }
  },
  {
    id: 'lesson-initials-hard-3',
    title: 'Bài 3 — Thanh mẫu khó: j q x / zh ch sh r / z c s',
    intro: 'Ba nhóm này không có âm tương đương chính xác trong tiếng Việt — phải tập riêng từng nhóm.',
    explanation: 'Nhóm j q x: mặt lưỡi chạm vòm miệng, âm nhẹ và nhọn (j như "ch" nhẹ, q bật hơi, x như "s" nhẹ). Nhóm zh ch sh r: đầu lưỡi cong lên (zh như "tr" cong lưỡi, ch bật hơi, sh như "s" cong lưỡi, r rung nhẹ). Nhóm z c s: đầu lưỡi chạm răng (z như "ch" tắc, c bật hơi, s như "x"). Quy tắc quan trọng: sau j q x, chữ ü bỏ hai chấm trên chữ viết — viết ju qu xu nhưng vẫn đọc là ü.',
    hanzi: 'j q x zh ch sh r z c s',
    pinyin: 'j q x zh ch sh r z c s',
    meaning: 'Nhóm thanh mẫu khó + quy tắc ü sau j q x',
    example: { hanzi: '去学校学中文。', pinyin: 'Qù xuéxiào xué Zhōngwén.', meaning: 'Đi đến trường học tiếng Trung.' },
    xp: 30,
    quiz: {
      question: 'Sau j, q, x thì chữ ü viết thế nào?',
      options: ['Bỏ hai chấm, viết ju qu xu', 'Giữ nguyên hai chấm jü qü xü', 'Đổi thành i: ji qi xi', 'Không ghép được với j q x'],
      correctIndex: 0,
      whyWrong: 'Sau j q x, ü bỏ hai chấm trên chữ viết (ju qu xu) nhưng vẫn đọc là ü. Hãy ôn lại Bài 3.'
    }
  },
  {
    id: 'lesson-finals-4',
    title: 'Bài 4 — Vận mẫu + cấu tạo chữ Hán',
    intro: 'Vận mẫu là phần vần của âm tiết. Chữ Hán thì không ghép vần — chữ Hán ghép từ các bộ phận có nghĩa.',
    explanation: 'Vận mẫu gồm nguyên âm đơn (a o e i u ü), nguyên âm kép (ai ei ao ou, ia ie iao iou, ua uo uai uei) và vận mẫu mũi (an en ang eng ong...). Còn chữ Hán được cấu tạo từ các bộ phận: chữ 你 gồm bộ 亻 (nhân đứng, nghĩa là người) + 尔 (ngươi); chữ 好 gồm 女 (nữ, con gái) + 子 (con trẻ) — người mẹ ôm con là điều tốt đẹp. Học chữ theo bộ phận thì nhớ lâu hơn học vẹt từng nét.',
    hanzi: '你 好',
    pinyin: 'Nǐ Hǎo',
    meaning: '你 = 亻 + 尔 — 好 = 女 + 子',
    example: { hanzi: '你好！', pinyin: 'Nǐ hǎo!', meaning: 'Xin chào!' },
    xp: 30,
    quiz: {
      question: 'Chữ 好 gồm những bộ phận nào?',
      options: ['女 + 子', '亻 + 尔', '日 + 月', '木 + 木'],
      correctIndex: 0,
      whyWrong: '好 = 女 (nữ) + 子 (con): người mẹ ôm con là điều tốt đẹp. Còn 你 = 亻 (người) + 尔 (ngươi). Hãy ôn lại Bài 4.'
    }
  },
  {
    id: 'lesson-tone-change-5',
    title: 'Bài 5 — Biến điệu',
    intro: 'Thanh điệu không phải lúc nào cũng giữ nguyên khi đọc liền nhau — có lúc nó phải biến đổi.',
    explanation: 'Ba quy tắc biến điệu hay gặp nhất: (1) Hai thanh 3 liền nhau: thanh 3 đầu tiên biến thành thanh 2 — nǐ hǎo đọc thành ní hǎo. (2) 不 (bù, thanh 4) đứng trước một thanh 4 khác thì đọc thành bú — ví dụ 不是 đọc bú shì. (3) 一 (yī, thanh 1) đứng trước thanh 4 thì đọc yì, đứng trước các thanh khác thì đọc yí — ví dụ 一个 đọc yí gè, 一次 đọc yí cì. Học xong bài này, con đã nắm xong nền tảng phát âm để chào hỏi đầu tiên.',
    hanzi: 'nǐ hǎo → ní hǎo',
    pinyin: 'nǐ hǎo → ní hǎo',
    meaning: 'Hai thanh 3 liền nhau: thanh đầu biến thành thanh 2',
    example: { hanzi: '你好！不是一次，是一次。', pinyin: 'Nǐ hǎo! Bú shì yí cì, shì yí cì.', meaning: 'Xin chào! Không phải một lần, mà là một lần. (Ví dụ biến điệu: 不→bú, 一→yí)' },
    xp: 30,
    quiz: {
      question: '“nǐ hǎo” đọc thực tế như thế nào?',
      options: ['ní hǎo (thanh 3 đầu biến thành thanh 2)', 'nǐ hǎo (giữ nguyên hai thanh 3)', 'nì hǎo', 'nǐ hào'],
      correctIndex: 0,
      whyWrong: 'Hai thanh 3 liền nhau: thanh 3 đầu biến thành thanh 2, nên đọc ní hǎo. Tương tự: 不 trước thanh 4 đọc bú, 一 trước thanh 4 đọc yì. Hãy ôn lại Bài 5.'
    }
  }
];

// ---------------------------------------------------------------------------
// Từ vựng HSK 1 — phần khởi đầu theo đề cương HSK 3.0 (HSK 1 = 300 từ).
// Đây KHÔNG phải danh sách đầy đủ 300 từ đã kiểm chứng chuyên môn — chỉ
// là 36 từ vỡ lòng để chơi được; xem câu ghi rõ trong renderStudyBook.
// ---------------------------------------------------------------------------
export const VOCAB_HSK1 = [
  { hanzi: '你', pinyin: 'nǐ', meaning: 'bạn', exampleHanzi: '你好！', examplePinyin: 'Nǐ hǎo!', exampleMeaning: 'Xin chào!' },
  { hanzi: '好', pinyin: 'hǎo', meaning: 'tốt; khỏe', exampleHanzi: '你好吗？', examplePinyin: 'Nǐ hǎo ma?', exampleMeaning: 'Bạn có khỏe không?' },
  { hanzi: '我', pinyin: 'wǒ', meaning: 'tôi', exampleHanzi: '我是学生。', examplePinyin: 'Wǒ shì xuésheng.', exampleMeaning: 'Tôi là học sinh.' },
  { hanzi: '他', pinyin: 'tā', meaning: 'anh ấy; ông ấy', exampleHanzi: '他是老师。', examplePinyin: 'Tā shì lǎoshī.', exampleMeaning: 'Anh ấy là thầy giáo.' },
  { hanzi: '她', pinyin: 'tā', meaning: 'chị ấy; cô ấy', exampleHanzi: '她是学生。', examplePinyin: 'Tā shì xuésheng.', exampleMeaning: 'Chị ấy là học sinh.' },
  { hanzi: '是', pinyin: 'shì', meaning: 'là', exampleHanzi: '我是中国人。', examplePinyin: 'Wǒ shì Zhōngguó rén.', exampleMeaning: 'Tôi là người Trung Quốc.' },
  { hanzi: '的', pinyin: 'de', meaning: 'của (trợ từ sở hữu)', exampleHanzi: '我的书。', examplePinyin: 'Wǒ de shū.', exampleMeaning: 'Sách của tôi.' },
  { hanzi: '不', pinyin: 'bù', meaning: 'không', exampleHanzi: '我不是老师。', examplePinyin: 'Wǒ bú shì lǎoshī.', exampleMeaning: 'Tôi không phải là thầy giáo.' },
  { hanzi: '在', pinyin: 'zài', meaning: 'ở, tại; đang', exampleHanzi: '我在家。', examplePinyin: 'Wǒ zài jiā.', exampleMeaning: 'Tôi ở nhà.' },
  { hanzi: '有', pinyin: 'yǒu', meaning: 'có', exampleHanzi: '我有一本书。', examplePinyin: 'Wǒ yǒu yì běn shū.', exampleMeaning: 'Tôi có một cuốn sách.' },
  { hanzi: '这', pinyin: 'zhè', meaning: 'đây, này', exampleHanzi: '这是我的书。', examplePinyin: 'Zhè shì wǒ de shū.', exampleMeaning: 'Đây là sách của tôi.' },
  { hanzi: '那', pinyin: 'nà', meaning: 'đó, kia', exampleHanzi: '那是老师。', examplePinyin: 'Nà shì lǎoshī.', exampleMeaning: 'Kia là thầy giáo.' },
  { hanzi: '人', pinyin: 'rén', meaning: 'người', exampleHanzi: '中国人。', examplePinyin: 'Zhōngguó rén.', exampleMeaning: 'Người Trung Quốc.' },
  { hanzi: '大', pinyin: 'dà', meaning: 'to, lớn', exampleHanzi: '这个字很大。', examplePinyin: 'Zhège zì hěn dà.', exampleMeaning: 'Chữ này rất to.' },
  { hanzi: '小', pinyin: 'xiǎo', meaning: 'nhỏ', exampleHanzi: '小学生。', examplePinyin: 'Xiǎoxuésheng.', exampleMeaning: 'Học sinh tiểu học.' },
  { hanzi: '中', pinyin: 'zhōng', meaning: 'giữa; Trung (trong 中国)', exampleHanzi: '中国。', examplePinyin: 'Zhōngguó.', exampleMeaning: 'Trung Quốc.' },
  { hanzi: '国', pinyin: 'guó', meaning: 'nước, quốc gia', exampleHanzi: '中国很大。', examplePinyin: 'Zhōngguó hěn dà.', exampleMeaning: 'Trung Quốc rất lớn.' },
  { hanzi: '学', pinyin: 'xué', meaning: 'học', exampleHanzi: '我学中文。', examplePinyin: 'Wǒ xué Zhōngwén.', exampleMeaning: 'Tôi học tiếng Trung.' },
  { hanzi: '生', pinyin: 'shēng', meaning: 'sinh; sống (trong 学生: học sinh)', exampleHanzi: '学生。', examplePinyin: 'Xuésheng.', exampleMeaning: 'Học sinh.' },
  { hanzi: '老', pinyin: 'lǎo', meaning: 'già; (trong 老师: thầy giáo)', exampleHanzi: '老师。', examplePinyin: 'Lǎoshī.', exampleMeaning: 'Thầy giáo.' },
  { hanzi: '师', pinyin: 'shī', meaning: 'thầy (trong 老师)', exampleHanzi: '老师好！', examplePinyin: 'Lǎoshī hǎo!', exampleMeaning: 'Chào thầy ạ!' },
  { hanzi: '谢', pinyin: 'xiè', meaning: 'cảm ơn (trong 谢谢)', exampleHanzi: '谢谢！', examplePinyin: 'Xièxie!', exampleMeaning: 'Cảm ơn!' },
  { hanzi: '谢谢', pinyin: 'xièxie', meaning: 'cảm ơn', exampleHanzi: '谢谢老师！', examplePinyin: 'Xièxie lǎoshī!', exampleMeaning: 'Cảm ơn thầy ạ!' },
  { hanzi: '吗', pinyin: 'ma', meaning: '(trợ từ hỏi) ...không?', exampleHanzi: '你好吗？', examplePinyin: 'Nǐ hǎo ma?', exampleMeaning: 'Bạn có khỏe không?' },
  { hanzi: '请', pinyin: 'qǐng', meaning: 'mời; xin', exampleHanzi: '请问，你叫什么名字？', examplePinyin: 'Qǐngwèn, nǐ jiào shénme míngzi?', exampleMeaning: 'Xin hỏi, bạn tên là gì?' },
  { hanzi: '去', pinyin: 'qù', meaning: 'đi', exampleHanzi: '我去学校。', examplePinyin: 'Wǒ qù xuéxiào.', exampleMeaning: 'Tôi đi đến trường học.' },
  { hanzi: '来', pinyin: 'lái', meaning: 'đến', exampleHanzi: '你来我家。', examplePinyin: 'Nǐ lái wǒ jiā.', exampleMeaning: 'Bạn đến nhà tôi.' },
  { hanzi: '家', pinyin: 'jiā', meaning: 'nhà', exampleHanzi: '我家有五个人。', examplePinyin: 'Wǒ jiā yǒu wǔ gè rén.', exampleMeaning: 'Nhà tôi có năm người.' },
  { hanzi: '天', pinyin: 'tiān', meaning: 'ngày; trời', exampleHanzi: '今天是星期五。', examplePinyin: 'Jīntiān shì xīngqīwǔ.', exampleMeaning: 'Hôm nay là thứ Sáu.' },
  { hanzi: '今', pinyin: 'jīn', meaning: 'nay (trong 今天: hôm nay)', exampleHanzi: '今天我学中文。', examplePinyin: 'Jīntiān wǒ xué Zhōngwén.', exampleMeaning: 'Hôm nay tôi học tiếng Trung.' },
  { hanzi: '书', pinyin: 'shū', meaning: 'sách', exampleHanzi: '这是我的书。', examplePinyin: 'Zhè shì wǒ de shū.', exampleMeaning: 'Đây là sách của tôi.' },
  { hanzi: '水', pinyin: 'shuǐ', meaning: 'nước', exampleHanzi: '我要喝水。', examplePinyin: 'Wǒ yào hē shuǐ.', exampleMeaning: 'Tôi muốn uống nước.' },
  { hanzi: '山', pinyin: 'shān', meaning: 'núi', exampleHanzi: '这座山很高。', examplePinyin: 'Zhè zuò shān hěn gāo.', exampleMeaning: 'Ngọn núi này rất cao.' },
  { hanzi: '钱', pinyin: 'qián', meaning: 'tiền', exampleHanzi: '这个多少钱？', examplePinyin: 'Zhège duōshao qián?', exampleMeaning: 'Cái này bao nhiêu tiền?' },
  { hanzi: '多', pinyin: 'duō', meaning: 'nhiều', exampleHanzi: '中国人很多。', examplePinyin: 'Zhōngguó rén hěn duō.', exampleMeaning: 'Người Trung Quốc rất đông.' },
  { hanzi: '少', pinyin: 'shǎo', meaning: 'ít', exampleHanzi: '我的钱很少。', examplePinyin: 'Wǒ de qián hěn shǎo.', exampleMeaning: 'Tiền của tôi rất ít.' }
];

// ---------------------------------------------------------------------------
// Hệ thống cấp bậc khoa cử — CHỈ đổi khi đỗ thi, XP không tự lên cấp.
//  - getRank(SỐ): như cũ, tính theo ngưỡng XP (tương thích ngược + probe).
//  - getRank(OBJECT có rankIndex là số): trả cấp theo rankIndex.
//  - getRank(OBJECT chỉ có xp): tính theo ngưỡng XP cũ (để probe của
//    main.js getRank({xp:99999}) trả cấp cao nhất, rồi main.js chuyển
//    sang dùng getRank(state)).
// ---------------------------------------------------------------------------
export function getRank(input) {
  if (input && typeof input === 'object') {
    if (typeof input.rankIndex === 'number' && Number.isFinite(input.rankIndex)) {
      const index = Math.max(0, Math.min(RANKS.length - 1, Math.floor(input.rankIndex)));
      return { name: RANKS[index], index, nextXp: null };
    }
    return rankFromXp(typeof input.xp === 'number' ? input.xp : 0);
  }
  return rankFromXp(input);
}

// ---------------------------------------------------------------------------
// Lưu / tải tiến trình — localStorage key 'hanlamky_save_v1' (không đổi key).
// Tương thích ngược save cũ (chỉ có playerName/xp/completed/currentQuest):
// các trường mới nhận mặc định an toàn, save cũ không bị mất.
// ---------------------------------------------------------------------------
export function loadSave() {
  const defaults = {
    playerName: 'Học trò', xp: 0, completed: [], currentQuest: null,
    rankIndex: 0, lessonsCompleted: [], vocabStats: {}, examResults: [],
    reviewDue: {}, wrongAttempts: {}
  };
  try {
    if (typeof localStorage === 'undefined') return { ...defaults, completed: [], lessonsCompleted: [] };
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...defaults, completed: [], lessonsCompleted: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...defaults, completed: [], lessonsCompleted: [] };
    const completed = Array.isArray(parsed.completed)
      ? parsed.completed.filter((id) => typeof id === 'string')
      : [];
    // Bài học xong có thể nằm trong completed (main.js ghi q.id vào đó)
    // hoặc trong lessonsCompleted riêng — hợp nhất cả hai.
    const lessonsCompleted = Array.isArray(parsed.lessonsCompleted)
      ? parsed.lessonsCompleted.filter((id) => typeof id === 'string')
      : [];
    for (const id of completed) {
      if (id.indexOf('lesson-') === 0 && !lessonsCompleted.includes(id)) lessonsCompleted.push(id);
    }
    return {
      playerName: typeof parsed.playerName === 'string' && parsed.playerName.trim()
        ? parsed.playerName
        : defaults.playerName,
      xp: typeof parsed.xp === 'number' && Number.isFinite(parsed.xp) ? Math.max(0, Math.floor(parsed.xp)) : 0,
      completed,
      currentQuest: typeof parsed.currentQuest === 'string' || parsed.currentQuest === null
        ? parsed.currentQuest
        : null,
      rankIndex: typeof parsed.rankIndex === 'number' && Number.isFinite(parsed.rankIndex)
        ? Math.max(0, Math.min(RANKS.length - 1, Math.floor(parsed.rankIndex)))
        : 0,
      lessonsCompleted,
      vocabStats: parsed.vocabStats && typeof parsed.vocabStats === 'object' && !Array.isArray(parsed.vocabStats)
        ? parsed.vocabStats
        : {},
      examResults: Array.isArray(parsed.examResults) ? parsed.examResults : [],
      reviewDue: parsed.reviewDue && typeof parsed.reviewDue === 'object' && !Array.isArray(parsed.reviewDue)
        ? parsed.reviewDue
        : {},
      wrongAttempts: parsed.wrongAttempts && typeof parsed.wrongAttempts === 'object' && !Array.isArray(parsed.wrongAttempts)
        ? parsed.wrongAttempts
        : {}
    };
  } catch (_err) {
    return { ...defaults, completed: [], lessonsCompleted: [] };
  }
}

export function saveGame(state) {
  if (!state || typeof state !== 'object') return;
  try {
    if (typeof localStorage === 'undefined') return;
    const completed = Array.isArray(state.completed) ? state.completed : [];
    const lessonsCompleted = Array.isArray(state.lessonsCompleted) ? [...state.lessonsCompleted] : [];
    for (const id of completed) {
      if (id.indexOf('lesson-') === 0 && !lessonsCompleted.includes(id)) lessonsCompleted.push(id);
    }
    const data = {
      playerName: typeof state.playerName === 'string' ? state.playerName : 'Học trò',
      xp: typeof state.xp === 'number' && Number.isFinite(state.xp) ? Math.max(0, Math.floor(state.xp)) : 0,
      completed,
      currentQuest: typeof state.currentQuest === 'string' || state.currentQuest === null
        ? state.currentQuest
        : null,
      rankIndex: typeof state.rankIndex === 'number' && Number.isFinite(state.rankIndex)
        ? Math.max(0, Math.min(RANKS.length - 1, Math.floor(state.rankIndex)))
        : 0,
      lessonsCompleted,
      vocabStats: state.vocabStats && typeof state.vocabStats === 'object' ? state.vocabStats : {},
      examResults: Array.isArray(state.examResults) ? state.examResults : [],
      reviewDue: state.reviewDue && typeof state.reviewDue === 'object' ? state.reviewDue : {},
      wrongAttempts: state.wrongAttempts && typeof state.wrongAttempts === 'object' ? state.wrongAttempts : {}
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (_err) {
    // Không có localStorage hoặc bị chặn: bỏ qua lặng lẽ, không làm vỡ game.
  }
}

// ---------------------------------------------------------------------------
// Tiện ích nội bộ
// ---------------------------------------------------------------------------
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function lessonIdsDone(state) {
  const done = new Set();
  if (state && Array.isArray(state.lessonsCompleted)) {
    for (const id of state.lessonsCompleted) if (typeof id === 'string') done.add(id);
  }
  if (state && Array.isArray(state.completed)) {
    for (const id of state.completed) if (typeof id === 'string' && id.indexOf('lesson-') === 0) done.add(id);
  }
  return [...done];
}

function isLessonDone(state, lessonId) {
  return lessonIdsDone(state).includes(lessonId);
}

function nextLesson(state) {
  for (const lesson of LESSONS) {
    if (!isLessonDone(state, lesson.id)) return lesson;
  }
  return null;
}

// Xáo trộn 4 lựa chọn, correctIndex khớp vị trí mới sau khi xáo.
function shuffledQuiz(quiz) {
  const order = quiz.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }
  return {
    options: order.map((i) => quiz.options[i]),
    correctIndex: order.indexOf(quiz.correctIndex)
  };
}

// Đưa bài học thành dạng quest để main.js answerQuiz() xử lý như cũ
// (cộng XP, ghi completed, saveGame, updateHUD).
function lessonAsQuest(lesson) {
  const shuffled = shuffledQuiz(lesson.quiz);
  return {
    id: lesson.id,
    npc: 'teacher',
    npcId: 'teacher',
    title: lesson.title,
    hanzi: lesson.hanzi,
    pinyin: lesson.pinyin,
    meaning: lesson.meaning,
    exampleHanzi: lesson.example.hanzi,
    examplePinyin: lesson.example.pinyin,
    exampleMeaning: lesson.example.meaning,
    example: { hanzi: lesson.example.hanzi, pinyin: lesson.example.pinyin, meaning: lesson.example.meaning },
    xp: lesson.xp,
    question: lesson.quiz.question,
    options: shuffled.options,
    choices: shuffled.options,
    correctIndex: shuffled.correctIndex,
    answerIndex: shuffled.correctIndex,
    answer: lesson.quiz.options[lesson.quiz.correctIndex],
    correctAnswer: lesson.quiz.options[lesson.quiz.correctIndex]
  };
}

// ---------------------------------------------------------------------------
// Đối thoại với NPC
// Thầy đồ: ưu tiên nhiệm vụ "Chào hỏi đầu tiên" (quiz 你好 mở ngay, KHÔNG
// chặn bởi bài vỡ lòng — Vinh chốt 27/11); xong rồi mới dẫn qua từng bài
// vỡ lòng theo tiến trình cá nhân; xong hết thì chỉ chào hỏi.
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
  },
  examiner: {
    npcName: 'Quan chủ khảo',
    greetingNew: 'Đây là trường thi làng Thanh Khê. Muốn lên cấp bậc khoa cử, ngươi phải ngồi vào một bàn thi trống và đỗ kỳ thi thăng cấp — XP nhiều đến mấy cũng không tự lên cấp được.',
    greetingDone: 'Trường thi luôn mở cửa cho người ham học. Ngồi vào bàn thi trống để thi lên cấp tiếp theo.',
    hint: 'Hãy ngồi vào một bàn thi trống trong trường thi (nhấn E gần bàn) để thi thăng cấp.'
  },
  student1: {
    npcName: 'Học trò An',
    greetingNew: 'Chào bạn! Tôi cũng đang học chữ Hán với thầy đồ. Bài thanh điệu khó thật, nhưng nghe thầy đọc nhiều lần là quen thôi!',
    greetingDone: 'Chào bạn! Hôm nay bạn học được chữ mới nào chưa?',
    hint: 'Hãy trò chuyện với thầy đồ để học bài mới.'
  },
  student2: {
    npcName: 'Học trò Bình',
    greetingNew: 'Chào bạn! Tôi thích nhất bài cấu tạo chữ Hán — chữ 好 là 女 + 子, nhớ một lần là không quên được!',
    greetingDone: 'Chào bạn! Lát nữa tôi sẽ ra trường thi xem các anh thi thăng cấp.',
    hint: 'Hãy trò chuyện với thầy đồ để học bài mới.'
  },
  student3: {
    npcName: 'Học trò Cường',
    greetingNew: 'Chào bạn! Tôi vừa học xong biến điệu: nǐ hǎo đọc thành ní hǎo đấy. Bạn thử đọc xem nào!',
    greetingDone: 'Chào bạn! Có gì khó thì hỏi thầy đồ nhé, thầy giảng dễ hiểu lắm.',
    hint: 'Hãy trò chuyện với thầy đồ để học bài mới.'
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

  // Thầy đồ: nhiệm vụ chào hỏi mở ngay (không chặn); sau đó là bài vỡ lòng.
  if (npcId === 'teacher') {
    const hello = QUESTS.find((q) => q.id === 'hello');
    if (!completed.includes('hello')) {
      return { npcName: npc.npcName, greeting: npc.greetingNew, quest: hello, hint: npc.hint };
    }
    const lesson = nextLesson(state);
    if (lesson) {
      let greeting = lesson.intro + ' ' + lesson.explanation;
      const wrongCount = state && state.wrongAttempts && typeof state.wrongAttempts[lesson.id] === 'number'
        ? state.wrongAttempts[lesson.id]
        : 0;
      if (wrongCount > 0) {
        greeting = 'Lần trước con trả lời sai bài này — đừng nản, ôn lại nhé. ' +
          getWrongExplanation(lesson.id) + ' ' + greeting;
      }
      return { npcName: npc.npcName, greeting, quest: lessonAsQuest(lesson), hint: 'Nghe thầy giảng rồi trả lời câu hỏi của bài.' };
    }
    return {
      npcName: npc.npcName,
      greeting: 'Con đã học xong cả 6 bài vỡ lòng! Giờ hãy ra trường thi, ngồi vào bàn thi và đỗ kỳ thi để thăng cấp từ 学童 lên 童生 nhé.',
      quest: null,
      hint: 'Hãy vào trường thi và thi thăng cấp.'
    };
  }

  // Anh đưa thư: xong "Lời cảm ơn" thì mở thêm nhiệm vụ hỏi đường.
  if (npcId === 'courier') {
    if (!completed.includes('thanks')) {
      const q = QUESTS.find((x) => x.id === 'thanks');
      return { npcName: npc.npcName, greeting: npc.greetingNew, quest: q, hint: npc.hint };
    }
    if (!completed.includes('askway')) {
      const q = QUESTS.find((x) => x.id === 'askway');
      return {
        npcName: npc.npcName,
        greeting: 'Bạn nói “谢谢” rất lễ phép! Người đưa thư như tôi hay được hỏi đường lắm. Học thêm câu “请问，去学校怎么走？” (Qǐngwèn, qù xuéxiào zěnme zǒu?) — Xin hỏi, đi đến trường học như thế nào? — nhé.',
        quest: q,
        hint: 'Hãy nghe anh đọc “请问，去学校怎么走？” rồi chọn nghĩa đúng.'
      };
    }
    return { npcName: npc.npcName, greeting: npc.greetingDone, quest: null, hint: npc.hint };
  }

  // Quan chủ khảo và các học trò: chỉ chào hỏi, không có nhiệm vụ.
  if (npcId === 'examiner' || npcId === 'student1' || npcId === 'student2' || npcId === 'student3') {
    return { npcName: npc.npcName, greeting: npc.greetingNew, quest: null, hint: npc.hint };
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

// Giải thích lỗi sai của một bài học / nhiệm vụ (để main.js hiển thị khi
// trả lời sai — hiện main.js chỉ toast chung, nên parent cần nối hàm này
// vào nhánh sai của answerQuiz).
export function getWrongExplanation(lessonId) {
  if (typeof lessonId !== 'string') return 'Hãy nghe lại phát âm và ôn lại bài rồi thử lại nhé.';
  const lesson = LESSONS.find((l) => l.id === lessonId);
  if (lesson) return lesson.quiz.whyWrong;
  const quest = QUESTS.find((q) => q.id === lessonId);
  if (quest) return 'Đáp án đúng là “' + quest.meaning + '” (' + quest.hanzi + ' — ' + quest.pinyin + '). Hãy nghe lại phát âm rồi thử lại nhé.';
  return 'Hãy nghe lại phát âm và ôn lại bài rồi thử lại nhé.';
}

// Ghi lại một lần trả lời sai (main.js gọi ở nhánh sai của answerQuiz).
// Lần sau gặp lại thầy đồ, getDialogue sẽ nhắc lại lỗi sai đó.
export function recordWrongAnswer(state, questId) {
  if (!state || typeof state !== 'object' || typeof questId !== 'string') return 0;
  if (!state.wrongAttempts || typeof state.wrongAttempts !== 'object') state.wrongAttempts = {};
  const count = (typeof state.wrongAttempts[questId] === 'number' ? state.wrongAttempts[questId] : 0) + 1;
  state.wrongAttempts[questId] = count;
  try { saveGame(state); } catch (_err) { /* bỏ qua */ }
  return count;
}

// ---------------------------------------------------------------------------
// Phát âm tiếng Trung (SpeechSynthesis zh-CN, tốc độ 0.85, không audio ngoài)
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

// Bảng âm theo thanh điệu cho các âm tiết hay dùng. tone: 1-4, 0 hoặc 5
// là thanh nhẹ (không dấu). Trả về chuỗi đã đọc để UI hiển thị nút nghe.
const TONE_SYLLABLES = {
  ma: ['ma', 'mā', 'má', 'mǎ', 'mà', 'ma'],
  ni: ['ni', 'nī', 'ní', 'nǐ', 'nì', 'ni'],
  hao: ['hao', 'hāo', 'háo', 'hǎo', 'hào', 'hao'],
  ba: ['ba', 'bā', 'bá', 'bǎ', 'bà', 'ba'],
  bu: ['bu', 'bū', 'bú', 'bǔ', 'bù', 'bu'],
  yi: ['yi', 'yī', 'yí', 'yǐ', 'yì', 'yi']
};

export function speakTone(base, tone) {
  const key = typeof base === 'string' ? base.toLowerCase() : '';
  const row = TONE_SYLLABLES[key] || null;
  let t = typeof tone === 'number' && Number.isFinite(tone) ? Math.floor(tone) : 0;
  if (t < 0 || t > 5) t = 0;
  const word = row ? row[t] : key;
  if (word) speakChinese(word);
  return word;
}

// ---------------------------------------------------------------------------
// Thầy đồ — 3 trạng thái giảng (characters.js teacher.setMode nhận 3 giá trị
// này). Parent nối: teacher.setMode(teacherModeFor(state, lessonId)) khi
// mở hội thoại thầy.
// ---------------------------------------------------------------------------
export function teacherModeFor(state, lessonId) {
  const done = lessonIdsDone(state);
  if (typeof lessonId === 'string' && lessonId) {
    if (!done.includes(lessonId)) return 'teach'; // bài mới: đứng giảng
    if (done.length >= LESSONS.length) return 'walk'; // xong hết: đi dạo
    return 'read'; // ôn lại bài đã học: ngồi đọc sách
  }
  if (done.length >= LESSONS.length) return 'walk';
  return 'teach'; // còn bài mới: đứng giảng
}

// Chữ ghi lên bảng đen khi mở hội thoại thầy (environment.js đã có
// env.setBlackboardText(hanzi, pinyin) — parent nối khi mở hội thoại).
export function blackboardForLesson(lessonId) {
  if (typeof lessonId === 'string') {
    const lesson = LESSONS.find((l) => l.id === lessonId);
    if (lesson) return { hanzi: lesson.hanzi, pinyin: lesson.pinyin };
  }
  return { hanzi: '你好', pinyin: 'Nǐ hǎo' };
}

// ---------------------------------------------------------------------------
// Spaced repetition đơn giản cho từ vựng.
//  - Sai >= 2 lần → needsReview = true, nextReview = bây giờ + 1 ngày.
//  - Ôn đúng (từ đang cần ôn hoặc đã quá hạn) → needsReview = false,
//    nextReview = bây giờ + 3 ngày.
//  - reviewDue[hanzi] đồng bộ với nextReview để tương thích trường cũ.
// ---------------------------------------------------------------------------
export function recordWordResult(state, hanzi, correct) {
  if (!state || typeof state !== 'object' || typeof hanzi !== 'string' || !hanzi) return null;
  if (!state.vocabStats || typeof state.vocabStats !== 'object') state.vocabStats = {};
  if (!state.reviewDue || typeof state.reviewDue !== 'object') state.reviewDue = {};
  const now = Date.now();
  const prev = state.vocabStats[hanzi] && typeof state.vocabStats[hanzi] === 'object'
    ? state.vocabStats[hanzi]
    : { seen: 0, correct: 0, wrong: 0, nextReview: 0, needsReview: false };
  const stat = {
    seen: (typeof prev.seen === 'number' ? prev.seen : 0) + 1,
    correct: typeof prev.correct === 'number' ? prev.correct : 0,
    wrong: typeof prev.wrong === 'number' ? prev.wrong : 0,
    nextReview: typeof prev.nextReview === 'number' ? prev.nextReview : 0,
    needsReview: !!prev.needsReview
  };
  if (correct) {
    stat.correct += 1;
    if (stat.needsReview || (stat.nextReview && now >= stat.nextReview)) {
      stat.needsReview = false;
      stat.nextReview = now + 3 * DAY_MS; // ôn đúng: hẹn lại sau 3 ngày
    }
  } else {
    stat.wrong += 1;
    if (stat.wrong >= REVIEW_WRONG_THRESHOLD) {
      stat.needsReview = true;
      stat.nextReview = now + DAY_MS; // sai >= 2 lần: ôn lại sau 1 ngày
    }
  }
  state.vocabStats[hanzi] = stat;
  state.reviewDue[hanzi] = stat.nextReview;
  return stat;
}

// Từ cần ôn: sai >= 1 lần và (đang cần ôn hoặc đã quá hạn ôn).
export function getReviewWords(state) {
  const stats = state && state.vocabStats && typeof state.vocabStats === 'object' ? state.vocabStats : {};
  const now = Date.now();
  const out = [];
  for (const hanzi of Object.keys(stats)) {
    const s = stats[hanzi];
    if (!s || typeof s !== 'object') continue;
    const wrong = typeof s.wrong === 'number' ? s.wrong : 0;
    const due = typeof s.nextReview === 'number' ? s.nextReview : 0;
    if (wrong >= 1 && (s.needsReview || (due && now >= due))) {
      const vocab = VOCAB_HSK1.find((v) => v.hanzi === hanzi) || null;
      out.push({
        hanzi,
        pinyin: vocab ? vocab.pinyin : '',
        meaning: vocab ? vocab.meaning : '',
        seen: typeof s.seen === 'number' ? s.seen : 0,
        correct: typeof s.correct === 'number' ? s.correct : 0,
        wrong,
        nextReview: due,
        needsReview: !!s.needsReview
      });
    }
  }
  out.sort((a, b) => b.wrong - a.wrong || a.nextReview - b.nextReview);
  return out;
}

// Gợi ý bài cần ôn lại theo từ yếu nhất (dùng trong Sổ học tập + khi trượt thi).
function weakLessonFor(hanzi) {
  if (hanzi === '你' || hanzi === '好' || hanzi === '你好') return 'Bài 4 — Vận mẫu + cấu tạo chữ Hán';
  if (hanzi === '吗' || hanzi === '妈' || hanzi === '马' || hanzi === '骂' || hanzi === '麻') return 'Bài 1 — Bốn thanh điệu + thanh nhẹ';
  if (hanzi === '不' || hanzi === '一') return 'Bài 5 — Biến điệu';
  if (hanzi === '去' || hanzi === '学' || hanzi === '请') return 'Bài 3 — Thanh mẫu khó: j q x / zh ch sh r / z c s';
  return 'Bài 0–5 — Giáo trình vỡ lòng';
}

// ---------------------------------------------------------------------------
// Sổ học tập — trả về chuỗi HTML
// ---------------------------------------------------------------------------
export function renderStudyBook(state) {
  const safe = state && typeof state === 'object' ? state : {};
  const completed = Array.isArray(safe.completed) ? safe.completed : [];
  const rank = getRank(safe);
  const reviewWords = getReviewWords(safe);
  const stats = safe.vocabStats && typeof safe.vocabStats === 'object' ? safe.vocabStats : {};

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

  // Giáo trình vỡ lòng Bài 0–5 (bài học tự chọn, không chặn quiz 你好).
  const lessonItems = LESSONS.map((lesson) => {
    const done = isLessonDone(safe, lesson.id);
    const status = done ? 'Đã học xong' : 'Chưa học';
    let tonesHtml = '';
    if (Array.isArray(lesson.tones)) {
      tonesHtml = '<p class="study-tones">Nghe từng thanh: ' +
        lesson.tones.map((t) => '<button type="button" class="tone-btn" data-tone-base="' + escapeHtml(t.base || 'ma') + '" data-tone="' + (typeof t.tone === 'number' ? t.tone : 0) + '">🔊 ' + escapeHtml(t.syllable) + ' (' + escapeHtml(t.hanzi) + ' — ' + escapeHtml(t.meaning) + ')</button>').join(' ') +
        '</p>';
    }
    return (
      '<article class="study-item' + (done ? ' study-item--done' : '') + '">' +
      '<h3>' + escapeHtml(lesson.title) + ' — ' + status + '</h3>' +
      '<p>' + escapeHtml(lesson.explanation) + '</p>' +
      '<p class="study-hanzi">' + escapeHtml(lesson.hanzi) + '</p>' +
      '<p class="study-pinyin">' + escapeHtml(lesson.pinyin) + '</p>' +
      '<p class="study-meaning">Nghĩa: ' + escapeHtml(lesson.meaning) + '</p>' +
      tonesHtml +
      '<p class="study-example">Ví dụ: ' + escapeHtml(lesson.example.hanzi) + ' (' + escapeHtml(lesson.example.pinyin) + ') — ' + escapeHtml(lesson.example.meaning) + '</p>' +
      '<p class="study-question">Câu hỏi ôn tập: ' + escapeHtml(lesson.quiz.question) + '</p>' +
      '<p class="study-xp">Làm đúng với thầy đồ: +' + lesson.xp + ' XP</p>' +
      '</article>'
    );
  }).join('\n');

  // Từ đã học (kèm số lần đúng/sai) — từ vocabStats.
  const learnedKeys = Object.keys(stats);
  const learnedHtml = learnedKeys.length === 0
    ? '<p>Chưa có từ nào được ghi nhận — hãy gặp thầy đồ, làm bài và trả lời câu hỏi để bắt đầu ghi nhận từ vựng.</p>'
    : '<ul>' + learnedKeys.map((hanzi) => {
      const s = stats[hanzi];
      const vocab = VOCAB_HSK1.find((v) => v.hanzi === hanzi) || null;
      const seen = s && typeof s.seen === 'number' ? s.seen : 0;
      const correct = s && typeof s.correct === 'number' ? s.correct : 0;
      const wrong = s && typeof s.wrong === 'number' ? s.wrong : 0;
      const label = vocab ? escapeHtml(vocab.pinyin) + ' — ' + escapeHtml(vocab.meaning) : '';
      return '<li>' + escapeHtml(hanzi) + ' ' + label + ' (đúng ' + correct + ' / sai ' + wrong + ' / gặp ' + seen + ' lần)</li>';
    }).join('') + '</ul>';

  const reviewHtml = reviewWords.length === 0
    ? '<p>Không có từ nào cần ôn ngay lúc này.</p>'
    : '<ul>' + reviewWords.map((w) =>
      '<li>' + escapeHtml(w.hanzi) + ' ' + escapeHtml(w.pinyin) + ' — ' + escapeHtml(w.meaning) +
      ' (sai ' + w.wrong + ' lần)' + (w.needsReview ? ' — cần ôn' : ' — đã quá hạn ôn') + '</li>'
    ).join('') + '</ul>';

  // Điểm yếu: 3 từ sai nhiều nhất + gợi ý bài cần ôn lại.
  const weakest = Object.keys(stats)
    .map((hanzi) => ({ hanzi, wrong: typeof stats[hanzi].wrong === 'number' ? stats[hanzi].wrong : 0 }))
    .filter((w) => w.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 3);
  const weakHtml = weakest.length === 0
    ? '<p>Chưa phát hiện điểm yếu — cứ tiếp tục học, sổ sẽ ghi lại từ nào con hay sai.</p>'
    : '<ul>' + weakest.map((w) => {
      const vocab = VOCAB_HSK1.find((v) => v.hanzi === w.hanzi) || null;
      return '<li>' + escapeHtml(w.hanzi) + ' ' + (vocab ? escapeHtml(vocab.pinyin) + ' — ' + escapeHtml(vocab.meaning) : '') +
        ' (sai ' + w.wrong + ' lần) — nên ôn lại: ' + escapeHtml(weakLessonFor(w.hanzi)) + '</li>';
    }).join('') + '</ul>';

  const hskLevelsHtml = '<ul>' + HSK_LEVELS_3_0.map((l) =>
    '<li>HSK ' + l.level + ' — ' + l.words.toLocaleString('vi-VN') + ' từ</li>'
  ).join('') + '</ul>';

  return (
    '<section class="study-book">' +
    '<h2>Sổ học tập</h2>' +
    '<p>Cấp bậc khoa cử hiện tại: ' + escapeHtml(rank.name) + ' (XP: ' + (typeof safe.xp === 'number' ? safe.xp : 0) + ')</p>' +
    '<p><strong>Muốn lên cấp, phải vào trường thi và đậu kỳ thi thăng cấp — XP không tự lên cấp.</strong></p>' +
    '<h3>Chuẩn ' + escapeHtml(HSK_VERSION) + '</h3>' +
    '<p>Giáo trình trong game theo chuẩn ' + escapeHtml(HSK_VERSION) + ' (không đánh đồng với HSK 2.0).</p>' +
    hskLevelsHtml +
    '<p>Nội dung HSK 1 đang theo đề cương ' + escapeHtml(HSK_VERSION) + ', chưa phải danh sách đầy đủ đã kiểm chứng chuyên môn.</p>' +
    '<p>HSK 6 là mục tiêu năng lực; danh hiệu Trạng nguyên là kết quả Điện thí trong game, hai hệ thống riêng biệt.</p>' +
    '<h3>Giáo trình vỡ lòng (tự chọn — gặp thầy đồ để làm bài kiểm tra từng bài)</h3>' +
    lessonItems +
    '<h3>Nhiệm vụ</h3>' +
    items +
    '<h3>Từ đã học (' + escapeHtml(HSK_VERSION) + ' — phần khởi đầu, ' + VOCAB_HSK1.length + ' từ trong game)</h3>' +
    learnedHtml +
    '<h3>Từ cần ôn</h3>' +
    reviewHtml +
    '<h3>Điểm yếu</h3>' +
    weakHtml +
    '<div class="font-test">' +
    '<p>Tiếng Việt đầy đủ dấu: ă â ê ô ơ ư đ. Hành trình học tập bắt đầu từ những chữ cái đầu tiên.</p>' +
    '<p>你好！欢迎来到汉林记。我要学习中文。谢谢老师！</p>' +
    '<p>Nǐ hǎo! Huānyíng lái dào Hàn Lín Jì. Wǒ yào xuéxí Zhōngwén. Xièxie lǎoshī!</p>' +
    '</div>' +
    '</section>'
  );
}

// ---------------------------------------------------------------------------
// HUD — không vỡ khi state thiếu trường mới (mọi trường đều có mặc định).
// ---------------------------------------------------------------------------
export function updateHUD(state) {
  try {
    if (typeof document === 'undefined') return;
    const safe = state && typeof state === 'object' ? state : {};
    const xp = typeof safe.xp === 'number' && Number.isFinite(safe.xp) ? Math.max(0, Math.floor(safe.xp)) : 0;
    const completed = Array.isArray(safe.completed) ? safe.completed : [];
    const rank = getRank(safe);

    const nameEl = document.getElementById('hud-name');
    if (nameEl) nameEl.textContent = typeof safe.playerName === 'string' && safe.playerName ? safe.playerName : 'Học trò';

    const rankEl = document.getElementById('hud-rank');
    if (rankEl) rankEl.textContent = rank.name;

    const xpEl = document.getElementById('hud-xp');
    if (xpEl) xpEl.textContent = 'XP: ' + xp;

    const fillEl = document.getElementById('xp-fill');
    if (fillEl) {
      // Cấp theo rankIndex thì không có ngưỡng XP tiếp theo: thanh đầy.
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

// ---------------------------------------------------------------------------
// Thi thăng cấp trong trường thi.
//  - buildExam(state, targetRank): tạo đề thi cho cấp mục tiêu.
//  - gradeExam(state, answers[, exam]): chấm bài; đậu (>= 4/5) thì
//    rankIndex + 1, trượt thì giữ nguyên cấp và gợi ý ôn tập.
//  - sitAtExamDesk(desk): mở overlay thi cho cấp TIẾP THEO.
//  XP một mình KHÔNG đủ lên cấp — chỉ có đỗ thi mới thăng cấp.
// ---------------------------------------------------------------------------
export const EXAM_TOTAL_QUESTIONS = 5;
export const EXAM_PASS_MARK = 4;

let currentExam = null;

function shuffleArray(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
}

// Câu hỏi nghĩa của một từ vựng: 4 lựa chọn nghĩa tiếng Việt.
function vocabMeaningQuestion(word) {
  const distractors = shuffleArray(VOCAB_HSK1.filter((v) => v.hanzi !== word.hanzi))
    .slice(0, 3)
    .map((v) => v.meaning);
  const options = shuffleArray([word.meaning, ...distractors]);
  return {
    question: word.hanzi + ' (' + word.pinyin + ') — Từ này có nghĩa là gì?',
    options,
    correctIndex: options.indexOf(word.meaning),
    explain: word.hanzi + ' (' + word.pinyin + ') nghĩa là “' + word.meaning + '”. Ví dụ: ' + word.exampleHanzi + ' (' + word.examplePinyin + ') — ' + word.exampleMeaning,
    source: 'Từ vựng HSK 1 (' + HSK_VERSION + ')',
    sourceHanzi: word.hanzi
  };
}

function lessonExamQuestion(lesson) {
  const shuffled = shuffledQuiz(lesson.quiz);
  return {
    question: lesson.quiz.question,
    options: shuffled.options,
    correctIndex: shuffled.correctIndex,
    explain: lesson.quiz.whyWrong,
    source: lesson.title,
    sourceHanzi: lesson.hanzi
  };
}

function questExamQuestion(quest) {
  const distractors = shuffleArray(QUESTS.filter((q) => q.id !== quest.id)).slice(0, 3).map((q) => q.meaning);
  const options = shuffleArray([quest.meaning, ...distractors]);
  return {
    question: quest.hanzi + ' (' + quest.pinyin + ') — Câu này có nghĩa là gì?',
    options,
    correctIndex: options.indexOf(quest.meaning),
    explain: quest.hanzi + ' (' + quest.pinyin + ') nghĩa là “' + quest.meaning + '”. Ví dụ: ' + quest.exampleHanzi + ' (' + quest.examplePinyin + ') — ' + quest.exampleMeaning,
    source: 'Nhiệm vụ: ' + quest.title,
    sourceHanzi: quest.hanzi
  };
}

export function buildExam(state, targetRank) {
  const safe = state && typeof state === 'object' ? state : {};
  const currentRankIndex = typeof safe.rankIndex === 'number' && Number.isFinite(safe.rankIndex)
    ? Math.max(0, Math.min(RANKS.length - 1, Math.floor(safe.rankIndex)))
    : 0;
  let targetIndex;
  if (typeof targetRank === 'number' && Number.isFinite(targetRank)) {
    targetIndex = Math.max(0, Math.min(RANKS.length - 1, Math.floor(targetRank)));
  } else if (typeof targetRank === 'string') {
    const found = RANKS.indexOf(targetRank);
    targetIndex = found >= 0 ? found : Math.min(currentRankIndex + 1, RANKS.length - 1);
  } else {
    targetIndex = Math.min(currentRankIndex + 1, RANKS.length - 1);
  }

  const pool = [];
  const seenKeys = new Set();
  const add = (q) => {
    const key = q.question;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    pool.push(q);
  };

  // Ưu tiên câu từ bài học + từ vựng ĐÃ học (lessonsCompleted/completed, vocabStats).
  for (const lesson of LESSONS) {
    if (isLessonDone(safe, lesson.id)) add(lessonExamQuestion(lesson));
  }
  const stats = safe.vocabStats && typeof safe.vocabStats === 'object' ? safe.vocabStats : {};
  for (const hanzi of Object.keys(stats)) {
    const word = VOCAB_HSK1.find((v) => v.hanzi === hanzi);
    if (word) add(vocabMeaningQuestion(word));
  }
  const completed = Array.isArray(safe.completed) ? safe.completed : [];
  for (const quest of QUESTS) {
    if (completed.includes(quest.id)) add(questExamQuestion(quest));
  }
  // Chưa đủ 5 câu thì bổ sung từ toàn bộ bài học + từ vựng HSK 1.
  if (pool.length < EXAM_TOTAL_QUESTIONS) {
    for (const lesson of LESSONS) add(lessonExamQuestion(lesson));
  }
  if (pool.length < EXAM_TOTAL_QUESTIONS) {
    for (const word of VOCAB_HSK1) {
      add(vocabMeaningQuestion(word));
      if (pool.length >= EXAM_TOTAL_QUESTIONS) break;
    }
  }

  const questions = shuffleArray(pool).slice(0, EXAM_TOTAL_QUESTIONS);
  const exam = {
    targetRank: RANKS[targetIndex],
    targetRankIndex: targetIndex,
    questions,
    passMark: EXAM_PASS_MARK,
    total: questions.length
  };
  currentExam = exam;
  return exam;
}

export function gradeExam(state, answers, exam) {
  const safe = state && typeof state === 'object' ? state : {};
  const usedExam = exam && Array.isArray(exam.questions)
    ? exam
    : (currentExam && Array.isArray(currentExam.questions) ? currentExam : buildExam(safe));
  const chosen = Array.isArray(answers) ? answers : [];
  let score = 0;
  const results = usedExam.questions.map((q, i) => {
    const chosenIndex = typeof chosen[i] === 'number' ? chosen[i] : -1;
    const correct = chosenIndex === q.correctIndex;
    if (correct) score += 1;
    if (q.sourceHanzi) {
      try { recordWordResult(safe, q.sourceHanzi, correct); } catch (_err) { /* bỏ qua */ }
    }
    return {
      question: q.question,
      options: q.options,
      chosenIndex,
      chosen: chosenIndex >= 0 && chosenIndex < q.options.length ? q.options[chosenIndex] : null,
      correctIndex: q.correctIndex,
      correctAnswer: q.options[q.correctIndex],
      correct,
      explain: q.explain || '',
      source: q.source || ''
    };
  });
  const passed = score >= usedExam.passMark;
  const currentRankIndex = typeof safe.rankIndex === 'number' && Number.isFinite(safe.rankIndex)
    ? Math.max(0, Math.min(RANKS.length - 1, Math.floor(safe.rankIndex)))
    : 0;
  let newRankIndex = currentRankIndex;
  if (passed && usedExam.targetRankIndex === currentRankIndex + 1) {
    newRankIndex = Math.min(currentRankIndex + 1, RANKS.length - 1);
    safe.rankIndex = newRankIndex;
  }
  if (!Array.isArray(safe.examResults)) safe.examResults = [];
  safe.examResults.push({
    targetRank: usedExam.targetRank,
    targetRankIndex: usedExam.targetRankIndex,
    score,
    total: usedExam.questions.length,
    passed,
    date: Date.now()
  });
  try { saveGame(safe); } catch (_err) { /* bỏ qua */ }
  try { updateHUD(safe); } catch (_err) { /* bỏ qua */ }
  try {
    if (passed) {
      showToast('Chúc mừng! Con đã đỗ kỳ thi, thăng cấp lên ' + RANKS[newRankIndex] + '!');
    } else {
      showToast('Chưa đỗ kỳ thi (' + score + '/' + usedExam.questions.length + '). Hãy ôn tập rồi thi lại nhé!');
    }
  } catch (_err) { /* bỏ qua */ }
  try {
    if (typeof window !== 'undefined' && window.dispatchEvent && typeof window.CustomEvent === 'function') {
      window.dispatchEvent(new window.CustomEvent('hanlamky:exam-done', {
        detail: { rankIndex: newRankIndex, passed, score, total: usedExam.questions.length }
      }));
    }
  } catch (_err) { /* bỏ qua */ }
  return {
    passed,
    score,
    total: usedExam.questions.length,
    passMark: usedExam.passMark,
    targetRank: usedExam.targetRank,
    targetRankIndex: usedExam.targetRankIndex,
    newRankIndex,
    results,
    reviewWords: getReviewWords(safe),
    reviewLessons: results.filter((r) => !r.correct).map((r) => r.source).filter((v, i, a) => a.indexOf(v) === i)
  };
}

// Ngồi vào bàn thi: mở overlay thi cho cấp tiếp theo. desk là tham chiếu
// từ env.examDesks nên gán desk.occupied trực tiếp. Mọi thao tác DOM đều
// try/catch — thiếu DOM thì trả false, không throw, không chiếm bàn.
export function sitAtExamDesk(desk) {
  try {
    if (!desk || typeof desk !== 'object') return false;
    if (desk.occupied) {
      showToast('Bàn thi này đã có người ngồi.');
      return false;
    }
    if (typeof document === 'undefined' || !document.body || typeof document.createElement !== 'function') {
      return false; // Không có DOM đầy đủ: không chiếm bàn, không throw.
    }
    const examState = loadSave();
    const rankIndex = typeof examState.rankIndex === 'number' ? examState.rankIndex : 0;
    if (rankIndex >= RANKS.length - 1) {
      showToast('Con đã đạt cấp cao nhất: ' + RANKS[RANKS.length - 1] + '!');
      return false;
    }
    desk.occupied = true;

    // Dọn panel cũ nếu còn sót.
    try {
      const old = document.getElementById('exam-panel');
      if (old && old.parentNode && typeof old.parentNode.removeChild === 'function') old.parentNode.removeChild(old);
    } catch (_err) { /* bỏ qua */ }

    const panel = document.createElement('div');
    panel.id = 'exam-panel';
    try { panel.className = 'panel'; } catch (_err) { /* bỏ qua */ }
    const body = document.createElement('div');
    try { panel.appendChild(body); } catch (_err) { /* bỏ qua */ }
    try { document.body.appendChild(panel); } catch (_err) {
      desk.occupied = false;
      return false;
    }

    const closeExam = () => {
      try {
        if (panel.parentNode && typeof panel.parentNode.removeChild === 'function') panel.parentNode.removeChild(panel);
      } catch (_err) { /* bỏ qua */ }
      desk.occupied = false;
    };

    const makeButton = (label, onClick) => {
      const b = document.createElement('button');
      try { b.type = 'button'; } catch (_err) { /* bỏ qua */ }
      try { b.textContent = label; } catch (_err) { /* bỏ qua */ }
      try { b.addEventListener('click', onClick); } catch (_err) { /* bỏ qua */ }
      return b;
    };

    const renderQuestions = (exam) => {
      const selections = new Array(exam.questions.length).fill(-1);
      try { body.innerHTML = ''; } catch (_err) { /* bỏ qua */ }
      const title = document.createElement('h2');
      try { title.textContent = 'Kỳ thi thăng cấp — ' + exam.targetRank; } catch (_err) { /* bỏ qua */ }
      try { body.appendChild(title); } catch (_err) { /* bỏ qua */ }
      const note = document.createElement('p');
      try {
        note.textContent = 'Trả lời đúng ít nhất ' + exam.passMark + '/' + exam.questions.length +
          ' câu để thăng cấp lên ' + exam.targetRank + '. Đạt ' + exam.passMark + ' câu trở lên mới đậu — XP không tự lên cấp.';
      } catch (_err) { /* bỏ qua */ }
      try { body.appendChild(note); } catch (_err) { /* bỏ qua */ }

      const optionRows = [];
      exam.questions.forEach((q, qi) => {
        const qEl = document.createElement('p');
        try { qEl.textContent = (qi + 1) + '. ' + q.question; } catch (_err) { /* bỏ qua */ }
        try { body.appendChild(qEl); } catch (_err) { /* bỏ qua */ }
        const row = [];
        q.options.forEach((opt, oi) => {
          const btn = makeButton(opt, () => {
            selections[qi] = oi;
            row.forEach((rb, rbi) => {
              try {
                if (rb.classList && typeof rb.classList.toggle === 'function') rb.classList.toggle('selected', rbi === oi);
              } catch (_err) { /* bỏ qua */ }
            });
          });
          row.push(btn);
          try { body.appendChild(btn); } catch (_err) { /* bỏ qua */ }
        });
        optionRows.push(row);
      });

      const submitBtn = makeButton('Nộp bài', () => {
        let grade;
        try {
          grade = gradeExam(examState, selections, exam);
        } catch (_err) {
          return; // chấm lỗi: giữ nguyên overlay, không vỡ game
        }
        renderResult(grade, exam);
      });
      try { body.appendChild(submitBtn); } catch (_err) { /* bỏ qua */ }
      const closeBtn = makeButton('Đóng', closeExam);
      try { body.appendChild(closeBtn); } catch (_err) { /* bỏ qua */ }
    };

    const renderResult = (grade, exam) => {
      try { body.innerHTML = ''; } catch (_err) { /* bỏ qua */ }
      const title = document.createElement('h2');
      try {
        title.textContent = grade.passed
          ? 'Đỗ! Thăng cấp lên ' + RANKS[grade.newRankIndex] + ' (' + grade.score + '/' + grade.total + ')'
          : 'Chưa đỗ (' + grade.score + '/' + grade.total + ') — cần ' + grade.passMark + '/' + grade.total + ' câu đúng';
      } catch (_err) { /* bỏ qua */ }
      try { body.appendChild(title); } catch (_err) { /* bỏ qua */ }
      grade.results.forEach((r, i) => {
        const line = document.createElement('p');
        try {
          line.textContent = (i + 1) + '. ' + r.question + ' — ' +
            (r.correct ? 'Đúng' : 'Sai (con chọn: ' + (r.chosen === null ? 'chưa chọn' : r.chosen) + '; đáp án: ' + r.correctAnswer + ')') +
            ' — ' + r.explain;
        } catch (_err) { /* bỏ qua */ }
        try { body.appendChild(line); } catch (_err) { /* bỏ qua */ }
      });
      if (!grade.passed) {
        const tip = document.createElement('p');
        try {
          const words = grade.reviewWords.length > 0
            ? 'Từ cần ôn: ' + grade.reviewWords.map((w) => w.hanzi + ' (' + w.pinyin + ')').join(', ') + '. '
            : '';
          const lessons = grade.reviewLessons.length > 0
            ? 'Bài cần ôn lại: ' + grade.reviewLessons.join('; ') + '.'
            : 'Hãy ôn lại các bài vỡ lòng trong Sổ học tập.';
          tip.textContent = words + lessons;
        } catch (_err) { /* bỏ qua */ }
        try { body.appendChild(tip); } catch (_err) { /* bỏ qua */ }
        const retryBtn = makeButton('Thi lại', () => {
          try {
            renderQuestions(buildExam(examState));
          } catch (_err) { /* bỏ qua */ }
        });
        try { body.appendChild(retryBtn); } catch (_err) { /* bỏ qua */ }
      }
      const closeBtn = makeButton('Đóng', closeExam);
      try { body.appendChild(closeBtn); } catch (_err) { /* bỏ qua */ }
    };

    try {
      renderQuestions(buildExam(examState));
    } catch (_err) {
      desk.occupied = false;
      return false;
    }
    return true;
  } catch (_err) {
    try { if (desk && typeof desk === 'object') desk.occupied = false; } catch (_e2) { /* bỏ qua */ }
    return false;
  }
}
