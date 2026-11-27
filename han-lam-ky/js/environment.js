// Hán Lâm Ký (汉林记) — Môi trường 3D: Làng Thanh Khê (青溪村)
// Module ES, Three.js 0.180, HTML/CSS/JS thuần, không build step.
// Chỉ nhận `scene` đã có; không tạo renderer / camera trong file này.
// © Nông Quang Vinh
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Texture vẽ bằng canvas — tạo một lần, dùng chung, tái sử dụng
// ---------------------------------------------------------------------------
function makeCanvasTexture(w, h, draw, repeatX = 1, repeatY = 1) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function tileTexture(base, dark, light) {
  return makeCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    const rows = 8;
    const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let x = -1; x < 9; x++) {
        const cx = x * 32 + (r % 2 ? 16 : 0);
        const cy = r * rh + rh / 2;
        // Một viên ngói cong: hình bán nguyệt + bóng đổ dưới. Mỗi viên lệch
        // tông nhẹ (ngói nung không đều màu) và có viền sáng ở mép trên.
        const g = ctx.createLinearGradient(cx - 14, cy, cx + 14, cy);
        g.addColorStop(0, dark);
        g.addColorStop(0.5, light);
        g.addColorStop(1, dark);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, 14, Math.PI, 0);
        ctx.fill();
        const jit = Math.random();
        ctx.fillStyle = jit < 0.5 ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.07)';
        ctx.beginPath();
        ctx.arc(cx, cy, 14, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 12, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(cx - 14, cy, 28, 5);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 14, Math.PI, 0);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, r * rh + rh - 3, w, 3);
    }
  }, 3, 3);
}

function woodTexture() {
  return makeCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#8a5a33';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const y = Math.random() * h;
      ctx.strokeStyle = `rgba(${40 + Math.random() * 60 | 0},${20 + Math.random() * 30 | 0},10,${0.15 + Math.random() * 0.3})`;
      ctx.lineWidth = 1 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + (Math.random() * 8 - 4), w * 0.7, y + (Math.random() * 8 - 4), w, y + (Math.random() * 6 - 3));
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 6; i++) ctx.fillRect(0, i * 43, w, 2);
  }, 2, 2);
}

function stoneTexture() {
  return makeCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#9a938a';
    ctx.fillRect(0, 0, w, h);
    const cols = 4, rows = 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * 64 + (r % 2 ? 32 : 0) - 32;
        const y = r * 64;
        const shade = 130 + Math.random() * 50 | 0;
        ctx.fillStyle = `rgb(${shade},${shade - 4},${shade - 12})`;
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, 56, 56, 12);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.roundRect(x + 8, y + 8, 48, 18, 8);
        ctx.fill();
      }
    }
  }, 4, 4);
}

function leafTexture() {
  return makeCanvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#3f7a2e';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const g = 90 + Math.random() * 90 | 0;
      ctx.fillStyle = `rgba(${30 + Math.random() * 40 | 0},${g},${20 + Math.random() * 30 | 0},0.85)`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, 4 + Math.random() * 8, 3 + Math.random() * 5, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 2, 2);
}

function groundTexture() {
  return makeCanvasTexture(512, 512, (ctx, w, h) => {
    // Nền cỏ trầm, không chói: xanh rêu pha vàng, nhiều mảng đậm/nhạt.
    ctx.fillStyle = '#5d8a3c';
    ctx.fillRect(0, 0, w, h);
    // Mảng cỏ đậm / nhạt xen kẽ (tạo cảm giác mặt đất không phẳng màu)
    for (let i = 0; i < 26; i++) {
      const dark = Math.random() < 0.5;
      ctx.fillStyle = dark ? 'rgba(52,96,38,0.35)' : 'rgba(122,150,70,0.30)';
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, 24 + Math.random() * 46, 16 + Math.random() * 30, Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Sợi cỏ nhỏ (nét vẽ ngắn, nhiều hướng)
    for (let i = 0; i < 2600; i++) {
      const g = 110 + Math.random() * 70 | 0;
      ctx.fillStyle = `rgba(${60 + Math.random() * 50 | 0},${g},${40 + Math.random() * 40 | 0},0.5)`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 2 + Math.random() * 4);
    }
    // Vài mảng đất khô + đá dăm nhỏ
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = 'rgba(150,120,70,0.35)';
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, 18 + Math.random() * 30, 12 + Math.random() * 20, Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = 'rgba(180,175,160,0.5)';
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 10, 10);
}

function clothTexture(colorA, colorB) {
  return makeCanvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = colorA;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = colorB;
    for (let x = 0; x < w; x += 32) ctx.fillRect(x, 0, 16, h);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let x = 8; x < w; x += 32) ctx.fillRect(x, 0, 3, h);
  }, 2, 1);
}

// Tường khung gỗ kiểu Trung Hoa: nền trát vôi + khung gỗ sẫm (cột, xà,
// thanh chéo). Dùng cho tường nhà thay cho màu phẳng.
function woodFrameTexture(base = '#efe3c8') {
  return makeCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    // Vệt trát vôi loang
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${200 + Math.random() * 40 | 0},${185 + Math.random() * 30 | 0},${150 + Math.random() * 30 | 0},0.25)`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, 12 + Math.random() * 26, 8 + Math.random() * 18, Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Khung gỗ: viền ngoài + cột giữa + xà ngang + thanh chéo
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(0, 0, w, 10);
    ctx.fillRect(0, h - 10, w, 10);
    ctx.fillRect(0, 0, 10, h);
    ctx.fillRect(w - 10, 0, 10, h);
    ctx.fillRect(w / 2 - 6, 0, 12, h);
    ctx.fillRect(0, h / 2 - 6, w, 12);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-w * 0.36, -6, w * 0.72, 12);
    ctx.restore();
    // Vân gỗ trên khung
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    for (let y = 4; y < 10; y += 3) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }, 1, 1);
}

// Cửa sổ chạm khắc: giấy sáng + khung gỗ lưới ô vuông (dùng làm mặt cửa sổ).
function latticeTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffedb8';
  ctx.fillRect(0, 0, 128, 128);
  const g = ctx.createRadialGradient(64, 64, 10, 64, 64, 90);
  g.addColorStop(0, 'rgba(255,255,220,0.5)');
  g.addColorStop(1, 'rgba(180,140,60,0.25)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#4a2e14';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 122, 122);
  ctx.lineWidth = 4;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(i * 32, 0); ctx.lineTo(i * 32, 128); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * 32); ctx.lineTo(128, i * 32); ctx.stroke();
  }
  // Hoa văn chéo ở ô giữa
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(32, 32); ctx.lineTo(96, 96); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(96, 32); ctx.lineTo(32, 96); ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Cửa gỗ ván đứng: thớ ván + đinh tán + tay nắm vòng đồng.
function doorTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#7a4a26';
  ctx.fillRect(0, 0, 128, 256);
  for (let p = 0; p < 4; p++) {
    const x0 = p * 32;
    ctx.fillStyle = p % 2 ? '#83522c' : '#744620';
    ctx.fillRect(x0 + 1, 0, 30, 256);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, 256); ctx.stroke();
    // Vân gỗ dọc
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    for (let k = 0; k < 5; k++) {
      const vx = x0 + 6 + Math.random() * 20;
      ctx.beginPath(); ctx.moveTo(vx, 0);
      ctx.bezierCurveTo(vx + 4, 80, vx - 4, 170, vx + 2, 256); ctx.stroke();
    }
  }
  // 2 thanh ngang + đinh tán đồng
  ctx.fillStyle = '#5a3016';
  ctx.fillRect(0, 34, 128, 14);
  ctx.fillRect(0, 208, 128, 14);
  ctx.fillStyle = '#d8a24a';
  for (const yy of [41, 215]) for (let x = 16; x < 128; x += 32) {
    ctx.beginPath(); ctx.arc(x, yy, 4, 0, Math.PI * 2); ctx.fill();
  }
  // Tay nắm vòng đồng
  ctx.strokeStyle = '#d8a24a';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(96, 128, 13, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(32, 128, 13, 0, Math.PI * 2); ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Đá xây không đều (cột cổng, kè sông, chân tường).
function stoneWallTexture() {
  return makeCanvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#8d8578';
    ctx.fillRect(0, 0, w, h);
    const rows = 5;
    for (let r = 0; r < rows; r++) {
      const y0 = r * (h / rows);
      let x = r % 2 ? -20 : 0;
      while (x < w) {
        const sw = 46 + Math.random() * 30;
        const shade = 130 + Math.random() * 55 | 0;
        ctx.fillStyle = `rgb(${shade},${shade - 5},${shade - 14})`;
        ctx.beginPath();
        ctx.roundRect(x + 3, y0 + 3, sw - 6, h / rows - 6, 9);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.beginPath();
        ctx.roundRect(x + 6, y0 + 6, sw - 12, 10, 6);
        ctx.fill();
        x += sw;
      }
    }
  }, 2, 2);
}

// Búi cỏ: các lá cỏ mảnh vẽ trên nền trong suốt (dùng cho mặt phẳng chéo,
// alphaTest để không phải vẽ hình nón nhọn như trước).
function grassBladeTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  for (let i = 0; i < 26; i++) {
    const x0 = 8 + Math.random() * 112;
    const lean = (Math.random() - 0.5) * 36;
    const hh = 46 + Math.random() * 70;
    const g = 120 + Math.random() * 80 | 0;
    ctx.strokeStyle = `rgba(${70 + Math.random() * 40 | 0},${g},${50 + Math.random() * 30 | 0},0.95)`;
    ctx.lineWidth = 2.5 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(x0, 128);
    ctx.quadraticCurveTo(x0 + lean * 0.3, 128 - hh * 0.6, x0 + lean, 128 - hh);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Mây mềm (billboard trôi trên trời).
function cloudTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 128);
  for (let i = 0; i < 14; i++) {
    const x = 40 + Math.random() * 176;
    const y = 45 + Math.random() * 40;
    const r = 18 + Math.random() * 30;
    const g = ctx.createRadialGradient(x, y, 2, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Lá tre: vài nhánh lá mảnh trên nền trong suốt (thay cho hình nón nhọn).
function bambooLeafTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  for (let i = 0; i < 18; i++) {
    const x0 = 14 + Math.random() * 100;
    const y0 = 10 + Math.random() * 40;
    const ang = (Math.random() - 0.5) * 1.2 + (Math.random() < 0.5 ? 0.6 : -0.6);
    const len = 34 + Math.random() * 26;
    ctx.strokeStyle = `rgba(${40 + Math.random() * 30 | 0},${120 + Math.random() * 60 | 0},${50 + Math.random() * 30 | 0},0.95)`;
    ctx.lineWidth = 3 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(x0 + Math.sin(ang) * len * 0.5, y0 + Math.cos(ang) * len * 0.5, x0 + Math.sin(ang) * len, y0 + Math.cos(ang) * len);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function signTexture(text, sub) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5a2e18';
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = '#d8a24a';
  ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, 244, 84);
  ctx.fillStyle = '#f5d98a';
  ctx.font = 'bold 34px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 38);
  ctx.font = '20px serif';
  ctx.fillStyle = '#ffe9b0';
  ctx.fillText(sub || '', 128, 70);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// Mái ngói cong — BufferGeometry tham số, góc mái vểnh lên
// Mái chạy dọc trục X (nóc ở giữa), dốc xuống hai phía Z, góc vểnh lên.
// ---------------------------------------------------------------------------
function createCurvedRoofGeometry(width, depth, height, upturn = 0.55) {
  const nx = 14, nz = 10;
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      const u = (i / nx) * 2 - 1; // -1..1 dọc nóc (X)
      const v = (j / nz) * 2 - 1; // -1..1 ngang mái (Z)
      const x = (u * width) / 2;
      const z = (v * depth) / 2;
      // Dốc chính: cao ở nóc, thấp ở diềm; góc vểnh: |u|^3 * |v|^2
      const slope = 1 - Math.pow(Math.abs(v), 1.7);
      const corner = upturn * Math.pow(Math.abs(u), 3) * Math.pow(Math.abs(v), 2.2);
      const y = height * slope + corner;
      pos.push(x, y, z);
      uv.push((i / nx) * 3, (j / nz) * 3);
    }
  }
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = a + 1;
      const c = a + nx + 1;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------
// Hàm export bắt buộc
// ---------------------------------------------------------------------------
export function createEnvironment(scene) {
  const colliders = [];
  const positions = {
    school: { x: -28, z: -20 },
    market: { x: -15, z: 10 },
    well: { x: -5, z: -5 },
    bridge: { x: 22, z: 0 },
    river: { x: 22, z: 0 },
    // Trường thi (Phase 4): (50,-52) — xem ghi chú ở khối trường thi.
    examHall: { x: 50, z: -52 },
  };
  const animated = { lanterns: [], birds: [], canopies: [], water: null, waterBase: null, doors: [] };
  // Mesh chi tiết thay đổi theo chất lượng (cỏ/hoa) + đèn chợ (bật ở MED/HIGH).
  const detailMeshes = { grass: null, grassTufts: 0, flowers: [], flowerStems: null };
  const marketLights = [];
  // Phase 4: cửa mở được (main.js hook đọc env.doors) + bàn thi (env.examDesks)
  const doors = [];
  const examDesks = [];
  // Tòa nhà đi vào được (trường học, trường thi): để camera trong nhà ẩn
  // mái + trần khi người chơi ở trong.
  const buildings = [];
  // Tòa nhà nào chứa điểm (x, z)? Tính theo hình chữ nhật đã xoay rotY.
  function buildingAt(x, z) {
    for (const b of buildings) {
      const dx = x - b.x, dz = z - b.z;
      const c = Math.cos(b.rotY), s = Math.sin(b.rotY);
      const lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) <= b.w / 2 && Math.abs(lz) <= b.d / 2) return b;
    }
    return null;
  }
  let blackboardDraw = null; // hàm vẽ chữ lên bảng đen (gán trong onInterior trường học)
  let blackboardFallback = null; // {x,y,z,created} — vị trí sprite chữ dự phòng
  let waterFrame = 0; // đếm frame để giảm tần suất tính lại sóng nước

  // --- Vật liệu dùng chung -------------------------------------------------
  const tileMatBlue = new THREE.MeshStandardMaterial({ map: tileTexture('#3f5a6a', '#2c4250', '#6d8ea3'), roughness: 0.85, metalness: 0.05, side: THREE.DoubleSide });
  const tileMatRed = new THREE.MeshStandardMaterial({ map: tileTexture('#7a4a35', '#5a3222', '#a86a4a'), roughness: 0.85, metalness: 0.05, side: THREE.DoubleSide });
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.9 });
  const woodDarkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.9 });
  const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), roughness: 0.95 });
  const leafMat = new THREE.MeshStandardMaterial({ map: leafTexture(), color: 0x7fbf5a, roughness: 0.9 });
  const leafMat2 = new THREE.MeshStandardMaterial({ map: leafTexture(), color: 0x5da344, roughness: 0.9 });
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0x7fae4e, roughness: 0.8 });
  const bambooLeafMat = new THREE.MeshStandardMaterial({ color: 0x4d8a33, roughness: 0.9 });
  const wallWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf2e8d5, roughness: 0.95 });
  const wallYellowMat = new THREE.MeshStandardMaterial({ color: 0xe8d49a, roughness: 0.95 });
  const wallGreyMat = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.95 });
  const trunkMat = new THREE.MeshStandardMaterial({ map: woodTexture(), color: 0xa08060, roughness: 0.95 });
  const groundMat = new THREE.MeshStandardMaterial({ map: groundTexture(), roughness: 1 });
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x4a90b8, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.88 });
  const lanternMat = new THREE.MeshStandardMaterial({ color: 0xd22222, roughness: 0.5, emissive: 0x881111, emissiveIntensity: 0.5 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd8a24a, roughness: 0.4, metalness: 0.5 });
  // Tường khung gỗ (thay màu phẳng), cửa sổ chạm khắc, cửa ván, đá xây.
  const wallFrameWhiteMat = new THREE.MeshStandardMaterial({ map: woodFrameTexture('#efe3c8'), roughness: 0.95 });
  const wallFrameYellowMat = new THREE.MeshStandardMaterial({ map: woodFrameTexture('#e9d49c'), roughness: 0.95 });
  const wallFrameGreyMat = new THREE.MeshStandardMaterial({ map: woodFrameTexture('#ddd5c2'), roughness: 0.95 });
  const latticeMat = new THREE.MeshStandardMaterial({ map: latticeTexture(), roughness: 0.4, emissive: 0x442200, emissiveIntensity: 0.3 });
  const doorMat = new THREE.MeshStandardMaterial({ map: doorTexture(), roughness: 0.85 });
  const stoneWallMat = new THREE.MeshStandardMaterial({ map: stoneWallTexture(), roughness: 0.95 });
  // Cỏ / lá tre vẽ trên nền trong suốt (mặt phẳng chéo, không dùng hình nón).
  const grassBladeMat = new THREE.MeshStandardMaterial({ map: grassBladeTexture(), roughness: 1, side: THREE.DoubleSide, alphaTest: 0.4 });
  const bambooLeafTexMat = new THREE.MeshStandardMaterial({ map: bambooLeafTexture(), roughness: 0.9, side: THREE.DoubleSide, alphaTest: 0.4 });
  const cloudMat = new THREE.MeshBasicMaterial({ map: cloudTexture(), transparent: true, depthWrite: false, fog: false, opacity: 0.9 });
  // Núi xa: đá xám + tuyết (đỉnh phủ trắng).
  const mountainRockMat = new THREE.MeshStandardMaterial({ map: stoneWallTexture(), color: 0x8a94a3, roughness: 1 });
  const mountainSnowMat = new THREE.MeshStandardMaterial({ color: 0xe8eef2, roughness: 0.9 });
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x5a7f3a, roughness: 1 });
  const hillMat2 = new THREE.MeshStandardMaterial({ color: 0x6b8f45, roughness: 1 });

  function addCollider(x, z, r) { colliders.push({ x, z, r }); }
  function shadowed(mesh, cast = true, receive = false) {
    mesh.castShadow = cast; mesh.receiveShadow = receive; return mesh;
  }

  // --- Bầu trời gradient: sphere lớn, mặt trong, shader đơn giản ---------
  const skyGeo = new THREE.SphereGeometry(220, 24, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color(0x6ea8dd) },
      mid: { value: new THREE.Color(0xcfe6f5) },
      bot: { value: new THREE.Color(0xffe8c0) },
      sunDir: { value: new THREE.Vector3(45, 65, 25).normalize() },
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform vec3 sunDir; void main(){ float h = normalize(vP).y; vec3 c = h > 0.15 ? mix(mid, top, smoothstep(0.15, 0.7, h)) : mix(bot, mid, smoothstep(-0.1, 0.15, h)); float s = max(dot(normalize(vP), sunDir), 0.0); c += vec3(1.0, 0.82, 0.55) * pow(s, 24.0) * 0.6 + vec3(1.0, 0.9, 0.7) * pow(s, 6.0) * 0.12; gl_FragColor = vec4(c, 1.0); }',
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // --- Sương ấm nhạt + ánh sáng -------------------------------------------
  scene.fog = new THREE.Fog(0xffe8c8, 60, 200);
  scene.background = new THREE.Color(0xcfe6f5);
  const sun = new THREE.DirectionalLight(0xffe3b3, 2.6);
  sun.position.set(45, 65, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -58; sun.shadow.camera.right = 58;
  sun.shadow.camera.top = 58; sun.shadow.camera.bottom = -58;
  sun.shadow.camera.near = 5; sun.shadow.camera.far = 180;
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x8a7a5a, 0.95));
  // Mặt trời vẽ bằng đĩa sáng nhỏ trên trời (không phải light)
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(7, 24), new THREE.MeshBasicMaterial({ color: 0xfff2c0, fog: false }));
  sunDisc.position.set(90, 95, -120);
  sunDisc.lookAt(0, 0, 0);
  scene.add(sunDisc);

  // --- Nền đất ngoài làng + núi xa + đồi bao quanh + mây trôi --------------
  // Nền đất tròn lớn dưới mặt đất làng (y=-0.1): để đồi/núi không nổi trên
  // nền trời trống ngoài mép đất 140x140.
  const outerGround = new THREE.Mesh(
    new THREE.CircleGeometry(260, 48),
    new THREE.MeshStandardMaterial({ color: 0x557f38, roughness: 1 })
  );
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.1;
  scene.add(outerGround);

  // Mây: sprite mềm trôi chậm trên trời.
  const clouds = [];
  for (let i = 0; i < 7; i++) {
    const sm = new THREE.SpriteMaterial({ map: cloudTexture(), transparent: true, depthWrite: false, fog: false, opacity: 0.85 });
    const spr = new THREE.Sprite(sm);
    const ang = (i / 7) * Math.PI * 2 + Math.random() * 0.5;
    const rad = 70 + Math.random() * 80;
    spr.position.set(Math.cos(ang) * rad, 55 + Math.random() * 30, Math.sin(ang) * rad);
    spr.scale.set(46 + Math.random() * 30, 16 + Math.random() * 10, 1);
    scene.add(spr);
    clouds.push({ spr, speed: 0.4 + Math.random() * 0.5 });
  }
  animated.clouds = clouds;

  // Núi xa: nón đá + chóp tuyết, mờ dần trong sương (fog tới 200 m).
  function makeMountain(x, z, h, r) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const rock = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mountainRockMat);
    rock.position.y = h / 2 - 0.5;
    g.add(rock);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.42, h * 0.38, 7), mountainSnowMat);
    cap.position.y = h - 0.5 - h * 0.19 + 0.4;
    g.add(cap);
    scene.add(g);
    return g;
  }
  makeMountain(-150, -80, 62, 46);
  makeMountain(-90, -165, 78, 55);
  makeMountain(0, -185, 66, 50);
  makeMountain(95, -155, 72, 52);
  makeMountain(170, -70, 58, 44);
  makeMountain(185, 40, 64, 48);
  makeMountain(140, 130, 70, 52);
  makeMountain(40, 180, 60, 46);
  makeMountain(-70, 175, 74, 54);
  makeMountain(-170, 90, 56, 42);
  makeMountain(-185, -10, 60, 44);

  // Đồi cỏ bao quanh làng (r ~64): vừa tạo chiều sâu, vừa làm biên tự
  // nhiên thay cho tường vô hình — có collider nên người chơi không đi xuyên.
  const hillSpots = [
    [-60, -35, 7, 3.2], [-45, -60, 6, 2.6], [-10, -64, 7, 3.0], [15, -62, 6, 2.8],
    [40, -60, 6, 2.4], [62, -30, 7, 3.4], [64, 25, 6, 2.6], [45, 62, 7, 3.0],
    [10, 64, 6, 2.5], [-25, 62, 7, 3.2], [-58, 30, 6, 2.7], [-64, -8, 7, 3.1],
  ];
  hillSpots.forEach(([hx, hz, hr, hh], i) => {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(hr, 18, 12), i % 2 ? hillMat2 : hillMat);
    hill.scale.y = hh / hr;
    hill.position.set(hx, -0.2, hz);
    hill.receiveShadow = true;
    scene.add(hill);
    addCollider(hx, hz, hr * 0.8);
  });

  // --- Mặt đất 140 x 140 ---------------------------------------------------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // --- Sông: x=22, rộng 8, z=-60..60 ---------------------------------------
  // Lòng sông hạ thấp một chút so với mặt đất (nhưng vẫn trên nền đất
  // ngoài y=-0.1 để không bị nền đất tròn che mất).
  const riverBed = new THREE.Mesh(new THREE.PlaneGeometry(9, 122), new THREE.MeshStandardMaterial({ color: 0x8a7a55, roughness: 1 }));
  riverBed.rotation.x = -Math.PI / 2;
  riverBed.position.set(22, -0.04, 0);
  riverBed.receiveShadow = true;
  scene.add(riverBed);

  const waterGeo = new THREE.PlaneGeometry(8, 120, 8, 48);
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(22, 0.06, 0);
  water.receiveShadow = true;
  scene.add(water);
  animated.water = water;
  animated.waterBase = waterGeo.attributes.position.array.slice();

  // Bờ sông: dải cát / đá hai bên
  const bankMat = new THREE.MeshStandardMaterial({ color: 0xcbb98a, roughness: 1 });
  [-1, 1].forEach((s) => {
    const bank = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 122), bankMat);
    bank.position.set(22 + s * 4.6, 0.05, 0);
    bank.receiveShadow = true;
    scene.add(bank);
    const stones = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 122), stoneMat);
    stones.position.set(22 + s * 5.4, 0.08, 0);
    stones.receiveShadow = true;
    scene.add(stones);
  });

  // --- Đường đá lát cong (ribbon dọc theo đường cong Catmull-Rom) ---------
  function createPath(points, width = 3) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], 0, p[1])));
    const segs = 60;
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const p = curve.getPoint(t);
      const tan = curve.getTangent(t);
      const nx = -tan.z, nz = tan.x; // pháp tuyến ngang
      pos.push(p.x + nx * width / 2, 0.03, p.z + nz * width / 2);
      pos.push(p.x - nx * width / 2, 0.03, p.z - nz * width / 2);
      uv.push(0, t * 12); uv.push(1, t * 12);
      if (i < segs) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, stoneMat);
    m.receiveShadow = true;
    scene.add(m);
  }
  // Đường chính Đông–Tây qua cầu, đường Bắc–Nam qua giếng/chợ, vòng quanh làng
  createPath([[-62, 2], [-30, 0], [-5, -2], [10, 0], [22, 0], [40, 1], [62, -2]], 3.2);
  createPath([[-5, -55], [-6, -20], [-5, -5], [-8, 10], [-5, 30], [-6, 55]], 2.6);
  createPath([[-28, -38], [0, -42], [32, -30], [45, 0], [30, 32], [0, 42], [-30, 32], [-45, 0], [-28, -38]], 2.4);

  // Tường nhà dùng bản khung gỗ tương ứng với màu tường gốc (thay màu phẳng).
  function frameMatFor(m) {
    if (m === wallYellowMat) return wallFrameYellowMat;
    if (m === wallGreyMat) return wallFrameGreyMat;
    return wallFrameWhiteMat;
  }

  // Chi tiết mái chung cho nhà thường + nhà đi vào được: tam giác đầu hồi
  // hai đầu, sừng mái vểnh 4 góc, đầu nóc.
  function addRoofDetails(g, w, d, hWall, roofH, wallMat) {
    const tri = new THREE.Shape();
    tri.moveTo(-d / 2, 0); tri.lineTo(d / 2, 0); tri.lineTo(0, roofH); tri.closePath();
    const gableGeo = new THREE.ExtrudeGeometry(tri, { depth: 0.12, bevelEnabled: false });
    [-1, 1].forEach((s) => {
      const gable = new THREE.Mesh(gableGeo, wallMat);
      gable.rotation.y = Math.PI / 2;
      gable.position.set(s * (w / 2) - (s > 0 ? 0.12 : 0), hWall + 0.05, 0);
      g.add(gable);
    });
    // Sừng mái vểnh 4 góc (mái cong vểnh lên ở góc — đặc trưng nhà cổ).
    [-1, 1].forEach((sx) => {
      [-1, 1].forEach((sz) => {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.5, 8), woodDarkMat);
        horn.position.set(sx * (w / 2 + 0.75), hWall + 0.05 + 0.62, sz * (d / 2 + 0.75));
        horn.rotation.z = -sx * 0.55;
        horn.rotation.x = sz * 0.55;
        g.add(horn);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), goldMat);
        tip.position.set(sx * (w / 2 + 0.82), hWall + 0.05 + 0.82, sz * (d / 2 + 0.82));
        g.add(tip);
      });
    });
    // Đầu nóc hai đầu
    [-1, 1].forEach((s) => {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.26, 0.3), woodDarkMat);
      cap.position.set(s * (w / 2 + 0.55), hWall + 0.05 + roofH + 0.05, 0);
      g.add(cap);
    });
  }

  // --- Nhà mái ngói cong ----------------------------------------------------
  function createHouse(x, z, rotY, opts = {}) {
    const w = opts.w || 5.5, d = opts.d || 4.5, hWall = opts.h || 2.6;
    const wallMat = frameMatFor(opts.wallMat || wallWhiteMat);
    const roofMat = opts.roofMat || tileMatBlue;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;

    const walls = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, hWall, d), wallMat), true, true);
    walls.position.y = hWall / 2;
    g.add(walls);
    // Cột gỗ 4 góc + xà ngang trên tường
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.2, hWall, 0.2), woodDarkMat);
      pillar.position.set(sx * (w / 2 - 0.05), hWall / 2, sz * (d / 2 - 0.05));
      g.add(pillar);
    });
    [-1, 1].forEach((sz) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.16, 0.14), woodMat);
      beam.position.set(0, hWall - 0.1, sz * (d / 2 + 0.02));
      g.add(beam);
    });
    // Chân tường đá
    const base = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.35, d + 0.2), stoneMat);
    base.position.y = 0.17;
    g.add(base);
    // Mái cong (không phải hộp) + nóc + đầu hồi + sừng mái
    const roofH = opts.roofH || 1.7;
    const roof = shadowed(new THREE.Mesh(createCurvedRoofGeometry(w + 1.6, d + 1.6, roofH, 0.6), roofMat));
    roof.position.y = hWall + 0.05;
    g.add(roof);
    addRoofDetails(g, w, d, hWall, roofH, wallMat);
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, w + 1.2, 8), woodDarkMat);
    ridge.rotation.z = Math.PI / 2;
    ridge.position.y = hWall + 0.05 + roofH + 0.02;
    g.add(ridge);
    // Diềm mái gỗ
    const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 1.5, 0.12, 0.18), woodMat);
    eave.position.set(0, hWall + 0.12, (d + 1.6) / 2 - 0.05);
    g.add(eave);
    const eave2 = eave.clone();
    eave2.position.z = -((d + 1.6) / 2 - 0.05);
    g.add(eave2);
    // Cửa ván (texture ván + đinh tán + tay nắm vòng)
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.9, 0.12), doorMat);
    door.position.set(0, 0.95, d / 2 + 0.03);
    g.add(door);
    // Cửa sổ chạm khắc hai bên cửa: lưới gỗ + giấy sáng
    [-1, 1].forEach((s) => {
      const backing = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.05), woodDarkMat);
      backing.position.set(s * 1.8, 1.5, d / 2 + 0.01);
      g.add(backing);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), latticeMat);
      win.position.set(s * 1.8, 1.5, d / 2 + 0.05);
      g.add(win);
    });
    // Biển hiệu trên cửa
    if (opts.sign) {
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 0.82),
        new THREE.MeshStandardMaterial({ map: signTexture(opts.sign, opts.signSub || ''), roughness: 0.8 })
      );
      sign.position.set(0, hWall + 0.55, d / 2 + 0.35);
      sign.rotation.x = -0.08;
      g.add(sign);
    }
    scene.add(g);
    addCollider(x, z, Math.max(w, d) * 0.62);
    return g;
  }

  // --- Nội thất & công trình đi vào được (Phase 4) -------------------------
  // Bàn học / bàn thi: mặt bàn + 4 chân + ngăn kéo + ghế có tựa + sách mở
  // + bút lông + nghiên mực + tờ giấy. `parent` là group của tòa nhà
  // (tọa độ cục bộ, mặt -Z quay về phía bảng / phía trước lớp).
  function makeStudyDesk(parent, lx, lz) {
    const dg = new THREE.Group();
    dg.position.set(lx, 0, lz);
    parent.add(dg);
    const top = shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.06, 0.62), woodMat), true, true);
    top.position.y = 0.74;
    dg.add(top);
    [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].forEach(([px, pz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.72, 8), woodDarkMat);
      leg.position.set(px, 0.37, pz);
      dg.add(leg);
    });
    const apron = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 0.5), woodDarkMat);
    apron.position.y = 0.66;
    dg.add(apron);
    // Ghế: mặt + 4 chân + tựa lưng (đặt phía +Z: người ngồi quay về -Z)
    const chair = new THREE.Group();
    chair.position.set(0, 0, 0.66);
    dg.add(chair);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.44), woodMat);
    seat.position.y = 0.45;
    seat.castShadow = true;
    chair.add(seat);
    [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].forEach(([px, pz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.45, 6), woodDarkMat);
      leg.position.set(px, 0.225, pz);
      chair.add(leg);
    });
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.55, 0.05), woodMat);
    back.position.set(0, 0.75, 0.21);
    chair.add(back);
    // Sách mở trên bàn: hai trang giấy nghiêng
    const pageMat = new THREE.MeshStandardMaterial({ color: 0xf5ead0, roughness: 0.9 });
    [-1, 1].forEach((s) => {
      const page = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.015, 0.3), pageMat);
      page.position.set(s * 0.1, 0.79, -0.05);
      page.rotation.z = -s * 0.18;
      dg.add(page);
    });
    // Bút lông nằm ngang + đầu bút + nghiên mực + tờ giấy
    const brush = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), woodDarkMat);
    brush.rotation.z = Math.PI / 2;
    brush.rotation.y = 0.4;
    brush.position.set(0.36, 0.785, 0.08);
    dg.add(brush);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.07, 6), new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.9 }));
    tip.rotation.z = -Math.PI / 2;
    tip.rotation.y = 0.4;
    tip.position.set(0.5, 0.785, 0.14);
    dg.add(tip);
    const ink = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.035, 12), new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.4 }));
    ink.position.set(-0.42, 0.79, -0.12);
    dg.add(ink);
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.19), pageMat);
    paper.rotation.x = -Math.PI / 2;
    paper.rotation.z = 0.15;
    paper.position.set(0.08, 0.775, 0.12);
    dg.add(paper);
    return dg;
  }

  // Bàn thầy: rộng hơn, có chồng sách cổ, ống đựng bút, cuộn sách, nghiên lớn.
  function makeTeacherDesk(parent, lx, lz) {
    const dg = new THREE.Group();
    dg.position.set(lx, 0, lz);
    parent.add(dg);
    const top = shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.07, 0.85), woodMat), true, true);
    top.position.y = 0.78;
    dg.add(top);
    [[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]].forEach(([px, pz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.76, 8), woodDarkMat);
      leg.position.set(px, 0.38, pz);
      dg.add(leg);
    });
    const apron = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.14, 0.7), woodDarkMat);
    apron.position.y = 0.68;
    dg.add(apron);
    // Chồng 3 quyển sách cổ
    const bookCols = [0x8c2f2f, 0x2e5d8c, 0x3a6b3a];
    bookCols.forEach((c, i) => {
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.42 - i * 0.04, 0.06, 0.3), new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }));
      book.position.set(-0.45, 0.85 + i * 0.06, -0.15);
      book.rotation.y = (i - 1) * 0.12;
      dg.add(book);
    });
    // Ống đựng bút + 3 bút lông đứng
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.22, 10), woodDarkMat);
    pot.position.set(0.62, 0.93, -0.2);
    dg.add(pot);
    [-0.15, 0, 0.15].forEach((a) => {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6), woodDarkMat);
      b.position.set(0.62 + a * 0.2, 1.08, -0.2);
      b.rotation.z = a;
      dg.add(b);
    });
    // Cuộn sách mở + nghiên mực lớn
    const pageMat = new THREE.MeshStandardMaterial({ color: 0xf5ead0, roughness: 0.9 });
    const scrollPage = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.32), pageMat);
    scrollPage.rotation.x = -Math.PI / 2;
    scrollPage.position.set(0.1, 0.82, 0.15);
    dg.add(scrollPage);
    const ink = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.4 }));
    ink.position.set(-0.6, 0.84, 0.18);
    dg.add(ink);
    return dg;
  }

  // Giá sách: khung gỗ 3 đợt, sách cổ nhiều màu xếp dọc tường.
  function makeBookshelf(parent, lx, lz, rotY) {
    const g = new THREE.Group();
    g.position.set(lx, 0, lz);
    g.rotation.y = rotY;
    parent.add(g);
    const sideGeo = new THREE.BoxGeometry(0.06, 2.0, 0.35);
    [-1.17, 1.17].forEach((px) => {
      const s = new THREE.Mesh(sideGeo, woodDarkMat);
      s.position.set(px, 1.0, 0);
      g.add(s);
    });
    [0.06, 0.72, 1.38, 1.97].forEach((py) => {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 0.35), woodMat);
      sh.position.set(0, py, 0);
      g.add(sh);
    });
    const bookCols = [0x8c2f2f, 0x2e5d8c, 0x3a6b3a, 0xc8a24a, 0x5a3a6e];
    for (let shelf = 0; shelf < 3; shelf++) {
      const baseY = [0.085, 0.745, 1.405][shelf];
      for (let i = 0; i < 9; i++) {
        const bh = 0.42 + ((i * 7 + shelf * 3) % 5) * 0.04;
        const book = new THREE.Mesh(new THREE.BoxGeometry(0.16, bh, 0.24), new THREE.MeshStandardMaterial({ color: bookCols[(i + shelf) % bookCols.length], roughness: 0.85 }));
        book.position.set(-1.02 + i * 0.24, baseY + bh / 2, 0);
        book.rotation.z = (i === 6 ? -0.12 : 0);
        g.add(book);
      }
    }
    return g;
  }

  // Đèn lồng treo trong nhà (treo từ trần/xà, đung đưa theo animated.lanterns).
  // Nhỏ + treo cao hơn đèn ngoài trời: kiểm thử 27/11 ghi đèn lồng trong lớp
  // rất to, che thêm tầm nhìn — trong nhà camera bị kéo lại gần (main.js:
  // tối đa 7,5 m, thực tế ~2–3 m vì tường chặn) nên đèn cũ đường kính
  // 0,52 m, tua rua chạm tới ~1,9 m chiếm quá nhiều khung hình. Bản này:
  // thân 0,36 m, đáy tua rua ~2,15 m (treo ở 2,9 m), chỉ dùng trong nhà.
  function makeIndoorLantern(parent, lx, ly, lz) {
    const g = new THREE.Group();
    g.position.set(lx, ly, lz);
    parent.add(g);
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 5), woodDarkMat);
    string.position.y = -0.125;
    g.add(string);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), lanternMat);
    body.scale.y = 0.85;
    body.position.y = -0.42;
    g.add(body);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.06, 10), goldMat);
    cap.position.y = -0.28;
    g.add(cap);
    const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.14, 6), goldMat);
    tassel.position.y = -0.68;
    g.add(tassel);
    animated.lanterns.push({ obj: g, phase: Math.random() * Math.PI * 2 });
    return g;
  }

  // Công trình ĐI VÀO ĐƯỢC: tường Bắc/Tây/Đông kín, tường Nam (+Z cục bộ)
  // chừa cửa rộng doorWidth. KHÔNG dùng collider tròn lớn: tường là hàng
  // collider tròn nhỏ r=0.85 cách nhau ~1.3 m (chồng lên nhau thành hàng rào
  // liên tục, chừa đúng khe cửa) để cả người chơi lẫn camera (main.js dùng
  // collider tròn) đều bị chặn. Cửa là mesh riêng có bản lề: đóng = có
  // collider chặn lối cửa, mở = xoay vào trong + gỡ collider.
  // opts: x,z,rotY,w,d,h,roofH,wallMat,roofMat,sign,signSub,doorWidth,
  //       doorId,doorLabel,onInterior({group,toWorld,w,d,h,doorW})
  function createEnterableBuilding(opts) {
    const w = opts.w, d = opts.d, h = opts.h || 3.1;
    const doorW = opts.doorWidth || 1.8, doorH = 2.2, T = 0.3;
    const rotY = opts.rotY || 0;
    const wallMat = frameMatFor(opts.wallMat || wallWhiteMat);
    const g = new THREE.Group();
    g.position.set(opts.x, 0, opts.z);
    g.rotation.y = rotY;
    const toWorld = (lx, lz) => {
      const c = Math.cos(rotY), s = Math.sin(rotY);
      return { x: opts.x + lx * c + lz * s, z: opts.z - lx * s + lz * c };
    };
    function wallBox(bw, bh, bd, lx, ly, lz, m) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), m || wallWhiteMat);
      mesh.position.set(lx, ly, lz);
      mesh.castShadow = true; mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    }
    // Tường: Bắc kín, Tây/Đông kín, Nam 2 đoạn + lanh-tô trên cửa
    wallBox(w, h, T, 0, h / 2, -d / 2, wallMat);
    wallBox(T, h, d, -w / 2, h / 2, 0, wallMat);
    wallBox(T, h, d, w / 2, h / 2, 0, wallMat);
    const segLen = (w - doorW) / 2;
    wallBox(segLen, h, T, -(doorW / 2 + segLen / 2), h / 2, d / 2, wallMat);
    wallBox(segLen, h, T, (doorW / 2 + segLen / 2), h / 2, d / 2, wallMat);
    wallBox(doorW, h - doorH, T, 0, doorH + (h - doorH) / 2, d / 2, wallMat);
    // Chân tường đá: KHÔNG làm hộp đặc (sẽ nuốt sàn trong nhà) — chỉ 4
    // dải đá dưới chân tường, dải Nam chừa đúng khe cửa (ngưỡng cửa thấp).
    const baseSeg = (w - doorW) / 2;
    [[w + 0.2, 0.4, 0, -d / 2], [baseSeg, 0.4, -(doorW / 2 + baseSeg / 2), d / 2], [baseSeg, 0.4, (doorW / 2 + baseSeg / 2), d / 2]].forEach(([bw, bd, lx, lz]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.35, bd), stoneMat);
      b.position.set(lx, 0.17, lz);
      g.add(b);
    });
    [[0.4, d - 0.4, -w / 2, 0], [0.4, d - 0.4, w / 2, 0]].forEach(([bw, bd, lx, lz]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.35, bd), stoneMat);
      b.position.set(lx, 0.17, lz);
      g.add(b);
    });
    // Sàn gỗ trong nhà + trần (nhìn từ dưới lên) + 3 xà gỗ
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, d - 0.4), new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.03;
    floor.receiveShadow = true;
    g.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.2, d - 0.2), new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.95, side: THREE.DoubleSide }));
    ceil.rotation.x = Math.PI / 2; // mặt hướng xuống (nhìn được từ trong nhà)
    ceil.position.y = h - 0.06;
    g.add(ceil);
    [-d / 4, 0, d / 4].forEach((lz) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, 0.16, 0.16), woodDarkMat);
      beam.position.set(0, h - 0.18, lz);
      g.add(beam);
    });
    // Mái ngói cong + nóc + diềm mái (như createHouse)
    const roofH = opts.roofH || 1.7;
    const roof = shadowed(new THREE.Mesh(createCurvedRoofGeometry(w + 1.6, d + 1.6, roofH, 0.6), opts.roofMat || tileMatBlue));
    roof.position.y = h + 0.05;
    g.add(roof);
    addRoofDetails(g, w, d, h, roofH, wallMat);
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, w + 1.2, 8), woodDarkMat);
    ridge.rotation.z = Math.PI / 2;
    ridge.position.y = h + 0.05 + roofH + 0.02;
    g.add(ridge);
    // Cửa sổ giấy hai bên hông: mặt giấy nằm NHÔ RA khỏi cả 2 mặt tường
    // (tường là hộp đặc — đặt đúng mặt phẳng giữa tường sẽ bị che khuất),
    // khung gỗ 4 thanh ôm quanh mép tường.
    const winMat = latticeMat;
    [-1, 1].forEach((s) => {
      [1, -1].forEach((side) => { // side=1: mặt ngoài, side=-1: mặt trong
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), winMat);
        win.position.set(s * (w / 2 + side * 0.16), 1.6, 0);
        win.rotation.y = (s * side * Math.PI) / 2;
        g.add(win);
      });
      [[0.36, 0.08, 1.06, 0, 2.12, 0], [0.36, 0.08, 1.06, 0, 1.08, 0], [0.36, 1.0, 0.08, 0, 1.6, -0.5], [0.36, 1.0, 0.08, 0, 1.6, 0.5]].forEach(([bw, bh, bd, px, py, pz]) => {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), woodDarkMat);
        bar.position.set(s * (w / 2) + px, py, pz);
        g.add(bar);
      });
    });
    // Khung cửa: 2 trụ + lanh-tô gỗ
    [-1, 1].forEach((s) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.3, 0.16), woodDarkMat);
      post.position.set(s * (doorW / 2 + 0.05), 1.15, d / 2 + 0.04);
      g.add(post);
    });
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.4, 0.16, 0.16), woodDarkMat);
    lintel.position.set(0, 2.3, d / 2 + 0.04);
    g.add(lintel);
    // Cửa gỗ: bản lề ở mép trái, xoay vào trong khi mở
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-doorW / 2, 0, d / 2);
    g.add(doorPivot);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.09), doorMat);
    panel.position.set(doorW / 2, doorH / 2, 0);
    panel.castShadow = true;
    doorPivot.add(panel);
    [0.5, 1.7].forEach((py) => {
      const batten = new THREE.Mesh(new THREE.BoxGeometry(doorW - 0.1, 0.09, 0.03), woodDarkMat);
      batten.position.set(doorW / 2, py, 0.06);
      doorPivot.add(batten);
    });
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), goldMat);
    knob.position.set(doorW - 0.28, 1.05, 0.09);
    doorPivot.add(knob);
    // Biển hiệu trên cửa
    if (opts.sign) {
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 0.82),
        new THREE.MeshStandardMaterial({ map: signTexture(opts.sign, opts.signSub || ''), roughness: 0.8 })
      );
      sign.position.set(0, h + 0.55, d / 2 + 0.35);
      sign.rotation.x = -0.08;
      g.add(sign);
    }
    // Collider tường: hàng tròn nhỏ dọc tường, chừa đúng khe cửa.
    // LƯU Ý: bán kính collider + bán kính người chơi (0.45) phải nhỏ hơn
    // nửa khe cửa, nếu không hai collider ở mép cửa sẽ chồng lên nhau và
    // bịt kín cửa ngay cả khi cửa đã mở (lỗi kiểm thử 27/11: không vào
    // được lớp học/trường thi). Vì vậy cửa rộng 2.0 m, mép cửa lùi ra
    // ±(doorW/2+0.6) và collider ở đoạn tường Nam dùng bán kính nhỏ (0.35)
    // để vùng đi qua giữa cửa rộng ~1.6 m, bấm W đi thẳng cũng qua được.
    function wallLine(lx0, lz0, lx1, lz1, step = 1.3, r = 0.65) {
      const len = Math.hypot(lx1 - lx0, lz1 - lz0);
      const n = Math.max(1, Math.round(len / step));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const p = toWorld(lx0 + (lx1 - lx0) * t, lz0 + (lz1 - lz0) * t);
        addCollider(p.x, p.z, r);
      }
    }
    wallLine(-w / 2, -d / 2, w / 2, -d / 2);
    wallLine(-w / 2, -d / 2, -w / 2, d / 2);
    wallLine(w / 2, -d / 2, w / 2, d / 2);
    wallLine(-w / 2, d / 2, -doorW / 2 - 0.6, d / 2, 1.3, 0.35);
    wallLine(doorW / 2 + 0.6, d / 2, w / 2, d / 2, 1.3, 0.35);
    // Cửa: collider riêng, chỉ tồn tại khi đóng
    const doorWorld = toWorld(0, d / 2);
    const doorCollider = { x: doorWorld.x, z: doorWorld.z, r: 0.95 };
    let open = false;
    let targetRot = 0;
    function applyDoor() {
      const i = colliders.indexOf(doorCollider);
      if (open) {
        if (i >= 0) colliders.splice(i, 1);
        targetRot = 1.9; // xoay vào trong (~109°)
      } else {
        if (i < 0) colliders.push(doorCollider);
        targetRot = 0;
      }
    }
    applyDoor();
    const doorApi = {
      id: opts.doorId, x: doorWorld.x, z: doorWorld.z,
      label: opts.doorLabel || 'Cửa',
      isOpen: () => open,
      toggle: () => { open = !open; applyDoor(); },
    };
    doors.push(doorApi);
    animated.doors.push({ pivot: doorPivot, getTarget: () => targetRot });
    scene.add(g);
    // Ghi lại tòa nhà để camera trong nhà ẩn mái + trần khi người chơi ở
    // trong (xem buildingAt): nếu không ẩn, camera trên cao nhìn xuyên mái
    // sẽ bị mái/trần che mất nhân vật (kiểm thử 27/11).
    buildings.push({ x: opts.x, z: opts.z, w, d, rotY, roof, ceil });
    if (typeof opts.onInterior === 'function') {
      try { opts.onInterior({ group: g, toWorld, w, d, h, doorW }); } catch (_err) { /* nội thất lỗi: tòa nhà vẫn đứng vững */ }
    }
    return { group: g, door: doorApi, toWorld };
  }

  // 7 nhà rải quanh làng — không trùng trường/chợ/giếng/ruộng/rừng trúc,
  // không chắn đường chính (đường Đông–Tây z≈0 và Bắc–Nam x≈-5).
  createHouse(-38, 18, 0.4, { sign: '福宅', signSub: 'Nhà họ Phúc', roofMat: tileMatBlue });
  createHouse(-36, -8, -0.3, { sign: '茶館', signSub: 'Quán Trà', wallMat: wallYellowMat, roofMat: tileMatRed });
  createHouse(5, -28, 0.9, { sign: '書屋', signSub: 'Nhà Sách', roofMat: tileMatBlue });
  createHouse(10, 18, -0.6, { sign: '藥鋪', signSub: 'Hiệu Thuốc', wallMat: wallGreyMat, roofMat: tileMatRed });
  createHouse(38, 20, -1.2, { sign: '酒家', signSub: 'Tửu Quán', roofMat: tileMatBlue });
  createHouse(8, -48, 0.2, { sign: '民居', signSub: 'Nhà Dân', wallMat: wallYellowMat, roofMat: tileMatRed });
  createHouse(-12, -38, 0.5, { sign: '繡坊', signSub: 'Xưởng Thêu', roofMat: tileMatBlue });

  // --- Trường học ở (-28,-20): ĐI VÀO ĐƯỢC (Phase 4) -----------------------
  // Cửa ở mặt Nam (local +Z, rotY 0.35 → cửa thế giới ≈ (-26.97,-17.18)),
  // thông ra sân đá đã có ở (-26.5,-16.5). Tường Bắc/Tây/Đông kín, tường
  // Nam chừa cửa rộng 1.8 m. Collider tròn lớn cũ (r≈5) đã bỏ, thay bằng
  // hàng collider nhỏ dọc tường trong createEnterableBuilding.
  const school = createEnterableBuilding({
    x: -28, z: -20, rotY: 0.35, w: 8, d: 6, h: 3.1, roofH: 2.1, doorWidth: 2.0,
    wallMat: wallYellowMat, roofMat: tileMatRed,
    sign: '學堂', signSub: 'Trường Học Thanh Khê',
    doorId: 'school', doorLabel: 'Cửa trường học',
    onInterior: ({ group, toWorld, w, d }) => {
      // Bảng đen lớn trên tường Bắc (để trống cho Phase 5 ghi chữ lên).
      // Vẽ lên texture canvas của bảng qua env.setBlackboardText().
      const bbCanvas = document.createElement('canvas');
      bbCanvas.width = 512; bbCanvas.height = 288;
      const bbCtx = bbCanvas.getContext('2d');
      const bbTex = new THREE.CanvasTexture(bbCanvas);
      bbTex.colorSpace = THREE.SRGBColorSpace;
      function drawBoard(hanzi, pinyin) {
        if (!bbCtx) return;
        bbCtx.fillStyle = '#22392c';
        bbCtx.fillRect(0, 0, 512, 288);
        bbCtx.strokeStyle = 'rgba(255,255,255,0.05)';
        bbCtx.lineWidth = 1;
        for (let y = 40; y < 288; y += 40) { bbCtx.beginPath(); bbCtx.moveTo(0, y); bbCtx.lineTo(512, y); bbCtx.stroke(); }
        bbCtx.fillStyle = '#f5f2e8';
        bbCtx.textAlign = 'center';
        bbCtx.textBaseline = 'middle';
        bbCtx.font = 'bold 110px serif';
        bbCtx.fillText(String(hanzi || '你好'), 256, 115);
        bbCtx.font = '44px serif';
        bbCtx.fillText(String(pinyin || 'Nǐ hǎo'), 256, 225);
        bbTex.needsUpdate = true;
      }
      drawBoard('你好', 'Nǐ hǎo');
      blackboardDraw = drawBoard;
      const bp = toWorld(0, -d / 2 + 0.6);
      blackboardFallback = { x: bp.x, y: 1.75, z: bp.z, created: false };
      const board = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.6), new THREE.MeshStandardMaterial({ map: bbTex, roughness: 0.9 }));
      board.position.set(0, 1.75, -d / 2 + 0.18);
      group.add(board);
      // Khung gỗ quanh bảng
      [[0, 2.59, 3.8, 0.08], [0, 0.91, 3.8, 0.08]].forEach(([px, py, bw, bh]) => {
        const f = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.06), woodDarkMat);
        f.position.set(px, py, -d / 2 + 0.18);
        group.add(f);
      });
      [[-1.86, 1.75], [1.86, 1.75]].forEach(([px, py]) => {
        const f = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.68, 0.06), woodDarkMat);
        f.position.set(px, py, -d / 2 + 0.18);
        group.add(f);
      });
      // 6 bàn học sinh: 2 hàng x 3 (hàng trước z=-0.8, hàng sau z=1.0)
      [[-2.2, -0.8], [0, -0.8], [2.2, -0.8], [-2.2, 1.0], [0, 1.0], [2.2, 1.0]]
        .forEach(([lx, lz]) => makeStudyDesk(group, lx, lz));
      // Bàn thầy ở phía trước, gần bảng
      makeTeacherDesk(group, 0, -2.0);
      // Giá sách dọc tường Tây
      makeBookshelf(group, -w / 2 + 0.35, 0.3, Math.PI / 2);
      // Tranh chữ treo tường Đông
      const scroll = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.5), new THREE.MeshStandardMaterial({ map: signTexture('學', 'Học'), roughness: 0.9, side: THREE.DoubleSide }));
      scroll.position.set(w / 2 - 0.18, 1.7, -1);
      scroll.rotation.y = -Math.PI / 2;
      group.add(scroll);
      // 2 đèn lồng trong nhà + 1 đèn PointLight ấm trong lớp
      makeIndoorLantern(group, -2.2, 2.9, 0.3);
      makeIndoorLantern(group, 2.2, 2.9, 0.3);
      const warm = new THREE.PointLight(0xffc37a, 15, 11, 1.8);
      const wp = toWorld(0, 0);
      warm.position.set(wp.x, 2.6, wp.z);
      scene.add(warm);
    },
  });
  // Sân trường lát đá trước cửa
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), stoneMat);
  yard.rotation.x = -Math.PI / 2;
  yard.position.set(-26.5, 0.04, -16.5);
  yard.receiveShadow = true;
  scene.add(yard);
  // Cột cờ / cột đèn sân trường
  const flagPole = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 4.5, 8), woodDarkMat));
  flagPole.position.set(-24, 2.25, -17);
  scene.add(flagPole);
  addCollider(-24, -17, 0.35);

  // --- Trường thi mới ở (50,-52), phía Đông sông (Phase 4) ------------------
  // (45,-28) KHÔNG dùng được: nằm gọn trong rừng trúc x=35..55, z=-40..-10,
  // lại vướng cây (30,-28) và (42,-48). (50,-52) là đất trống: cách cây gần
  // nhất (42,-48) ~8 m, ngoài rừng trúc (z=-40..-10), ngoài đường vòng
  // làng, cách nhà (38,20) rất xa. Cửa quay về hướng Nam (về phía làng).
  const examHall = createEnterableBuilding({
    x: 50, z: -52, rotY: 0, w: 9, d: 6.5, h: 3.2, roofH: 1.9, doorWidth: 2.0,
    wallMat: wallGreyMat, roofMat: tileMatRed,
    sign: '科举考场', signSub: 'Trường Thi',
    doorId: 'examHall', doorLabel: 'Cửa trường thi',
    onInterior: ({ group, toWorld, w, d }) => {
      // 6 bàn thi riêng: 2 hàng x 3, mỗi bàn + ghế + giấy + bút
      const spots = [[-2.4, -1.1], [0, -1.1], [2.4, -1.1], [-2.4, 1.1], [0, 1.1], [2.4, 1.1]];
      spots.forEach(([lx, lz], i) => {
        makeStudyDesk(group, lx, lz);
        const wp = toWorld(lx, lz);
        examDesks.push({ id: 'exam-desk-' + (i + 1), x: wp.x, z: wp.z, rotY: 0, occupied: false });
        // Biển số bàn (mặt số quay về phía thí sinh ngồi, +Z)
        const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.19), new THREE.MeshStandardMaterial({ map: signTexture(String(i + 1), ''), roughness: 0.85, side: THREE.DoubleSide }));
        plate.position.set(lx, 1.0, lz - 0.34);
        plate.rotation.y = Math.PI;
        group.add(plate);
      });
      // Biển chỉ bàn gần cửa (bên tường Đông)
      const guide = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.95), new THREE.MeshStandardMaterial({ map: signTexture('考场', '按号入座 · 六案'), roughness: 0.85, side: THREE.DoubleSide }));
      guide.position.set(w / 2 - 0.35, 1.35, 2.0);
      guide.rotation.y = -Math.PI / 2;
      group.add(guide);
      // 1 đèn lồng + 1 đèn PointLight ấm trong phòng thi
      makeIndoorLantern(group, 0, 2.9, 0);
      const warm = new THREE.PointLight(0xffc37a, 15, 12, 1.8);
      warm.position.set(50, 2.7, -52);
      scene.add(warm);
    },
  });
  // Sân lát đá trước trường thi
  const examYard = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), stoneMat);
  examYard.rotation.x = -Math.PI / 2;
  examYard.position.set(50, 0.04, -46.2);
  examYard.receiveShadow = true;
  scene.add(examYard);
  // Đường mòn từ làng qua phía Đông sông tới cổng trường thi
  createPath([[38, 4], [46, -18], [50, -42]], 2.4);
  // Cổng trường thi: 2 cột đá + biển 科举考场 + cửa cổng gỗ mở được
  (function createExamGate() {
    const gz = -44;
    [-1.4, 1.4].forEach((dx) => {
      const pillar = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 3.4, 10), stoneMat), true, true);
      pillar.position.set(50 + dx, 1.7, gz);
      scene.add(pillar);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.48, 10, 8), tileMatRed);
      cap.position.set(50 + dx, 3.6, gz);
      scene.add(cap);
      addCollider(50 + dx, gz, 0.45); // khe cổng 2.8 m: chừa lối đi ~1.0 m
    });
    const gateSign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.9), new THREE.MeshStandardMaterial({ map: signTexture('科举考场', 'Trường Thi'), roughness: 0.85, side: THREE.DoubleSide }));
    gateSign.position.set(50, 3.1, gz);
    scene.add(gateSign);
    // Cửa cổng gỗ: bản lề ở cột Tây, mở xoay vào trong (về phía trường thi)
    const pivot = new THREE.Group();
    pivot.position.set(48.95, 0, gz);
    scene.add(pivot);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.2, 0.09), woodMat);
    panel.position.set(0.95, 1.1, 0);
    panel.castShadow = true;
    pivot.add(panel);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), goldMat);
    knob.position.set(1.7, 1.1, 0.08);
    pivot.add(knob);
    const gateCollider = { x: 50, z: gz, r: 1.0 };
    let open = false;
    let targetRot = 0;
    function applyGate() {
      const i = colliders.indexOf(gateCollider);
      if (open) { if (i >= 0) colliders.splice(i, 1); targetRot = 1.9; }
      else { if (i < 0) colliders.push(gateCollider); targetRot = 0; }
    }
    applyGate();
    doors.push({
      id: 'examGate', x: 50, z: gz, label: 'Cổng trường thi',
      isOpen: () => open,
      toggle: () => { open = !open; applyGate(); },
    });
    animated.doors.push({ pivot, getTarget: () => targetRot });
  })();

  // --- Chợ ở (-15,10): ít nhất 3 sạp (làm 4 sạp) ---------------------------
  const stallCloths = [
    clothTexture('#c0392b', '#f5e6c8'),
    clothTexture('#2e7d32', '#f5e6c8'),
    clothTexture('#8e44ad', '#f5e6c8'),
    clothTexture('#d68910', '#fdf2e9'),
  ];
  // Hàng hóa theo loại sạp: trái cây / rau củ / vải / gốm — không còn 8 quả
  // cầu giống nhau ở mọi sạp. Mỗi sạp có diềm mái vải + biển hiệu chữ Hán.
  const stallSigns = [['果', 'Trái cây'], ['蔬', 'Rau củ'], ['布', 'Vải vóc'], ['陶', 'Gốm sứ']];
  function createStall(x, z, rotY, clothIdx, goodsColor) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    // 4 cột
    [[-1.1, -0.8], [1.1, -0.8], [-1.1, 0.8], [1.1, 0.8]].forEach(([px, pz]) => {
      const pole = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8), woodMat));
      pole.position.set(px, 1.1, pz);
      g.add(pole);
    });
    // Mái vải nghiêng (không phải mái nhà, là vải sạp)
    const clothMat = new THREE.MeshStandardMaterial({ map: stallCloths[clothIdx % stallCloths.length], roughness: 0.9, side: THREE.DoubleSide });
    const roofCloth = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 2.2), clothMat);
    roofCloth.rotation.x = -Math.PI / 2 + 0.22;
    roofCloth.position.y = 2.25;
    roofCloth.castShadow = true;
    g.add(roofCloth);
    // Diềm mái vải rủ ở mép trước
    const valance = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 0.35), clothMat);
    valance.position.set(0, 1.95, 1.08);
    g.add(valance);
    // Biển hiệu treo trước sạp
    const [signHanzi, signSub] = stallSigns[clothIdx % stallSigns.length];
    const stallSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.42),
      new THREE.MeshStandardMaterial({ map: signTexture(signHanzi, signSub), roughness: 0.85, side: THREE.DoubleSide })
    );
    stallSign.position.set(0, 1.62, 1.12);
    g.add(stallSign);
    // Quầy
    const counter = shadowed(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 1.1), woodMat), true, true);
    counter.position.y = 0.45;
    g.add(counter);
    // Ghế đẩu của người bán sau quầy
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.38, 10), woodMat);
    stool.position.set(0.5, 0.19, -1.15);
    g.add(stool);
    // Hàng hóa theo loại sạp
    if (clothIdx % 4 === 0) {
      // Trái cây: cầu nhiều màu xếp 2 hàng + giỏ trái cây
      const fruitGeo = new THREE.SphereGeometry(0.16, 10, 8);
      for (let i = 0; i < 8; i++) {
        const f = new THREE.Mesh(fruitGeo, new THREE.MeshStandardMaterial({ color: goodsColor, roughness: 0.6 }));
        f.position.set(-0.8 + (i % 4) * 0.55, 1.0, -0.25 + Math.floor(i / 4) * 0.5);
        g.add(f);
      }
    } else if (clothIdx % 4 === 1) {
      // Rau củ: quả dài nằm ngang, xanh/cam xen kẽ
      const vegGeo = new THREE.CapsuleGeometry(0.07, 0.26, 4, 8);
      const vegCols = [0x7cb342, 0xe67e22, 0x7cb342, 0xc0392b, 0x7cb342, 0xe67e22, 0x7cb342, 0x8e44ad];
      for (let i = 0; i < 8; i++) {
        const v = new THREE.Mesh(vegGeo, new THREE.MeshStandardMaterial({ color: vegCols[i], roughness: 0.7 }));
        v.rotation.z = Math.PI / 2;
        v.rotation.y = (i % 2 ? 0.3 : -0.3);
        v.position.set(-0.8 + (i % 4) * 0.55, 0.98, -0.25 + Math.floor(i / 4) * 0.5);
        g.add(v);
      }
    } else if (clothIdx % 4 === 2) {
      // Vải vóc: cuộn vải nằm ngang xếp chồng
      const boltCols = [0x8c2f2f, 0x2e5d8c, 0x3a6b3a, 0xc8a24a, 0x5a3a6e];
      boltCols.forEach((c, i) => {
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.85, 10), new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }));
        bolt.rotation.z = Math.PI / 2;
        bolt.position.set(-0.55 + (i % 3) * 0.55, 0.99 + Math.floor(i / 3) * 0.19, -0.1 + (i % 2) * 0.3);
        g.add(bolt);
      });
    } else {
      // Gốm sứ: bình + bát trên quầy
      const potPts = [new THREE.Vector2(0.02, 0), new THREE.Vector2(0.13, 0.02), new THREE.Vector2(0.16, 0.14), new THREE.Vector2(0.11, 0.26), new THREE.Vector2(0.13, 0.3)];
      const potGeo = new THREE.LatheGeometry(potPts, 12);
      const potCols = [0x8c5a2e, 0x3a5a8c, 0x7a6a8a, 0x5a7a4a];
      potCols.forEach((c, i) => {
        const pot = new THREE.Mesh(potGeo, new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }));
        pot.position.set(-0.75 + i * 0.5, 0.9, -0.15);
        g.add(pot);
      });
      for (let i = 0; i < 3; i++) {
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.09, 0.1, 12), new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.4 }));
        bowl.position.set(-0.6 + i * 0.55, 0.95, 0.3);
        g.add(bowl);
      }
    }
    scene.add(g);
    addCollider(x, z, 1.4);
    return g;
  }
  createStall(-18, 7, 0.3, 0, 0xe74c3c);
  createStall(-12, 8, -0.2, 1, 0x7cb342);
  createStall(-15, 14, 0.1, 2, 0xf39c12);
  createStall(-19, 13, 0.6, 3, 0xc0392b);

  // --- Đạo cụ làng: thùng, giỏ, ghế, bàn, hàng rào, đèn đá, bó rơm -------
  function makeBarrel(x, z, s = 1) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const body = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.32 * s, 0.36 * s, 0.85 * s, 12), woodMat));
    body.position.y = 0.43 * s;
    g.add(body);
    [0.2, 0.65].forEach((py) => {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.345 * s, 0.02, 6, 16), woodDarkMat);
      band.rotation.x = Math.PI / 2;
      band.position.y = py * s;
      g.add(band);
    });
    scene.add(g);
    addCollider(x, z, 0.4 * s);
    return g;
  }
  function makeBasket(x, z, s = 1, goods = 0x8ec63f) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const pts = [
      new THREE.Vector2(0.02, 0), new THREE.Vector2(0.28 * s, 0),
      new THREE.Vector2(0.34 * s, 0.16 * s), new THREE.Vector2(0.3 * s, 0.34 * s),
    ];
    const basket = shadowed(new THREE.Mesh(new THREE.LatheGeometry(pts, 12), new THREE.MeshStandardMaterial({ color: 0xb98d4f, roughness: 0.95 })));
    basket.position.y = 0.02;
    g.add(basket);
    for (let i = 0; i < 4; i++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.09 * s, 8, 6), new THREE.MeshStandardMaterial({ color: goods, roughness: 0.7 }));
      f.position.set((Math.random() - 0.5) * 0.3 * s, 0.36 * s, (Math.random() - 0.5) * 0.3 * s);
      g.add(f);
    }
    scene.add(g);
    addCollider(x, z, 0.35 * s);
    return g;
  }
  function makeBench(x, z, rotY) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    const seat = shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.45), woodMat), true, true);
    seat.position.y = 0.45;
    g.add(seat);
    [-0.6, 0.6].forEach((px) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.4), woodDarkMat);
      leg.position.set(px, 0.22, 0);
      g.add(leg);
    });
    scene.add(g);
    addCollider(x, z, 0.8);
    return g;
  }
  function makeTableStools(x, z, rotY) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    const top = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.07, 14), woodMat), true, true);
    top.position.y = 0.72;
    g.add(top);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.7, 10), woodDarkMat);
    leg.position.y = 0.36;
    g.add(leg);
    [[0.95, 0.3], [-0.8, 0.55], [0.1, -0.95]].forEach(([px, pz]) => {
      const stool = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.4, 10), woodMat));
      stool.position.set(px, 0.2, pz);
      g.add(stool);
    });
    // Ấm trà + chén trên bàn
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.16, 10), new THREE.MeshStandardMaterial({ color: 0x3a5a8c, roughness: 0.4 }));
    pot.position.set(0.15, 0.84, 0.1);
    g.add(pot);
    scene.add(g);
    addCollider(x, z, 1.0);
    return g;
  }
  function makeFence(x, z, rotY, len) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    const n = Math.max(2, Math.round(len / 1.3) + 1);
    for (let i = 0; i < n; i++) {
      const px = -len / 2 + (i * len) / (n - 1);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.95, 0.09), woodDarkMat);
      post.position.set(px, 0.48, 0);
      post.castShadow = true;
      g.add(post);
    }
    [0.35, 0.75].forEach((py) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.07, 0.06), woodMat);
      rail.position.set(0, py, 0);
      g.add(rail);
    });
    scene.add(g);
    const c = Math.cos(rotY), s = Math.sin(rotY);
    for (let i = 0; i < n; i++) {
      const px = -len / 2 + (i * len) / (n - 1);
      addCollider(x + px * c, z - px * s, 0.22);
    }
    return g;
  }
  function makeStoneLantern(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const base = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.6), stoneWallMat), true, true);
    base.position.y = 0.12;
    g.add(base);
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), stoneWallMat);
    pillar.position.y = 0.6;
    g.add(pillar);
    const lightBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), stoneWallMat);
    lightBox.position.y = 1.15;
    g.add(lightBox);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.24),
      new THREE.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xff9a2a, emissiveIntensity: 0.9 }));
    glow.position.set(0, 1.15, 0.26);
    g.add(glow);
    const roofL = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.3, 4), stoneWallMat);
    roofL.position.y = 1.5;
    roofL.rotation.y = Math.PI / 4;
    g.add(roofL);
    scene.add(g);
    addCollider(x, z, 0.45);
    return g;
  }
  function makeHaystack(x, z, s = 1) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const stack = shadowed(new THREE.Mesh(new THREE.ConeGeometry(1.1 * s, 2.0 * s, 12), new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 1 })));
    stack.position.y = 1.0 * s;
    g.add(stack);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.85 * s, 0.04, 6, 14), woodDarkMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = 0.7 * s;
    g.add(band);
    scene.add(g);
    addCollider(x, z, 1.1 * s);
    return g;
  }
  // Đặt đạo cụ có chủ đích quanh làng (không chắn đường chính).
  makeTableStools(-33, -5.5, 0.4);      // trước quán trà
  makeTableStools(-12, 16.5, -0.3);     // cạnh chợ
  makeBench(-24, -14.5, 0.3);           // sân trường
  makeBench(2, -3.5, -0.5);             // gần giếng
  makeBench(44, -43, 0.2);              // sân trường thi
  makeBarrel(-17, 5.2); makeBarrel(-11, 6.2); makeBarrel(-19.5, 15.5);
  makeBarrel(-4, -3.6); makeBarrel(39.5, 18.5); makeBarrel(-36.5, -5.5);
  makeBasket(-16.5, 11.5, 1, 0xe74c3c); makeBasket(-13, 10, 1, 0x7cb342);
  makeBasket(-19, 9.5, 1, 0xf39c12); makeBasket(8.5, 16, 1, 0xd9b96a);
  makeBasket(-37, -9.5, 1, 0x8ec63f); makeBasket(6.5, -26.5, 1, 0xe74c3c);
  makeStoneLantern(16.8, -2.6); makeStoneLantern(27.2, 2.6); // hai đầu cầu
  makeStoneLantern(-24, -15.2); makeStoneLantern(48.5, -43.5); // sân trường / trường thi
  makeHaystack(-34, 40, 1.1); makeHaystack(30, 40, 1); makeHaystack(-2, -52, 0.9);
  // Hàng rào gỗ dọc đường làng (cách mép đường, không chắn lối đi).
  makeFence(-12, -4.2, 0, 7);
  makeFence(8, 4.6, 0, 7);
  makeFence(-30, 2.8, Math.PI / 2, 6);
  makeFence(33, -2.8, Math.PI / 2, 6);
  makeFence(-20, -13.5, 0.35, 6);
  // Lau sậy hai bờ sông (mặt phẳng chéo, tán lá vẽ bằng texture).
  (function createReeds() {
    const reedGeo = new THREE.PlaneGeometry(0.9, 1.5);
    for (let i = 0; i < 26; i++) {
      const side = i % 2 ? 1 : -1;
      const x = 22 + side * (4.9 + Math.random() * 0.7);
      const z = -55 + Math.random() * 110;
      if (Math.abs(z) < 3.5) continue; // chừa hai đầu cầu
      const tuft = new THREE.Group();
      [0, Math.PI / 2].forEach((ry) => {
        const p = new THREE.Mesh(reedGeo, grassBladeMat);
        p.rotation.y = ry;
        p.position.y = 0.75;
        tuft.add(p);
      });
      tuft.position.set(x, 0, z);
      tuft.rotation.y = Math.random() * Math.PI;
      scene.add(tuft);
    }
  })();

  // --- Giếng ở (-5,-5) -------------------------------------------------------
  (function createWell() {
    const g = new THREE.Group();
    g.position.set(-5, 0, -5);
    const base = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.9, 12), stoneMat), true, true);
    base.position.y = 0.45;
    g.add(base);
    const waterDisc = new THREE.Mesh(new THREE.CircleGeometry(0.85, 20), new THREE.MeshStandardMaterial({ color: 0x2e6b8a, roughness: 0.2 }));
    waterDisc.rotation.x = -Math.PI / 2;
    waterDisc.position.y = 0.82;
    g.add(waterDisc);
    // 2 cột + mái ngói cong nhỏ
    [-0.9, 0.9].forEach((px) => {
      const pole = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8), woodMat));
      pole.position.set(px, 1.0, 0);
      g.add(pole);
    });
    const roof = shadowed(new THREE.Mesh(createCurvedRoofGeometry(2.8, 2.0, 0.7, 0.5), tileMatBlue));
    roof.position.y = 2.05;
    g.add(roof);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6), woodDarkMat);
    rope.position.y = 1.6;
    g.add(rope);
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.25, 10), woodMat);
    bucket.position.y = 1.2;
    g.add(bucket);
    scene.add(g);
    addCollider(-5, -5, 1.3);
  })();

  // --- Cầu gỗ cong ở z=0, bắc qua x=18..26 ----------------------------------
  (function createBridge() {
    const g = new THREE.Group();
    // Ván cầu cong: 9 tấm ván dọc theo vòm
    for (let i = 0; i < 9; i++) {
      const t = i / 8; // 0..1 qua sông
      const x = 18 + t * 8;
      const y = 0.35 + Math.sin(t * Math.PI) * 1.35;
      const slope = Math.cos(t * Math.PI) * 1.35 * Math.PI / 8;
      const plank = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 3.0), woodMat), true, true);
      plank.position.set(x, y, 0);
      plank.rotation.z = -Math.atan(slope);
      g.add(plank);
    }
    // Lan can cong hai bên: ống dọc theo đường cong
    [-1.45, 1.45].forEach((pz) => {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        pts.push(new THREE.Vector3(18 + t * 8, 0.35 + Math.sin(t * Math.PI) * 1.35 + 0.95, pz));
      }
      const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.06, 6), woodDarkMat);
      rail.castShadow = true;
      g.add(rail);
      // Cọc lan can
      for (let i = 0; i <= 4; i++) {
        const t = i / 4;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.95, 8), woodMat);
        post.position.set(18 + t * 8, 0.35 + Math.sin(t * Math.PI) * 1.35 + 0.5, pz);
        g.add(post);
      }
    });
    // Trụ cầu — nằm dưới mặt ván, trong nước nên không chặn lối đi trên cầu
    [19.5, 24.5].forEach((px) => {
      const pillar = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.6, 10), stoneMat));
      pillar.position.set(px, -0.4, 0);
      g.add(pillar);
    });
    scene.add(g);
  })();

  // --- Ruộng lúa: z=35..55, x=-40..0 ----------------------------------------
  (function createRiceField() {
    const field = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 20),
      new THREE.MeshStandardMaterial({ color: 0x6b8f5a, roughness: 0.6 })
    );
    field.rotation.x = -Math.PI / 2;
    field.position.set(-20, 0.05, 45);
    field.receiveShadow = true;
    scene.add(field);
    // Nước nông trên ruộng
    const paddy = new THREE.Mesh(
      new THREE.PlaneGeometry(38, 18),
      new THREE.MeshStandardMaterial({ color: 0x7fb0c0, roughness: 0.2, transparent: true, opacity: 0.5 })
    );
    paddy.rotation.x = -Math.PI / 2;
    paddy.position.set(-20, 0.07, 45);
    scene.add(paddy);
    // Bờ ruộng: gờ đất quanh và giữa các luống
    const bankMat2 = new THREE.MeshStandardMaterial({ color: 0x9a7d4f, roughness: 1 });
    for (let i = 0; i <= 4; i++) {
      const bank = new THREE.Mesh(new THREE.BoxGeometry(40, 0.22, 0.5), bankMat2);
      bank.position.set(-20, 0.12, 35 + i * 5);
      scene.add(bank);
    }
    [-40, 0].forEach((px) => {
      const bank = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 20), bankMat2);
      bank.position.set(px, 0.12, 45);
      scene.add(bank);
    });
    // Lúa theo hàng — InstancedMesh búi lá chéo (không còn hình nón nhọn).
    const riceGeo = new THREE.PlaneGeometry(0.55, 0.85);
    const rows = 9, perRow = 42;
    const rice = new THREE.InstancedMesh(riceGeo, grassBladeMat, rows * perRow * 2);
    const m4 = new THREE.Matrix4();
    const rq = new THREE.Quaternion();
    const re = new THREE.Euler();
    const rs = new THREE.Vector3(1, 1, 1);
    let k = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < perRow; c++) {
        const x = -39 + c * 0.95 + (r % 2 ? 0.45 : 0);
        const z = 36.2 + r * 2.1;
        for (let p = 0; p < 2; p++) {
          re.set(0, (p * Math.PI) / 2 + r * 0.1, 0);
          rq.setFromEuler(re);
          m4.compose(new THREE.Vector3(x, 0.42, z), rq, rs);
          rice.setMatrixAt(k++, m4);
        }
      }
    }
    rice.instanceMatrix.needsUpdate = true;
    rice.castShadow = false;
    scene.add(rice);
    // Bù nhìn ở góc ruộng: cọc + thanh ngang + mũ rơm + áo cũ
    (function makeScarecrow() {
      const g = new THREE.Group();
      g.position.set(-32, 0, 48);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.9, 8), woodDarkMat);
      pole.position.y = 0.95;
      g.add(pole);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8), woodDarkMat);
      bar.rotation.z = Math.PI / 2;
      bar.position.y = 1.45;
      g.add(bar);
      const robe = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.18), new THREE.MeshStandardMaterial({ color: 0x8c2f2f, roughness: 1 }));
      robe.position.y = 1.15;
      g.add(robe);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd9b96a, roughness: 1 }));
      head.position.y = 1.7;
      g.add(head);
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.14, 10), new THREE.MeshStandardMaterial({ color: 0xd9b96a, roughness: 1 }));
      hat.position.y = 1.82;
      g.add(hat);
      scene.add(g);
      addCollider(-32, 48, 0.4);
    })();
  })();

  // --- Cây: thân cong 3 đoạn + tán nhiều khối icosahedron biến dạng -------
  // Một geometry tán duy nhất dùng chung cho mọi cây (tiết kiệm bộ nhớ).
  const canopyGeo = new THREE.IcosahedronGeometry(1, 1);
  {
    const cp = canopyGeo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < cp.count; i++) {
      v.fromBufferAttribute(cp, i);
      const n = 1 + (Math.sin(v.x * 12.9 + v.y * 78.2) * 0.5 + Math.sin(v.y * 39.4 + v.z * 11.3) * 0.5) * 0.12;
      v.multiplyScalar(n);
      cp.setXYZ(i, v.x, v.y, v.z);
    }
    canopyGeo.computeVertexNormals();
  }
  function createTree(x, z, s = 1) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    // Gốc xòe + thân cong 3 đoạn
    const flare = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.32 * s, 0.5 * s, 0.5 * s, 8), trunkMat));
    flare.position.set(0, 0.25 * s, 0);
    g.add(flare);
    const trunk1 = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.3 * s, 1.6 * s, 8), trunkMat));
    trunk1.position.set(0, 0.9 * s, 0);
    trunk1.rotation.z = 0.1;
    g.add(trunk1);
    const trunk2 = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.13 * s, 0.18 * s, 1.3 * s, 8), trunkMat));
    trunk2.position.set(0.2 * s, 2.1 * s, 0);
    trunk2.rotation.z = -0.14;
    g.add(trunk2);
    const trunk3 = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.09 * s, 0.13 * s, 1.0 * s, 8), trunkMat));
    trunk3.position.set(0.05 * s, 2.95 * s, 0);
    trunk3.rotation.z = 0.1;
    g.add(trunk3);
    // Tán 5 khối lệch nhau — silhouette tự nhiên hơn 3 hình cầu xếp đều.
    const canopy = new THREE.Group();
    const blobs = [
      [0, 3.7, 0, 1.7, 0.8], [1.1, 3.2, 0.3, 1.15, 0.65], [-1.05, 3.3, -0.3, 1.2, 0.7],
      [0.4, 4.3, -0.4, 1.0, 0.6], [-0.5, 4.2, 0.5, 0.95, 0.6],
    ];
    blobs.forEach(([bx, by, bz, r, sy], i) => {
      const b = shadowed(new THREE.Mesh(canopyGeo, i % 2 ? leafMat2 : leafMat));
      b.scale.set(r * s, r * sy * s, r * s);
      b.position.set(bx * s, by * s, bz * s);
      canopy.add(b);
    });
    g.add(canopy);
    animated.canopies.push({ obj: canopy, phase: Math.random() * Math.PI * 2, base: 0 });
    scene.add(g);
    addCollider(x, z, 0.8 * s);
    return g;
  }

  // Cây rải quanh làng (tránh sông, ruộng, đường chính). 6 vị trí gần trung
  // tâm đã thay bằng cây GLB (tree-broad/oak/plateau — js/assets.js).
  const treeSpots = [
    [-45, -12, 1.1], [-2, -38, 1.2],
    [15, -38, 1.0], [28, 48, 0.9], [-48, 48, 1.1], [-8, -48, 1.0],
    [42, -48, 0.9], [-52, 5, 1.0],
    [55, 45, 1.0], [-55, -35, 1.1], [20, 55, 1.0], [-55, 35, 0.9],
    [60, -12, 1.0], [-15, 58, 1.1],
  ];
  treeSpots.forEach(([x, z, s]) => createTree(x, z, s));

  // --- Rừng trúc: x=-50..-30, z=-50..-30 và x=35..55, z=-40..-10 -----------
  // Thân trúc có đốt (texture vòng đốt) thay cho trụ trơn; lá là mặt phẳng
  // chéo vẽ lá tre thay cho hình nón nhọn.
  const bambooStalkMat = new THREE.MeshStandardMaterial({
    map: makeCanvasTexture(64, 256, (ctx, w, h) => {
      ctx.fillStyle = '#8fae4e';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(0, i * 51, w, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(0, i * 51 + 5, w, 3);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(0, 0, 8, h);
    }, 1, 1),
    roughness: 0.8,
  });
  function createBambooZone(x0, x1, z0, z1, count) {
    const stalkGeo = new THREE.CylinderGeometry(0.09, 0.12, 5.2, 7);
    const leafPlaneGeo = new THREE.PlaneGeometry(1.1, 1.2);
    for (let i = 0; i < count; i++) {
      const x = x0 + Math.random() * (x1 - x0);
      const z = z0 + Math.random() * (z1 - z0);
      const h = 4.2 + Math.random() * 1.6;
      const stalk = shadowed(new THREE.Mesh(stalkGeo, bambooStalkMat));
      stalk.scale.y = h / 5.2;
      stalk.position.set(x, h / 2, z);
      stalk.rotation.z = (Math.random() - 0.5) * 0.08;
      scene.add(stalk);
      // Tán lá: 2 mặt phẳng chéo vẽ lá tre
      const leaves = new THREE.Group();
      [0, Math.PI / 2].forEach((ry) => {
        const p = new THREE.Mesh(leafPlaneGeo, bambooLeafTexMat);
        p.rotation.y = ry;
        p.castShadow = true;
        leaves.add(p);
      });
      leaves.position.set(x, h + 0.35, z);
      leaves.rotation.y = Math.random() * Math.PI;
      scene.add(leaves);
      animated.canopies.push({ obj: leaves, phase: Math.random() * Math.PI * 2, base: leaves.rotation.z });
      // Chỉ cây trúc lớn ở rìa mới thêm collider để không chặn kín rừng
      if (i % 4 === 0) addCollider(x, z, 0.45);
    }
  }
  createBambooZone(-50, -30, -50, -30, 26);
  createBambooZone(35, 55, -40, -10, 26);

  // --- Hoa + cỏ + bụi cây (InstancedMesh) ------------------------------------
  // Cỏ: búi lá vẽ bằng texture trên 2 mặt phẳng chéo (không còn hình nón
  // nhọn). Số lượng điều chỉnh theo chất lượng qua detailMeshes (setDetail).
  (function createFlowersGrass() {
    const TUFTS = 260;
    const grassGeo = new THREE.PlaneGeometry(0.7, 0.7);
    const grass = new THREE.InstancedMesh(grassGeo, grassBladeMat, TUFTS * 2);
    grass.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const eul = new THREE.Euler();
    const sc = new THREE.Vector3(1, 1, 1);
    let placed = 0, guard = 0;
    while (placed < TUFTS && guard++ < 4000) {
      const x = -68 + Math.random() * 136;
      const z = -68 + Math.random() * 136;
      if (Math.abs(x - 22) < 5.5) continue; // không mọc dưới sông
      if (x > -40 && x < 0 && z > 35 && z < 55) continue; // không mọc trong ruộng
      const baseRot = Math.random() * Math.PI;
      const s = 0.8 + Math.random() * 0.7;
      for (let k = 0; k < 2; k++) {
        eul.set(0, baseRot + k * Math.PI / 2, 0);
        q.setFromEuler(eul);
        sc.set(s, s * (0.9 + Math.random() * 0.3), s);
        m4.compose(new THREE.Vector3(x, 0.35 * s, z), q, sc);
        grass.setMatrixAt(placed * 2 + k, m4);
      }
      placed++;
    }
    grass.count = placed * 2;
    grass.instanceMatrix.needsUpdate = true;
    scene.add(grass);
    detailMeshes.grass = grass;
    detailMeshes.grassTufts = placed;

    const flowerGeo = new THREE.SphereGeometry(0.14, 8, 6);
    const stemGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.3, 5);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3a7a2e, roughness: 1 });
    const flowerMats = [
      new THREE.MeshStandardMaterial({ color: 0xff6b9d, roughness: 0.6, emissive: 0x551122, emissiveIntensity: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0xffd93d, roughness: 0.6, emissive: 0x554411, emissiveIntensity: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0xf5f0ff, roughness: 0.6, emissive: 0x444455, emissiveIntensity: 0.25 }),
    ];
    detailMeshes.flowers = [];
    const stems = new THREE.InstancedMesh(stemGeo, stemMat, 120);
    let stemIdx = 0;
    flowerMats.forEach((fm) => {
      const fl = new THREE.InstancedMesh(flowerGeo, fm, 40);
      for (let i = 0; i < 40; i++) {
        const x = -60 + Math.random() * 120;
        const z = -60 + Math.random() * 120;
        m4.makeTranslation(x, 0.32, z);
        fl.setMatrixAt(i, m4);
        m4.makeTranslation(x, 0.15, z);
        stems.setMatrixAt(stemIdx++, m4);
      }
      fl.instanceMatrix.needsUpdate = true;
      scene.add(fl);
      detailMeshes.flowers.push({ mesh: fl, full: 40 });
    });
    stems.count = stemIdx;
    stems.instanceMatrix.needsUpdate = true;
    scene.add(stems);
    detailMeshes.flowerStems = stems;

    // Bụi cây thấp quanh nhà / ven đường (khối icosahedron dẹt).
    const bushSpots = [
      [-33, 14], [-40, -4], [2, -24], [13, 14], [34, 16], [6, -44],
      [-16, -34], [-8, 26], [26, -24], [52, -48], [-48, -16], [44, 30],
    ];
    bushSpots.forEach(([bx, bz], i) => {
      const b = new THREE.Mesh(canopyGeo, i % 2 ? leafMat2 : leafMat);
      const r = 0.7 + Math.random() * 0.5;
      b.scale.set(r, r * 0.55, r);
      b.position.set(bx, r * 0.45, bz);
      b.castShadow = true;
      scene.add(b);
      addCollider(bx, bz, r * 0.7);
    });
  })();

  // --- Đèn lồng đỏ treo đung đưa ---------------------------------------------
  function createLantern(x, y, z, parent) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 5), woodDarkMat);
    string.position.y = -0.25;
    g.add(string);
    const body = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 12), lanternMat));
    body.scale.y = 0.85;
    body.position.y = -0.75;
    g.add(body);
    const capT = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.08, 10), goldMat);
    capT.position.y = -0.48;
    g.add(capT);
    const capB = capT.clone();
    capB.position.y = -1.02;
    g.add(capB);
    const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.28, 6), goldMat);
    tassel.position.y = -1.2;
    g.add(tassel);
    (parent || scene).add(g);
    animated.lanterns.push({ obj: g, phase: Math.random() * Math.PI * 2 });
    return g;
  }
  // Treo ở chợ, trước trường, dọc đường chính, hai đầu cầu
  createLantern(-17, 2.6, 7.5);
  createLantern(-13, 2.6, 7.5);
  createLantern(-26, 3.4, -17);
  createLantern(-5, 2.8, -3.5);
  createLantern(0, 2.8, -1);
  createLantern(10, 2.8, 1);
  createLantern(17.5, 2.6, -2);
  createLantern(26.5, 2.6, 2);
  createLantern(38, 2.8, 18.5);
  createLantern(-36, 2.8, 16.5);
  createLantern(5, 3.0, -26);
  createLantern(-12, 3.0, -36);

  // Đèn ấm ở chợ + quán trà (PointLight nhỏ, chỉ bật ở MED/HIGH qua setDetail).
  [[-15, 2.6, 10], [-36, 2.6, -8]].forEach(([lx, ly, lz]) => {
    const pl = new THREE.PointLight(0xffb45e, 7, 9, 1.8);
    pl.position.set(lx, ly, lz);
    scene.add(pl);
    marketLights.push(pl);
  });

  // --- Chim bay: ít nhất 5 con ----------------------------------------------
  function createBird(cx, cz, radius, height, speed, phase) {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 8), bodyMat);
    body.rotation.x = Math.PI / 2;
    g.add(body);
    const wingGeo = new THREE.PlaneGeometry(0.7, 0.28);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8, side: THREE.DoubleSide });
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.x = -0.35;
    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.x = 0.35;
    // Cánh xoay quanh trục Z (vỗ lên xuống) — đặt pivot ở gốc cánh
    wingL.geometry = wingGeo.clone();
    wingL.geometry.translate(0.35, 0, 0);
    wingL.position.x = 0;
    wingR.geometry = wingGeo.clone();
    wingR.geometry.translate(-0.35, 0, 0);
    wingR.position.x = 0;
    g.add(wingL);
    g.add(wingR);
    scene.add(g);
    const bird = { obj: g, wingL, wingR, cx, cz, radius, height, speed, phase };
    animated.birds.push(bird);
    return bird;
  }
  createBird(0, 0, 28, 22, 0.12, 0);
  createBird(-10, 10, 32, 25, 0.10, 1.3);
  createBird(15, -15, 26, 20, 0.14, 2.4);
  createBird(-20, -25, 36, 27, 0.09, 3.6);
  createBird(25, 20, 30, 23, 0.11, 4.8);
  createBird(5, 30, 34, 26, 0.10, 5.5);

  // --- Cổng làng 牌坊 (hai đầu đường Đông–Tây): cột đỏ + xà + mái cong ----
  // Thay 2 cột đá trơ trọi cũ: cổng có mái, biển tên làng, lối đi giữa rộng.
  [[-58, 0], [58, 0]].forEach(([x, z]) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    [-2.3, 2.3].forEach((pz) => {
      const pillar = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 4.2, 10), new THREE.MeshStandardMaterial({ color: 0x8c2f2f, roughness: 0.7 })), true, true);
      pillar.position.set(0, 2.1, pz);
      g.add(pillar);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.9), stoneWallMat);
      foot.position.set(0, 0.25, pz);
      g.add(foot);
      addCollider(x, z + pz, 0.5);
    });
    // 2 xà ngang + mái ngói cong nhỏ trên cổng
    [3.6, 4.15].forEach((py) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 5.6), woodDarkMat);
      beam.position.set(0, py, 0);
      g.add(beam);
    });
    const roof = shadowed(new THREE.Mesh(createCurvedRoofGeometry(2.2, 6.4, 1.0, 0.6), tileMatBlue));
    roof.rotation.y = Math.PI / 2; // nóc chạy dọc Z (ngang đường)
    roof.position.y = 4.3;
    g.add(roof);
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6.0, 8), woodDarkMat);
    ridge.rotation.x = Math.PI / 2;
    ridge.position.y = 5.32;
    g.add(ridge);
    // Biển tên làng treo giữa cổng
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.85),
      new THREE.MeshStandardMaterial({ map: signTexture('青溪村', 'Làng Thanh Khê'), roughness: 0.8, side: THREE.DoubleSide })
    );
    sign.position.set(0, 3.3, 0);
    g.add(sign);
    // Đèn lồng treo hai bên cổng
    createLantern(-0.0, 3.9, -1.6, g);
    createLantern(-0.0, 3.9, 1.6, g);
    scene.add(g);
  });

  // --- update(dt, t): đèn lồng, chim, nước, lá ------------------------------
  function update(dt, t) {
    const tt = typeof t === 'number' ? t : 0;
    // Mây trôi chậm trên trời
    if (animated.clouds) {
      for (const c of animated.clouds) {
        c.spr.position.x += (dt || 0) * c.speed;
        if (c.spr.position.x > 170) c.spr.position.x = -170;
      }
    }
    // Asset GLB: cáo đi dạo (mixer + di chuyển theo waypoint)
    if (assetsUpdate) { try { assetsUpdate(dt, t); } catch (_e) { /* cáo lỗi: bỏ qua */ } }
    // Cửa mở/đóng: xoay mượt về góc đích (đặt bởi toggle())
    for (const dr of animated.doors) {
      if (!dr || !dr.pivot || typeof dr.getTarget !== 'function') continue;
      const target = dr.getTarget();
      dr.pivot.rotation.y += (target - dr.pivot.rotation.y) * Math.min(1, (dt || 0) * 6);
    }
    // Đèn lồng đung đưa
    for (const l of animated.lanterns) {
      l.obj.rotation.z = Math.sin(tt * 1.3 + l.phase) * 0.16;
      l.obj.rotation.x = Math.cos(tt * 1.0 + l.phase) * 0.08;
    }
    // Chim bay vòng tròn + vỗ cánh
    for (const b of animated.birds) {
      const a = tt * b.speed + b.phase;
      b.obj.position.set(b.cx + Math.cos(a) * b.radius, b.height + Math.sin(tt * 0.7 + b.phase) * 1.2, b.cz + Math.sin(a) * b.radius);
      b.obj.rotation.y = -a;
      const flap = Math.sin(tt * 9 + b.phase) * 0.65;
      b.wingL.rotation.z = flap;
      b.wingR.rotation.z = -flap;
    }
    // Nước sông gợn sóng: chỉ tính lại đỉnh + pháp tuyến mỗi 3 frame
    // (computeVertexNormals mỗi frame là tốn kém nhất của scene).
    if (animated.water) {
      waterFrame++;
      if (waterFrame % 3 === 0) {
        const attr = animated.water.geometry.attributes.position;
        const base = animated.waterBase;
        for (let i = 0; i < attr.count; i++) {
          const bx = base[i * 3];
          const by = base[i * 3 + 1];
          attr.setZ(i, Math.sin(bx * 1.2 + tt * 1.6) * 0.07 + Math.cos(by * 0.8 + tt * 1.1) * 0.06);
        }
        attr.needsUpdate = true;
        animated.water.geometry.computeVertexNormals();
      }
      animated.water.material.opacity = 0.84 + Math.sin(tt * 0.8) * 0.04;
    }
    // Lá / tán cây rung nhẹ
    for (const c of animated.canopies) {
      c.obj.rotation.z = (c.base || 0) + Math.sin(tt * 0.9 + c.phase) * 0.03;
    }
  }

  // Vẽ chữ lên bảng đen trường học (Phase 5 dùng để ghi bài giảng).
  // Phòng thủ: nếu canvas/texture của bảng chưa sẵn (vẽ lỗi) thì thử tạo
  // sprite chữ đứng trước bảng; mọi lỗi đều nuốt lặng, không throw.
  function setBlackboardText(hanzi, pinyin) {
    try {
      if (typeof blackboardDraw === 'function') {
        blackboardDraw(hanzi, pinyin);
        return true;
      }
    } catch (_err) { /* rơi xuống fallback sprite */ }
    try {
      if (blackboardFallback && !blackboardFallback.created) {
        const c = document.createElement('canvas');
        c.width = 512; c.height = 288;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#22392c';
        ctx.fillRect(0, 0, 512, 288);
        ctx.fillStyle = '#f5f2e8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 110px serif';
        ctx.fillText(String(hanzi || '你好'), 256, 115);
        ctx.font = '44px serif';
        ctx.fillText(String(pinyin || ''), 256, 225);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
        spr.scale.set(3.4, 1.9, 1);
        spr.position.set(blackboardFallback.x, blackboardFallback.y, blackboardFallback.z);
        scene.add(spr);
        blackboardFallback.created = true;
        return true;
      }
    } catch (_err2) { /* không vẽ được: bỏ qua lặng lẽ */ }
    return false;
  }

  // Chất lượng chi tiết theo LOW/MED/HIGH (main.js gọi qua env.setDetail):
  // mật độ cỏ/hoa, đèn chợ, độ phân giải bóng mặt trời.
  function setDetail(level) {
    try {
      if (level === 'low') {
        if (detailMeshes.grass) detailMeshes.grass.count = Math.floor(detailMeshes.grassTufts * 2 * 0.4);
        detailMeshes.flowers.forEach((f) => { f.mesh.count = Math.floor(f.full * 0.5); });
        if (detailMeshes.flowerStems) detailMeshes.flowerStems.count = 60;
        sun.shadow.mapSize.set(1024, 1024);
        marketLights.forEach((l) => { l.visible = false; });
      } else if (level === 'high') {
        if (detailMeshes.grass) detailMeshes.grass.count = detailMeshes.grassTufts * 2;
        detailMeshes.flowers.forEach((f) => { f.mesh.count = f.full; });
        if (detailMeshes.flowerStems) detailMeshes.flowerStems.count = 120;
        sun.shadow.mapSize.set(2048, 2048);
        marketLights.forEach((l) => { l.visible = true; });
      } else {
        if (detailMeshes.grass) detailMeshes.grass.count = Math.floor(detailMeshes.grassTufts * 2 * 0.75);
        detailMeshes.flowers.forEach((f) => { f.mesh.count = f.full; });
        if (detailMeshes.flowerStems) detailMeshes.flowerStems.count = 90;
        sun.shadow.mapSize.set(2048, 2048);
        marketLights.forEach((l) => { l.visible = true; });
      }
      if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    } catch (_err) { /* đổi chi tiết lỗi: game vẫn chạy ở mức hiện tại */ }
  }

  // Asset GLB có giấy phép (js/assets.js): nạp bất đồng bộ, file nào lỗi
  // thì bỏ qua, game vẫn chạy bằng hình học thủ tục. Đèn lồng GLB đung đưa
  // chung với đèn thủ tục (animated.lanterns); cáo chạy qua assetsUpdate.
  let assetsUpdate = null;
  const assetsReady = import('./assets.js')
    .then((m) => m.loadVillageAssets(scene, {
      addCollider,
      addLantern: (l) => animated.lanterns.push(l),
    }))
    .then((r) => { assetsUpdate = r.update || null; return r; })
    .catch(() => ({ loaded: [], failed: ['assets.js'] }));

  return { colliders, positions, update, doors, examDesks, setBlackboardText, buildings, buildingAt, setDetail, assetsReady };
}
