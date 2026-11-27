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
        // Một viên ngói cong: hình bán nguyệt + bóng đổ dưới
        const g = ctx.createLinearGradient(cx - 14, cy, cx + 14, cy);
        g.addColorStop(0, dark);
        g.addColorStop(0.5, light);
        g.addColorStop(1, dark);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, 14, Math.PI, 0);
        ctx.fill();
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
    ctx.fillStyle = '#6da344';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const g = 110 + Math.random() * 70 | 0;
      ctx.fillStyle = `rgba(${60 + Math.random() * 50 | 0},${g},${40 + Math.random() * 40 | 0},0.5)`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 2 + Math.random() * 4);
    }
    // Vài mảng đất khô
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = 'rgba(150,120,70,0.35)';
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, 18 + Math.random() * 30, 12 + Math.random() * 20, Math.random() * 3, 0, Math.PI * 2);
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
  };
  const animated = { lanterns: [], birds: [], canopies: [], water: null, waterBase: null };

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

  function addCollider(x, z, r) { colliders.push({ x, z, r }); }
  function shadowed(mesh, cast = true, receive = false) {
    mesh.castShadow = cast; mesh.receiveShadow = receive; return mesh;
  }

  // --- Bầu trời gradient: sphere lớn, mặt trong, shader đơn giản ---------
  const skyGeo = new THREE.SphereGeometry(220, 24, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color(0x7fb2e5) },
      mid: { value: new THREE.Color(0xcfe6f5) },
      bot: { value: new THREE.Color(0xffe8c0) },
    },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bot; void main(){ float h = normalize(vP).y; vec3 c = h > 0.15 ? mix(mid, top, smoothstep(0.15, 0.7, h)) : mix(bot, mid, smoothstep(-0.1, 0.15, h)); gl_FragColor = vec4(c, 1.0); }',
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // --- Sương ấm nhạt + ánh sáng -------------------------------------------
  scene.fog = new THREE.Fog(0xffe8c8, 60, 150);
  scene.background = new THREE.Color(0xcfe6f5);
  const sun = new THREE.DirectionalLight(0xffe0b3, 2.4);
  sun.position.set(45, 65, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -70; sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70;
  sun.shadow.camera.near = 5; sun.shadow.camera.far = 180;
  sun.shadow.bias = -0.0006;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x8a7a5a, 0.95));
  // Mặt trời vẽ bằng đĩa sáng nhỏ trên trời (không phải light)
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(7, 24), new THREE.MeshBasicMaterial({ color: 0xfff2c0, fog: false }));
  sunDisc.position.set(90, 95, -120);
  sunDisc.lookAt(0, 0, 0);
  scene.add(sunDisc);

  // --- Mặt đất 140 x 140 ---------------------------------------------------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // --- Sông: x=22, rộng 8, z=-60..60 ---------------------------------------
  // Lòng sông hạ thấp một chút so với mặt đất
  const riverBed = new THREE.Mesh(new THREE.PlaneGeometry(9, 122), new THREE.MeshStandardMaterial({ color: 0x8a7a55, roughness: 1 }));
  riverBed.rotation.x = -Math.PI / 2;
  riverBed.position.set(22, -0.15, 0);
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

  // --- Nhà mái ngói cong ----------------------------------------------------
  function createHouse(x, z, rotY, opts = {}) {
    const w = opts.w || 5.5, d = opts.d || 4.5, hWall = opts.h || 2.6;
    const wallMat = opts.wallMat || wallWhiteMat;
    const roofMat = opts.roofMat || tileMatBlue;
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rotY;

    const walls = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, hWall, d), wallMat), true, true);
    walls.position.y = hWall / 2;
    g.add(walls);
    // Chân tường đá
    const base = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.35, d + 0.2), stoneMat);
    base.position.y = 0.17;
    g.add(base);
    // Mái cong (không phải hộp) + nóc
    const roofH = opts.roofH || 1.7;
    const roof = shadowed(new THREE.Mesh(createCurvedRoofGeometry(w + 1.6, d + 1.6, roofH, 0.6), roofMat));
    roof.position.y = hWall + 0.05;
    g.add(roof);
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
    // Cửa (mặt trước +Z)
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.9, 0.12), woodMat);
    door.position.set(0, 0.95, d / 2 + 0.03);
    g.add(door);
    const doorKnob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), goldMat);
    doorKnob.position.set(0.35, 0.95, d / 2 + 0.12);
    g.add(doorKnob);
    // Cửa sổ hai bên cửa, có khung gỗ + giấy sáng
    const winMat = new THREE.MeshStandardMaterial({ color: 0xffe9a8, roughness: 0.4, emissive: 0x442200, emissiveIntensity: 0.25 });
    [-1, 1].forEach((s) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.08), winMat);
      win.position.set(s * 1.8, 1.5, d / 2 + 0.02);
      g.add(win);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 0.04), woodDarkMat);
      frame.position.set(s * 1.8, 1.5, d / 2 - 0.01);
      g.add(frame);
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

  // 7 nhà rải quanh làng — không trùng trường/chợ/giếng/ruộng/rừng trúc,
  // không chắn đường chính (đường Đông–Tây z≈0 và Bắc–Nam x≈-5).
  createHouse(-38, 18, 0.4, { sign: '福宅', signSub: 'Nhà họ Phúc', roofMat: tileMatBlue });
  createHouse(-36, -8, -0.3, { sign: '茶館', signSub: 'Quán Trà', wallMat: wallYellowMat, roofMat: tileMatRed });
  createHouse(5, -28, 0.9, { sign: '書屋', signSub: 'Nhà Sách', roofMat: tileMatBlue });
  createHouse(10, 18, -0.6, { sign: '藥鋪', signSub: 'Hiệu Thuốc', wallMat: wallGreyMat, roofMat: tileMatRed });
  createHouse(38, 20, -1.2, { sign: '酒家', signSub: 'Tửu Quán', roofMat: tileMatBlue });
  createHouse(8, -48, 0.2, { sign: '民居', signSub: 'Nhà Dân', wallMat: wallYellowMat, roofMat: tileMatRed });
  createHouse(-12, -38, 0.5, { sign: '繡坊', signSub: 'Xưởng Thêu', roofMat: tileMatBlue });

  // --- Trường học ở (-28,-20): nhà lớn + sân + bảng -------------------------
  const school = createHouse(-28, -20, 0.35, { w: 8, d: 6, h: 3.1, roofH: 2.1, sign: '學堂', signSub: 'Trường Học Thanh Khê', wallMat: wallYellowMat, roofMat: tileMatRed });
  school.scale.setScalar(1.05);
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

  // --- Chợ ở (-15,10): ít nhất 3 sạp (làm 4 sạp) ---------------------------
  const stallCloths = [
    clothTexture('#c0392b', '#f5e6c8'),
    clothTexture('#2e7d32', '#f5e6c8'),
    clothTexture('#8e44ad', '#f5e6c8'),
    clothTexture('#d68910', '#fdf2e9'),
  ];
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
    const roofCloth = new THREE.Mesh(
      new THREE.PlaneGeometry(2.9, 2.2),
      new THREE.MeshStandardMaterial({ map: stallCloths[clothIdx % stallCloths.length], roughness: 0.9, side: THREE.DoubleSide })
    );
    roofCloth.rotation.x = -Math.PI / 2 + 0.22;
    roofCloth.position.y = 2.25;
    roofCloth.castShadow = true;
    g.add(roofCloth);
    // Quầy
    const counter = shadowed(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 1.1), woodMat), true, true);
    counter.position.y = 0.45;
    g.add(counter);
    // Hàng hóa: quả / rau — hình cầu nhỏ nhiều màu trên quầy
    const fruitGeo = new THREE.SphereGeometry(0.16, 10, 8);
    for (let i = 0; i < 8; i++) {
      const f = new THREE.Mesh(fruitGeo, new THREE.MeshStandardMaterial({ color: goodsColor, roughness: 0.6 }));
      f.position.set(-0.8 + (i % 4) * 0.55, 1.0, -0.25 + Math.floor(i / 4) * 0.5);
      g.add(f);
    }
    scene.add(g);
    addCollider(x, z, 1.4);
    return g;
  }
  createStall(-18, 7, 0.3, 0, 0xe74c3c);
  createStall(-12, 8, -0.2, 1, 0x7cb342);
  createStall(-15, 14, 0.1, 2, 0xf39c12);
  createStall(-19, 13, 0.6, 3, 0xc0392b);

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
    // Lúa theo hàng — InstancedMesh (nón xanh nhỏ), tiết kiệm draw call
    const riceGeo = new THREE.ConeGeometry(0.22, 0.85, 6);
    const riceMat = new THREE.MeshStandardMaterial({ color: 0x4caf3d, roughness: 0.9 });
    const rows = 9, perRow = 42;
    const rice = new THREE.InstancedMesh(riceGeo, riceMat, rows * perRow);
    const m4 = new THREE.Matrix4();
    let k = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < perRow; c++) {
        const x = -39 + c * 0.95 + (r % 2 ? 0.45 : 0);
        const z = 36.2 + r * 2.1;
        m4.makeTranslation(x, 0.45, z);
        rice.setMatrixAt(k++, m4);
      }
    }
    rice.instanceMatrix.needsUpdate = true;
    rice.castShadow = false;
    scene.add(rice);
  })();

  // --- Cây: thân cong + tán nhiều lớp hình cầu dẹt / nón mềm ---------------
  function createTree(x, z, s = 1) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    // Thân cong: 2 đoạn trụ nghiêng nối nhau
    const trunk1 = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.16 * s, 0.26 * s, 1.8 * s, 8), trunkMat));
    trunk1.position.set(0, 0.9 * s, 0);
    trunk1.rotation.z = 0.08;
    g.add(trunk1);
    const trunk2 = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.11 * s, 0.16 * s, 1.4 * s, 8), trunkMat));
    trunk2.position.set(0.22 * s, 2.2 * s, 0);
    trunk2.rotation.z = -0.16;
    g.add(trunk2);
    // Tán 3 lớp cầu dẹt
    const canopy = new THREE.Group();
    const blobs = [
      [0, 3.1, 0, 1.5, 0.85], [0.9, 2.7, 0.3, 1.0, 0.65], [-0.85, 2.8, -0.25, 1.05, 0.7],
    ];
    blobs.forEach(([bx, by, bz, r, sy], i) => {
      const b = shadowed(new THREE.Mesh(new THREE.SphereGeometry(r * s, 12, 10), i % 2 ? leafMat2 : leafMat));
      b.scale.y = sy;
      b.position.set(bx * s, by * s, bz * s);
      canopy.add(b);
    });
    g.add(canopy);
    animated.canopies.push({ obj: canopy, phase: Math.random() * Math.PI * 2, base: 0 });
    scene.add(g);
    addCollider(x, z, 0.8 * s);
    return g;
  }

  // Cây rải quanh làng (tránh sông, ruộng, đường chính)
  const treeSpots = [
    [-45, -12, 1.1], [-42, 28, 0.9], [-25, 32, 1.0], [-2, -38, 1.2],
    [15, -38, 1.0], [30, -28, 0.9], [48, 8, 1.1], [48, 38, 1.0],
    [28, 48, 0.9], [-48, 48, 1.1], [2, 8, 0.8], [-8, -48, 1.0],
    [42, -48, 0.9], [-52, 5, 1.0],
  ];
  treeSpots.forEach(([x, z, s]) => createTree(x, z, s));

  // --- Rừng trúc: x=-50..-30, z=-50..-30 và x=35..55, z=-40..-10 -----------
  function createBambooZone(x0, x1, z0, z1, count) {
    const stalkGeo = new THREE.CylinderGeometry(0.09, 0.12, 5.2, 7);
    const leafGeo = new THREE.ConeGeometry(0.9, 1.8, 7);
    for (let i = 0; i < count; i++) {
      const x = x0 + Math.random() * (x1 - x0);
      const z = z0 + Math.random() * (z1 - z0);
      const h = 4.2 + Math.random() * 1.6;
      const stalk = shadowed(new THREE.Mesh(stalkGeo, bambooMat));
      stalk.scale.y = h / 5.2;
      stalk.position.set(x, h / 2, z);
      stalk.rotation.z = (Math.random() - 0.5) * 0.08;
      scene.add(stalk);
      const leaves = new THREE.Mesh(leafGeo, bambooLeafMat);
      leaves.position.set(x, h + 0.4, z);
      leaves.scale.set(1, 1, 0.7);
      leaves.castShadow = true;
      scene.add(leaves);
      animated.canopies.push({ obj: leaves, phase: Math.random() * Math.PI * 2, base: leaves.rotation.z });
      // Chỉ cây trúc lớn ở rìa mới thêm collider để không chặn kín rừng
      if (i % 4 === 0) addCollider(x, z, 0.45);
    }
  }
  createBambooZone(-50, -30, -50, -30, 16);
  createBambooZone(35, 55, -40, -10, 16);

  // --- Hoa + cỏ (InstancedMesh) ---------------------------------------------
  (function createFlowersGrass() {
    const grassGeo = new THREE.ConeGeometry(0.16, 0.55, 5);
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x5da344, roughness: 1 });
    const grass = new THREE.InstancedMesh(grassGeo, grassMat, 320);
    const m4 = new THREE.Matrix4();
    let placed = 0, guard = 0;
    while (placed < 320 && guard++ < 3000) {
      const x = -68 + Math.random() * 136;
      const z = -68 + Math.random() * 136;
      if (Math.abs(x - 22) < 5.5) continue; // không mọc dưới sông
      if (x > -40 && x < 0 && z > 35 && z < 55) continue; // không mọc trong ruộng
      m4.makeTranslation(x, 0.28, z);
      grass.setMatrixAt(placed++, m4);
    }
    grass.count = placed;
    grass.instanceMatrix.needsUpdate = true;
    scene.add(grass);

    const flowerGeo = new THREE.SphereGeometry(0.14, 8, 6);
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xff6b9d, roughness: 0.6, emissive: 0x551122, emissiveIntensity: 0.3 });
    const flowerMat2 = new THREE.MeshStandardMaterial({ color: 0xffd93d, roughness: 0.6, emissive: 0x554411, emissiveIntensity: 0.3 });
    [flowerMat, flowerMat2].forEach((fm, fi) => {
      const fl = new THREE.InstancedMesh(flowerGeo, fm, 40);
      for (let i = 0; i < 40; i++) {
        const x = -60 + Math.random() * 120;
        const z = -60 + Math.random() * 120;
        m4.makeTranslation(x, 0.32, z);
        fl.setMatrixAt(i, m4);
      }
      fl.instanceMatrix.needsUpdate = true;
      scene.add(fl);
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

  // --- Cột đá / cổng làng (trang trí, có collider) ---------------------------
  [[-58, 0], [58, 0]].forEach(([x, z]) => {
    const pillar = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 3.2, 10), stoneMat), true, true);
    pillar.position.set(x, 1.6, z);
    scene.add(pillar);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), tileMatRed);
    cap.position.set(x, 3.4, z);
    scene.add(cap);
    addCollider(x, z, 0.8);
  });

  // --- update(dt, t): đèn lồng, chim, nước, lá ------------------------------
  function update(dt, t) {
    const tt = typeof t === 'number' ? t : 0;
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
    // Nước sông gợn sóng: đổi vertices theo thời gian
    if (animated.water) {
      const attr = animated.water.geometry.attributes.position;
      const base = animated.waterBase;
      for (let i = 0; i < attr.count; i++) {
        const bx = base[i * 3];
        const by = base[i * 3 + 1];
        attr.setZ(i, Math.sin(bx * 1.2 + tt * 1.6) * 0.07 + Math.cos(by * 0.8 + tt * 1.1) * 0.06);
      }
      attr.needsUpdate = true;
      animated.water.geometry.computeVertexNormals();
      animated.water.material.opacity = 0.84 + Math.sin(tt * 0.8) * 0.04;
    }
    // Lá / tán cây rung nhẹ
    for (const c of animated.canopies) {
      c.obj.rotation.z = (c.base || 0) + Math.sin(tt * 0.9 + c.phase) * 0.03;
    }
  }

  return { colliders, positions, update };
}
