// Hán Lâm Ký (汉林记) — main.js: vòng lặp game, camera, điều khiển, va chạm,
// hội thoại và tích hợp môi trường / nhân vật / gameplay.
// © Nông Quang Vinh
import * as THREE from 'three';
import { createEnvironment } from './environment.js';
import { createPlayer, createNPCs } from './characters.js';
import {
  QUESTS, getRank, loadSave, saveGame, getDialogue,
  renderStudyBook, speakChinese, updateHUD, showToast
} from './gameplay.js';

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
let player = null;
let started = false;

// ---------------------------------------------------------------------------
// Camera người thứ ba: yaw / pitch / khoảng cách, mượt theo mục tiêu
// ---------------------------------------------------------------------------
let camYaw = 0;            // 0 = camera ở phía Nam, nhìn về Bắc
let camPitch = 0.38;       // góc ngẩng (rad)
let camDist = 11;          // zoom 6..18
const camTarget = new THREE.Vector3(0, 1.6, 0);
const desiredTarget = new THREE.Vector3(0, 1.6, 0);

function updateCamera(dt) {
  const focus = player ? player.group.position : new THREE.Vector3(0, 0, 0);
  desiredTarget.set(focus.x, focus.y + 1.6, focus.z);
  camTarget.lerp(desiredTarget, 1 - Math.pow(0.001, dt)); // mượt
  const cp = Math.cos(camPitch), sp = Math.sin(camPitch);
  camera.position.set(
    camTarget.x + Math.sin(camYaw) * cp * camDist,
    camTarget.y + sp * camDist,
    camTarget.z + Math.cos(camYaw) * cp * camDist
  );
  camera.lookAt(camTarget);
}

// ---------------------------------------------------------------------------
// Điều khiển
// ---------------------------------------------------------------------------
const keys = new Set();
let clickTarget = null;      // {x, z, run}
let pendingNpcId = null;
let dialogueOpen = false;
let currentDialogue = null;  // {npcId, quest}
let listenText = '你好';

const WALK_SPEED = 4.2;
const RUN_SPEED = 7.6;

window.addEventListener('keydown', (e) => {
  if (!started) return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.code === 'KeyE') interactNearest();
  if (e.code === 'Escape') closeAllPanels();
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

function closeAllPanels() {
  document.getElementById('dialogue-panel').classList.add('hidden');
  document.getElementById('study-panel').classList.add('hidden');
  dialogueOpen = false;
  currentDialogue = null;
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
  if (!started || dialogueOpen) return;
  downInfo = { x: e.clientX, y: e.clientY, time: performance.now(), button: e.button };
  lastPointer = { x: e.clientX, y: e.clientY };
  if (e.button === 2) rightDragging = true;
});

renderer.domElement.addEventListener('pointermove', (e) => {
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
  if (!downInfo || downInfo.button !== 0 || !started || dialogueOpen) { downInfo = null; return; }
  const moved = Math.hypot(e.clientX - downInfo.x, e.clientY - downInfo.y);
  const dtMs = performance.now() - downInfo.time;
  downInfo = null;
  if (moved > 6 || dtMs > 400) return;
  handleGroundClick(e);
}

renderer.domElement.addEventListener('pointerup', endPointer);
renderer.domElement.addEventListener('pointercancel', () => { downInfo = null; rightDragging = false; });

renderer.domElement.addEventListener('dblclick', (e) => {
  if (!started || dialogueOpen) return;
  // Double-click: chạy tới điểm đã click (click đơn trước đó đã đặt mục tiêu đi bộ)
  if (clickTarget) clickTarget.run = true;
  else handleGroundClick(e, true);
});

renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  camDist = Math.max(6, Math.min(18, camDist * (1 + e.deltaY * 0.001)));
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
    clickTarget = { x: np.x, z: np.z, run: false, npc: true };
    showToast('Đang đi tới ' + npc.name + '…');
    return;
  }
  pendingNpcId = null;
  clickTarget = { x: p.x, z: p.z, run };
}

function isDescendant(root, obj) {
  let o = obj;
  while (o) { if (o === root) return true; o = o.parent; }
  return false;
}

// --- Joystick ảo (mobile) ---
const joy = { active: false, x: 0, y: 0 };
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
joystickEl.addEventListener('pointerdown', (e) => { joy.active = true; joystickEl.setPointerCapture(e.pointerId); joyUpdate(e); });
joystickEl.addEventListener('pointermove', (e) => { if (joy.active) joyUpdate(e); });
function joyEnd() { joy.active = false; joy.x = 0; joy.y = 0; stickEl.style.transform = 'translate(-50%, -50%)'; }
joystickEl.addEventListener('pointerup', joyEnd);
joystickEl.addEventListener('pointercancel', joyEnd);
document.getElementById('btn-e').addEventListener('click', () => interactNearest());

// ---------------------------------------------------------------------------
// Va chạm: vòng tròn quanh nhà/cây/cột + dải sông (chỉ qua được bằng cầu)
// ---------------------------------------------------------------------------
function resolveCollisions(pos, prev) {
  // Sông x=18..26: chỉ qua được trên cầu (|z| <= 2.2)
  if (pos.x > 17.8 && pos.x < 26.2 && Math.abs(pos.z) > 2.2) pos.x = prev.x;
  // Giới hạn làng
  pos.x = Math.max(-68, Math.min(68, pos.x));
  pos.z = Math.max(-68, Math.min(68, pos.z));
  // Vòng tròn va chạm
  for (const c of colliders) {
    const dx = pos.x - c.x, dz = pos.z - c.z;
    const d = Math.hypot(dx, dz);
    const min = c.r + 0.45;
    if (d < min && d > 0.0001) {
      pos.x = c.x + (dx / d) * min;
      pos.z = c.z + (dz / d) * min;
    }
  }
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
  const npc = nearestNpc(3.5);
  if (npc) openDialogue(npc.id);
  else showToast('Hãy lại gần một người trong làng rồi nhấn E.');
}

function openDialogue(npcId) {
  const dlg = getDialogue(npcId, state);
  currentDialogue = { npcId, quest: dlg.quest };
  dialogueOpen = true;
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
    optsEl.innerHTML = '';
    (q.options || q.choices || []).forEach((opt, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = opt;
      b.addEventListener('click', () => answerQuiz(b, idx));
      optsEl.appendChild(b);
    });
  } else {
    listenText = '你好';
    lessonEl.classList.add('hidden');
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
      'Chính xác! +' + q.xp + ' XP — Cấp bậc hiện tại: ' + getRank(state.xp).name;
    showToast('Hoàn thành nhiệm vụ: ' + q.title + ' (+' + q.xp + ' XP)');
  } else {
    btn.classList.add('wrong');
    btn.disabled = true;
    showToast('Chưa đúng, hãy nghe lại phát âm và thử nhé!');
  }
}

function escapeHtml(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

document.getElementById('btn-listen').addEventListener('click', () => speakChinese(listenText));
document.getElementById('btn-close-dialogue').addEventListener('click', closeAllPanels);

document.getElementById('btn-study').addEventListener('click', () => {
  document.getElementById('study-content').innerHTML = renderStudyBook(state);
  document.getElementById('study-panel').classList.remove('hidden');
});
document.getElementById('btn-close-study').addEventListener('click', closeAllPanels);
document.getElementById('btn-help').addEventListener('click', () => {
  document.getElementById('help-panel').classList.toggle('hidden');
});

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
  scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
  document.querySelectorAll('[data-quality]').forEach((b) => {
    b.classList.toggle('active', b.dataset.quality === q);
  });
}
document.querySelectorAll('[data-quality]').forEach((b) => {
  b.addEventListener('click', () => setQuality(b.dataset.quality));
});

// ---------------------------------------------------------------------------
// Màn hình bắt đầu
// ---------------------------------------------------------------------------
const nameInput = document.getElementById('player-name');
if (saved.playerName) nameInput.value = saved.playerName;

document.getElementById('btn-start').addEventListener('click', () => {
  const name = (nameInput.value || '').trim() || saved.playerName || 'Học trò';
  // Tên khác với bản lưu có XP -> nhân vật mới, bắt đầu lại từ đầu.
  if (name !== saved.playerName && saved.xp > 0) {
    state = { playerName: name, xp: 0, completed: [], currentQuest: null };
  } else {
    state = { ...saved, playerName: name, completed: [...saved.completed] };
  }
  saveGame(state);
  player = createPlayer(scene, { x: 0, z: 20 }, name);
  player.setFacing(Math.PI); // quay mặt về phía Bắc, hướng vào làng
  started = true;
  document.getElementById('start-screen').classList.add('hidden');
  ['hud', 'quest-panel', 'help-panel', 'quality-panel'].forEach((id) => {
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

  if (player && started) {
    const pos = player.group.position;
    const prev = { x: pos.x, z: pos.z };
    let mx = 0, mz = 0;
    let running = keys.has('ShiftLeft') || keys.has('ShiftRight');

    // WASD / mũi tên (theo hướng camera)
    const fwd = { x: -Math.sin(camYaw), z: -Math.cos(camYaw) };
    const right = { x: Math.cos(camYaw), z: -Math.sin(camYaw) };
    if (keys.has('KeyW') || keys.has('ArrowUp')) { mx += fwd.x; mz += fwd.z; }
    if (keys.has('KeyS') || keys.has('ArrowDown')) { mx -= fwd.x; mz -= fwd.z; }
    if (keys.has('KeyD') || keys.has('ArrowRight')) { mx += right.x; mz += right.z; }
    if (keys.has('KeyA') || keys.has('ArrowLeft')) { mx -= right.x; mz -= right.z; }

    // Joystick ảo
    if (joy.active && Math.hypot(joy.x, joy.y) > 0.15) {
      mx += fwd.x * -joy.y + right.x * joy.x;
      mz += fwd.z * -joy.y + right.z * joy.x;
    }

    // Click-to-move (NPC đang đi tuần thì cập nhật mục tiêu theo vị trí mới)
    if (pendingNpcId) {
      const npc = npcs.find((n) => n.id === pendingNpcId);
      if (npc) {
        const np = npc.group.position;
        const dx = pos.x - np.x, dz = pos.z - np.z;
        const d = Math.hypot(dx, dz) || 1;
        clickTarget = { x: np.x + (dx / d) * 1.8, z: np.z + (dz / d) * 1.8, run: false, npc: true };
        if (Math.hypot(dx, dz) < 3.0) {
          openDialogue(pendingNpcId);
          pendingNpcId = null;
          clickTarget = null;
        }
      } else pendingNpcId = null;
    }

    if (mx !== 0 || mz !== 0) {
      clickTarget = null; // phím / joystick ưu tiên hơn click
    } else if (clickTarget) {
      const dx = clickTarget.x - pos.x, dz = clickTarget.z - pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.35) {
        clickTarget = null;
      } else {
        mx = dx / d; mz = dz / d;
        if (clickTarget.run) running = true;
      }
    }

    const moving = mx !== 0 || mz !== 0;
    if (moving) {
      const len = Math.hypot(mx, mz);
      mx /= len; mz /= len;
      const speed = running ? RUN_SPEED : WALK_SPEED;
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

  updateCamera(dt);
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
