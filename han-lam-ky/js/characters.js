// Hán Lâm Ký (汉林记) — Nhân vật 3D
// © Nông Quang Vinh
// Module nhân vật: Thư Sinh (người chơi) + NPC trong làng.
// Dựng hoàn toàn bằng hình học trong code (Three.js 0.180), không tải asset ngoài.
// Tuyệt đối không dùng khối lập phương làm người: đầu, thân, tay, chân đều là
// hình cầu / hình trụ thuôn / hình nón / torus / LatheGeometry / CapsuleGeometry.

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Vật liệu dùng chung
// ---------------------------------------------------------------------------
const _materials = new Map();

function mat(color, roughness = 0.75, metalness = 0.0) {
  const key = `${color}|${roughness}|${metalness}`;
  if (!_materials.has(key)) {
    _materials.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  }
  return _materials.get(key);
}

const SKIN = mat(0xf2c89b, 0.65);
const SKIN_DARK = mat(0xe0aa72, 0.65);
const HAIR_BLACK = mat(0x1a1512, 0.55);
const HAIR_WHITE = mat(0xe8e6df, 0.85);
const GOLD = mat(0xd4af37, 0.35, 0.6);
const DARK = mat(0x1c1c22, 0.6);
const EYE = mat(0x141210, 0.4);
const MOUTH = mat(0xb04a3a, 0.6);
const PAPER = mat(0xf5ead0, 0.9);
const STRAW = mat(0xd9b96a, 0.85);
const LEATHER = mat(0x7a5230, 0.8);

// ---------------------------------------------------------------------------
// Helper tạo hình
// ---------------------------------------------------------------------------
function sphere(r, material, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  return m;
}

function cyl(rTop, rBottom, h, material, x = 0, y = 0, z = 0, radial = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, radial), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function cone(r, h, material, x = 0, y = 0, z = 0, radial = 20) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, radial), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function torus(r, tube, material, x = 0, y = 0, z = 0, arc = Math.PI * 2) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, 32, arc), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

/** Áo dài / áo choàng thuôn bằng LatheGeometry. hemY: mép áo, topY: vai. */
function robe(robeMat, { hemY = 0.28, hemR = 0.27, waistR = 0.20, shoulderR = 0.17, topY = 1.44 } = {}) {
  const pts = [
    new THREE.Vector2(0.001, hemY),
    new THREE.Vector2(hemR, hemY),
    new THREE.Vector2(hemR * 0.92, hemY + 0.25),
    new THREE.Vector2(waistR, 1.02),
    new THREE.Vector2(shoulderR + 0.01, 1.30),
    new THREE.Vector2(shoulderR, topY),
    new THREE.Vector2(0.055, topY + 0.02),
  ];
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 28), robeMat);
  m.castShadow = true;
  return m;
}

// ---------------------------------------------------------------------------
// Nhãn tên (sprite canvas, tiếng Việt có dấu)
// ---------------------------------------------------------------------------
function makeNameSprite(text) {
  const label = String(text || 'Thư Sinh');
  // Nhỏ hơn trước (46px/0,26 m): kiểm thử 27/11 ghi tên NPC trong lớp bị cắt
  // ở mép màn hình. Nhãn là sprite 3D căn giữa trên đầu NPC nên NPC đứng
  // sát mép thì nhãn vẫn có thể chạm mép — thu nhỏ ~15% giúp nhãn dài như
  // "Thầy Đồ Lâm" bớt tràn, không sửa được triệt để nếu không kẹp nhãn theo
  // khung hình (việc lớn hơn, để riêng).
  const font = 'bold 38px sans-serif';
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = font;
  const textW = Math.ceil(measure.measureText(label).width);
  const padX = 26;
  const w = textW + padX * 2;
  const h = 64;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Nền bán trong suốt, bo tròn, viền vàng
  const r = 20;
  ctx.beginPath();
  ctx.moveTo(r, 2);
  ctx.lineTo(w - r, 2);
  ctx.quadraticCurveTo(w - 2, 2, w - 2, r);
  ctx.lineTo(w - 2, h - r);
  ctx.quadraticCurveTo(w - 2, h - 2, w - r, h - 2);
  ctx.lineTo(r, h - 2);
  ctx.quadraticCurveTo(2, h - 2, 2, h - r);
  ctx.lineTo(2, r);
  ctx.quadraticCurveTo(2, 2, r, 2);
  ctx.closePath();
  ctx.fillStyle = 'rgba(18, 28, 48, 0.62)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.95)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 4;
  ctx.fillText(label, w / 2, h / 2 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(spriteMat);
  const height = 0.22;
  sprite.scale.set(height * (w / h), height, 1);
  sprite.position.y = 2.25;
  return sprite;
}

// ---------------------------------------------------------------------------
// Bộ phận chung của một con người
// ---------------------------------------------------------------------------
function makeFace(headGroup, { beard = false } = {}) {
  // Mắt: hình cầu dẹt
  headGroup.add(sphere(0.02, EYE, -0.06, 0.02, 0.135, 1, 1.3, 0.45));
  headGroup.add(sphere(0.02, EYE, 0.06, 0.02, 0.135, 1, 1.3, 0.45));
  // Lông mày: hình cầu dẹt dài
  headGroup.add(sphere(0.028, HAIR_BLACK, -0.06, 0.065, 0.14, 1.6, 0.35, 0.4));
  headGroup.add(sphere(0.028, HAIR_BLACK, 0.06, 0.065, 0.14, 1.6, 0.35, 0.4));
  // Mũi nhỏ
  headGroup.add(sphere(0.016, SKIN_DARK, 0, -0.02, 0.155, 1, 1.2, 1));
  // Miệng nhỏ
  headGroup.add(sphere(0.028, MOUTH, 0, -0.075, 0.14, 1.4, 0.45, 0.5));
  if (beard) {
    // Râu trắng: hình nón úp ngược, dẹt theo chiều trước-sau
    const b = cone(0.075, 0.2, HAIR_WHITE, 0, -0.17, 0.10);
    b.rotation.x = Math.PI;
    b.scale.set(1, 1, 0.55);
    headGroup.add(b);
    // Ria mép: hai hình cầu dẹt trắng
    headGroup.add(sphere(0.03, HAIR_WHITE, -0.04, -0.09, 0.14, 1.5, 0.4, 0.5));
    headGroup.add(sphere(0.03, HAIR_WHITE, 0.04, -0.09, 0.14, 1.5, 0.4, 0.5));
  }
  return headGroup;
}

function makeHead({ hairStyle = 'scholar', beard = false } = {}) {
  const head = new THREE.Group();
  head.position.y = 1.58;
  head.add(sphere(0.16, SKIN, 0, 0, 0));
  // Tai
  head.add(sphere(0.028, SKIN, -0.155, 0, 0, 0.5, 1, 0.8));
  head.add(sphere(0.028, SKIN, 0.155, 0, 0, 0.5, 1, 0.8));
  makeFace(head, { beard });

  if (hairStyle === 'scholar') {
    // Tóc đen ôm sau đầu + búi cao + trâm vàng
    const hair = sphere(0.165, HAIR_BLACK, 0, 0.03, -0.03, 1, 0.92, 1);
    head.add(hair);
    head.add(sphere(0.06, HAIR_BLACK, 0, 0.19, -0.02)); // búi tròn
    const pin = cyl(0.008, 0.008, 0.20, GOLD, 0, 0.19, -0.02);
    pin.rotation.z = Math.PI / 2;
    pin.rotation.y = 0.5;
    head.add(pin);
    head.add(sphere(0.014, GOLD, 0.10, 0.19, 0.03)); // đầu trâm
  } else if (hairStyle === 'teacher') {
    // Mũ đen của thầy đồ: vành tròn + chóp trụ
    const brim = cyl(0.21, 0.21, 0.018, DARK, 0, 0.13, 0);
    head.add(brim);
    head.add(cyl(0.13, 0.145, 0.09, DARK, 0, 0.18, 0));
    head.add(sphere(0.165, HAIR_WHITE, 0, 0.02, -0.05, 1, 0.9, 1)); // tóc bạc hai bên
  } else if (hairStyle === 'elder') {
    // Người già: tóc bạc búi thấp + trâm gỗ
    head.add(sphere(0.165, HAIR_WHITE, 0, 0.03, -0.03, 1, 0.92, 1));
    head.add(sphere(0.055, HAIR_WHITE, 0, 0.16, -0.06)); // búi thấp
    const pin = cyl(0.008, 0.008, 0.16, LEATHER, 0, 0.16, -0.06);
    pin.rotation.z = Math.PI / 2;
    head.add(pin);
  } else if (hairStyle === 'seller') {
    // Khăn đội đầu: hình cầu dẹt ôm đầu + nút thắt bên
    head.add(sphere(0.17, mat(0xd95f7a, 0.8), 0, 0.05, -0.02, 1, 0.9, 1));
    head.add(sphere(0.05, mat(0xd95f7a, 0.8), 0.14, -0.02, -0.08)); // nút khăn
    head.add(sphere(0.035, mat(0x2e7d4f, 0.8), -0.14, 0.10, 0.02)); // kẹp tóc lá
  } else if (hairStyle === 'chef') {
    // Giai đoạn B — Phố Hoa: khăn trắng quấn đầu của chủ quán mì + nút
    // thắt trước trán (phân biệt với khăn hồng của cô bán bánh).
    head.add(sphere(0.17, mat(0xf5f2e8, 0.85), 0, 0.05, -0.02, 1, 0.9, 1));
    head.add(sphere(0.05, mat(0xf5f2e8, 0.85), 0, 0.13, 0.11)); // nút khăn
  } else if (hairStyle === 'courier') {
    // Mũ rơm: chóp cầu dẹt + vành nón rộng (hình nón dẹt)
    head.add(sphere(0.15, STRAW, 0, 0.10, 0, 1, 0.55, 1));
    const brim = cone(0.32, 0.10, STRAW, 0, 0.10, 0);
    head.add(brim);
    head.add(torus(0.15, 0.012, LEATHER, 0, 0.10, 0));
    // phần torus dây mũ nằm ngang quanh chóp
    head.children[head.children.length - 1].rotation.x = Math.PI / 2;
  }
  return head;
}

/** Một cánh tay: pivot ở vai, tay áo rộng loe, bàn tay hình cầu nhỏ. */
function makeArm(side, sleeveMat) {
  const pivot = new THREE.Group();
  pivot.position.set(0.21 * side, 1.34, 0);
  // Tay áo rộng: trụ loe từ vai xuống cổ tay
  pivot.add(cyl(0.055, 0.105, 0.46, sleeveMat, 0, -0.23, 0));
  // Cánh tay trong tay áo (đoạn dưới) + bàn tay
  pivot.add(cyl(0.032, 0.028, 0.14, SKIN, 0, -0.48, 0));
  pivot.add(sphere(0.045, SKIN, 0, -0.57, 0, 0.85, 1.1, 1));
  return pivot;
}

/** Một chân: pivot ở hông, ống chân trụ thon, giày đen hình cầu dẹt dài. */
function makeLeg(side, pantsMat, hipY = 0.62) {
  const pivot = new THREE.Group();
  pivot.position.set(0.09 * side, hipY, 0);
  const legLen = hipY - 0.05; // ống chân chạm tới mắt cá, gần mặt đất
  pivot.add(cyl(0.055, 0.042, legLen, pantsMat, 0, -legLen / 2, 0));
  // Giày: tâm ở y tuyệt đối ~0.035, đáy giày chạm y=0
  const shoe = sphere(0.06, DARK, 0, -(hipY - 0.035), 0.035, 1, 0.55, 1.7);
  pivot.add(shoe);
  return pivot;
}

/**
 * Dựng một con người đầy đủ.
 * opts: robeMat, trimMat, pantsMat, hairStyle, beard, hemY/hemR (dài áo),
 *        beltColor, name, nameY
 * Trả về { group, body, head, leftArm, rightArm, leftLeg, rightLeg }
 */
function buildHuman(opts) {
  const {
    robeMat, trimMat, pantsMat, hairStyle = 'scholar', beard = false,
    hemY = 0.28, hemR = 0.27, beltColor = 0xd4af37, name = '',
  } = opts;

  const group = new THREE.Group();
  const body = new THREE.Group(); // thở: body lên xuống, chân ở ngoài body
  group.add(body);

  // Áo dài / áo choàng
  body.add(robe(robeMat, { hemY, hemR }));
  // Viền cổ áo vàng + viền mép áo
  const collar = torus(0.09, 0.016, trimMat || GOLD, 0, 1.44, 0.03);
  collar.rotation.x = Math.PI / 2 - 0.3;
  body.add(collar);
  const hemTrim = torus(hemR, 0.012, trimMat || GOLD, 0, hemY + 0.015, 0);
  hemTrim.rotation.x = Math.PI / 2;
  body.add(hemTrim);
  // Thắt lưng
  const belt = torus(0.205, 0.022, mat(beltColor, 0.5, 0.3), 0, 1.02, 0);
  belt.rotation.x = Math.PI / 2;
  body.add(belt);
  const buckle = sphere(0.035, GOLD, 0, 1.02, 0.205, 1, 1, 0.5);
  body.add(buckle);

  // Cổ
  body.add(cyl(0.05, 0.06, 0.12, SKIN, 0, 1.47, 0));

  // Đầu
  const head = makeHead({ hairStyle, beard });
  body.add(head);

  // Tay
  const leftArm = makeArm(-1, robeMat);
  const rightArm = makeArm(1, robeMat);
  body.add(leftArm, rightArm);

  // Chân (con của group, không theo nhịp thở của body)
  const hipY = hemY > 0.45 ? 0.85 : 0.62;
  const leftLeg = makeLeg(-1, pantsMat, hipY);
  const rightLeg = makeLeg(1, pantsMat, hipY);
  group.add(leftLeg, rightLeg);

  // Nhãn tên
  if (name) group.add(makeNameSprite(name));

  return { group, body, head, leftArm, rightArm, leftLeg, rightLeg };
}

// ---------------------------------------------------------------------------
// NHÂN VẬT CHÍNH — THƯ SINH
// ---------------------------------------------------------------------------
export function createPlayer(scene, startPos, displayName) {
  const name = displayName || 'Thư Sinh';
  const robeMat = mat(0x1e4d8c, 0.8); // xanh lam đậm
  const pantsMat = mat(0x2a2a33, 0.8);

  const human = buildHuman({
    robeMat, trimMat: GOLD, pantsMat,
    hairStyle: 'scholar', beltColor: 0xd4af37, name,
  });
  const { group, body, head, leftArm, rightArm, leftLeg, rightLeg } = human;

  // Quạt giấy cầm tay phải (cuộn quạt: trụ nhỏ + nan quạt hình nón dẹt)
  const fan = new THREE.Group();
  fan.add(cyl(0.012, 0.012, 0.22, LEATHER, 0, 0, 0));
  const fanBlade = cone(0.09, 0.16, PAPER, 0, 0.16, 0);
  fanBlade.scale.set(1, 1, 0.25);
  fan.add(fanBlade);
  fan.position.set(0, -0.58, 0.02);
  fan.rotation.x = 0.4;
  rightArm.add(fan);

  const pos = startPos || { x: 0, z: 0 };
  group.position.set(pos.x || 0, 0, pos.z || 0);
  scene.add(group);

  let phase = 0;
  let breathe = 0;

  function update(dt, moveSpeed, isMoving, isRunning) {
    const step = Math.min(Math.max(dt || 0, 0), 0.05);
    breathe += step;
    const speed = typeof moveSpeed === 'number' ? moveSpeed : (isMoving ? 1 : 0);

    if (isMoving) {
      const freq = isRunning ? 11 : 7;
      phase += step * freq * (0.7 + Math.min(speed, 2) * 0.3);
      const amp = isRunning ? 0.72 : 0.45;
      const s = Math.sin(phase);
      leftLeg.rotation.x = s * amp;
      rightLeg.rotation.x = -s * amp;
      leftArm.rotation.x = -s * amp * 0.8;
      rightArm.rotation.x = s * amp * 0.8;
      leftArm.rotation.z = 0.08;
      rightArm.rotation.z = -0.08;
      body.position.y = Math.abs(Math.cos(phase)) * (isRunning ? 0.05 : 0.03);
      body.rotation.x = isRunning ? 0.08 : 0.03;
      head.rotation.x = 0;
    } else {
      // Đứng yên: thở nhẹ, tay buông, chân về 0
      phase = 0;
      const b = Math.sin(breathe * 2.0);
      body.position.y = b * 0.015;
      body.rotation.x = 0;
      leftLeg.rotation.x *= 0.85;
      rightLeg.rotation.x *= 0.85;
      leftArm.rotation.x = b * 0.03;
      rightArm.rotation.x = b * 0.03;
      leftArm.rotation.z = 0.08;
      rightArm.rotation.z = -0.08;
      head.rotation.x = b * 0.01;
    }
  }

  function setFacing(angle) {
    group.rotation.y = angle;
  }

  return { group, update, setFacing };
}

// ---------------------------------------------------------------------------
// NPC TRONG LÀNG
// ---------------------------------------------------------------------------
export function createNPCs(scene) {
  const npcs = [];

  // --- 1. Thầy Đồ Lâm — áo đỏ nâu, râu trắng, mũ đen, cầm cuộn sách ---
  {
    const robeMat = mat(0x7a2e2e, 0.8); // đỏ nâu
    const human = buildHuman({
      robeMat, trimMat: GOLD, pantsMat: mat(0x3a2a2a, 0.8),
      hairStyle: 'teacher', beard: true, beltColor: 0x2e1a4d, name: 'Thầy Đồ Lâm',
    });
    const { group, body, head, leftArm, rightArm, leftLeg, rightLeg } = human;
    // TRONG lớp học (Phase 4): đứng trước bàn thầy, gần bảng đen.
    // Tọa độ cục bộ trong lớp (0,-1.3) quy đổi từ tâm lớp (-28,-20), rotY 0.35.
    group.position.set(-28.45, 0, -21.22);
    // Mặc định mode 'teach': quay mặt về bảng đen (hướng Bắc trong lớp)
    group.rotation.y = -2.79;
    scene.add(group);

    // Cuộn sách cầm tay phải: trụ giấy cuộn ngang + dây buộc
    const scroll = new THREE.Group();
    const roll = cyl(0.045, 0.045, 0.30, PAPER, 0, 0, 0);
    roll.rotation.z = Math.PI / 2;
    scroll.add(roll);
    scroll.add(torus(0.048, 0.008, mat(0x8c2f2f, 0.7), -0.08, 0, 0));
    scroll.children[scroll.children.length - 1].rotation.y = Math.PI / 2;
    scroll.position.set(0, -0.58, 0.06);
    rightArm.add(scroll);
    rightArm.rotation.x = -0.85; // giơ sách lên trước ngực để đọc
    rightArm.rotation.z = -0.15;
    leftArm.rotation.x = -0.35; // tay trái đỡ nhẹ

    let t0 = 0;
    // Chế độ dạy học của thầy (Phase 4): 'teach' (mặc định, đứng trước
    // bảng chỉ bảng), 'read' (đọc sách trước lớp), 'walk' (đi chậm dọc
    // lối đi phía Đông lớp, giữa 2 điểm trong lớp, không ra ngoài).
    let mode = 'teach';
    let walkPos = 0, walkDir = 1, walkPhase = 0;
    // Lối đi phía Đông lớp, tọa độ thế giới (cục bộ (3.3,-1.6) → (3.3,1.9)):
    // cách cột bàn phía Đông (x cục bộ 2.2) ~0.9 m, không vướng bàn/ghế.
    const walkA = { x: -25.45, z: -22.63 };
    const walkB = { x: -24.25, z: -19.35 };
    const teacherHome = { x: -28.45, z: -21.22 };
    function setMode(m) {
      if (m === 'teach' || m === 'read' || m === 'walk') mode = m;
      return mode;
    }
    npcs.push({
      id: 'teacher',
      name: 'Thầy Đồ Lâm',
      role: 'Thầy đồ dạy chữ Hán ở trường làng',
      group,
      home: { x: -28.45, z: -21.22 },
      setMode,
      get mode() { return mode; },
      update(dt, t) {
        const step = Math.min(Math.max(dt || 0, 0), 0.05);
        t0 += step;
        const time = typeof t === 'number' ? t : t0;
        const breathe = Math.sin(time * 1.8) * 0.012;
        if (mode === 'walk') {
          // Đi chậm qua lại dọc lối phía Đông lớp
          walkPos += step * 0.13 * walkDir;
          if (walkPos >= 1) { walkPos = 1; walkDir = -1; }
          if (walkPos <= 0) { walkPos = 0; walkDir = 1; }
          const x = walkA.x + (walkB.x - walkA.x) * walkPos;
          const z = walkA.z + (walkB.z - walkA.z) * walkPos;
          group.position.set(x, 0, z);
          group.rotation.y = walkDir > 0 ? 0.35 : -2.79;
          walkPhase += step * 5;
          const s = Math.sin(walkPhase);
          leftLeg.rotation.x = s * 0.35;
          rightLeg.rotation.x = -s * 0.35;
          leftArm.rotation.x = -s * 0.25;
          rightArm.rotation.x = s * 0.25 - 0.4;
          body.position.y = Math.abs(Math.cos(walkPhase)) * 0.02 + breathe * 0.5;
          head.rotation.x = 0.05;
          head.rotation.y = 0;
        } else if (mode === 'read') {
          // Đọc sách trước lớp, quay mặt về phía học trò (hướng Nam)
          group.position.set(teacherHome.x, 0, teacherHome.z);
          group.rotation.y = 0.35;
          leftLeg.rotation.x = 0;
          rightLeg.rotation.x = 0;
          body.position.y = breathe;
          head.rotation.x = 0.18 + Math.sin(time * 1.2) * 0.06;
          head.rotation.y = Math.sin(time * 0.5) * 0.08;
          rightArm.rotation.x = -0.85 + Math.sin(time * 1.2) * 0.05;
          leftArm.rotation.x = -0.35 + Math.sin(time * 1.8) * 0.03;
        } else {
          // 'teach' (mặc định): đứng trước bảng, tay phải giơ chỉ bảng
          group.position.set(teacherHome.x, 0, teacherHome.z);
          group.rotation.y = -2.79;
          leftLeg.rotation.x = 0;
          rightLeg.rotation.x = 0;
          body.position.y = breathe;
          head.rotation.x = -0.06 + Math.sin(time * 0.9) * 0.04;
          head.rotation.y = Math.sin(time * 0.4) * 0.1;
          rightArm.rotation.x = -1.9 + Math.sin(time * 1.1) * 0.1;
          rightArm.rotation.z = -0.1;
          leftArm.rotation.x = -0.2 + Math.sin(time * 1.8) * 0.03;
        }
      },
    });
  }

  // --- 2. Cô Bán Bánh — áo xanh lá, khăn hồng, tạp dề, khay bánh ---
  {
    const robeMat = mat(0x2e7d4f, 0.8); // xanh lá
    const human = buildHuman({
      robeMat, trimMat: mat(0xd95f7a, 0.8), pantsMat: mat(0x2a2a33, 0.8),
      hairStyle: 'seller', beltColor: 0xd95f7a, name: 'Cô Bán Bánh',
      hemY: 0.55, hemR: 0.24,
    });
    const { group, body, head, leftArm, rightArm, leftLeg, rightLeg } = human;
    // Tạp dề: hình cầu dẹt (mặt trước thân) màu kem
    const apron = sphere(0.19, PAPER, 0, 1.05, 0.14, 1, 1.25, 0.45);
    body.add(apron);
    group.position.set(-14, 0, 12);
    group.rotation.y = Math.atan2(0 - (-14), 0 - 12);
    scene.add(group);

    // Khay bánh trên tay trái: trụ dẹt + 5 chiếc bánh hình cầu nhỏ
    const tray = new THREE.Group();
    tray.add(cyl(0.20, 0.20, 0.02, LEATHER, 0, 0, 0));
    const cakeMat = mat(0xe8b96a, 0.7);
    const cakePos = [[-0.09, 0.03, -0.05], [0.09, 0.03, -0.05], [0, 0.03, 0.08], [-0.09, 0.03, 0.08], [0.09, 0.03, 0.08]];
    // Bánh: hình cầu dẹt, có bánh nhân đỏ ở giữa
    for (const [cx, cy, cz] of cakePos) {
      tray.add(sphere(0.045, cakeMat, cx, cy, cz, 1, 0.6, 1));
    }
    tray.add(sphere(0.02, mat(0x8c2f2f, 0.7), 0, 0.055, 0.08, 1, 0.6, 1));
    tray.position.set(0, -0.60, 0.04);
    leftArm.add(tray);
    leftArm.rotation.x = -1.15; // giơ khay ra trước, giữ ngang
    leftArm.rotation.z = 0.12;

    let t0 = 0;
    npcs.push({
      id: 'seller',
      name: 'Cô Bán Bánh',
      role: 'Bán bánh ở chợ làng',
      group,
      home: { x: -14, z: 12 },
      update(dt, t) {
        const step = Math.min(Math.max(dt || 0, 0), 0.05);
        t0 += step;
        const time = typeof t === 'number' ? t : t0;
        // Thở nhẹ; tay phải lên xuống làm bánh, tay trái giữ khay steady
        body.position.y = Math.sin(time * 2.0) * 0.012;
        rightArm.rotation.x = -0.55 + Math.sin(time * 2.4) * 0.35;
        rightArm.rotation.z = -0.10;
        leftArm.rotation.x = -1.15 + Math.sin(time * 2.0) * 0.03;
        head.rotation.y = Math.sin(time * 0.7) * 0.12; // ngó khách qua lại
        head.rotation.x = Math.sin(time * 1.4) * 0.03;
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
      },
    });
  }

  // --- 2b. Ông Trà — chủ quán trà 茶館, áo xanh ngọc đậm, tóc bạc + râu
  // trắng, cầm ấm trà (giai đoạn B — Phố Hoa) ---
  {
    const robeMat = mat(0x2f5d50, 0.8); // xanh ngọc đậm
    const human = buildHuman({
      robeMat, trimMat: GOLD, pantsMat: mat(0x2a2a33, 0.8),
      hairStyle: 'elder', beard: true, beltColor: 0x8c2f2f, name: 'Ông Trà',
    });
    const { group, body, head, leftArm, rightArm, leftLeg, rightLeg } = human;
    // Trước quán trà 茶館 (-36,-8): đứng ở (-32.6,-3.6) — ngoài collider nhà
    // (r 3.41) và bàn trà (-33,-5.5, r 1.0), quay mặt về làng, đi tới được.
    group.position.set(-32.6, 0, -3.6);
    group.rotation.y = Math.atan2(0 - (-32.6), 0 - (-3.6));
    scene.add(group);

    // Ấm trà nhỏ cầm tay phải: thân cầu + vòi + quai
    const teapot = new THREE.Group();
    teapot.add(sphere(0.07, mat(0x3a5a8c, 0.5), 0, 0, 0));
    const spout = cyl(0.012, 0.02, 0.12, mat(0x3a5a8c, 0.5), 0.08, 0.03, 0);
    spout.rotation.z = -0.9;
    teapot.add(spout);
    teapot.add(torus(0.045, 0.01, mat(0x3a5a8c, 0.5), -0.075, 0.01, 0));
    teapot.position.set(0, -0.58, 0.05);
    rightArm.add(teapot);
    rightArm.rotation.x = -0.7; // giơ ấm trà ra trước
    rightArm.rotation.z = -0.12;
    leftArm.rotation.x = -0.3;

    let t0 = 0;
    npcs.push({
      id: 'teaOwner',
      name: 'Ông Trà',
      role: 'Chủ quán trà trước quán trà',
      group,
      home: { x: -32.6, z: -3.6 },
      update(dt, t) {
        const step = Math.min(Math.max(dt || 0, 0), 0.05);
        t0 += step;
        const time = typeof t === 'number' ? t : t0;
        // Đứng pha trà: thở nhẹ, tay phải nghiêng ấm rót trà nhịp nhàng
        body.position.y = Math.sin(time * 1.7) * 0.012;
        rightArm.rotation.x = -0.7 + Math.sin(time * 1.7) * 0.12;
        leftArm.rotation.x = -0.3 + Math.sin(time * 1.7) * 0.03;
        head.rotation.y = Math.sin(time * 0.6) * 0.12;
        head.rotation.x = Math.sin(time * 1.2) * 0.03;
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
      },
    });
  }

  // --- 2c. Anh Mì — chủ quán mì ở chợ, áo nâu cam, khăn trắng, bưng bát
  // mì (giai đoạn B — Phố Hoa) ---
  {
    const robeMat = mat(0xa85b32, 0.8); // nâu cam
    const human = buildHuman({
      robeMat, trimMat: mat(0xf5ead0, 0.85), pantsMat: mat(0x2a2a33, 0.8),
      hairStyle: 'chef', beltColor: 0x2e7d4f, name: 'Anh Mì',
      hemY: 0.55, hemR: 0.24,
    });
    const { group, body, head, leftArm, rightArm, leftLeg, rightLeg } = human;
    // Tạp dề kem như cô bán bánh (đổi màu áo/khăn/đạo cụ để phân biệt)
    const apron = sphere(0.19, PAPER, 0, 1.05, 0.14, 1, 1.25, 0.45);
    body.add(apron);
    // Phía Đông chợ, ngoài collider các sạp (r 1.4): (-9,11.5), quay mặt
    // về làng, không chắn lối đi giữa các sạp.
    group.position.set(-9, 0, 11.5);
    group.rotation.y = Math.atan2(0 - (-9), 0 - 11.5);
    scene.add(group);

    // Bát mì trên tay trái: bát + sợi mì + đôi đũa
    const bowl = new THREE.Group();
    bowl.add(cyl(0.13, 0.09, 0.09, mat(0xe8e0d0, 0.4), 0, 0, 0));
    const noodleMat = mat(0xe8b96a, 0.7);
    [-0.04, 0.03].forEach((nx) => {
      const strand = torus(0.05, 0.012, noodleMat, nx, 0.05, 0);
      strand.rotation.x = Math.PI / 2;
      bowl.add(strand);
    });
    [-1, 1].forEach((s) => {
      const stick = cyl(0.008, 0.006, 0.22, LEATHER, s * 0.03, 0.12, 0.02);
      stick.rotation.z = s * 0.15;
      stick.rotation.x = 0.25;
      bowl.add(stick);
    });
    bowl.position.set(0, -0.60, 0.04);
    leftArm.add(bowl);
    leftArm.rotation.x = -1.15; // bưng bát ra trước, giữ ngang
    leftArm.rotation.z = 0.12;

    let t0 = 0;
    npcs.push({
      id: 'noodleOwner',
      name: 'Anh Mì',
      role: 'Chủ quán mì ở chợ làng',
      group,
      home: { x: -9, z: 11.5 },
      update(dt, t) {
        const step = Math.min(Math.max(dt || 0, 0), 0.05);
        t0 += step;
        const time = typeof t === 'number' ? t : t0;
        // Thở nhẹ; tay phải khuấy mì, tay trái bưng bát giữ steady
        body.position.y = Math.sin(time * 2.0) * 0.012;
        rightArm.rotation.x = -0.55 + Math.sin(time * 2.4) * 0.3;
        rightArm.rotation.z = -0.10;
        leftArm.rotation.x = -1.15 + Math.sin(time * 2.0) * 0.03;
        head.rotation.y = Math.sin(time * 0.7) * 0.12;
        head.rotation.x = Math.sin(time * 1.4) * 0.03;
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
      },
    });
  }

  // --- 3. Anh Đưa Thư — áo nâu vàng, mũ rơm, túi thư chéo vai, tuần tra ---
  {
    const robeMat = mat(0x9a7b3a, 0.8); // nâu vàng
    const human = buildHuman({
      robeMat, trimMat: mat(0x5a3a1a, 0.8), pantsMat: mat(0x4a3826, 0.8),
      hairStyle: 'courier', beltColor: 0x5a3a1a, name: 'Anh Đưa Thư',
      hemY: 0.55, hemR: 0.23,
    });
    const { group, body, head, leftArm, rightArm, leftLeg, rightLeg } = human;

    // Túi thư chéo vai: dây đeo (trụ mảnh chéo ngực) + túi hình cầu dẹt ở hông
    const strap = cyl(0.014, 0.014, 0.62, LEATHER, -0.05, 1.18, 0.16);
    strap.rotation.z = 0.65;
    strap.rotation.x = 0.15;
    body.add(strap);
    const bag = sphere(0.13, mat(0x6b4a22, 0.85), -0.24, 0.92, 0.06, 1, 1.25, 0.55);
    body.add(bag);
    const flap = sphere(0.13, mat(0x8a6234, 0.85), -0.24, 0.98, 0.10, 1, 0.6, 0.5);
    body.add(flap);

    // Tuần tra quanh trung tâm làng theo đường tròn bán kính 11
    const RADIUS = 11;
    const ANGULAR_SPEED = 0.11; // rad/s — đi bộ chậm
    let theta = 0;
    let phase = 0;
    let t0 = 0;
    group.position.set(RADIUS, 0, 0);
    group.rotation.y = Math.atan2(-Math.sin(theta), Math.cos(theta));
    scene.add(group);

    npcs.push({
      id: 'courier',
      name: 'Anh Đưa Thư',
      role: 'Đưa thư đi khắp làng',
      group,
      home: { x: RADIUS, z: 0 },
      update(dt, t) {
        const step = Math.min(Math.max(dt || 0, 0), 0.05);
        t0 += step;
        const time = typeof t === 'number' ? t : t0;
        // Đi vòng tròn quanh làng
        theta += step * ANGULAR_SPEED;
        const x = Math.cos(theta) * RADIUS;
        const z = Math.sin(theta) * RADIUS;
        group.position.set(x, 0, z);
        // Quay mặt theo hướng tiếp tuyến của đường tròn
        group.rotation.y = Math.atan2(-Math.sin(theta), Math.cos(theta));
        // Đi bộ: chân tay đu đưa
        phase += step * 7;
        const s = Math.sin(phase);
        leftLeg.rotation.x = s * 0.5;
        rightLeg.rotation.x = -s * 0.5;
        leftArm.rotation.x = -s * 0.4;
        rightArm.rotation.x = s * 0.4;
        body.position.y = Math.abs(Math.cos(phase)) * 0.03 + Math.sin(time * 1.8) * 0.008;
        head.rotation.x = Math.sin(time * 1.1) * 0.04;
      },
    });
  }

  // --- 4-6. Học trò ngồi học trong lớp (Phase 4) ---
  // Ngồi trên ghế ở bàn học sinh, quay mặt về bảng đen (rotY ≈ -2.79).
  // Tọa độ thế giới đã quy đổi từ tọa độ cục bộ trong lớp (tâm (-28,-20),
  // rotY 0.35): vị trí ghế = bàn + 0.62 m về phía Nam cục bộ.
  function makeSeatedStudent(id, name, robeColor, wx, wz) {
    const human = buildHuman({
      robeMat: mat(robeColor, 0.8), trimMat: GOLD, pantsMat: mat(0x2a2a33, 0.8),
      hairStyle: 'scholar', beltColor: 0xd4af37, name,
      hemY: 0.55, hemR: 0.24,
    });
    const { group, body, head, leftArm, rightArm, leftLeg, rightLeg } = human;
    group.position.set(wx, -0.42, wz); // hạ thấp: hông ngang mặt ghế (~0.43 m)
    group.rotation.y = -2.79; // quay mặt về bảng đen
    scene.add(group);
    // Tư thế ngồi: chân gập về trước, tay đặt trên bàn/sách, đầu hơi cúi
    leftLeg.rotation.x = -1.1;
    rightLeg.rotation.x = -1.05;
    leftArm.rotation.x = -1.2;
    rightArm.rotation.x = -1.15;
    leftArm.rotation.z = 0.15;
    rightArm.rotation.z = -0.15;
    head.rotation.x = 0.22;
    // Quyển sách mở cầm trước ngực
    const book = new THREE.Group();
    const pageMat = mat(0xf5ead0, 0.9);
    [-1, 1].forEach((s) => {
      const page = sphere(0.09, pageMat, s * 0.08, 0, 0, 1, 0.12, 1.4);
      page.rotation.z = -s * 0.2;
      book.add(page);
    });
    book.position.set(0, 1.02, 0.3);
    book.rotation.x = -0.45;
    body.add(book);
    let t0 = 0;
    npcs.push({
      id, name,
      role: 'Học trò trong lớp',
      group,
      home: { x: wx, z: wz },
      update(dt, t) {
        const step = Math.min(Math.max(dt || 0, 0), 0.05);
        t0 += step;
        const time = typeof t === 'number' ? t : t0;
        // Chỉ thở nhẹ + cúi đầu đọc, thỉnh thoảng lật sách (tay phải nhấc nhẹ)
        body.position.y = Math.sin(time * 1.7) * 0.01;
        head.rotation.x = 0.22 + Math.sin(time * 0.9) * 0.05;
        head.rotation.y = Math.sin(time * 0.45) * 0.06;
        const flip = Math.max(0, Math.sin(time * 0.5));
        rightArm.rotation.x = -1.15 + flip * 0.18;
        leftArm.rotation.x = -1.2 + Math.sin(time * 1.7) * 0.02;
        leftLeg.rotation.x = -1.1;
        rightLeg.rotation.x = -1.05;
      },
    });
  }
  makeSeatedStudent('student1', 'Học Trò An', 0x2e7d4f, -30.13, -19.41);
  makeSeatedStudent('student2', 'Học Trò Bình', 0x8c5a2e, -28.06, -20.17);
  makeSeatedStudent('student3', 'Học Trò Cường', 0x5a3a6e, -25.38, -19.23);

  // --- 7. Quan Khảo Thí — đứng ở sân trường thi (Phase 4) ---
  {
    const robeMat = mat(0x8c1f28, 0.8); // quan phục đỏ sẫm
    const human = buildHuman({
      robeMat, trimMat: GOLD, pantsMat: mat(0x2a1a1a, 0.8),
      hairStyle: 'teacher', beard: true, beltColor: 0xd4af37, name: 'Quan Khảo Thí',
    });
    const { group, body, head, leftArm, rightArm } = human;
    group.position.set(50, 0, -46);
    group.rotation.y = Math.PI; // quay mặt về trường thi (hướng Bắc)
    scene.add(group);
    // Cuộn chiếu chỉ cầm tay phải
    const edict = new THREE.Group();
    const roll = cyl(0.05, 0.05, 0.34, PAPER, 0, 0, 0);
    roll.rotation.z = Math.PI / 2;
    edict.add(roll);
    edict.add(torus(0.053, 0.008, mat(0x8c2f2f, 0.7), -0.09, 0, 0));
    edict.children[edict.children.length - 1].rotation.y = Math.PI / 2;
    edict.position.set(0, -0.58, 0.06);
    rightArm.add(edict);
    rightArm.rotation.x = -0.85;
    rightArm.rotation.z = -0.15;
    leftArm.rotation.x = -0.25;
    let t0 = 0;
    npcs.push({
      id: 'examiner',
      name: 'Quan Khảo Thí',
      role: 'Coi thi ở trường thi phía Đông sông',
      group,
      home: { x: 50, z: -46 },
      update(dt, t) {
        const step = Math.min(Math.max(dt || 0, 0), 0.05);
        t0 += step;
        const time = typeof t === 'number' ? t : t0;
        // Đứng yên canh thi: thở nhẹ, thỉnh thoảng đảo mắt quan sát
        body.position.y = Math.sin(time * 1.6) * 0.012;
        head.rotation.y = Math.sin(time * 0.4) * 0.25;
        head.rotation.x = Math.sin(time * 1.1) * 0.03;
        rightArm.rotation.x = -0.85 + Math.sin(time * 1.2) * 0.04;
        leftArm.rotation.x = -0.25 + Math.sin(time * 1.6) * 0.02;
      },
    });
  }

  return npcs;
}

// ---------------------------------------------------------------------------
// DÂN LÀNG ĐI LẠI (chỉ trang trí, không tham gia nhiệm vụ/hội thoại)
// ---------------------------------------------------------------------------
// Đi chậm theo vòng waypoints, dừng nghỉ ở mỗi điểm. KHÔNG nằm trong mảng
// `npcs` nên không bị click-to-move nhắm tới, không mở hội thoại, không
// ảnh hưởng nhiệm vụ — chỉ làm làng có sức sống.
export function createVillagers(scene) {
  const villagers = [];

  function makeWalker({ name, robeColor, trimColor, pantsColor, hairStyle, waypoints, speed = 1.0, prop }) {
    const human = buildHuman({
      robeMat: mat(robeColor, 0.8), trimMat: mat(trimColor, 0.8), pantsMat: mat(pantsColor, 0.8),
      hairStyle, beltColor: trimColor, name, hemY: 0.55, hemR: 0.24,
    });
    const { group, body, head, leftArm, rightArm, leftLeg, rightLeg } = human;
    if (typeof prop === 'function') prop({ group, body, head, leftArm, rightArm });
    group.position.set(waypoints[0].x, 0, waypoints[0].z);
    scene.add(group);
    let wp = 1, pause = 0, phase = 0, t0 = 0;
    villagers.push({
      id: 'villager-' + villagers.length,
      name,
      group,
      update(dt, t) {
        const step = Math.min(Math.max(dt || 0, 0), 0.05);
        t0 += step;
        const time = typeof t === 'number' ? t : t0;
        if (pause > 0) {
          pause -= step;
          body.position.y = Math.sin(time * 1.8) * 0.012;
          // Dừng nghỉ: chân tay về tư thế đứng tự nhiên
          leftLeg.rotation.x *= 0.85;
          rightLeg.rotation.x *= 0.85;
          leftArm.rotation.x *= 0.85;
          rightArm.rotation.x *= 0.85;
          return;
        }
        const target = waypoints[wp];
        const dx = target.x - group.position.x, dz = target.z - group.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.4) {
          wp = (wp + 1) % waypoints.length;
          pause = 1.5 + Math.random() * 2;
          return;
        }
        const vx = dx / d, vz = dz / d;
        group.position.x += vx * speed * step;
        group.position.z += vz * speed * step;
        group.rotation.y = Math.atan2(vx, vz);
        phase += step * 6.5;
        const s = Math.sin(phase);
        leftLeg.rotation.x = s * 0.45;
        rightLeg.rotation.x = -s * 0.45;
        leftArm.rotation.x = -s * 0.35;
        rightArm.rotation.x = s * 0.35;
        body.position.y = Math.abs(Math.cos(phase)) * 0.025 + Math.sin(time * 1.8) * 0.008;
      },
    });
  }

  // Bà Lão Mai — áo tím xám, tóc bạc, xách giỏ đi chợ → giếng → sân trường.
  makeWalker({
    name: 'Bà Lão Mai', robeColor: 0x6e5a7e, trimColor: 0xd4af37, pantsColor: 0x3a3340,
    hairStyle: 'elder', speed: 0.85,
    waypoints: [{ x: -14, z: 10 }, { x: -5, z: -5 }, { x: -26, z: -15 }, { x: -14, z: 10 }],
    prop: ({ leftArm }) => {
      const basket = new THREE.Group();
      basket.add(cyl(0.13, 0.10, 0.14, mat(0xb98d4f, 0.95), 0, 0, 0));
      basket.add(sphere(0.05, mat(0x8ec63f, 0.7), -0.04, 0.09, 0, 1, 0.7, 1));
      basket.add(sphere(0.05, mat(0xe74c3c, 0.7), 0.05, 0.09, 0.02, 1, 0.7, 1));
      basket.position.set(0, -0.58, 0.04);
      leftArm.add(basket);
      leftArm.rotation.x = -0.5;
    },
  });

  // Anh Nông Dân — áo nâu xanh, mũ rơm, vác cuốc đi ruộng → chợ → đầu cầu.
  makeWalker({
    name: 'Anh Nông Dân', robeColor: 0x5a6b3a, trimColor: 0x8a6234, pantsColor: 0x4a3826,
    hairStyle: 'courier', speed: 1.15,
    waypoints: [{ x: -35, z: 35 }, { x: -12, z: 8 }, { x: 16, z: 0 }, { x: -12, z: 8 }],
    prop: ({ rightArm }) => {
      const hoe = new THREE.Group();
      hoe.add(cyl(0.02, 0.02, 0.85, LEATHER, 0, 0, 0));
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.03), mat(0x777777, 0.4, 0.6));
      blade.position.set(0, 0.48, 0);
      hoe.add(blade);
      hoe.position.set(0, -0.55, 0.05);
      hoe.rotation.x = 0.5;
      rightArm.add(hoe);
      rightArm.rotation.x = -0.3;
    },
  });

  // Cô Gái Trẻ — áo chàm, khăn hồng, đội gói vải đi quanh nhà dân → giếng.
  makeWalker({
    name: 'Cô Gái Trẻ', robeColor: 0x2e6b7a, trimColor: 0xd95f7a, pantsColor: 0x2a2a33,
    hairStyle: 'seller', speed: 1.05,
    waypoints: [{ x: -36, z: 18 }, { x: -5, z: -5 }, { x: 10, z: 18 }, { x: -36, z: 18 }],
    prop: ({ head }) => {
      // Gói vải đội đầu
      head.add(sphere(0.09, mat(0x2e7d4f, 0.85), 0, 0.26, 0, 1, 0.7, 1));
    },
  });

  return villagers;
}

