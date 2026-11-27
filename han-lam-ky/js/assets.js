// Hán Lâm Ký (汉林记) — Asset GLB có giấy phép, nạp bất đồng bộ
// Nguồn + license từng file xem ASSETS.md và ASSETS_FOUND.md.
// Cách nạp (do connector GitHub không đẩy được file nhị phân):
//  - Model lớn (Poly Pizza, Khronos Fox): nạp trực tiếp từ CDN gốc của
//    tác giả (static.poly.pizza / raw.githubusercontent.com, CORS *).
//  - Model nhỏ (Kenney): file .glb đã mã hóa base64 thành file text
//    .b64 trong thư mục assets/; game tải về rồi giải mã và parse.
//  - 5 model Kenney dùng chung texture Textures/colormap.png: texture
//    này nhúng sẵn dạng data URI bên dưới, loader tự chuyển hướng.
// Nguyên tắc: file nào lỗi/thiếu thì bỏ qua file đó, game vẫn chạy bằng
// hình học thủ tục; không bao giờ throw ra ngoài. © Nông Quang Vinh
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// URL CDN gốc của model lớn (CORS *, đã kiểm chứng 27/11/2026).
const REMOTE_URLS = {
  'pagoda.glb': 'https://static.poly.pizza/5ed9ad9d-ebd6-4eb8-9ea5-5232f8f55a61.glb',
  'pavilion.glb': 'https://static.poly.pizza/c8c63564-31e0-4f19-9e82-1c5bec4ac870.glb',
  'bamboo.glb': 'https://static.poly.pizza/88f0463b-af10-4fa5-94d4-2d8e3b91f58e.glb',
  'red-lantern.glb': 'https://static.poly.pizza/686aaafe-8e8e-4f39-8719-511311724193.glb',
  'bonsai.glb': 'https://static.poly.pizza/6184a5b5-b595-4184-845d-b4d00bf98089.glb',
  'market-stall.glb': 'https://static.poly.pizza/e2633001-4cf5-46fa-ac68-575c9954f4ba.glb',
  'street-lantern-post.glb': 'https://static.poly.pizza/41095798-4ff6-4567-8654-026703a51f32.glb',
  'fox.glb': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb',
};

// Texture dùng chung của Kenney Survival Kit (CC0), nhúng dạng data URI.
const COLORMAP_DATA_URI = 'data:image/png;base64,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';

// Manager chuyển hướng mọi yêu cầu Textures/colormap.png về data URI trên.
const assetManager = new THREE.LoadingManager();
assetManager.setURLModifier((url) => (url.includes('colormap.png') ? COLORMAP_DATA_URI : url));

// base64 (ASCII) -> ArrayBuffer để GLTFLoader.parse đọc được.
function b64ToArrayBuffer(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

// pos: [x, y, z] (mặt đất y=0). scale đã tính theo gợi ý trong
// ASSETS_FOUND.md (1 đơn vị game = 1 m, nhân vật cao ~1,7 m).
// collider: bán kính va chạm (m) — 0/không có = đi xuyên được (đình mở).
// sway: đèn lồng GLB đung đưa như đèn thủ tục (cần dây treo `string`).
const PLACEMENTS = [
  // Kiến trúc Đông Á (CC-BY — xem ASSETS.md)
  { file: 'pagoda.glb', pos: [0, 0, -58], rotY: 0.15, scale: 0.25, collider: 3.5 }, // tháp landmark phía Bắc làng
  { file: 'pavilion.glb', pos: [8, 0, 28], rotY: 0.5, scale: 0.4, collider: 0 }, // đình làng (mở, đi vào được)
  // Chợ
  { file: 'market-stall.glb', pos: [2, 0, 14], rotY: -0.9, scale: 1.7, collider: 1.4 },
  // Đèn lồng đỏ GLB (treo 2 bên cửa trường + 2 dưới mái đình)
  { file: 'red-lantern.glb', pos: [-25.4, 2.7, -17.5], scale: 1, sway: true, string: 0.8 },
  { file: 'red-lantern.glb', pos: [-28.4, 2.7, -16.4], scale: 1, sway: true, string: 0.8 },
  { file: 'red-lantern.glb', pos: [6.5, 3.0, 26.5], scale: 1, sway: true, string: 0.8 },
  { file: 'red-lantern.glb', pos: [9.5, 3.0, 29.5], scale: 1, sway: true, string: 0.8 },
  // Cây GLB thay 6 cây thủ tục gần trung tâm (đã gỡ khỏi treeSpots)
  { file: 'tree-broad.glb', pos: [2, 0, 8], rotY: 0.7, scale: 3, collider: 1.0 },
  { file: 'tree-oak.glb', pos: [-42, 0, 28], rotY: 1.9, scale: 3, collider: 1.0 },
  { file: 'tree-plateau.glb', pos: [-25, 0, 32], rotY: 0.3, scale: 3, collider: 1.0 },
  { file: 'tree-broad.glb', pos: [48, 0, 8], rotY: 2.4, scale: 3.2, collider: 1.0 },
  { file: 'tree-oak.glb', pos: [30, 0, -28], rotY: 1.1, scale: 3, collider: 1.0 },
  { file: 'tree-plateau.glb', pos: [48, 0, 38], rotY: 2.8, scale: 3, collider: 1.0 },
  // Tre GLB xen vào 2 rừng trúc thủ tục
  { file: 'bamboo.glb', pos: [-46, 0, -38], rotY: 0.4, scale: 2 },
  { file: 'bamboo.glb', pos: [-38, 0, -46], rotY: 1.7, scale: 2 },
  { file: 'bamboo.glb', pos: [-42, 0, -32], rotY: 2.6, scale: 2 },
  { file: 'bamboo.glb', pos: [-34, 0, -40], rotY: 0.9, scale: 2 },
  { file: 'bamboo-young.glb', pos: [-48, 0, -44], rotY: 0.2, scale: 3 },
  { file: 'bamboo-young.glb', pos: [-36, 0, -34], rotY: 1.3, scale: 3 },
  { file: 'bamboo-young.glb', pos: [40, 0, -30], rotY: 2.1, scale: 3 },
  { file: 'bamboo-young.glb', pos: [48, 0, -18], rotY: 0.6, scale: 3 },
  // Bụi cây, đá bờ sông, thùng, hòm
  { file: 'bush-large.glb', pos: [-20, 0, 20], rotY: 0.5, scale: 3, collider: 0.5 },
  { file: 'bush-large.glb', pos: [14, 0, -14], rotY: 1.8, scale: 3, collider: 0.5 },
  { file: 'bush-large.glb', pos: [-2, 0, 30], rotY: 2.9, scale: 3, collider: 0.5 },
  { file: 'bush-large.glb', pos: [36, 0, 26], rotY: 0.1, scale: 3, collider: 0.5 },
  { file: 'bush-large.glb', pos: [-44, 0, 2], rotY: 2.2, scale: 3, collider: 0.5 },
  { file: 'bush-large.glb', pos: [20, 0, -44], rotY: 1.1, scale: 3, collider: 0.5 },
  { file: 'rock-large.glb', pos: [16.5, 0, -8], rotY: 0.4, scale: 2, collider: 0.9 },
  { file: 'rock-large.glb', pos: [27.5, 0, 10], rotY: 1.5, scale: 2, collider: 0.9 },
  { file: 'rock-large.glb', pos: [17, 0, -20], rotY: 2.3, scale: 2, collider: 0.9 },
  { file: 'rock-large.glb', pos: [27, 0, -14], rotY: 0.8, scale: 2, collider: 0.9 },
  { file: 'rock-large.glb', pos: [16.8, 0, 18], rotY: 1.9, scale: 2, collider: 0.9 },
  { file: 'barrel.glb', pos: [-13.5, 0, 6], rotY: 0.3, scale: 2.5, collider: 0.4 },
  { file: 'barrel.glb', pos: [-18.5, 0, 15], rotY: 1.2, scale: 2.5, collider: 0.4 },
  { file: 'barrel.glb', pos: [37.5, 0, 19.5], rotY: 2.0, scale: 2.5, collider: 0.4 },
  { file: 'crate.glb', pos: [-16, 0, 12.5], rotY: 0.7, scale: 2.5, collider: 0.35 },
  { file: 'crate.glb', pos: [-13, 0, 14.5], rotY: 1.6, scale: 2.5, collider: 0.35 },
  { file: 'crate.glb', pos: [-19, 0, 8.5], rotY: 2.5, scale: 2.5, collider: 0.35 },
  // Ghế dài, bonsai, cột đèn đường, biển chỉ đường, bếp lửa, rương
  { file: 'bench-wood.glb', pos: [6.5, 0, 27], rotY: 0.9, scale: 2, collider: 0.6 },
  { file: 'bench-wood.glb', pos: [2.5, 0, -55.5], rotY: -0.6, scale: 2, collider: 0.6 },
  { file: 'bonsai.glb', pos: [-24.8, 0, -16.2], rotY: 0.5, scale: 0.5 },
  { file: 'bonsai.glb', pos: [-34.5, 0, -6.8], rotY: 1.4, scale: 0.5 },
  { file: 'street-lantern-post.glb', pos: [-8, 0, 2], rotY: 0.2, scale: 0.6, collider: 0.35 },
  { file: 'street-lantern-post.glb', pos: [14, 0, 2], rotY: -0.3, scale: 0.6, collider: 0.35 },
  { file: 'signpost.glb', pos: [30, 0, 3], rotY: -0.5, scale: 4, collider: 0.3 },
  { file: 'campfire-pit.glb', pos: [8, 0, 31.5], rotY: 0.3, scale: 3, collider: 0.6 },
  { file: 'chest.glb', pos: [-31.5, 0, -8.5], rotY: 0.8, scale: 2.5, collider: 0.5 },
  // Bàn + ghế trong đình làng
  { file: 'table-wood.glb', pos: [8, 0, 28], rotY: 0.2, scale: 2.2, collider: 0.8 },
  { file: 'chair-wood.glb', pos: [7, 0, 28.8], rotY: 1.2, scale: 2 },
  { file: 'chair-wood.glb', pos: [9, 0, 27.2], rotY: -1.8, scale: 2 },
];

// Cáo đi dạo quanh rừng trúc phía Tây (fox.glb, Khronos — rig CC-BY 4.0).
// Model quay mặt theo trục +X cục bộ nên góc quay = atan2(-vz, vx).
async function loadFox(scene, loader) {
  const gltf = await loader.loadAsync(REMOTE_URLS['fox.glb']);
  const fox = gltf.scene;
  fox.scale.setScalar(0.008); // dài ~1,2 m
  fox.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  const mixer = new THREE.AnimationMixer(fox);
  const clip = THREE.AnimationClip.findByName(gltf.animations, 'Walk') || gltf.animations[0];
  if (clip) mixer.clipAction(clip).play();
  const waypoints = [[-40, -35], [-32, -42], [-46, -28], [-38, -30]];
  let wp = 1;
  fox.position.set(waypoints[0][0], 0, waypoints[0][1]);
  scene.add(fox);
  const speed = 1.1;
  return function updateFox(dt) {
    const step = Math.min(Math.max(dt || 0, 0), 0.05);
    mixer.update(step);
    const target = waypoints[wp];
    const dx = target[0] - fox.position.x, dz = target[1] - fox.position.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.5) { wp = (wp + 1) % waypoints.length; return; }
    const vx = dx / d, vz = dz / d;
    fox.position.x += vx * speed * step;
    fox.position.z += vz * speed * step;
    fox.rotation.y = Math.atan2(-vz, vx);
  };
}

export async function loadVillageAssets(scene, hooks = {}) {
  const { addCollider = () => {}, addLantern = () => {} } = hooks;
  const loader = new GLTFLoader(assetManager);
  const loaded = [];
  const failed = [];
  const cache = new Map();
  async function getModel(file) {
    if (cache.has(file)) return cache.get(file);
    let promise;
    if (REMOTE_URLS[file]) {
      promise = loader.loadAsync(REMOTE_URLS[file]);
    } else {
      // Model nhỏ: tải file .b64 (text), giải mã rồi parse. path './assets/'
      // để texture ngoài (nếu có) vẫn phân giải đúng đường dẫn tương đối.
      promise = fetch('./assets/' + file + '.b64')
        .then((r) => { if (!r.ok) throw new Error('missing ' + file + '.b64'); return r.text(); })
        .then((b64) => loader.parseAsync(b64ToArrayBuffer(b64), './assets/'));
    }
    cache.set(file, promise);
    return promise;
  }
  for (const p of PLACEMENTS) {
    try {
      const gltf = await getModel(p.file);
      const obj = gltf.scene.clone();
      obj.position.set(p.pos[0], p.pos[1] || 0, p.pos[2]);
      obj.rotation.y = p.rotY || 0;
      obj.scale.setScalar(p.scale || 1);
      obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      if (p.string) {
        const str = new THREE.Mesh(
          new THREE.CylinderGeometry(0.012, 0.012, p.string, 5),
          new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 1 })
        );
        str.position.y = 0.35 + p.string / 2;
        obj.add(str);
      }
      scene.add(obj);
      if (p.collider) addCollider(p.pos[0], p.pos[2], p.collider);
      if (p.sway) addLantern({ obj, phase: Math.random() * Math.PI * 2 });
      loaded.push(p.file);
    } catch (err) {
      failed.push(p.file);
    }
  }
  let foxUpdate = null;
  try {
    foxUpdate = await loadFox(scene, loader);
    loaded.push('fox.glb');
  } catch (err) {
    failed.push('fox.glb');
  }
  return {
    loaded,
    failed,
    update(dt) { if (foxUpdate) { try { foxUpdate(dt); } catch (_e) { /* cáo lỗi: bỏ qua */ } } },
  };
}
