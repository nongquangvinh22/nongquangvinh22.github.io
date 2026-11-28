// Hán Lâm Ký (汉林记) — main.js: vòng lặp game, camera, điều khiển, va chạm,
// hội thoại và tích hợp môi trường / nhân vật / gameplay.
// © Nông Quang Vinh
import * as THREE from 'three';
import { createEnvironment } from './environment.js';
import { createPlayer, createNPCs, createVillagers } from './characters.js';
import {
  QUESTS, getRank, loadSave, saveGame, getDialogue, completeOrder,
  renderStudyBook, speakChinese, updateHUD, showToast,
  recordWrongAnswer, blackboardForLesson, teacherModeNow, speakTone,
  currentClass, scheduleBlackboard
} from './gameplay.js';
import { openCalligraphy } from './calligraphy.js';

// ---------------------------------------------------------------------------
// Trạng thái lưu
// ---------------------------------------------------------------------------
const saved = loadSave();
let state = { ...saved, completed: [...saved.completed] };

// ---------------------------------------------------------------------------
// Renderer / Scene / Camera
// ---------------------------------------------------------------------------
const container = document.getElementById('game-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);

// ---------------------------------------------------------------------------
// Môi trường + NPC (người chơi tạo sau khi nhập tên ở màn hình bắt đầu)
// ---------------------------------------------------------------------------
const env = createEnvironment(scene);
const colliders = env.colliders || [];
const npcs = createNPCs(scene);
const villagers = createVillagers(scene); // dân làng đi lại (trang trí, không nhiệm vụ)
let player = null;
let started = false;

// ---------------------------------------------------------------------------
// Camera người thứ ba: yaw / pitch / khoảng cách, mượt theo mục tiêu
// ---------------------------------------------------------------------------
let camYaw = 0;            // 0 = camera ở phía Nam, nhìn về Bắc
let camPitch = 0.38;       // góc ngẩng (rad)
let camDist = 11;          // zoom hiện tại (mượt dần về mục tiêu), 6..18
let camDistTarget = 11;    // zoom mục tiêu (lăn chuột đặt mục tiêu, không nhảy)
let camDistEff = 11;       // khoảng cách thực sau va chạm camera
const camTarget = new THREE.Vector3(0, 1.6, 0);
const desiredTarget = new THREE.Vector3(0, 1.6, 0);

// Va chạm camera: tia từ mục tiêu tới camera chạm collider (hình trụ đứng,
// coi như cao ~6.5 m — mái nhà) thì kéo camera lại gần, không xuyên tường/mái.
// Trả về giới hạn camDist lớn nhất cho phép (Infinity = không chạm).
function cameraCollisionLimit() {
  const cp = Math.cos(camPitch);
  if (cp < 0.05) return Infinity;
  const dx = Math.sin(camYaw), dz = Math.cos(camYaw); // hướng ngang mục tiêu -> camera
  const tx = camTarget.x, tz = camTarget.z;
  let limit = Infinity;
  for (const c of colliders) {
    const rx = c.x - tx, rz = c.z - tz;
    const t = rx * dx + rz * dz; // khoảng cách dọc tia tới điểm gần tâm nhất
    if (t <= 0) continue;
    const rad = c.r + 0.5;
    const closestSq = rx * rx + rz * rz - t * t;
    if (closestSq >= rad * rad) continue;
    const entry = t - Math.sqrt(rad * rad - closestSq);
    if (entry <= 0) continue;
    // Chiều cao camera tại điểm vào collider: đã vượt mái thì không chặn.
    const yAt = camTarget.y + Math.tan(camPitch) * entry;
    if (yAt > 6.5) continue;
    limit = Math.min(limit, Math.max(1.2, entry - 0.4) / cp);
  }
  return limit;
}

function updateCamera(dt) {
  const focus = player ? player.group.position : new THREE.Vector3(0, 0, 0);
  desiredTarget.set(focus.x, focus.y + 1.6, focus.z);
  camTarget.lerp(desiredTarget, 1 - Math.pow(0.001, dt)); // mượt
  // Zoom mượt: lerp về mục tiêu thay vì nhảy ngay khi lăn chuột.
  camDist += (camDistTarget - camDist) * (1 - Math.pow(0.001, dt));
  // Trong nhà thì kéo camera lại gần (tối đa 7.5 m) để không chui qua tường
  // đối diện; mái + trần đã được ẩn bởi updateIndoor() nên nhìn xuyên được.
  const maxDist = indoorBuilding ? 7.5 : Infinity;
  // Va chạm: kéo lại gần khi sắp xuyên nhà/tường; kéo vào nhanh, nhả ra mượt.
  const effTarget = Math.min(camDist, maxDist, cameraCollisionLimit());
  const effRate = effTarget < camDistEff ? 0.00001 : 0.001;
  camDistEff += (effTarget - camDistEff) * (1 - Math.pow(effRate, dt));
  const dist = Math.max(2.0, camDistEff); // tối thiểu 2 m: vẫn thấy rõ nhân vật
  const cp = Math.cos(camPitch), sp = Math.sin(camPitch);
  camera.position.set(
    camTarget.x + Math.sin(camYaw) * cp * dist,
    camTarget.y + sp * dist,
    camTarget.z + Math.cos(camYaw) * cp * dist
  );
  camera.lookAt(camTarget);
}

// ---------------------------------------------------------------------------
// Điều khiển
// ---------------------------------------------------------------------------
const keys = new Set();
let runHeld = false; // nút RUN (mobile): giữ để chạy
let clickTarget = null;      // {x, z, run}
let clickWaypoints = [];     // hàng đợi điểm trung gian (đi qua cầu, xem routeClickTarget)
let pendingNpcId = null;
let dialogueOpen = false;
let currentDialogue = null;  // {npcId, quest}
let listenText = '你好';

// Tòa nhà người chơi đang đứng trong (trường học / trường thi): mái + trần
// của tòa đó được ẩn để camera trên cao nhìn xuyên vào trong được, thay vì
// bị mái che 60–70% màn hình (kiểm thử 27/11).
let indoorBuilding = null;
function updateIndoor() {
  try {
    if (!player || !env || typeof env.buildingAt !== 'function') return;
    const p = player.group.position;
    const b = env.buildingAt(p.x, p.z);
    if (b !== indoorBuilding) {
      if (indoorBuilding) {
        if (indoorBuilding.roof) indoorBuilding.roof.visible = true;
        if (indoorBuilding.ceil) indoorBuilding.ceil.visible = true;
      }
      indoorBuilding = b;
      if (indoorBuilding) {
        if (indoorBuilding.roof) indoorBuilding.roof.visible = false;
        if (indoorBuilding.ceil) indoorBuilding.ceil.visible = false;
      }
    }
  } catch (_err) { /* ẩn mái là phụ: không vỡ game */ }
}

// Click sang bờ bên kia sông thì đi qua cầu (22, 0) trước: đi thẳng sẽ đâm
// vào dải sông (x 17.8–26.2, chỉ |z| ≤ 2.2 mới qua được) và kẹt ở bờ tây,
// đúng như kiểm thử 27/11 ghi nhận. Đích thật nằm trong hàng đợi.
const RIVER_X0 = 17.8, RIVER_X1 = 26.2;
function routeClickTarget(tx, tz, run, npc) {
  clickWaypoints = [];
  const pos = player ? player.group.position : { x: 0, z: 0 };
  const crosses = (pos.x < RIVER_X0 && tx > RIVER_X1) || (pos.x > RIVER_X1 && tx < RIVER_X0);
  clickTarget = { x: tx, z: tz, run: !!run, npc: !!npc };
  if (crosses) {
    clickWaypoints.push(clickTarget);
    clickTarget = { x: 22, z: 0, run: !!run, npc: false };
  }
}

// Bảng mở có chặn di chuyển không? (hội thoại hoặc sổ học tập)
function isStudyOpen() {
  const el = document.getElementById('study-panel');
  return !!el && !el.classList.contains('hidden');
}
function isInputBlocked() { return dialogueOpen || isStudyOpen(); }

// Xóa toàn bộ trạng thái di chuyển đang giữ — chống nhân vật tự trôi khi
// mở hội thoại, mất focus cửa sổ, hoặc nhấn Esc.
function clearKeys() {
  keys.clear();
  clickTarget = null;
  clickWaypoints = [];
  pendingNpcId = null;
  runHeld = false;
  if (typeof joyReset === 'function') joyReset();
}

const WALK_SPEED = 4.2;
const RUN_SPEED = 7.6;

window.addEventListener('keydown', (e) => {
  if (!started) return;
  // Chỉ bỏ qua phím khi đang gõ tên ở màn hình bắt đầu: ô tên đã ẩn sau khi
  // vào game thì không được chặn phím nữa, dù focus có kẹt trong đó.
  const startVisible = !document.getElementById('start-screen').classList.contains('hidden');
  if (startVisible && e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.code === 'Escape') { clearKeys(); closeAllPanels(); return; }
  if (isInputBlocked()) return; // đang đọc hội thoại / sổ: không nhận phím đi
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.code === 'KeyE') interactNearest();
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
// Mất focus / ẩn tab: phím đang giữ coi như đã thả (tránh trôi nhân vật).
window.addEventListener('blur', () => { clearKeys(); rightDragging = false; downInfo = null; });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { clearKeys(); rightDragging = false; downInfo = null; }
});

function closeAllPanels() {
  document.getElementById('dialogue-panel').classList.add('hidden');
  document.getElementById('study-panel').classList.add('hidden');
  document.getElementById('help-panel').classList.add('hidden');
  dialogueOpen = false;
  currentDialogue = null;
  clearKeys();
}

// --- Chuột: click trái đi tới, double-click chạy, giữ phải xoay camera ---
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const pointerNDC = new THREE.Vector2();
let downInfo = null;
let rightDragging = false;
let lastPointer = { x: 0, y: 0 };

function setPointerFromEvent(e) {
  const r = renderer.domElement.getBoundingClientRect();
  pointerNDC.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
}

renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (!started || dialogueOpen || isStudyOpen()) return;
  downInfo = { x: e.clientX, y: e.clientY, time: performance.now(), button: e.button, dragged: false };
  lastPointer = { x: e.clientX, y: e.clientY };
  if (e.button === 2) rightDragging = true;
});

renderer.domElement.addEventListener('pointermove', (e) => {
  // Kéo chuột trái >6px: hủy click-to-move đang có, không đặt mục tiêu mới.
  // (Click trái đơn không xoay camera — chỉ chuột phải giữ kéo mới xoay.)
  if (downInfo && downInfo.button === 0 && !downInfo.dragged) {
    if (Math.hypot(e.clientX - downInfo.x, e.clientY - downInfo.y) > 6) {
      downInfo.dragged = true;
      clickTarget = null;
    }
  }
  if (rightDragging && downInfo && downInfo.button === 2) {
    const dx = e.clientX - lastPointer.x;
    const dy = e.clientY - lastPointer.y;
    camYaw -= dx * 0.005;
    camPitch = Math.max(0.12, Math.min(1.15, camPitch + dy * 0.004));
  }
  lastPointer = { x: e.clientX, y: e.clientY };
});

function endPointer(e) {
  if (rightDragging && e.button === 2) rightDragging = false;
  if (!downInfo || downInfo.button !== 0 || !started || dialogueOpen || isStudyOpen()) { downInfo = null; return; }
  const moved = Math.hypot(e.clientX - downInfo.x, e.clientY - downInfo.y);
  const dtMs = performance.now() - downInfo.time;
  const wasDragged = downInfo.dragged;
  downInfo = null;
  if (wasDragged || moved > 6 || dtMs > 400) return;
  handleGroundClick(e);
}

renderer.domElement.addEventListener('pointerup', endPointer);
renderer.domElement.addEventListener('pointercancel', () => { downInfo = null; rightDragging = false; });

renderer.domElement.addEventListener('dblclick', (e) => {
  if (!started || dialogueOpen || isStudyOpen()) return;
  // Double-click: chạy tới điểm đã click (click đơn trước đó đã đặt mục tiêu đi bộ)
  if (clickTarget) clickTarget.run = true;
  else handleGroundClick(e, true);
});

renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  // Chỉ đặt mục tiêu zoom — updateCamera lerp camDist về đó nên zoom mượt.
  camDistTarget = Math.max(6, Math.min(18, camDistTarget * (1 + e.deltaY * 0.001)));
}, { passive: false });

function groundPointFromEvent(e) {
  setPointerFromEvent(e);
  raycaster.setFromCamera(pointerNDC, camera);
  const p = new THREE.Vector3();
  return raycaster.ray.intersectPlane(groundPlane, p) ? p : null;
}

function npcAtPoint(p) {
  // Click trúng NPC: kiểm tra khoảng cách tới điểm click (bền hơn raycast sprite)
  let best = null, bestD = 2.6;
  for (const npc of npcs) {
    const d = Math.hypot(npc.group.position.x - p.x, npc.group.position.z - p.z);
    if (d < bestD) { bestD = d; best = npc; }
  }
  return best;
}

function handleGroundClick(e, run = false) {
  const p = groundPointFromEvent(e);
  if (!p) return;
  // Ưu tiên raycast trực tiếp vào NPC
  setPointerFromEvent(e);
  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(npcs.map((n) => n.group), true);
  let npc = hits.length ? npcs.find((n) => hits[0].object === n.group || n.group.children.includes(hits[0].object) || isDescendant(n.group, hits[0].object)) : null;
  if (!npc) npc = npcAtPoint(p);
  if (npc) {
    pendingNpcId = npc.id;
    const np = npc.group.position;
    routeClickTarget(np.x, np.z, false, true);
    showToast('Đang đi tới ' + npc.name + '…');
    return;
  }
  pendingNpcId = null;
  routeClickTarget(p.x, p.z, run, false);
}

function isDescendant(root, obj) {
  let o = obj;
  while (o) { if (o === root) return true; o = o.parent; }
  return false;
}

// --- Joystick ảo (mobile): multi-touch thật, mỗi vùng một Pointer ID riêng ---
const joy = { active: false, pointerId: null, x: 0, y: 0 };
const joystickEl = document.getElementById('joystick');
const stickEl = document.getElementById('stick');
function joyUpdate(e) {
  const r = joystickEl.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = (e.clientX - cx) / (r.width / 2);
  let dy = (e.clientY - cy) / (r.height / 2);
  const len = Math.hypot(dx, dy);
  if (len > 1) { dx /= len; dy /= len; }
  joy.x = dx; joy.y = dy;
  stickEl.style.transform = `translate(calc(-50% + ${dx * 34}px), calc(-50% + ${dy * 34}px))`;
}
function joyReset() {
  joy.active = false; joy.pointerId = null; joy.x = 0; joy.y = 0;
  if (stickEl) stickEl.style.transform = 'translate(-50%, -50%)';
}
joystickEl.addEventListener('pointerdown', (e) => {
  if (joy.active) return; // đã có một ngón giữ joystick: ngón khác không cướp
  joy.active = true; joy.pointerId = e.pointerId;
  try { joystickEl.setPointerCapture(e.pointerId); } catch (_err) {}
  e.stopPropagation();
  joyUpdate(e);
});
joystickEl.addEventListener('pointermove', (e) => {
  if (!joy.active || e.pointerId !== joy.pointerId) return;
  joyUpdate(e);
});
function joyEnd(e) {
  if (e && joy.pointerId !== null && e.pointerId !== joy.pointerId) return;
  joyReset();
}
joystickEl.addEventListener('pointerup', joyEnd);
joystickEl.addEventListener('pointercancel', joyEnd);

// --- Vùng xoay camera cảm ứng (nửa phải màn hình): Pointer ID riêng ---
// Người chơi giữ joystick tay trái vẫn xoay camera tay phải cùng lúc.
const touchCamEl = document.getElementById('touch-camera');
let camPointerId = null;
const lastCamPointer = { x: 0, y: 0 };
if (touchCamEl) {
  touchCamEl.addEventListener('pointerdown', (e) => {
    if (camPointerId !== null) return; // một ngón đang xoay camera
    camPointerId = e.pointerId;
    lastCamPointer.x = e.clientX; lastCamPointer.y = e.clientY;
    try { touchCamEl.setPointerCapture(e.pointerId); } catch (_err) {}
    e.stopPropagation();
  });
  touchCamEl.addEventListener('pointermove', (e) => {
    if (camPointerId === null || e.pointerId !== camPointerId) return;
    const dx = e.clientX - lastCamPointer.x;
    const dy = e.clientY - lastCamPointer.y;
    lastCamPointer.x = e.clientX; lastCamPointer.y = e.clientY;
    camYaw -= dx * 0.005;
    camPitch = Math.max(0.12, Math.min(1.15, camPitch + dy * 0.005));
  });
  const camTouchEnd = (e) => { if (e.pointerId === camPointerId) camPointerId = null; };
  touchCamEl.addEventListener('pointerup', camTouchEnd);
  touchCamEl.addEventListener('pointercancel', camTouchEnd);
}

// --- Nút RUN: giữ để chạy (pointerdown/up, thả là hết chạy) ---
const btnRunEl = document.getElementById('btn-run');
if (btnRunEl) {
  btnRunEl.addEventListener('pointerdown', (e) => {
    runHeld = true; e.stopPropagation(); e.preventDefault();
  });
  const runEnd = (e) => { runHeld = false; if (e) e.stopPropagation(); };
  btnRunEl.addEventListener('pointerup', runEnd);
  btnRunEl.addEventListener('pointercancel', runEnd);
  btnRunEl.addEventListener('pointerleave', runEnd);
  btnRunEl.addEventListener('contextmenu', (e) => e.preventDefault());
}

// --- Nút tương tác (E): giữ nguyên id btn-e để không vỡ code cũ ---
// Trên mobile đổi nhãn thành "Tương tác" (CSS đổi nút tròn thành nút dài).
const btnEEl = document.getElementById('btn-e');
if (btnEEl) {
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    btnEEl.textContent = 'Tương tác';
  }
  btnEEl.addEventListener('click', () => interactNearest());
  btnEEl.addEventListener('pointerdown', (e) => e.stopPropagation());
}

// ---------------------------------------------------------------------------
// Va chạm: vòng tròn quanh nhà/cây/cột + dải sông (chỉ qua được bằng cầu).
// Trượt dọc tường: thử di chuyển X rồi Z riêng, chỉ giữ trục nào không va
// chạm — thay cho kiểu đẩy xuyên tâm cũ (dễ kẹt giữa 2 collider / bị đẩy
// vào sông khi đứng gần cầu).
function collidesAt(x, z) {
  // Sông x=18..26: chỉ qua được trên cầu (|z| <= 2.2)
  if (x > 17.8 && x < 26.2 && Math.abs(z) > 2.2) return true;
  // Giới hạn làng
  if (x < -68 || x > 68 || z < -68 || z > 68) return true;
  // Vòng tròn va chạm
  for (const c of colliders) {
    const dx = x - c.x, dz = z - c.z;
    const min = c.r + 0.45;
    if (dx * dx + dz * dz < min * min) return true;
  }
  return false;
}

function resolveCollisions(pos, prev) {
  // Trục X trước: va chạm thì giữ nguyên X cũ, vẫn cho trượt theo Z.
  if (collidesAt(pos.x, prev.z)) pos.x = prev.x;
  // Trục Z sau (dùng X đã chốt): va chạm thì giữ nguyên Z cũ.
  if (collidesAt(pos.x, pos.z)) pos.z = prev.z;
  pos.x = Math.max(-68, Math.min(68, pos.x));
  pos.z = Math.max(-68, Math.min(68, pos.z));
  return pos;
}

function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

// ---------------------------------------------------------------------------
// Hội thoại / bài học
// ---------------------------------------------------------------------------
// Cấp bậc: thử getRank(state) dạng object trước, fallback getRank(state.xp).
// gameplay.js hiện tại getRank(xp) chỉ nhận SỐ — getRank(object) bị ép về
// xp=0 nên luôn trả 学童. Probe dưới đây phát hiện điều đó (gọi thử với
// xp=99999: nếu object-mode hỗ trợ thật thì phải trả cấp cao nhất, còn
// không thì vẫn là 学童) và tự động dùng dạng object nếu gameplay sau này
// hỗ trợ. Không đổi API gameplay/environment/characters.
let rankObjectSupported = null;
function rankFor(s) {
  const xp = s && typeof s.xp === 'number' ? s.xp : 0;
  const fallback = getRank(xp);
  try {
    if (rankObjectSupported === null) {
      const probe = getRank({ xp: 99999 });
      const top = getRank(99999);
      rankObjectSupported = !!(probe && probe.name && top && probe.name === top.name);
    }
    if (rankObjectSupported) {
      const r = getRank(s);
      if (r && typeof r.name === 'string' && r.name) return r;
    }
  } catch (_err) { /* getRank(state) không hỗ trợ: dùng fallback số */ }
  return fallback;
}

function nearestNpc(maxDist) {
  if (!player) return null;
  let best = null, bestD = maxDist;
  for (const npc of npcs) {
    const d = Math.hypot(npc.group.position.x - player.group.position.x, npc.group.position.z - player.group.position.z);
    if (d < bestD) { bestD = d; best = npc; }
  }
  return best;
}

function interactNearest() {
  if (!started || dialogueOpen) return;

  // --- Hook Phase 4 (phòng thủ): cửa — env hiện CHƯA có env.doors nên
  // khối này bỏ qua hoàn toàn, game chạy bình thường. Khi Phase 4 thêm
  // env.doors = [{id,x,z,label,isOpen,toggle}], E gần cửa (<2.2 m) sẽ
  // toggle cửa thay vì nói chuyện NPC.
  try {
    const doors = env && env.doors;
    if (player && Array.isArray(doors)) {
      let best = null, bestD = 2.2;
      for (const d of doors) {
        if (!d || typeof d.x !== 'number' || typeof d.z !== 'number') continue;
        const dd = Math.hypot(d.x - player.group.position.x, d.z - player.group.position.z);
        if (dd < bestD) { bestD = dd; best = d; }
      }
      if (best) {
        if (typeof best.toggle === 'function') best.toggle();
        else if (typeof best.isOpen === 'boolean') best.isOpen = !best.isOpen;
        const isOpenNow = typeof best.isOpen === 'function' ? best.isOpen() : !!best.isOpen;
        showToast((isOpenNow ? 'Đã mở ' : 'Đã đóng ') + (best.label || 'cửa') + '.');
        return;
      }
    }
  } catch (_err) { /* doors chưa sẵn sàng: rơi xuống NPC như thường */ }

  // --- Hook Phase 4 (phòng thủ): bàn thi — env hiện CHƯA có env.examDesks.
  // Khi có, E gần bàn thi trống (<2.2 m) sẽ gọi sitAtExamDesk nếu gameplay
  // export hàm đó (dynamic import optional, try/catch, không vỡ game).
  try {
    const desks = env && env.examDesks;
    if (player && Array.isArray(desks)) {
      let best = null, bestD = 2.2;
      for (const dk of desks) {
        if (!dk || dk.occupied || typeof dk.x !== 'number' || typeof dk.z !== 'number') continue;
        const dd = Math.hypot(dk.x - player.group.position.x, dk.z - player.group.position.z);
        if (dd < bestD) { bestD = dd; best = dk; }
      }
      if (best) {
        import('./gameplay.js').then((m) => {
          if (typeof m.sitAtExamDesk === 'function') m.sitAtExamDesk(best);
          else showToast('Bàn thi chưa sẵn sàng.');
        }).catch(() => { showToast('Bàn thi chưa sẵn sàng.'); });
        return;
      }
    }
  } catch (_err) { /* examDesks chưa sẵn sàng: rơi xuống NPC như thường */ }

  const npc = nearestNpc(3.5);
  if (npc) openDialogue(npc.id);
  else showToast('Hãy lại gần một người trong làng rồi nhấn E.');
}

function openDialogue(npcId) {
  clearKeys(); // dừng di chuyển ngay khi hội thoại mở (chống trôi)
  const dlg = getDialogue(npcId, state);
  // Tích hợp Phase 5: thầy giảng thì bảng đen + tư thế thầy đổi theo bài.
  if (npcId === 'teacher') {
    try {
      const lessonId = dlg.quest ? dlg.quest.id : null;
      if (typeof blackboardForLesson === 'function' && env && typeof env.setBlackboardText === 'function') {
        const bb = blackboardForLesson(lessonId);
        if (bb && bb.hanzi) env.setBlackboardText(bb.hanzi, bb.pinyin || '');
      }
      if (typeof teacherModeNow === 'function') {
        const teacher = npcs.find((n) => n.id === 'teacher');
        // Tư thế thầy theo GIỜ HỌC THẬT (A2): trong giờ thì 'teach',
        // ngoài giờ thì 'read' — kể cả khi đang ôn bài cũ.
        if (teacher && typeof teacher.setMode === 'function') teacher.setMode(teacherModeNow(new Date(), state, lessonId));
      }
    } catch (_err) { /* bảng/tư thế thầy là phụ: không vỡ hội thoại */ }
  }
  currentDialogue = { npcId, quest: dlg.quest, order: dlg.order || null };
  dialogueOpen = true;
  // Chân dung thầy đồ (A1): chỉ hiện khi nói chuyện với thầy, các NPC
  // khác không có chân dung nên ẩn đi (kể cả khi vừa nói chuyện với thầy).
  const portraitEl = document.getElementById('dialogue-portrait');
  if (portraitEl) portraitEl.classList.toggle('hidden', npcId !== 'teacher');
  clickTarget = null;
  pendingNpcId = null;
  document.getElementById('dialogue-npc').textContent = dlg.npcName;
  document.getElementById('dialogue-text').textContent = dlg.greeting;
  const lessonEl = document.getElementById('dialogue-lesson');
  if (dlg.quest) {
    const q = dlg.quest;
    listenText = q.hanzi;
    lessonEl.classList.remove('hidden');
    document.getElementById('dialogue-hanzi').textContent = q.hanzi;
    document.getElementById('dialogue-pinyin').textContent = q.pinyin;
    document.getElementById('dialogue-meaning').textContent = 'Nghĩa: ' + q.meaning;
    const ex = q.example || { hanzi: q.exampleHanzi, pinyin: q.examplePinyin, meaning: q.exampleMeaning };
    document.getElementById('dialogue-example').innerHTML =
      '<span class="hanzi">' + escapeHtml(ex.hanzi) + '</span><br>' +
      escapeHtml(ex.pinyin) + ' — ' + escapeHtml(ex.meaning);
    document.getElementById('dialogue-question').textContent = q.question;
    const optsEl = document.getElementById('dialogue-options');
    optsEl.classList.remove('order-options');
    optsEl.innerHTML = '';
    (q.options || q.choices || []).forEach((opt, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = opt;
      b.addEventListener('click', () => answerQuiz(b, idx));
      optsEl.appendChild(b);
    });
  } else if (dlg.order) {
    // Giai đoạn B — Phố Hoa: gọi món bằng tiếng Trung. Dùng lại đúng panel
    // hội thoại cũ (chữ + Pinyin + nghĩa + nút nghe), chỉ đổi nội dung.
    const o = dlg.order;
    listenText = o.askHanzi; // nút 🔊 đọc câu hỏi của người bán
    lessonEl.classList.remove('hidden');
    document.getElementById('dialogue-hanzi').textContent = o.askHanzi;
    document.getElementById('dialogue-pinyin').textContent = o.askPinyin;
    document.getElementById('dialogue-meaning').textContent = 'Nghĩa: ' + o.askMeaning;
    document.getElementById('dialogue-example').innerHTML =
      'Bạn muốn gọi: <span class="hanzi">' + escapeHtml(o.item.hanzi) + '</span> (' +
      escapeHtml(o.item.pinyin) + ') — ' + escapeHtml(o.item.meaning) +
      '.<br>Thực đơn ' + escapeHtml(o.shopName) + ': ' + escapeHtml(o.menuText) +
      ' (đã gọi ' + o.progress.ordered + '/' + o.progress.total + ' món' +
      (o.progress.complete ? ' — đã thưởng thức hết thực đơn!' : '') + ')';
    document.getElementById('dialogue-question').textContent =
      'Bạn sẽ nói thế nào để gọi ' + o.item.hanzi + ' (' + o.item.meaning + ')?';
    const optsEl = document.getElementById('dialogue-options');
    optsEl.classList.add('order-options'); // câu gọi món dài: xếp 1 cột
    optsEl.innerHTML = '';
    o.options.forEach((opt, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = opt.hanzi + ' (' + opt.pinyin + ') — ' + opt.meaning;
      b.addEventListener('click', () => answerOrder(b, idx));
      optsEl.appendChild(b);
    });
  } else {
    listenText = '你好';
    lessonEl.classList.add('hidden');
    document.getElementById('dialogue-options').classList.remove('order-options');
    document.getElementById('dialogue-question').textContent = '';
  }
  document.getElementById('dialogue-panel').classList.remove('hidden');
}

function answerQuiz(btn, idx) {
  if (!currentDialogue || !currentDialogue.quest) return;
  const q = currentDialogue.quest;
  const correct = typeof q.correctIndex === 'number' ? q.correctIndex : 0;
  const optsEl = document.getElementById('dialogue-options');
  if (idx === correct) {
    btn.classList.add('correct');
    optsEl.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    if (!state.completed.includes(q.id)) {
      state.completed.push(q.id);
      state.xp += q.xp;
      state.currentQuest = null;
      saveGame(state);
      updateHUD(state);
    }
    document.getElementById('dialogue-question').textContent =
      'Chính xác! +' + q.xp + ' XP — Cấp bậc hiện tại: ' + rankFor(state).name;
    showToast('Hoàn thành nhiệm vụ: ' + q.title + ' (+' + q.xp + ' XP)');
  } else {
    btn.classList.add('wrong');
    btn.disabled = true;
    try { if (typeof recordWrongAnswer === 'function') recordWrongAnswer(state, q.id); } catch (_err) { /* ghi lỗi sai là phụ */ }
    showToast('Chưa đúng, hãy nghe lại phát âm và thử nhé!');
  }
}

function escapeHtml(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Giai đoạn B — Phố Hoa: trả lời câu gọi món.
// Sai → người bán sửa lỗi cụ thể (whyWrong), chỉ khóa nút vừa chọn, cho
// chọn lại, không trừ XP. Đúng → món vào kho đồ, cộng XP, cập nhật HUD.
function answerOrder(btn, idx) {
  if (!currentDialogue || !currentDialogue.order) return;
  const o = currentDialogue.order;
  const optsEl = document.getElementById('dialogue-options');
  const questionEl = document.getElementById('dialogue-question');
  if (idx === o.correctIndex) {
    btn.classList.add('correct');
    optsEl.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    let result = null;
    try {
      if (typeof completeOrder === 'function') result = completeOrder(state, o.shopId, o.item.id);
    } catch (_err) { /* cộng XP/lưu lỗi: vẫn báo đúng, món có thể chưa lưu */ }
    if (result) updateHUD(state);
    const xp = result ? result.xp : o.xpFirst;
    let msg = 'Chính xác! +' + xp + ' XP — Bạn nhận được ' + o.item.hanzi + ' (' + o.item.meaning + '), món đã vào kho đồ (xem trong Sổ học tập).';
    if (result && result.shopComplete) {
      msg += ' 🎉 Bạn đã thưởng thức hết thực đơn của ' + o.shopName + '!';
    } else if (result) {
      msg += ' Thực đơn ' + o.shopName + ': đã gọi ' + result.orderedCount + '/' + result.total + ' món.';
    }
    questionEl.textContent = msg;
    showToast('Đã gọi món: ' + o.item.hanzi + ' (+' + xp + ' XP)');
  } else {
    btn.classList.add('wrong');
    btn.disabled = true;
    const opt = o.options[idx];
    const why = opt && opt.whyWrong ? opt.whyWrong : 'Chưa đúng, hãy thử câu khác nhé!';
    questionEl.textContent = 'Chưa đúng — ' + why;
    showToast('Chưa đúng, người bán đã sửa lỗi cho bạn — thử lại nhé!');
  }
}

document.getElementById('btn-listen').addEventListener('click', () => speakChinese(listenText));
document.getElementById('btn-close-dialogue').addEventListener('click', closeAllPanels);

document.getElementById('btn-study').addEventListener('click', () => {
  clearKeys(); // dừng di chuyển khi mở sổ học tập
  document.getElementById('study-content').innerHTML = renderStudyBook(state);
  document.getElementById('study-panel').classList.remove('hidden');
});
// Nút nghe từng thanh điệu trong Sổ học tập (gameplay.js render ra .tone-btn)
// và nút mở Lớp Luyện chữ (#btn-calligraphy, js/calligraphy.js).
document.getElementById('study-content').addEventListener('click', (e) => {
  const c = e.target && e.target.closest ? e.target.closest('#btn-calligraphy') : null;
  if (c) {
    // Mở lớp Luyện chữ trên nền Sổ học tập (panel z-70 phủ lên trên; Sổ vẫn
    // mở phía dưới nên phím di chuyển vẫn bị chặn trong lúc luyện chữ).
    try {
      openCalligraphy(state, {
        onAwardXP: (xp) => {
          if (typeof xp === 'number' && xp > 0) {
            state.xp += xp;
            saveGame(state);
            updateHUD(state);
            showToast('Luyện chữ: +' + xp + ' XP');
          }
        },
        onSave: () => saveGame(state)
      });
    } catch (_err) { /* luyện chữ lỗi: không vỡ game */ }
    return;
  }
  const b = e.target && e.target.closest ? e.target.closest('.tone-btn') : null;
  if (!b) return;
  try { if (typeof speakTone === 'function') speakTone(b.dataset.toneBase || 'ma', parseInt(b.dataset.tone || '0', 10)); } catch (_err) { /* nghe phát âm là phụ */ }
});
// Sau khi thi xong trong overlay trường thi, gameplay.js ghi save mới và
// phát sự kiện 'hanlamky:exam-done' — nạp lại state để HUD/cấp bậc cập nhật.
window.addEventListener('hanlamky:exam-done', (e) => {
  try {
    const fresh = loadSave();
    state = { ...fresh, completed: [...(fresh.completed || [])] };
    updateHUD(state);
    if (e && e.detail && e.detail.passed) showToast('Chúc mừng! Bạn đã thăng cấp lên ' + (e.detail.rankName || getRank(state).name) + '.');
  } catch (_err) { /* nạp lại save là phụ */ }
});
document.getElementById('btn-close-study').addEventListener('click', closeAllPanels);
document.getElementById('btn-help').addEventListener('click', () => {
  document.getElementById('help-panel').classList.toggle('hidden');
});

// ---------------------------------------------------------------------------
// A2 — Đồng bộ tư thế thầy theo giờ học thật (giờ địa phương của người
// chơi). Kiểm tra mỗi 30 giây, KHÔNG chạy mỗi frame. Trong giờ học thầy
// ở mode 'teach', ngoài giờ thầy ở mode 'read' (tự đọc sách).
// Bảng đen chỉ ghi lại khi ĐỔI buổi (vào/ra giờ học hoặc đổi lớp), không
// ghi đè liên tục, để khỏi xóa chữ bài giảng khi đang nói chuyện với thầy.
// ---------------------------------------------------------------------------
let lastScheduleKey = null;
function syncTeacherSchedule(now) {
  try {
    const teacher = npcs.find((n) => n.id === 'teacher');
    if (!teacher || typeof teacher.setMode !== 'function') return;
    const at = now instanceof Date ? now : new Date();
    if (typeof teacherModeNow === 'function') teacher.setMode(teacherModeNow(at, state));
    const cls = typeof currentClass === 'function' ? currentClass(at) : null;
    const key = cls ? cls.classId + '@' + cls.start.getTime() : 'off';
    if (key !== lastScheduleKey) {
      lastScheduleKey = key;
      if (env && typeof env.setBlackboardText === 'function' && typeof scheduleBlackboard === 'function') {
        const bb = scheduleBlackboard(at, state);
        if (bb && bb.hanzi) env.setBlackboardText(bb.hanzi, bb.pinyin || '');
      }
    }
  } catch (_err) { /* đồng bộ lịch là phụ: không vỡ game */ }
}
syncTeacherSchedule();
setInterval(() => syncTeacherSchedule(), 30000);

// ---------------------------------------------------------------------------
// Chất lượng đồ họa Thấp / Trung / Cao
// ---------------------------------------------------------------------------
function setQuality(q) {
  if (q === 'low') {
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = false;
  } else if (q === 'high') {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
  } else {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
  }
  // Đồng bộ mật độ chi tiết môi trường (cỏ/hoa, đèn chợ, bóng mặt trời).
  try { if (env && typeof env.setDetail === 'function') env.setDetail(q); } catch (_err) { /* chi tiết là phụ */ }
  scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
  document.querySelectorAll('[data-quality]').forEach((b) => {
    b.classList.toggle('active', b.dataset.quality === q);
  });
}
document.querySelectorAll('[data-quality]').forEach((b) => {
  b.addEventListener('click', () => setQuality(b.dataset.quality));
});
// Đồng bộ trạng thái mặc định (Trung) ngay khi tải: mật độ cỏ/hoa, đèn chợ.
setQuality('medium');

// ---------------------------------------------------------------------------
// Màn hình bắt đầu
// ---------------------------------------------------------------------------
const nameInput = document.getElementById('player-name');
if (saved.playerName) nameInput.value = saved.playerName;

document.getElementById('btn-start').addEventListener('click', () => {
  // Thử khóa màn hình ngang trên mobile (thất bại thì bỏ qua lặng lẽ,
  // không alert — nhiều trình duyệt chỉ cho lock khi đang fullscreen).
  try {
    const so = window.screen && window.screen.orientation;
    if (so && typeof so.lock === 'function') {
      const p = so.lock('landscape');
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  } catch (_err) { /* không hỗ trợ: bỏ qua */ }
  const name = (nameInput.value || '').trim() || saved.playerName || 'Học trò';
  // Tên khác với bản lưu có XP -> nhân vật mới, bắt đầu lại từ đầu.
  if (name !== saved.playerName && saved.xp > 0) {
    state = { playerName: name, xp: 0, completed: [], currentQuest: null, inventory: {}, calligraphy: {} };
  } else {
    state = { ...saved, playerName: name, completed: [...saved.completed] };
  }
  saveGame(state);
  player = createPlayer(scene, { x: 0, z: 20 }, name);
  player.setFacing(Math.PI); // quay mặt về phía Bắc, hướng vào làng
  started = true;
  // Nhả focus khỏi ô nhập tên: nếu focus còn kẹt trong INPUT thì mọi phím
  // (W/A/S/D/E) đều bị bộ lọc keydown chặn lại và nhân vật không đi được
  // (lỗi Vinh báo 27/11: ấn W không hoạt động).
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }
  document.getElementById('start-screen').classList.add('hidden');
  // help-panel KHÔNG tự hiện: bắt đầu ở trạng thái ẩn (index.html đã có
  // class hidden) để lần bấm đầu tiên vào nút Hướng dẫn là MỞ bảng, không
  // phải tắt bảng đang hiện sẵn (lỗi kiểm thử 27/11: bấm Hướng dẫn không
  // thấy bảng hiện ra). Nút btn-help vẫn toggle như cũ.
  ['hud', 'quest-panel', 'quality-panel'].forEach((id) => {
    document.getElementById(id).classList.remove('hidden');
  });
  updateHUD(state);
  showToast('Chào mừng đến làng Thanh Khê, ' + name + '! Hãy tới gặp Thầy Đồ Lâm ở trường học.');
});

// ---------------------------------------------------------------------------
// Vòng lặp chính
// ---------------------------------------------------------------------------
const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;

  env.update(dt, elapsed);
  for (const npc of npcs) npc.update(dt, elapsed);
  for (const v of villagers) v.update(dt, elapsed);

  if (player && started) {
    const pos = player.group.position;
    const prev = { x: pos.x, z: pos.z };
    let mx = 0, mz = 0;
    let running = keys.has('ShiftLeft') || keys.has('ShiftRight') || runHeld;
    const inputBlocked = isInputBlocked(); // hội thoại / sổ mở: không nhận input đi

    // WASD / mũi tên (theo hướng camera)
    const fwd = { x: -Math.sin(camYaw), z: -Math.cos(camYaw) };
    const right = { x: Math.cos(camYaw), z: -Math.sin(camYaw) };
    let speedScale = 1; // joystick: tốc độ tỉ lệ lực kéo (phím/click luôn = 1)
    if (!inputBlocked) {
    if (keys.has('KeyW') || keys.has('ArrowUp')) { mx += fwd.x; mz += fwd.z; }
    if (keys.has('KeyS') || keys.has('ArrowDown')) { mx -= fwd.x; mz -= fwd.z; }
    if (keys.has('KeyD') || keys.has('ArrowRight')) { mx += right.x; mz += right.z; }
    if (keys.has('KeyA') || keys.has('ArrowLeft')) { mx -= right.x; mz -= right.z; }
    const hasKeyInput = mx !== 0 || mz !== 0;

    // Joystick ảo: 8 hướng, tốc độ tỉ lệ lực kéo (deadzone 0.15, chuẩn hóa 0..1)
    if (joy.active) {
      const joyMagRaw = Math.hypot(joy.x, joy.y);
      if (joyMagRaw > 0.15) {
        const joyMag = Math.min(1, (joyMagRaw - 0.15) / 0.85);
        if (joyMag > 0.02) {
          const jx = joy.x / joyMagRaw, jy = joy.y / joyMagRaw;
          mx += (fwd.x * -jy + right.x * jx) * joyMag;
          mz += (fwd.z * -jy + right.z * jx) * joyMag;
          if (!hasKeyInput) speedScale = joyMag;
        }
      }
    }

    // Click-to-move (NPC đang đi tuần thì cập nhật mục tiêu theo vị trí mới).
    // Đang đi theo hàng đợi (qua cầu) thì không ghi đè: hàng đợi chạy xong,
    // clickTarget về null thì lần lặp sau sẽ đặt lại mục tiêu tới NPC.
    if (pendingNpcId) {
      const npc = npcs.find((n) => n.id === pendingNpcId);
      if (npc) {
        const np = npc.group.position;
        const dx = pos.x - np.x, dz = pos.z - np.z;
        const d = Math.hypot(dx, dz) || 1;
        if (!clickTarget && clickWaypoints.length === 0) {
          routeClickTarget(np.x + (dx / d) * 1.8, np.z + (dz / d) * 1.8, false, true);
        }
        if (Math.hypot(dx, dz) < 3.0) {
          openDialogue(pendingNpcId);
          pendingNpcId = null;
          clickTarget = null;
          clickWaypoints = [];
        }
      } else pendingNpcId = null;
    }

    if (mx !== 0 || mz !== 0) {
      clickTarget = null; // phím / joystick ưu tiên hơn click
      clickWaypoints = [];
    } else if (clickTarget) {
      const dx = clickTarget.x - pos.x, dz = clickTarget.z - pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.35) {
        // Tới điểm trung gian (cầu) thì lấy điểm tiếp theo trong hàng đợi.
        clickTarget = clickWaypoints.length ? clickWaypoints.shift() : null;
      } else {
        mx = dx / d; mz = dz / d;
        if (clickTarget.run) running = true;
      }
    }
    } // !inputBlocked

    const moving = mx !== 0 || mz !== 0;
    if (moving) {
      const len = Math.hypot(mx, mz);
      mx /= len; mz /= len;
      const speed = (running ? RUN_SPEED : WALK_SPEED) * speedScale;
      pos.x += mx * speed * dt;
      pos.z += mz * speed * dt;
      resolveCollisions(pos, prev);
      const targetAngle = Math.atan2(pos.x - prev.x, pos.z - prev.z);
      if (Math.hypot(pos.x - prev.x, pos.z - prev.z) > 0.001) {
        player.group.rotation.y = lerpAngle(player.group.rotation.y, targetAngle, 1 - Math.pow(0.001, dt));
      }
      player.update(dt, running ? 2 : 1, true, running);
    } else {
      player.update(dt, 0, false, false);
    }
  }

  updateIndoor(); // ẩn mái/trần tòa nhà đang đứng trong (nếu có)
  updateCamera(dt);
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
