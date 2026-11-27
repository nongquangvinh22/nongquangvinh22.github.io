# Asset 3D — Hán Lâm Ký (汉林记)

Ngày cập nhật: 2026-11-27. Thư mục asset: `assets/` (27 file `.glb` + `Textures/colormap.png`, tổng ~3,4 MB).
Danh mục đầy đủ kèm bằng chứng tìm kiếm: xem `ASSETS_FOUND.md`.
Code nạp asset: `js/assets.js` (nạp bất đồng bộ bằng `GLTFLoader`; file nào lỗi thì bỏ qua, game vẫn chạy bằng hình học thủ tục).

## 1. Asset GLB đã tích hợp vào game

| File | Nguồn / Tác giả | License | Attribution? | Scale dùng | Đặt ở đâu |
|---|---|---|---|---|---|
| `pagoda.glb` | Poly Pizza — "Pagoda", Poly by Google | CC-BY 3.0 | **Có** | 0,25 (cao ~14 m) | Landmark phía Bắc làng (0,-58) |
| `pavilion.glb` | Poly Pizza — "Pagoda", Poly by Google | CC-BY 3.0 | **Có** | 0,4 (cao ~6,5 m) | Đình làng (8,28), đi vào được, có bàn + ghế |
| `bamboo.glb` | Poly Pizza — "Bamboo", Poly by Google | CC-BY 3.0 | **Có** | 2 | 4 cụm xen trong 2 rừng trúc |
| `red-lantern.glb` | Poly Pizza — "red lantern", Sophie Kim | CC-BY 3.0 | **Có** | 1 | 2 bên cửa trường + 2 dưới mái đình (đung đưa) |
| `bonsai.glb` | Poly Pizza — "Bonsai", Poly by Google | CC-BY 3.0 | **Có** | 0,5 | Cửa trường, quán trà |
| `market-stall.glb` | Poly Pizza — "Market Stand", Quaternius | CC0 1.0 | Không (ghi ơn) | 1,7 | Sạp thứ 5 ở chợ (2,14) |
| `street-lantern-post.glb` | Poly Pizza — "Post Lantern", Kay Lousberg | CC0 1.0 | Không (ghi ơn) | 0,6 | 2 cột đèn dọc đường chính |
| `bamboo-young.glb` | Kenney Nature Kit | CC0 1.0 | Không | 3 | 4 bụi tre non trong rừng trúc |
| `tree-broad.glb` | Kenney Nature Kit | CC0 1.0 | Không | 3–3,2 | 2 cây lớn gần trung tâm |
| `tree-oak.glb` | Kenney Nature Kit | CC0 1.0 | Không | 3 | 2 cây gần trung tâm |
| `tree-plateau.glb` | Kenney Nature Kit | CC0 1.0 | Không | 3 | 2 cây gần trung tâm |
| `bush-large.glb` | Kenney Nature Kit | CC0 1.0 | Không | 3 | 6 bụi cây quanh làng |
| `rock-large.glb` | Kenney Nature Kit | CC0 1.0 | Không | 2 | 5 tảng đá ven sông |
| `table-wood.glb` | Kenney Furniture Kit | CC0 1.0 | Không | 2,2 | Bàn trong đình làng |
| `chair-wood.glb` | Kenney Furniture Kit | CC0 1.0 | Không | 2 | 2 ghế trong đình làng |
| `bench-wood.glb` | Kenney Furniture Kit | CC0 1.0 | Không | 2 | Ghế dài ở đình + tháp |
| `barrel.glb` | Kenney Survival Kit | CC0 1.0 | Không | 2,5 | 3 thùng ở chợ/nhà (cần `Textures/colormap.png`) |
| `crate.glb` | Kenney Survival Kit | CC0 1.0 | Không | 2,5 | 3 hòm ở chợ (cần `Textures/colormap.png`) |
| `chest.glb` | Kenney Survival Kit | CC0 1.0 | Không | 2,5 | 1 rương cạnh quán trà (cần `Textures/colormap.png`) |
| `signpost.glb` | Kenney Survival Kit | CC0 1.0 | Không | 4 | Biển chỉ đường ở ngã ba phía Đông (cần `Textures/colormap.png`) |
| `campfire-pit.glb` | Kenney Survival Kit | CC0 1.0 | Không | 3 | Bếp lửa đá cạnh đình (cần `Textures/colormap.png`) |
| `fox.glb` | Khronos glTF-Sample-Assets | CC0 (model) + CC-BY 4.0 (rig/animation) | **Có** (rig/animation) | 0,008 | Cáo đi dạo quanh rừng trúc phía Tây (animation Walk) |

**Kiểm chứng kỹ thuật:** mọi file đã kiểm tra bằng Python (magic `glTF`, JSON parse được) và `gltf-transform validate` (không lỗi; 5 model Kenney báo `SCENE_NON_ROOT_NODE` — chỉ là cảnh báo validator về node cha `tmpParent`, `GLTFLoader` của Three.js r180 đã load thử thành công trong Node). Các model không texture đã load thử thật bằng `GLTFLoader.parse` (Three.js 0.180) — đều OK. Các model có texture nhúng (pagoda, bamboo, fox, bonsai, street-lantern-post) mới chỉ kiểm chứng cấu trúc; hình ảnh thật cuối cùng cần chụp từ trình duyệt sau khi deploy.

**Lưu ý:** nhóm Kenney Survival Kit (`barrel`, `crate`, `chest`, `signpost`, `campfire-pit`) tham chiếu texture ngoài `Textures/colormap.png` — file này **phải giữ đúng đường dẫn tương đối** `assets/Textures/colormap.png`, nếu không model sẽ thiếu texture.

### Ghi công bắt buộc (CC-BY) — đã đưa vào game (bảng Hướng dẫn) và README

```
- "Pagoda", "Bamboo", "Bonsai" by Poly by Google — CC-BY 3.0 (via Poly Pizza)
- "red lantern" by Sophie Kim — CC-BY 3.0 (via Poly Pizza)
- Fox model © PixelMannen (CC0); rigging & animation © tomkranis (CC-BY 4.0);
  glTF conversion © AsoboStudio and scurest (CC-BY 4.0) — Khronos glTF-Sample-Assets
```

## 2. Asset đã tải về nhưng CHƯA tích hợp (lý do)

| File | Lý do chưa dùng |
|---|---|
| `market-square.glb` (Quaternius, CC0) | Kích thước trong file mâu thuẫn (bbox 0,019×0,021×0,006, node scale 100) — cụm chợ có thể chỉ là mô hình dẹt/thu nhỏ; không mạo hiểm đặt làm trung tâm chợ khi chưa nhìn thấy render thật. Chợ hiện tại đã có 4 sạp thủ tục + 1 sạp GLB. |
| `bridge-wood.glb` (Kenney, CC0) | Cầu hiện tại gắn với logic đi qua sông (hành lang \|z\| ≤ 2,2, cầu vòm cao 1,7 m); thay cầu visual mà không kiểm thử trực tiếp có thể làm người chơi kẹt/lọt sông. Để riêng cho đợt kiểm thử sau. |
| `fence-wood.glb` (Kenney, CC0) | Hàng rào thủ tục hiện tại đã có collider từng cọc và đặt đúng vị trí; thay bằng GLB không cải thiện rõ rệt. |
| `desk-wood.glb`, `bookshelf-open.glb` (Kenney, CC0) | Bàn thầy và kệ sách thủ tục trong lớp đã chi tiết (sách, bút, nghiên mực); kệ GLB đặt trong lớp sẽ vướng lối đi của thầy. |
| `fox.glb` — đã tích hợp (xem bảng 1) | — |

## 3. KHÔNG tìm được asset phù hợp (đã thử nhiều nguồn — xem bằng chứng ở `ASSETS_FOUND.md` mục 5)

1. **Nhà dân kiểu Trung Hoa** (tường trắng, mái ngói cong, cửa gỗ): không có trong bất kỳ kho CC0/CC-BY nào tải trực tiếp được (Poly Pizza, Quaternius, Kenney, KayKit, Khronos). Không lấy nhà phương Tây gán làm nhà Trung Hoa. Nhà trong game vẫn là hình học thủ tục nâng cấp (xem mục 4).
2. **Nhân vật cổ trang có rig + animation đi bộ**: chỉ có nhân vật fantasy phương Tây (hiệp sĩ/lính/robot). Không lấy bừa. Nhân vật trong game vẫn là hình học thủ tục (xem mục 4).
3. **Đèn lồng đá / đèn treo dây dài kiểu Trung Hoa**: chỉ có 1 mẫu đèn lồng đỏ (`red-lantern.glb`).

Hướng lấp chỗ trống (cần chủ dự án quyết): mua pack "Low Poly Chinese Town" (EH98, itch.io, 4,99 USD, 47 model nhà/chùa/cửa hàng chuẩn Trung Hoa) hoặc tạo tài khoản Sketchfab miễn phí để tải "Low Poly Chinese Temple" (CC-BY 4.0).

## 4. Phần nào VẪN LÀ hình học thủ tục và vì sao

- **8 nhà dân + trường học + trường thi**: không có asset GLB nhà Trung Hoa (mục 3). Đã nâng cấp thủ tục lên mức chi tiết cao: tường khung gỗ (texture canvas), cửa sổ chạm khắc, cửa ván có đinh tán + tay nắm vòng, đầu hồi tam giác, sừng mái vểnh 4 góc, cột gỗ góc nhà, xà ngang — nhưng vẫn là hình học trong code, không phải asset thật.
- **Nhân vật (người chơi + 7 NPC + 3 dân làng)**: không có nhân vật cổ trang rig sẵn (mục 3). Dựng bằng sphere/cylinder/lathe/torus, animation xoay khớp thủ tục. Đã thêm 3 dân làng đi lại và cáo GLB để làng có sức sống.
- **Cầu, giếng, ruộng, nội thất lớp học**: thủ tục chi tiết (cầu vòm 9 ván + lan can ống, bàn ghế có sách/bút/nghiên, kệ sách 27 cuốn). Cầu GLB chưa thay vì lý do ở mục 2.
- **Cây cối**: kết hợp — 6 cây lớn gần trung tâm + tre xen kẽ đã dùng GLB; cây còn lại, rừng trúc, cỏ/hoa/lúa vẫn là thủ tục (đã nâng cấp: tán icosahedron biến dạng, lá tre/cỏ vẽ texture trên mặt phẳng chéo thay cho hình nón nhọn, lúa búi lá chéo, hoa có cuống).
- **Núi xa, đồi, mây, bầu trời**: thủ tục (nón đá + chóp tuyết, đồi cầu dẹt, sprite mây, shader bầu trời) — không có asset núi/mây GLB phù hợp trong đợt này.

© Nông Quang Vinh

## 5. Cách model GLB được đưa lên trang live (ghi chú kỹ thuật)

Connector GitHub của Muse không đẩy được file nhị phân (file `.glb` gốc vẫn lưu trong bản sao làm việc, không có trên repo). Game nạp model bằng 2 cách:

- **Model lớn (Poly Pizza, Khronos Fox):** nạp trực tiếp từ CDN gốc của tác giả (`static.poly.pizza`, `raw.githubusercontent.com` — đã kiểm chứng `Access-Control-Allow-Origin: *` ngày 27/11/2026). Xem bảng URL đầy đủ trong `js/assets.js` (`REMOTE_URLS`).
- **Model nhỏ (Kenney):** file `.glb` mã hóa base64 thành file text `.b64` trong `han-lam-ky/assets/`; game tải về, giải mã rồi parse bằng `GLTFLoader.parseAsync`. 5 model dùng chung texture `Textures/colormap.png` thì texture này được nhúng dạng data URI trong `js/assets.js` (loader tự chuyển hướng qua `LoadingManager.setURLModifier`).

Nếu sau này đẩy được file nhị phân lên repo (git trực tiếp), chỉ cần đổi `js/assets.js` về nạp `./assets/<file>.glb` như cũ — danh sách đặt model (`PLACEMENTS`) không đổi.
