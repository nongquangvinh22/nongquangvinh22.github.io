// Hán Lâm Ký (汉林记) — Lớp Luyện chữ (calligraphy.js)
// Module A3: tự chứa toàn bộ UI + logic luyện viết chữ Hán.
// KHÔNG phụ thuộc hàm toàn cục nào của game, không dùng thư viện ngoài.
// Giao tiếp với game DUY NHẤT qua:
//   openCalligraphy(state, opts)
//     state: object lưu game (tiến trình ghi vào state.calligraphy)
//     opts:  { onAwardXP(xp), onSave(), onClose() } — mọi callback đều tùy chọn.
// Tiến trình lưu dạng:
//   state.calligraphy = { [hanzi]: { attempts, best (0–100), last, done } }
// Module KHÔNG tự ghi localStorage; game lưu qua opts.onSave().
// © Nông Quang Vinh

// ---------------------------------------------------------------------------
// 1. DỮ LIỆU CHỮ — tự biên soạn, kiểm tra chéo số nét / thứ tự nét chuẩn.
//    Tọa độ trong khung 0–100, y tăng xuống dưới (như canvas).
//    Mỗi nét: { name, pts } — pts là polyline [[x, y], ...].
//    LƯU Ý TRUNG THỰC: tọa độ là đường nét "mẫu gợi ý" vẽ tay theo thứ tự
//    nét chuẩn, KHÔNG phải font chữ vector chuyên nghiệp. Số nét và thứ tự
//    nét đã kiểm tra chéo với kiến thức chuẩn; tọa độ chỉ gần đúng hình chữ.
//    Các chữ phức tạp (谢, 师) có hình mẫu đơn giản hóa — xem báo cáo.
// ---------------------------------------------------------------------------

export const CALLIGRAPHY_CHARS = [
  {
    hanzi: '人', pinyin: 'rén', meaning: 'người', strokes: [
      { name: '撇', pts: [[55, 14], [42, 45], [28, 84]] },
      { name: '捺', pts: [[46, 34], [62, 58], [82, 86]] }
    ]
  },
  {
    hanzi: '大', pinyin: 'dà', meaning: 'to, lớn', strokes: [
      { name: '横', pts: [[20, 30], [50, 30], [80, 30]] },
      { name: '撇', pts: [[50, 14], [38, 48], [24, 86]] },
      { name: '捺', pts: [[50, 34], [64, 58], [82, 86]] }
    ]
  },
  {
    hanzi: '小', pinyin: 'xiǎo', meaning: 'nhỏ', strokes: [
      { name: '竖钩', pts: [[50, 14], [50, 55], [50, 74], [58, 82]] },
      { name: '点', pts: [[32, 34], [25, 46], [20, 56]] },
      { name: '点', pts: [[68, 34], [75, 46], [80, 56]] }
    ]
  },
  {
    hanzi: '山', pinyin: 'shān', meaning: 'núi', strokes: [
      { name: '竖', pts: [[24, 20], [24, 50], [24, 80]] },
      { name: '竖折', pts: [[48, 18], [48, 52], [74, 52], [74, 80]] },
      { name: '竖', pts: [[74, 20], [74, 50], [74, 80]] }
    ]
  },
  {
    hanzi: '水', pinyin: 'shuǐ', meaning: 'nước', strokes: [
      { name: '竖钩', pts: [[50, 12], [50, 45], [50, 68], [58, 76]] },
      { name: '横撇', pts: [[28, 32], [52, 32], [40, 50], [28, 68]] },
      { name: '撇', pts: [[56, 44], [46, 58], [36, 74]] },
      { name: '捺', pts: [[58, 46], [70, 60], [82, 78]] }
    ]
  },
  {
    hanzi: '日', pinyin: 'rì', meaning: 'mặt trời; ngày', strokes: [
      { name: '竖', pts: [[26, 20], [26, 50], [26, 80]] },
      { name: '横折', pts: [[26, 20], [74, 20], [74, 80]] },
      { name: '横', pts: [[26, 50], [74, 50]] },
      { name: '横', pts: [[26, 80], [74, 80]] }
    ]
  },
  {
    hanzi: '月', pinyin: 'yuè', meaning: 'mặt trăng; tháng', strokes: [
      { name: '撇', pts: [[52, 14], [38, 45], [24, 78]] },
      { name: '横折', pts: [[26, 26], [74, 26], [74, 80]] },
      { name: '横', pts: [[28, 50], [72, 50]] },
      { name: '横', pts: [[28, 80], [72, 80]] }
    ]
  },
  {
    hanzi: '木', pinyin: 'mù', meaning: 'cây; gỗ', strokes: [
      { name: '横', pts: [[20, 30], [50, 30], [80, 30]] },
      { name: '竖', pts: [[50, 14], [50, 50], [50, 86]] },
      { name: '撇', pts: [[50, 34], [38, 58], [24, 82]] },
      { name: '捺', pts: [[50, 34], [64, 58], [80, 82]] }
    ]
  },
  {
    hanzi: '中', pinyin: 'zhōng', meaning: 'giữa; trung', strokes: [
      { name: '竖', pts: [[30, 26], [30, 50], [30, 74]] },
      { name: '横折', pts: [[30, 26], [70, 26], [70, 74]] },
      { name: '横', pts: [[30, 74], [70, 74]] },
      { name: '竖', pts: [[50, 10], [50, 50], [50, 90]] }
    ]
  },
  {
    hanzi: '文', pinyin: 'wén', meaning: 'văn; chữ', strokes: [
      { name: '点', pts: [[50, 12], [48, 20], [44, 26]] },
      { name: '横', pts: [[24, 30], [50, 30], [76, 30]] },
      { name: '撇', pts: [[50, 30], [38, 56], [24, 82]] },
      { name: '捺', pts: [[50, 34], [64, 58], [80, 82]] }
    ]
  },
  {
    hanzi: '你', pinyin: 'nǐ', meaning: 'bạn', strokes: [
      { name: '撇', pts: [[36, 12], [26, 32], [16, 54]] },
      { name: '竖', pts: [[30, 30], [30, 52], [30, 74]] },
      { name: '撇', pts: [[62, 12], [50, 26], [38, 42]] },
      { name: '横撇', pts: [[44, 42], [70, 42], [58, 52], [50, 62]] },
      { name: '竖钩', pts: [[63, 44], [63, 68], [63, 80], [53, 88]] },
      { name: '撇', pts: [[56, 62], [46, 72], [36, 84]] },
      { name: '点', pts: [[72, 66], [77, 73], [82, 80]] }
    ]
  },
  {
    hanzi: '好', pinyin: 'hǎo', meaning: 'tốt; khỏe', strokes: [
      { name: '撇', pts: [[32, 12], [24, 26], [16, 40]] },
      { name: '横撇', pts: [[24, 40], [46, 40], [36, 52], [30, 62]] },
      { name: '横', pts: [[14, 62], [32, 62], [50, 62]] },
      { name: '横撇', pts: [[56, 20], [80, 20], [68, 34], [60, 46]] },
      { name: '竖钩', pts: [[68, 34], [68, 60], [68, 76], [58, 84]] },
      { name: '横', pts: [[54, 84], [68, 84], [84, 84]] }
    ]
  },
  {
    hanzi: '学', pinyin: 'xué', meaning: 'học', strokes: [
      { name: '点', pts: [[42, 12], [39, 17], [36, 22]] },
      { name: '横撇', pts: [[44, 18], [70, 18], [58, 28], [50, 40]] },
      { name: '点', pts: [[68, 28], [71, 33], [74, 38]] },
      { name: '横', pts: [[28, 48], [50, 48], [72, 48]] },
      { name: '横', pts: [[30, 60], [50, 60], [70, 60]] },
      { name: '撇', pts: [[50, 60], [38, 72], [26, 86]] },
      { name: '横撇', pts: [[44, 72], [72, 72], [62, 80], [56, 88]] },
      { name: '捺', pts: [[50, 72], [66, 80], [82, 88]] }
    ]
  },
  {
    hanzi: '老', pinyin: 'lǎo', meaning: 'già; thầy (kính)', strokes: [
      { name: '横', pts: [[24, 20], [50, 20], [76, 20]] },
      { name: '竖', pts: [[50, 20], [50, 34], [50, 46]] },
      { name: '提', pts: [[32, 46], [58, 46], [70, 38]] },
      { name: '撇', pts: [[56, 50], [48, 56], [40, 62]] },
      { name: '撇', pts: [[58, 54], [44, 70], [28, 88]] },
      { name: '捺', pts: [[48, 60], [66, 74], [82, 88]] }
    ]
  },
  {
    hanzi: '师', pinyin: 'shī', meaning: 'thầy', strokes: [
      { name: '撇', pts: [[34, 10], [26, 26], [18, 44]] },
      { name: '竖', pts: [[32, 28], [32, 44], [32, 58]] },
      { name: '横折钩', pts: [[20, 58], [52, 58], [52, 76], [44, 84]] },
      { name: '横', pts: [[48, 16], [66, 16], [84, 16]] },
      { name: '竖', pts: [[60, 16], [60, 30], [60, 44]] },
      { name: '横折钩', pts: [[52, 44], [80, 44], [80, 66], [72, 72]] },
      { name: '点', pts: [[64, 52], [68, 58], [72, 64]] },
      { name: '竖', pts: [[62, 70], [62, 80], [62, 90]] },
      { name: '横折', pts: [[54, 90], [78, 90], [78, 96]] },
      { name: '横', pts: [[50, 96], [66, 96], [82, 96]] }
    ]
  },
  {
    hanzi: '谢', pinyin: 'xiè', meaning: 'cảm ơn', strokes: [
      { name: '点', pts: [[18, 16], [15, 22], [12, 28]] },
      { name: '横折提', pts: [[20, 30], [36, 30], [36, 46], [48, 36]] },
      { name: '撇', pts: [[66, 10], [58, 20], [50, 32]] },
      { name: '横', pts: [[52, 34], [67, 34], [82, 34]] },
      { name: '横', pts: [[54, 44], [67, 44], [80, 44]] },
      { name: '横折钩', pts: [[52, 54], [82, 54], [82, 76], [72, 82]] },
      { name: '横', pts: [[58, 62], [67, 62], [76, 62]] },
      { name: '横', pts: [[58, 70], [67, 70], [76, 70]] },
      { name: '竖钩', pts: [[64, 56], [64, 70], [64, 80], [56, 86]] },
      { name: '点', pts: [[76, 58], [79, 63], [82, 68]] },
      { name: '横', pts: [[56, 74], [71, 74], [86, 74]] },
      { name: '竖钩', pts: [[70, 70], [70, 84], [70, 92], [60, 98]] }
    ]
  }
];

// ---------------------------------------------------------------------------
// 2. CHẤM ĐIỂM (heuristic — KHÔNG phải nhận dạng chữ chuyên nghiệp)
//    Xem gradeStrokes() để biết công thức đầy đủ. Tóm tắt:
//      shape 40% + direction 20% + order 20% + count 20%  →  0–100, đỗ ≥ 70.
// ---------------------------------------------------------------------------

export const PASS_SCORE = 70;          // Ngưỡng đỗ
export const XP_FIRST_PASS = 10;       // Đỗ lần đầu một chữ
export const XP_IMPROVED_PASS = 5;     // Đỗ lại với điểm cao hơn kỷ lục
const RESAMPLE_N = 16;                 // Số điểm chuẩn khi so hình dạng
const SHAPE_SCALE = 50;                // Chuẩn hóa khoảng cách (khung 0–100)

// Tính độ dài polyline (tọa độ khung 0–100).
function polylineLength(pts) {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return len;
}

// Resample polyline về đúng n điểm cách đều theo độ dài cung.
// Dùng để so hai nét có số điểm thô khác nhau một cách công bằng.
function resample(pts, n) {
  if (!pts || pts.length === 0) return [];
  if (pts.length === 1) return Array.from({ length: n }, () => [...pts[0]]);
  const total = polylineLength(pts);
  if (total === 0) return Array.from({ length: n }, () => [...pts[0]]);
  const step = total / (n - 1);
  const out = [[...pts[0]]];
  let acc = 0;
  let prev = pts[0];
  for (let i = 1; i < pts.length && out.length < n - 1; i++) {
    let seg = Math.hypot(pts[i][0] - prev[0], pts[i][1] - prev[1]);
    while (seg > 0 && acc + seg >= step && out.length < n - 1) {
      const t = (step - acc) / seg;
      const p = [prev[0] + (pts[i][0] - prev[0]) * t, prev[1] + (pts[i][1] - prev[1]) * t];
      out.push(p);
      prev = p;
      seg = Math.hypot(pts[i][0] - prev[0], pts[i][1] - prev[1]);
      acc = 0;
    }
    acc += seg;
    prev = pts[i];
  }
  while (out.length < n) out.push([...pts[pts.length - 1]]);
  return out;
}

// Vector đầu–cuối của một nét, chuẩn hóa về độ dài 1 (để chấm hướng).
function endToEndUnit(pts) {
  const a = pts[0];
  const b = pts[pts.length - 1];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len === 0) return [0, 0];
  return [dx / len, dy / len];
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/**
 * Chấm bài viết của người chơi cho một chữ.
 * @param {Array<Array<[number,number]>>} userStrokes - các nét người viết,
 *   mỗi nét là polyline tọa độ khung 0–100, theo thứ tự người viết.
 * @param {object} charData - một mục trong CALLIGRAPHY_CHARS.
 * @returns {{
 *   score: number (0–100, làm tròn),
 *   passed: boolean,
 *   countScore, shapeScore, directionScore, orderScore: number (0–100),
 *   perStroke: Array<{expected:number, name:string, matched:boolean,
 *     shape:number, direction:number, reversed:boolean, wrongOrder:boolean}>,
 *   missing: number[], extra: number, reversed: number[], wrongOrder: number[]
 * }}
 * Cách chấm:
 *  (1) Ghép nét: với mỗi nét mẫu (theo thứ tự), chọn nét người viết CHƯA
 *      dùng có điểm bắt đầu gần điểm bắt đầu nét mẫu nhất.
 *  (2) countScore: đủ số nét = 100; thiếu/thừa mỗi nét trừ 25 (tối thiểu 0).
 *  (3) shapeScore: trung bình độ tương đồng hình dạng trên TẤT CẢ nét mẫu
 *      (nét thiếu tính 0) = 1 − (khoảng cách trung bình giữa 16 điểm
 *      resample / 50), kẹp 0–1.
 *  (4) directionScore: trung bình tích vô hướng vector đầu–cuối trên TẤT CẢ
 *      nét mẫu (nét thiếu tính 0; ngược hướng → âm → tính 0).
 *      Nét quá ngắn (< 3 đơn vị) không tính hướng (tính 1).
 *  (5) orderScore: tỉ lệ nét được ghép đúng vị trí thứ tự của nó
 *      (nét mẫu i ghép với nét người viết thứ i). Nét không ghép được = sai.
 *  Ngoài ra: thiếu hoặc thừa nét thì trần tổng điểm ở 69 (không đỗ),
 *  vì chữ thiếu/thừa nét là chữ sai hẳn.
 */
export function gradeStrokes(userStrokes, charData) {
  const expected = charData.strokes;
  const nExp = expected.length;
  const nUser = userStrokes.length;

  // (2) Điểm số nét.
  const countScore = Math.max(0, 100 - 25 * Math.abs(nUser - nExp));

  // (1) Ghép nét theo điểm bắt đầu gần nhất.
  const used = new Array(nUser).fill(false);
  const perStroke = [];
  const missing = [];
  const wrongOrder = [];
  const reversed = [];
  let shapeSum = 0;
  let shapeCount = 0;
  let dirSum = 0;
  let dirCount = 0;
  let orderOk = 0;

  for (let i = 0; i < nExp; i++) {
    const expStart = expected[i].pts[0];
    const expEnd = expected[i].pts[expected[i].pts.length - 1];
    let bestJ = -1;
    let bestDist = Infinity;
    for (let j = 0; j < nUser; j++) {
      if (used[j] || !userStrokes[j] || userStrokes[j].length === 0) continue;
      // Chi phí ghép = khoảng cách điểm ĐẦU + điểm CUỐI: một số chữ có hai
      // nét cùng điểm bắt đầu (木: 撇/捺 cùng [50,34]; 中: 竖/横折 cùng
      // [30,26]) nên chỉ so điểm đầu sẽ ghép nhầm và trừ oan người viết
      // cẩn thận; điểm cuối của hai nét đó ở xa nhau nên phân biệt được.
      const uStart = userStrokes[j][0];
      const uEnd = userStrokes[j][userStrokes[j].length - 1];
      const d = Math.hypot(uStart[0] - expStart[0], uStart[1] - expStart[1]) +
        Math.hypot(uEnd[0] - expEnd[0], uEnd[1] - expEnd[1]);
      if (d < bestDist) { bestDist = d; bestJ = j; }
    }
    if (bestJ === -1) {
      missing.push(i);
      perStroke.push({ expected: i, name: expected[i].name, matched: false, shape: 0, direction: 0, reversed: false, wrongOrder: false });
      continue;
    }
    used[bestJ] = true;
    const user = userStrokes[bestJ];
    // (3) Hình dạng: resample về 16 điểm, khoảng cách trung bình.
    const a = resample(user, RESAMPLE_N);
    const b = resample(expected[i].pts, RESAMPLE_N);
    let distSum = 0;
    for (let k = 0; k < RESAMPLE_N; k++) distSum += Math.hypot(a[k][0] - b[k][0], a[k][1] - b[k][1]);
    const shape = clamp01(1 - (distSum / RESAMPLE_N) / SHAPE_SCALE);
    // (4) Hướng: tích vô hướng vector đầu–cuối.
    let direction = 1; // nét quá ngắn thì không trừ điểm hướng
    let isReversed = false;
    if (polylineLength(user) >= 3 && polylineLength(expected[i].pts) >= 3) {
      const u = endToEndUnit(user);
      const e = endToEndUnit(expected[i].pts);
      const dot = u[0] * e[0] + u[1] * e[1];
      direction = clamp01(dot);
      isReversed = dot < 0;
      if (isReversed) reversed.push(i);
    }
    // (5) Thứ tự: nét mẫu i phải ghép đúng nét người viết thứ i.
    const orderRight = bestJ === i;
    if (orderRight) orderOk++;
    else wrongOrder.push(i);
    shapeSum += shape;
    shapeCount++;
    dirSum += direction;
    dirCount++;
    perStroke.push({
      expected: i, name: expected[i].name, matched: true,
      shape: Math.round(shape * 100), direction: Math.round(direction * 100),
      reversed: isReversed, wrongOrder: !orderRight
    });
  }

  const shapeScore = nExp ? (shapeSum / nExp) * 100 : 0; // Nét thiếu tính 0.
  const directionScore = nExp ? (dirSum / nExp) * 100 : 0; // Nét thiếu tính 0.
  const orderScore = nExp ? (orderOk / nExp) * 100 : 0;
  let score = Math.round(
    shapeScore * 0.40 + directionScore * 0.20 + orderScore * 0.20 + countScore * 0.20
  );
  // Thiếu hoặc thừa nét thì chữ đã sai hẳn → trần điểm ở 69 (không đỗ),
  // dù các nét đã viết có đẹp đến đâu. Đây là quy tắc sư phạm, không phải
  // hệ quả tự nhiên của công thức trọng số.
  const extra = Math.max(0, nUser - nExp);
  if (missing.length > 0 || extra > 0) score = Math.min(score, PASS_SCORE - 1);

  return {
    score, passed: score >= PASS_SCORE,
    countScore: Math.round(countScore), shapeScore: Math.round(shapeScore),
    directionScore: Math.round(directionScore), orderScore: Math.round(orderScore),
    perStroke, missing, extra, reversed, wrongOrder
  };
}

// ---------------------------------------------------------------------------
// 3. NHẬN XÉT CỦA THẦY ĐỒ — nghiêm mà dí dỏm, chỉ lỗi cụ thể.
// ---------------------------------------------------------------------------

const PRAISE = [
  'Hảo! Nét chữ vững như núi Thái Sơn, thầy rất ưng.',
  'Tốt lắm! Chữ này viết ra đã có phong thái người đọc sách.',
  'Khá! Thầy thấy con đã thuộc thứ tự nét rồi đấy.'
];
const ENCOURAGE = [
  'Chưa đỗ, nhưng đừng nản — thầy ngày xưa cũng từng viết chữ 人 mà như chữ 大!',
  'Còn vụng tay, không sao. Luyện chữ cũng như luyện võ, ngày nào cũng phải mài.',
  'Thầy chấm trượt, nhưng thầy thấy con đã cố. Viết lại lần nữa xem nào.'
];

function teacherComment(charData, result) {
  const lines = [];
  if (result.passed) {
    lines.push(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
  } else {
    lines.push(ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)]);
  }
  if (result.missing.length) {
    const names = result.missing.map((i) => `nét ${i + 1} (${charData.strokes[i].name})`);
    lines.push(`Con còn thiếu ${names.join(', ')} — nhớ viết đủ ${charData.strokes.length} nét.`);
  }
  if (result.extra > 0) {
    lines.push(`Con viết thừa ${result.extra} nét — chữ này chỉ có ${charData.strokes.length} nét thôi.`);
  }
  if (result.wrongOrder.length) {
    const names = result.wrongOrder.map((i) => `nét ${i + 1} (${charData.strokes[i].name})`);
    lines.push(`Sai thứ tự ở ${names.join(', ')} — phải viết theo số thứ tự thầy ghi trên bảng.`);
  }
  if (result.reversed.length) {
    const names = result.reversed.map((i) => `nét ${i + 1} (${charData.strokes[i].name})`);
    lines.push(`${names.join(', ')} viết ngược hướng rồi — bút đi ngược thì chữ mất hồn.`);
  }
  if (result.passed && result.shapeScore < 75) {
    lines.push('Thứ tự và hướng đều đúng, chỉ hình nét còn xiêu vẹo — lần sau viết chậm tay lại một chút.');
  }
  if (!result.passed && !result.missing.length && !result.wrongOrder.length && !result.reversed.length) {
    lines.push('Thứ tự không sai, chỉ hình nét còn xa mẫu quá — con bật "Xem mẫu" rồi viết theo từng nét nhé.');
  }
  return lines;
}

// ---------------------------------------------------------------------------
// 4. GIAO DIỆN — panel DOM riêng, CSS inline tự chèn, tự dọn khi đóng.
//    Phong cách: giấy gạo, đỏ son, nâu gỗ (theo chuẩn hình ảnh Hán Lâm Ký).
// ---------------------------------------------------------------------------

const STYLE_ID = 'calligraphy-style';
const PANEL_ID = 'calligraphy-panel';

const CSS = `
#${PANEL_ID}{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;background:rgba(30,18,8,.72);font-family:"Segoe UI",system-ui,sans-serif;color:#3a2415;padding:10px;box-sizing:border-box}
#${PANEL_ID} *{box-sizing:border-box}
.clg-card{width:min(920px,100%);max-height:94vh;overflow:auto;background:#f6ecd7;border:3px solid #8b2e1f;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.5);padding:14px 16px}
.clg-head{display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:2px solid #c9a86a;padding-bottom:8px;margin-bottom:12px}
.clg-head h2{margin:0;font-size:20px;color:#8b2e1f;letter-spacing:1px}
.clg-head p{margin:2px 0 0;font-size:13px;color:#7a5a34}
.clg-close{background:#8b2e1f;color:#f6ecd7;border:none;border-radius:8px;font-size:16px;line-height:1;padding:8px 12px;cursor:pointer}
.clg-close:hover{background:#a63a26}
.clg-body{display:flex;gap:14px;flex-wrap:wrap}
.clg-list{flex:1 1 220px;max-height:520px;overflow:auto;border:1px solid #c9a86a;border-radius:10px;background:#fff8e7;padding:6px}
.clg-item{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:transparent;border:1px solid transparent;border-radius:8px;padding:7px 8px;cursor:pointer;color:#3a2415}
.clg-item:hover{background:#f1e2c0}
.clg-item.active{background:#8b2e1f;color:#f6ecd7}
.clg-item.active .clg-sub{color:#f0d9a8}
.clg-hanzi{font-size:28px;line-height:1;min-width:32px;text-align:center}
.clg-sub{font-size:12px;color:#7a5a34;line-height:1.4}
.clg-best{margin-left:auto;font-size:12px;font-weight:700;white-space:nowrap}
.clg-main{flex:2 1 380px;min-width:300px}
.clg-title{font-size:22px;font-weight:700;color:#8b2e1f}
.clg-title .clg-py{font-size:14px;color:#7a5a34;font-weight:400}
.clg-hint{font-size:13px;color:#7a5a34;margin:4px 0 8px}
.clg-canvas-wrap{position:relative;background:#fdf6e3;border:2px solid #8b5a2b;border-radius:10px;overflow:hidden}
.clg-canvas-wrap canvas{display:block;width:100%;height:auto;touch-action:none;cursor:crosshair}
.clg-progress{font-size:13px;margin:6px 0 0;color:#5a3d1e}
.clg-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.clg-btns button{border:2px solid #8b5a2b;background:#fff8e7;color:#3a2415;border-radius:8px;padding:8px 14px;font-size:14px;cursor:pointer}
.clg-btns button:hover{background:#f1e2c0}
.clg-btns button.primary{background:#8b2e1f;border-color:#8b2e1f;color:#f6ecd7;font-weight:700}
.clg-btns button.primary:hover{background:#a63a26}
.clg-btns button:disabled{opacity:.45;cursor:not-allowed}
.clg-result{margin-top:12px;border:1px solid #c9a86a;border-radius:10px;background:#fff8e7;padding:10px 12px;font-size:14px}
.clg-score{font-size:26px;font-weight:800;color:#8b2e1f}
.clg-score.pass{color:#2e6b34}
.clg-score.fail{color:#8b2e1f}
.clg-bars{font-size:12px;color:#5a3d1e;margin:6px 0}
.clg-comment{margin:6px 0 0;line-height:1.55}
.clg-xp{font-weight:700;color:#2e6b34}
.clg-foot{font-size:12px;color:#7a5a34;margin-top:10px}
@media (max-width:640px){.clg-hanzi{font-size:24px}.clg-head h2{font-size:17px}.clg-card{padding:10px}}
`;

let activePanel = null; // Chỉ mở một panel tại một thời điểm.

// Lấy (hoặc khởi tạo) object tiến trình trong state. Không ghi localStorage.
function progressOf(state) {
  if (!state || typeof state !== 'object') return {};
  if (!state.calligraphy || typeof state.calligraphy !== 'object') state.calligraphy = {};
  return state.calligraphy;
}

function safeCall(fn, arg) {
  if (typeof fn === 'function') {
    try { fn(arg); } catch (e) { /* callback game lỗi thì không làm vỡ panel */ }
  }
}

/** Đóng panel Luyện chữ đang mở (nếu có), dọn sạch DOM + listener. */
export function closeCalligraphy() {
  if (activePanel) {
    activePanel.cleanup();
    activePanel = null;
  }
}

/**
 * Mở Lớp Luyện chữ.
 * @param {object} state - state game (ghi tiến trình vào state.calligraphy).
 * @param {object} [opts] - { onAwardXP(xp), onSave(), onClose() }.
 * @returns {function} hàm đóng panel (tương đương closeCalligraphy()).
 */
export function openCalligraphy(state, opts = {}) {
  closeCalligraphy(); // Nếu đang mở thì đóng cái cũ trước.
  const progress = progressOf(state);

  // --- Chèn CSS riêng của module (tự dọn khi đóng) ---
  let styleEl = document.getElementById(STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);
  }

  // --- Dựng panel ---
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <div class="clg-card" role="dialog" aria-label="Lớp Luyện chữ">
      <div class="clg-head">
        <div>
          <h2>✒️ Lớp Luyện chữ — Thầy đồ chấm từng nét</h2>
          <p>Viết theo thứ tự nét. Mỗi lần nhấc bút là xong một nét. Đỗ từ 70 điểm.</p>
        </div>
        <button class="clg-close" type="button" aria-label="Đóng">✕</button>
      </div>
      <div class="clg-body">
        <div class="clg-list" role="listbox" aria-label="Danh sách chữ"></div>
        <div class="clg-main">
          <div class="clg-title"></div>
          <p class="clg-hint"></p>
          <div class="clg-canvas-wrap"><canvas width="360" height="360" aria-label="Bảng viết chữ"></canvas></div>
          <p class="clg-progress"></p>
          <div class="clg-btns">
            <button type="button" data-act="demo">▶ Xem mẫu</button>
            <button type="button" data-act="clear">🧹 Xóa</button>
            <button type="button" data-act="submit" class="primary">📝 Nộp bài</button>
          </div>
          <div class="clg-result" hidden></div>
          <p class="clg-foot">Chấm theo 4 tiêu chí: đủ nét, đúng thứ tự, đúng hướng, giống hình mẫu.
          Đây là chấm gợi ý, không phải nhận dạng chữ chuyên nghiệp — thầy chấm bằng mắt thường thôi.</p>
        </div>
      </div>
    </div>`;
  document.body.appendChild(panel);

  const listEl = panel.querySelector('.clg-list');
  const titleEl = panel.querySelector('.clg-title');
  const hintEl = panel.querySelector('.clg-hint');
  const progressEl = panel.querySelector('.clg-progress');
  const resultEl = panel.querySelector('.clg-result');
  const canvas = panel.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  // Canvas sắc nét trên màn hình mật độ điểm ảnh cao.
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = 360 * dpr;
  canvas.height = 360 * dpr;
  ctx.scale(dpr, dpr);

  let current = CALLIGRAPHY_CHARS[0]; // Chữ đang luyện.
  let userStrokes = [];                // Các nét đã viết xong (tọa độ 0–100).
  let currentStroke = null;            // Nét đang viết dở (điểm thô, tọa độ canvas px).
  let animating = false;               // Đang chạy animation "Xem mẫu".
  let animationId = 0;                 // Token hủy animation khi đổi chữ/đóng panel.
  let disposed = false;

  // --- Vẽ ---------------------------------------------------------------
  // Vẽ lại toàn bộ: lưới 米字格, nét mẫu mờ + số thứ tự, nét người viết.
  // demoProgress: { strokeIndex, frac } khi đang chạy animation mẫu.
  function draw(demoProgress = null) {
    const W = 360;
    ctx.clearRect(0, 0, W, W);
    // Nền giấy.
    ctx.fillStyle = '#fdf6e3';
    ctx.fillRect(0, 0, W, W);
    // Lưới 米字格: khung + đường giữa + 2 đường chéo (đỏ nhạt, đứt nét).
    ctx.strokeStyle = 'rgba(139,46,31,.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(14, 14, W - 28, W - 28);
    ctx.beginPath();
    ctx.moveTo(W / 2, 14); ctx.lineTo(W / 2, W - 14);
    ctx.moveTo(14, W / 2); ctx.lineTo(W - 14, W / 2);
    ctx.moveTo(14, 14); ctx.lineTo(W - 14, W - 14);
    ctx.moveTo(W - 14, 14); ctx.lineTo(14, W - 14);
    ctx.stroke();
    ctx.setLineDash([]);

    const toPx = (v) => 14 + (v / 100) * (W - 28); // khung 0–100 → px trong khung lưới.

    // Nét mẫu mờ + số thứ tự từng nét.
    current.strokes.forEach((s, i) => {
      const demoActive = demoProgress && i === demoProgress.strokeIndex;
      const demoDone = demoProgress && i < demoProgress.strokeIndex;
      ctx.strokeStyle = demoActive || demoDone ? 'rgba(139,46,31,.85)' : 'rgba(120,90,52,.30)';
      ctx.lineWidth = demoActive ? 5 : 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const pts = s.pts;
      const upto = demoActive
        ? Math.max(2, Math.round(pts.length * demoProgress.frac) + 1)
        : pts.length;
      // Nội suy thêm điểm cuối khi animation đang ở giữa đoạn thẳng.
      const drawPts = pts.slice(0, upto);
      if (demoActive && upto < pts.length && drawPts.length >= 2) {
        const a = pts[upto - 1];
        const b = pts[upto];
        const f = (pts.length * demoProgress.frac + 1) - upto;
        drawPts.push([a[0] + (b[0] - a[0]) * Math.max(0, Math.min(1, f)), a[1] + (b[1] - a[1]) * Math.max(0, Math.min(1, f))]);
      }
      drawPts.forEach(([x, y], k) => (k === 0 ? ctx.moveTo(toPx(x), toPx(y)) : ctx.lineTo(toPx(x), toPx(y))));
      ctx.stroke();
      // Số thứ tự nét đặt ở điểm bắt đầu.
      ctx.fillStyle = demoActive || demoDone ? '#8b2e1f' : 'rgba(139,90,43,.75)';
      ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), toPx(pts[0][0]) - 13, toPx(pts[0][1]) - 12);
    });

    // Nét người viết: mực đen-nâu, đè lên mẫu.
    ctx.strokeStyle = '#2b1a10';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const drawUserStroke = (ptsPx) => {
      if (ptsPx.length < 2) {
        if (ptsPx.length === 1) {
          ctx.beginPath();
          ctx.arc(ptsPx[0][0], ptsPx[0][1], 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#2b1a10';
          ctx.fill();
        }
        return;
      }
      ctx.beginPath();
      ptsPx.forEach(([x, y], k) => (k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
    };
    userStrokes.forEach((s) => drawUserStroke(s.map(([x, y]) => [toPx(x), toPx(y)])));
    if (currentStroke) drawUserStroke(currentStroke);
  }

  // --- Danh sách chữ ------------------------------------------------------
  function renderList() {
    listEl.innerHTML = '';
    CALLIGRAPHY_CHARS.forEach((c) => {
      const p = progress[c.hanzi] || {};
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'clg-item' + (c === current ? ' active' : '');
      btn.setAttribute('role', 'option');
      btn.innerHTML = `
        <span class="clg-hanzi">${c.hanzi}</span>
        <span class="clg-sub">${c.pinyin}<br>${c.meaning} · ${c.strokes.length} nét${p.done ? ' · ✅ đã đỗ' : ''}</span>
        <span class="clg-best">${p.best != null ? `⭐ ${p.best}` : ''}</span>`;
      btn.addEventListener('click', () => selectChar(c));
      listEl.appendChild(btn);
    });
  }

  function updateHeader() {
    const p = progress[current.hanzi] || {};
    titleEl.innerHTML = `<span class="clg-title">${current.hanzi}</span>
      <span class="clg-py"> ${current.pinyin} — ${current.meaning} · ${current.strokes.length} nét</span>`;
    hintEl.textContent = `Thứ tự nét: ${current.strokes.map((s, i) => `${i + 1}. ${s.name}`).join(' → ')}`;
    progressEl.textContent = p.attempts
      ? `Đã viết ${p.attempts} lần · Điểm cao nhất: ${p.best} · ${p.done ? 'Đã đỗ ✅' : 'Chưa đỗ — cố lên!'}`
      : 'Chữ mới — viết lần đầu nào!';
  }

  function selectChar(c) {
    animationId++; // Hủy animation mẫu đang chạy (nếu có).
    animating = false;
    current = c;
    userStrokes = [];
    currentStroke = null;
    resultEl.hidden = true;
    resultEl.innerHTML = '';
    renderList();
    updateHeader();
    draw();
    updateProgress();
  }

  function updateProgress() {
    progressEl.textContent = `${userStrokes.length}/${current.strokes.length} nét` +
      (userStrokes.length >= current.strokes.length ? ' — đủ nét, thầy chấm được rồi!' : ' — nhấc bút để xong một nét.') +
      (progress[current.hanzi] && progress[current.hanzi].attempts
        ? ` · Kỷ lục: ${progress[current.hanzi].best} điểm` : '');
  }

  // --- Nộp bài / chấm ------------------------------------------------------
  function submit() {
    if (animating) return;
    if (userStrokes.length === 0) {
      resultEl.hidden = false;
      resultEl.innerHTML = '<p class="clg-comment">Con chưa viết nét nào mà đã nộp bài à? Thầy chấm giấy trắng thì chỉ có điểm 0 thôi đấy.</p>';
      return;
    }
    const result = gradeStrokes(userStrokes, current);
    const p = progress[current.hanzi] || { attempts: 0, best: 0, last: 0, done: false };
    const wasDone = !!p.done;
    const prevBest = p.best || 0;
    p.attempts = (p.attempts || 0) + 1;
    p.last = result.score;
    if (result.score > prevBest) p.best = result.score;
    if (result.passed) p.done = true;
    progress[current.hanzi] = p;

    // Thưởng XP: đỗ lần đầu +10; đỗ lại cao điểm hơn kỷ lục +5; trượt 0.
    let xp = 0;
    if (result.passed && !wasDone) xp = XP_FIRST_PASS;
    else if (result.passed && result.score > prevBest) xp = XP_IMPROVED_PASS;
    if (xp > 0) safeCall(opts.onAwardXP, xp);
    safeCall(opts.onSave);

    const comments = teacherComment(current, result);
    resultEl.hidden = false;
    resultEl.innerHTML = `
      <div><span class="clg-score ${result.passed ? 'pass' : 'fail'}">${result.score} điểm</span>
      ${result.passed ? ' — ✅ Đỗ!' : ' — ❌ Chưa đỗ (cần ≥ 70)'}</div>
      <div class="clg-bars">Hình dạng ${result.shapeScore} · Hướng nét ${result.directionScore} ·
      Thứ tự ${result.orderScore} · Đủ nét ${result.countScore}</div>
      ${comments.map((c) => `<p class="clg-comment">🖌️ ${c}</p>`).join('')}
      ${xp > 0 ? `<p class="clg-xp">+${xp} XP vào Sổ học tập!</p>` : ''}`;
    renderList();
    updateHeader();
  }

  // --- "Xem mẫu": animation vẽ từng nét theo thứ tự -----------------------
  function playDemo() {
    if (animating) return;
    animating = true;
    const token = ++animationId;
    const total = current.strokes.length;
    const perStrokeMs = 700;
    const start = performance.now();
    const tick = (now) => {
      if (disposed || token !== animationId) return; // Đổi chữ/đóng panel → dừng.
      const elapsed = now - start;
      const idx = Math.floor(elapsed / perStrokeMs);
      if (idx >= total) {
        animating = false;
        draw();
        return;
      }
      const frac = (elapsed % perStrokeMs) / perStrokeMs;
      draw({ strokeIndex: idx, frac });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // --- Vẽ bằng chuột + cảm ứng (Pointer Events) ---------------------------
  // touch-action: none (trong CSS) + preventDefault để không cuộn trang.
  function toLogical(e) {
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 360;
    const py = ((e.clientY - rect.top) / rect.height) * 360;
    // Đổi px canvas → tọa độ khung 0–100 (ngược với toPx trong draw()).
    const x = ((px - 14) / (360 - 28)) * 100;
    const y = ((py - 14) / (360 - 28)) * 100;
    return [Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y))];
  }

  function onPointerDown(e) {
    if (animating) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* không hỗ trợ thì thôi */ }
    currentStroke = [toLogical(e)];
    draw();
  }
  function onPointerMove(e) {
    if (!currentStroke) return;
    e.preventDefault();
    const p = toLogical(e);
    const last = currentStroke[currentStroke.length - 1];
    // Lọc điểm quá sát nhau để polyline gọn, đỡ tốn bộ nhớ.
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 1.2) return;
    currentStroke.push(p);
    draw();
  }
  function onPointerUp(e) {
    if (!currentStroke) return;
    e.preventDefault();
    const stroke = currentStroke;
    currentStroke = null;
    // Nét chỉ có 1 điểm chạm (chấm 点) vẫn tính là một nét.
    if (stroke.length >= 1) {
      if (userStrokes.length < current.strokes.length + 2) {
        userStrokes.push(stroke);
      } else {
        resultEl.hidden = false;
        resultEl.innerHTML = '<p class="clg-comment">Thầy chỉ đếm tối đa thừa 2 nét thôi — con viết thừa nhiều quá rồi, bấm "Xóa" viết lại nhé.</p>';
      }
    }
    draw();
    updateProgress();
    // Đủ số nét mẫu → chấm luôn (theo yêu cầu: hết nét thì chấm).
    if (userStrokes.length === current.strokes.length) submit();
  }
  function onPointerCancel() {
    currentStroke = null;
    draw();
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  // Chặn cuộn/trượt trang khi chạm vào canvas trên mobile cũ.
  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

  // --- Nút bấm + phím tắt --------------------------------------------------
  function onButtonClick(e) {
    const act = e.target.closest('button')?.dataset.act;
    if (!act) return;
    if (act === 'demo') playDemo();
    else if (act === 'clear') {
      animationId++;
      animating = false;
      userStrokes = [];
      currentStroke = null;
      resultEl.hidden = true;
      resultEl.innerHTML = '';
      draw();
      updateProgress();
    } else if (act === 'submit') submit();
  }
  panel.addEventListener('click', onButtonClick);
  panel.querySelector('.clg-close').addEventListener('click', () => closeCalligraphy());
  // Bấm ra ngoài thẻ card thì đóng (bấm vào nền mờ).
  panel.addEventListener('click', (e) => { if (e.target === panel) closeCalligraphy(); });
  function onKeyDown(e) {
    if (e.key === 'Escape') closeCalligraphy();
  }
  document.addEventListener('keydown', onKeyDown);

  // --- Dọn dẹp --------------------------------------------------------------
  function cleanup() {
    disposed = true;
    animationId++;
    document.removeEventListener('keydown', onKeyDown);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerCancel);
    panel.remove();
    const st = document.getElementById(STYLE_ID);
    if (st) st.remove();
    safeCall(opts.onClose);
  }

  renderList();
  updateHeader();
  draw();
  updateProgress();
  activePanel = { cleanup };

  return closeCalligraphy;
}
