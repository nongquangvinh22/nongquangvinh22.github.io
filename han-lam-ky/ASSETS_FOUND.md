# Asset 3D đã tìm & tải thật cho Hán Lâm Ký (汉林记)

- **Ngày tìm:** 2026-11-27
- **Thư mục asset:** `~/workspace/han-lam-ky/assets/` (27 file `.glb` + 1 file texture `.png`)
- **Tổng dung lượng:** 3.530.424 byte ≈ **3,37 MB** (giới hạn đề ra: mỗi file < 3 MB, tổng < ~15 MB — **đạt**)
- **Định dạng:** tất cả là glTF 2.0 binary (`.glb`), Three.js r180 `GLTFLoader` đọc được.
- **Kiểm chứng:** mọi file đã kiểm tra bằng script Python đọc trực tiếp chunk JSON trong GLB — 4 byte đầu đều là `glTF`, độ dài khai báo trong header khớp đúng kích thước file (`len_ok=True`), JSON parse được, không file nào rỗng/hỏng. Chi tiết từng file ở bảng dưới (cột *Kiểm chứng*).
- **Quy tắc đặt tên:** tên file trong `assets/` là tên gọi theo công dụng trong game, không phải tên gốc.

> ⚠️ **Lưu ý tỉ lệ (quan trọng):** các nguồn khác nhau dùng đơn vị khác nhau (xem cột *Tỉ lệ gợi ý*). Khi đưa vào game **bắt buộc phải scale** theo gợi ý, nếu không model sẽ quá to (tháp 55 m) hoặc tí hon (sạp chợ cao 1,2 cm trong file). Gợi ý tính theo quy ước game: 1 đơn vị = 1 m, nhân vật cao ~1,7 m.

---

## 1. Bảng tổng hợp

| # | File trong `assets/` | Nguồn / Tác giả | License | Attribution? | Dung lượng | Dùng được? |
|---|---|---|---|---|---|---|
| 1 | `pagoda.glb` | Poly Pizza — "Pagoda", Poly by Google | CC-BY 3.0 | **Có** | 1.720.628 B (1,64 MB) | ✅ Dùng được — tháp/chùa 5 tầng |
| 2 | `pavilion.glb` | Poly Pizza — "Pagoda", Poly by Google | CC-BY 3.0 | **Có** | 181.304 B | ✅ Dùng được — đình 2 tầng mái cong xanh |
| 3 | `bamboo.glb` | Poly Pizza — "Bamboo", Poly by Google | CC-BY 3.0 | **Có** | 345.312 B | ✅ Dùng được — 3 thân tre |
| 4 | `red-lantern.glb` | Poly Pizza — "red lantern", Sophie Kim | CC-BY 3.0 | **Có** | 30.212 B | ✅ Dùng được — đèn lồng đỏ |
| 5 | `bonsai.glb` | Poly Pizza — "Bonsai", Poly by Google | CC-BY 3.0 | **Có** | 251.800 B | ✅ Dùng được — bonsai trang trí |
| 6 | `market-stall.glb` | Poly Pizza — "Market Stand", Quaternius | CC0 1.0 | Không (ghi ơn tự nguyện) | 84.992 B | ✅ Dùng được — sạp chợ |
| 7 | `market-square.glb` | Poly Pizza — "Village Market", Quaternius | CC0 1.0 | Không (ghi ơn tự nguyện) | 385.312 B | ✅ Dùng được — cụm chợ 5–6 sạp |
| 8 | `street-lantern-post.glb` | Poly Pizza — "Post Lantern", Kay Lousberg | CC0 1.0 | Không (ghi ơn tự nguyện) | 44.024 B | ✅ Dùng được — cột đèn đường gỗ |
| 9 | `bamboo-young.glb` | Kenney Nature Kit — `crops_bambooStageB` | CC0 1.0 | Không | 40.144 B | ✅ Dùng được — bụi tre non |
| 10 | `tree-broad.glb` | Kenney Nature Kit — `tree_detailed` | CC0 1.0 | Không | 31.412 B | ✅ Dùng được — cây tán rộng |
| 11 | `tree-oak.glb` | Kenney Nature Kit — `tree_oak` | CC0 1.0 | Không | 14.644 B | ✅ Dùng được — cây sồi tán rộng |
| 12 | `tree-plateau.glb` | Kenney Nature Kit — `tree_plateau` | CC0 1.0 | Không | 16.304 B | ✅ Dùng được — thông tán phẳng |
| 13 | `fence-wood.glb` | Kenney Nature Kit — `fence_simple` | CC0 1.0 | Không | 5.712 B | ✅ Dùng được — hàng rào gỗ |
| 14 | `bridge-wood.glb` | Kenney Nature Kit — `bridge_wood` | CC0 1.0 | Không | 15.692 B | ✅ Dùng được — cầu gỗ |
| 15 | `bush-large.glb` | Kenney Nature Kit — `plant_bushLarge` | CC0 1.0 | Không | 6.436 B | ✅ Dùng được — bụi cây |
| 16 | `rock-large.glb` | Kenney Nature Kit — `rock_largeA` | CC0 1.0 | Không | 7.552 B | ✅ Dùng được — tảng đá |
| 17 | `table-wood.glb` | Kenney Furniture Kit — `table` | CC0 1.0 | Không | 8.196 B | ✅ Dùng được — bàn gỗ (lớp học) |
| 18 | `chair-wood.glb` | Kenney Furniture Kit — `chair` | CC0 1.0 | Không | 10.756 B | ✅ Dùng được — ghế gỗ |
| 19 | `bench-wood.glb` | Kenney Furniture Kit — `bench` | CC0 1.0 | Không | 10.756 B | ✅ Dùng được — ghế dài gỗ |
| 20 | `desk-wood.glb` | Kenney Furniture Kit — `desk` | CC0 1.0 | Không | 15.048 B | ✅ Dùng được — bàn làm việc gỗ |
| 21 | `bookshelf-open.glb` | Kenney Furniture Kit — `bookcaseOpen` | CC0 1.0 | Không | 18.020 B | ✅ Dùng được — kệ sách gỗ |
| 22 | `barrel.glb` | Kenney Survival Kit — `barrel` | CC0 1.0 | Không | 34.256 B | ✅ Dùng được — thùng gỗ (cần kèm texture) |
| 23 | `crate.glb` | Kenney Survival Kit — `box` | CC0 1.0 | Không | 14.056 B | ✅ Dùng được — thùng/hòm gỗ (cần kèm texture) |
| 24 | `chest.glb` | Kenney Survival Kit — `chest` | CC0 1.0 | Không | 35.172 B | ✅ Dùng được — rương gỗ, **có animation mở/đóng** |
| 25 | `signpost.glb` | Kenney Survival Kit — `signpost` | CC0 1.0 | Không | 5.924 B | ✅ Dùng được — biển chỉ đường gỗ |
| 26 | `campfire-pit.glb` | Kenney Survival Kit — `campfire-pit` | CC0 1.0 | Không | 26.468 B | ✅ Dùng được — bếp lửa đá |
| 27 | `fox.glb` | Khronos glTF-Sample-Assets — "Fox" | CC0 (model) + CC-BY 4.0 (rig/animation) | **Có** (phần rig/animation) | 162.852 B | ✅ Dùng được — cáo, có animation Walk/Run (thú trong làng, **không phải nhân vật cổ trang**) |
| — | `Textures/colormap.png` | Kenney Survival Kit (texture dùng chung) | CC0 1.0 | Không | 7.440 B | ⚠️ **Bắt buộc đi kèm** các file số 22–26 (xem mục 4) |

---

## 2. Chi tiết từng asset

### 2.1. Nhóm kiến trúc Đông Á (Poly Pizza)

#### `pagoda.glb` — Tháp 5 tầng (landmark chùa/tháp)
- **Nguồn:** trang model https://poly.pizza/m/1zS7ucaAd4J — file GLB trực tiếp https://static.poly.pizza/5ed9ad9d-ebd6-4eb8-9ea5-5232f8f55a61.glb
- **Tác giả / License:** "Pagoda" by **Poly by Google** (kho Google Poly), **CC-BY 3.0** (trên trang ghi "Creative Commons Attribution", link `creativecommons.org/licenses/by/3.0/`).
- **Attribution:** **Bắt buộc.** Ghi: `"Pagoda" by Poly by Google, CC-BY 3.0, via Poly Pizza (poly.pizza/m/1zS7ucaAd4J)`.
- **Dung lượng:** 1.720.628 B (~1,64 MB) — file lớn nhất đợt này, vẫn dưới 3 MB.
- **Mô tả:** tháp 5 tầng mái cong, cột đỏ, mái nâu sẫm, đế đỏ — đã xem ảnh poster thật, đúng phong cách tháp Đông Á (Trung/Nhật), low-poly, 1 mesh duy nhất nên nhẹ khi render.
- **Kiểm chứng:** magic `glTF`, `len_ok=True`, glTF 2.0, **1 mesh / 1 node / 1 material / 0 animation**, 1 ảnh nhúng trong file (không cần texture ngoài), kích thước gốc trong file 26,4 × 55,5 × 26,4.
- **Tỉ lệ gợi ý:** scale **0,30** → cao ~16,6 m, chân tháp ~7,9 m. Đặt làm landmark chùa/tháp ở rìa làng.
- **Đánh giá:** ✅ **Dùng được.** Đây là công trình Đông Á tốt nhất tìm được miễn phí.

#### `pavilion.glb` — Đình 2 tầng mái cong xanh (đình làng)
- **Nguồn:** trang model https://poly.pizza/m/eHOI2VgW1ol — file GLB trực tiếp https://static.poly.pizza/c8c63564-31e0-4f19-9e82-1c5bec4ac870.glb
- **Tác giả / License:** "Pagoda" by **Poly by Google**, **CC-BY 3.0**.
- **Attribution:** **Bắt buộc.** Ghi: `"Pagoda" by Poly by Google, CC-BY 3.0, via Poly Pizza (poly.pizza/m/eHOI2VgW1ol)`.
- **Dung lượng:** 181.304 B.
- **Mô tả:** đình lục giác 2 tầng, mái cong màu xanh lục (ngói lưu ly), cột đỏ, lan can — đã xem ảnh poster thật, rất hợp làm **đình làng Thanh Khê** (nơi nghỉ chân / điểm tụ họp).
- **Kiểm chứng:** magic `glTF`, `len_ok=True`, **1 mesh / 1 node / 5 materials / 0 animation**, 0 ảnh, kích thước gốc 16,0 × 16,3 × 14,6.
- **Tỉ lệ gợi ý:** scale **0,5** → cao ~8,2 m, rộng ~8 m.
- **Đánh giá:** ✅ **Dùng được.**

#### `bamboo.glb` — Cụm 3 thân tre
- **Nguồn:** trang model https://poly.pizza/m/auVD_m-ugF0 — file GLB trực tiếp https://static.poly.pizza/88f0463b-af10-4fa5-94d4-2d8e3b91f58e.glb
- **Tác giả / License:** "Bamboo" by **Poly by Google**, **CC-BY 3.0**.
- **Attribution:** **Bắt buộc.** Ghi: `"Bamboo" by Poly by Google, CC-BY 3.0, via Poly Pizza (poly.pizza/m/auVD_m-ugF0)`.
- **Dung lượng:** 345.312 B.
- **Mô tả:** 3 thân tre xanh có đốt, vài lá — đã xem ảnh poster thật.
- **Kiểm chứng:** magic `glTF`, `len_ok=True`, **1 mesh / 1 node / 1 material / 0 animation**, 1 ảnh nhúng trong file, kích thước gốc 0,9 × 1,85 × 0,87.
- **Tỉ lệ gợi ý:** scale **1,5–2** → cao ~2,8–3,7 m. Nhân bản nhiều cụm làm rừng tre ven làng.
- **Đánh giá:** ✅ **Dùng được.**

#### `red-lantern.glb` — Đèn lồng đỏ
- **Nguồn:** trang model https://poly.pizza/m/7PZhxLFiGc2 — file GLB trực tiếp https://static.poly.pizza/686aaafe-8e8e-4f39-8719-511311724193.glb
- **Tác giả / License:** "red lantern" by **Sophie Kim**, **CC-BY 3.0**.
- **Attribution:** **Bắt buộc.** Ghi: `"red lantern" by Sophie Kim, CC-BY 3.0, via Poly Pizza (poly.pizza/m/7PZhxLFiGc2)`.
- **Dung lượng:** 30.212 B.
- **Mô tả:** đèn lồng giấy đỏ hình bầu dục, nắp + quai đen — đã xem ảnh poster thật, đúng đèn lồng đỏ Trung Hoa, treo ở đình/chợ/cổng làng.
- **Kiểm chứng:** magic `glTF`, `len_ok=True`, **4 meshes / 4 nodes / 2 materials / 0 animation**, 0 ảnh, kích thước gốc 0,48 × 0,75 × 0,47.
- **Tỉ lệ gợi ý:** scale **1** (treo nguyên cỡ ~0,75 m) hoặc 0,7 nếu treo thấp.
- **Đánh giá:** ✅ **Dùng được.** Asset đèn lồng đỏ chuẩn nhất tìm được.

#### `bonsai.glb` — Cây bonsai trong chậu
- **Nguồn:** trang model https://poly.pizza/m/1BtyNc_gX5a — file GLB trực tiếp https://static.poly.pizza/6184a5b5-b595-4184-845d-b4d00bf98089.glb
- **Tác giả / License:** "Bonsai" by **Poly by Google**, **CC-BY 3.0**.
- **Attribution:** **Bắt buộc.** Ghi: `"Bonsai" by Poly by Google, CC-BY 3.0, via Poly Pizza (poly.pizza/m/1BtyNc_gX5a)`.
- **Dung lượng:** 251.800 B.
- **Mô tả:** cây tùng bonsai dáng uốn trong chậu đỏ cam — đã xem ảnh poster thật. Trang trí sân trường / sân đình.
- **Kiểm chứng:** magic `glTF`, `len_ok=True`, **1 mesh / 1 node / 1 material / 0 animation**, 1 ảnh nhúng trong file, kích thước gốc 1,32 × 1,54 × 1,97.
- **Tỉ lệ gợi ý:** scale **0,5** → cao ~0,77 m.
- **Đánh giá:** ✅ **Dùng được** (đồ trang trí, không bắt buộc).

### 2.2. Nhóm chợ & đèn đường (Poly Pizza — CC0)

#### `market-stall.glb` — Sạp chợ mái sọc
- **Nguồn:** trang model https://poly.pizza/m/DGIM5HGISb — file GLB trực tiếp https://static.poly.pizza/e2633001-4cf5-46fa-ac68-575c9954f4ba.glb
- **Tác giả / License:** "Market Stand" by **Quaternius**, **CC0 1.0** (public domain).
- **Attribution:** Không bắt buộc; nên ghi ơn tự nguyện: `"Market Stand" by Quaternius (CC0), via Poly Pizza`.
- **Dung lượng:** 84.992 B.
- **Mô tả:** sạp gỗ 4 cột, mái bạt sọc đỏ/trắng, bàn gỗ — đã xem ảnh poster thật. Mái sọc là kiểu sạp chợ chung, không mang dấu ấn riêng phương Tây nên dùng được cho chợ làng (bán bánh bao…).
- **Kiểm chứng:** magic `glTF`, `len_ok=True`, **1 mesh / 2 nodes / 4 materials / 0 animation**, 0 ảnh, kích thước gốc 0,010 × 0,012 × 0,010 (đơn vị file rất nhỏ — xem tỉ lệ).
- **Tỉ lệ gợi ý:** scale **~170** → cao ~2,0 m.
- **Đánh giá:** ✅ **Dùng được.**

#### `market-square.glb` — Cụm chợ 5–6 sạp có hàng hóa
- **Nguồn:** trang model https://poly.pizza/m/0TsHLxX6CB — file GLB trực tiếp https://static.poly.pizza/d99b4be3-5157-4dda-b308-ad77acbe8801.glb
- **Tác giả / License:** "Village Market" by **Quaternius**, **CC0 1.0**.
- **Attribution:** Không bắt buộc; ghi ơn tự nguyện: `"Village Market" by Quaternius (CC0), via Poly Pizza`.
- **Dung lượng:** 385.312 B.
- **Mô tả:** một cụm chợ hoàn chỉnh (5–6 sạp mái bạt nhiều màu + bao hàng) trong **một model duy nhất** — đã xem ảnh poster thật. Đặt một lần là có ngay khu chợ.
- **Kiểm chứng:** magic `glTF`, `len_ok=True`, **1 mesh / 2 nodes / 7 materials / 0 animation**, 0 ảnh, kích thước gốc 0,019 × 0,021 × 0,006.
- **Tỉ lệ gợi ý:** scale **~100** → sạp cao ~2,1 m, cả cụm rộng ~6–8 m (cần thử trong scene vì cụm dẹt theo một trục).
- **Đánh giá:** ✅ **Dùng được.**

#### `street-lantern-post.glb` — Cột đèn đường gỗ + đèn treo
- **Nguồn:** trang model https://poly.pizza/m/ZSQ65S4lEu — file GLB trực tiếp https://static.poly.pizza/41095798-4ff6-4567-8654-026703a51f32.glb
- **Tác giả / License:** "Post Lantern" by **Kay Lousberg**, **CC0 1.0**.
- **Attribution:** Không bắt buộc; ghi ơn tự nguyện: `"Post Lantern" by Kay Lousberg (CC0), via Poly Pizza`.
- **Dung lượng:** 44.024 B.
- **Mô tả:** cột gỗ có tay đỡ, treo đèn lồng khung đen kính vàng — đã xem ảnh poster thật. Dạng cột đèn chung, dùng được dọc đường làng (lưu ý đầu đèn kiểu đèn đường phương Tây, không phải lồng đỏ — đã có `red-lantern.glb` riêng cho lồng đỏ).
- **Kiểm chứng:** magic `glTF`, `len_ok=True`, **2 meshes / 3 nodes / 1 material / 0 animation**, 1 ảnh nhúng trong file, kích thước gốc 0,006 × 0,046 × 0,017.
- **Tỉ lệ gợi ý:** scale **~60** → cao ~2,8 m.
- **Đánh giá:** ✅ **Dùng được.**

### 2.3. Nhóm cây & môi trường (Kenney Nature Kit — CC0)

Nguồn chung: pack **Nature Kit** (330 model), trang https://kenney.nl/assets/nature-kit — tải file ZIP gốc từ Kenney qua link ký của họ rồi trích từng GLB. License toàn pack **CC0 1.0** (https://creativecommons.org/publicdomain/zero/1.0/), không cần attribution. Các GLB Kenney Nature Kit **không dùng texture ngoài** (0 ảnh trong JSON) — chỉ màu material, file tự chứa hoàn toàn.

#### `bamboo-young.glb` — Bụi tre non / măng tre
- **Gốc trong pack:** `Models/GLTF format/crops_bambooStageB.glb` (40.144 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 1 mesh / 2 nodes / 1 material, kích thước gốc 0,34 × 0,89 × 0,31. Tỉ lệ gợi ý: scale **3** → cao ~2,7 m. ✅ Dùng được — trồng xen với `bamboo.glb` cho rừng tre có tầng cao thấp.

#### `tree-broad.glb` — Cây cổ thụ tán rộng
- **Gốc trong pack:** `Models/GLTF format/tree_detailed.glb` (31.412 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 1 mesh / 2 nodes / 3 materials, kích thước gốc 0,85 × 1,33 × 0,76. Tỉ lệ gợi ý: scale **3** → cao ~4 m, tán ~2,5 m. ✅ Dùng được — cây lớn giữa làng / sân trường.

#### `tree-oak.glb` — Cây sồi tán rộng
- **Gốc trong pack:** `Models/GLTF format/tree_oak.glb` (14.644 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 1 mesh / 2 nodes / 2 materials, kích thước gốc 0,64 × 1,23 × 0,74. Tỉ lệ gợi ý: scale **3** → cao ~3,7 m. ✅ Dùng được.

#### `tree-plateau.glb` — Thông tán phẳng
- **Gốc trong pack:** `Models/GLTF format/tree_plateau.glb` (16.304 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 1 mesh / 2 nodes / 2 materials, kích thước gốc 0,61 × 1,25 × 0,66. Tỉ lệ gợi ý: scale **3** → cao ~3,7 m. ✅ Dùng được — tán phẳng kiểu tùng, hợp cảnh quan Á Đông.

#### `fence-wood.glb` — Hàng rào gỗ (1 đoạn thẳng)
- **Gốc trong pack:** `Models/GLTF format/fence_simple.glb` (5.712 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 1 mesh / 2 nodes / 2 materials, kích thước gốc 1,0 × 0,35 × 0,07. Tỉ lệ gợi ý: scale **3** → dài 3 m, cao ~1 m; xếp nối tiếp quanh vườn/nhà. ✅ Dùng được.

#### `bridge-wood.glb` — Cầu gỗ
- **Gốc trong pack:** `Models/GLTF format/bridge_wood.glb` (15.692 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 1 mesh / 2 nodes / 3 materials, kích thước gốc 1,04 × 0,4 × 1,04. Tỉ lệ gợi ý: scale **3–4** → dài ~3–4 m (game đã có cầu — thay/cân nhắc khi tích hợp). ✅ Dùng được.

#### `bush-large.glb` — Bụi cây lớn
- **Gốc trong pack:** `Models/GLTF format/plant_bushLarge.glb` (6.436 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 1 mesh / 2 nodes / 1 material, kích thước gốc 0,37 × 0,24 × 0,34. Tỉ lệ gợi ý: scale **3** → ~1 m. ✅ Dùng được.

#### `rock-large.glb` — Tảng đá lớn
- **Gốc trong pack:** `Models/GLTF format/rock_largeA.glb` (7.552 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 1 mesh / 2 nodes / 2 materials, kích thước gốc 0,79 × 0,26 × 1,02. Tỉ lệ gợi ý: scale **3** → dài ~3 m. ✅ Dùng được.

### 2.4. Nhóm đồ gỗ trong nhà (Kenney Furniture Kit — CC0)

Nguồn chung: pack **Furniture Kit** (140 model), trang https://kenney.nl/assets/furniture-kit — tải ZIP gốc từ Kenney rồi trích từng GLB. License **CC0 1.0**, không cần attribution. Đã xem ảnh render Isometric của pack: bàn/ghế/ghế dài/kệ đều là **gỗ trơn đơn giản, không có chi tiết hiện đại** (không kính, không kim loại) nên dùng được trong lớp học / nhà cổ. Các GLB này **không dùng texture ngoài** (0 ảnh trong JSON).

#### `table-wood.glb` — Bàn gỗ
- **Gốc trong pack:** `Models/GLTF format/table.glb` (8.196 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 1 mesh / 1 node / 1 material, kích thước gốc 0,84 × 0,33 × 0,45. Tỉ lệ gợi ý: scale **2,2** → cao ~0,72 m. ✅ Dùng được — bàn học trong lớp / bàn trong nhà.

#### `chair-wood.glb` — Ghế gỗ
- **Gốc trong pack:** `Models/GLTF format/chair.glb` (10.756 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 1 mesh / 1 node / 1 material, kích thước gốc 0,2 × 0,47 × 0,2. Tỉ lệ gợi ý: scale **2** → cao ~0,94 m. ✅ Dùng được.

#### `bench-wood.glb` — Ghế dài gỗ
- **Gốc trong pack:** `Models/GLTF format/bench.glb` (10.756 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 1 mesh / 1 node / 1 material, kích thước gốc 0,4 × 0,47 × 0,2. Tỉ lệ gợi ý: scale **2** → cao ~0,94 m. ✅ Dùng được — ghế dài lớp học / sân đình.

#### `desk-wood.glb` — Bàn làm việc gỗ
- **Gốc trong pack:** `Models/GLTF format/desk.glb` (15.048 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 2 meshes / 2 nodes / 2 materials, kích thước gốc 0,73 × 0,38 × 0,56. Tỉ lệ gợi ý: scale **2** → cao ~0,77 m. ✅ Dùng được — bàn thầy đồ.

#### `bookshelf-open.glb` — Kệ sách gỗ mở
- **Gốc trong pack:** `Models/GLTF format/bookcaseOpen.glb` (18.020 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 1 mesh / 1 node / 1 material, kích thước gốc 0,4 × 0,88 × 0,25. Tỉ lệ gợi ý: scale **2** → cao ~1,76 m. ✅ Dùng được — kệ sách trong lớp học.

### 2.5. Nhóm thùng / rương / biển báo (Kenney Survival Kit — CC0)

Nguồn chung: pack **Survival Kit** (80 model), trang https://kenney.nl/assets/survival-kit — tải ZIP gốc từ Kenney rồi trích từng GLB. License **CC0 1.0**, không cần attribution. Đã xem ảnh preview của pack: thùng/rương/biển/bếp lửa đều là gỗ/đá mộc, hợp làng cổ.

⚠️ **Bắt buộc:** các GLB nhóm này tham chiếu texture ngoài `Textures/colormap.png` (JSON `images[0].uri = "Textures/colormap.png"`). File `assets/Textures/colormap.png` (7.440 B, PNG 512×512) **phải giữ đúng vị trí tương đối** `assets/Textures/colormap.png` so với các file GLB ở `assets/`, nếu không Three.js sẽ load thiếu texture (model có thể hiện màu sai / báo lỗi texture).

#### `barrel.glb` — Thùng gỗ có đai
- **Gốc trong pack:** `Models/GLB format/barrel.glb` (34.256 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 1 mesh / 1 node / 1 material, texture ngoài `Textures/colormap.png`, kích thước gốc 0,24 × 0,34 × 0,24. Tỉ lệ gợi ý: scale **2,5** → cao ~0,86 m. ✅ Dùng được.

#### `crate.glb` — Hòm/thùng gỗ vuông
- **Gốc trong pack:** `Models/GLB format/box.glb` (14.056 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 1 mesh / 1 node / 1 material, texture ngoài `Textures/colormap.png`, kích thước gốc 0,25 × 0,25 × 0,25. Tỉ lệ gợi ý: scale **2,5** → ~0,63 m. ✅ Dùng được.

#### `chest.glb` — Rương gỗ (có animation)
- **Gốc trong pack:** `Models/GLB format/chest.glb` (35.172 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 2 meshes / 2 nodes / 1 material, texture ngoài `Textures/colormap.png`, kích thước gốc 0,26 × 0,21 × 0,39. **Có 3 animation: `open`, `close`, `open-close`.** Tỉ lệ gợi ý: scale **2,5**. ✅ Dùng được — rương đồ / rương kho báu, animation mở nắp dùng được cho tương tác.

#### `signpost.glb` — Biển chỉ đường gỗ 2 hướng
- **Gốc trong pack:** `Models/GLB format/signpost.glb` (5.924 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 1 mesh / 1 node / 1 material, texture ngoài `Textures/colormap.png`, kích thước gốc 0,21 × 0,46 × 0,04. Tỉ lệ gợi ý: scale **4** → cao ~1,84 m. ✅ Dùng được — cắm ở ngã ba làng (bảng gỗ trơn, chưa có chữ).

#### `campfire-pit.glb` — Bếp lửa đá
- **Gốc trong pack:** `Models/GLB format/campfire-pit.glb` (26.468 B). Kiểm chứng: magic `glTF`, `len_ok=True`, 2 meshes / 2 nodes / 1 material, texture ngoài `Textures/colormap.png`, kích thước gốc 0,28 × 0,09 × 0,27. Tỉ lệ gợi ý: scale **3** → ~0,85 m. ✅ Dùng được — bếp lửa ngoài trời (chưa có lửa/effect, chỉ có vòng đá + củi).

### 2.6. Động vật (Khronos)

#### `fox.glb` — Cáo (có rig + animation đi/chạy)
- **Nguồn:** https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb (trang model: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox)
- **License (theo README của model):** model gốc **CC0 1.0** (PixelMannen); rigging & animation **CC-BY 4.0** (tomkranis); chuyển đổi glTF **CC-BY 4.0** (AsoboStudio và scurest).
- **Attribution:** **Bắt buộc cho phần rig/animation/chuyển đổi.** Ghi: `Fox model © PixelMannen (CC0); rigging & animation © tomkranis (CC-BY 4.0); glTF conversion © AsoboStudio and scurest (CC-BY 4.0). Source: Khronos glTF-Sample-Assets.`
- **Dung lượng:** 162.852 B.
- **Mô tả:** cáo low-poly màu cam, có skeleton (1 skin) — dùng làm thú hoang / thú cưng chạy quanh làng.
- **Kiểm chứng:** magic `glTF`, `len_ok=True`, **1 mesh / 26 nodes / 1 material / 1 skin / 1 ảnh nhúng**, **3 animation: `Survey` (đứng quan sát), `Walk`, `Run`**. Kích thước gốc 25,2 × 79,0 × 154,7 (đơn vị cm).
- **Tỉ lệ gợi ý:** scale **0,005–0,01** → dài ~0,8–1,5 m (cần thử trong scene; 0,006 ≈ cáo thật ~0,9 m).
- **Đánh giá:** ✅ **Dùng được — nhưng lưu ý: đây là ĐỘNG VẬT, không phải nhân vật cổ trang.** Nhân vật người có rig + animation đi bộ vẫn chưa có (xem mục 5).

---

## 3. Attribution cần đưa vào game (khối credits)

Các model **CC-BY bắt buộc ghi công** (nếu dùng trong game công khai). Gợi ý dán vào màn hình credits / file `CREDITS.md` của game:

```
3D models:
- "Pagoda", "Bamboo", "Bonsai" by Poly by Google — CC-BY 3.0
  (https://poly.pizza/m/1zS7ucaAd4J, /m/eHOI2VgW1ol, /m/auVD_m-ugF0, /m/1BtyNc_gX5a)
- "red lantern" by Sophie Kim — CC-BY 3.0 (https://poly.pizza/m/7PZhxLFiGc2)
- Fox model © PixelMannen (CC0); rigging & animation © tomkranis (CC-BY 4.0);
  glTF conversion © AsoboStudio and scurest (CC-BY 4.0) — Khronos glTF-Sample-Assets

CC0 (không bắt buộc ghi công, ghi ơn tự nguyện):
- "Market Stand", "Village Market" by Quaternius (CC0)
- "Post Lantern" by Kay Lousberg (CC0)
- Kenney Nature Kit / Furniture Kit / Survival Kit by Kenney (CC0) — kenney.nl
```

**Lưu ý license:**
- Toàn bộ asset CC-BY ở đây là **CC-BY 3.0** (kho Google Poly + Sophie Kim) và **CC-BY 4.0** (phần rig/animation của Fox). Cả hai đều cho phép dùng thương mại + chỉnh sửa, với điều kiện **ghi công tác giả + dẫn license + ghi chú nếu có chỉnh sửa**.
- Không có asset nào dùng license cấm thương mại (không có CC-BY-NC / CC-BY-ND trong đợt này).
- Model CC0 (Kenney, Quaternius, Kay Lousberg) không yêu cầu gì, nhưng vẫn nên ghi ơn trong credits để minh bạch nguồn gốc.
- **Không được** ghi các model CC-BY là "của Hán Lâm Ký" hay bỏ tên tác giả khi phát hành công khai.

---

## 4. Lưu ý kỹ thuật khi tích hợp (Three.js r180)

1. **Texture ngoài duy nhất:** chỉ nhóm Kenney Survival Kit (`barrel`, `crate`, `chest`, `signpost`, `campfire-pit`) cần `assets/Textures/colormap.png` ở đúng đường dẫn tương đối `Textures/colormap.png` tính từ file GLB. Tất cả asset còn lại tự chứa hoàn toàn (ảnh nhúng trong GLB hoặc chỉ dùng màu material).
2. **Tỉ lệ rất lệch giữa các nguồn** (xem cột tỉ lệ từng asset): Poly Pizza/Quaternius/KayKit (FBX2glTF) thường ở đơn vị mm → scale 60–170; Google Poly ở đơn vị m/cm lẫn lộn; Kenney ở đơn vị nhỏ (~0,5×) → scale 2–3. **Không load nguyên scale 1.**
3. **Trục gốc:** hầu hết model có gốc ở đáy (đặt trực tiếp lên mặt đất được); riêng `market-square.glb` là cụm dẹt, cần thử vị trí/rotation trong scene.
4. **`pagoda-b` không lấy** (xem mục 6): 285 mesh trong 1 file, tỉ lệ sai — nặng draw call, đã có `pagoda.glb` 1 mesh tốt hơn.
5. **`fox.glb`:** dùng `THREE.AnimationMixer`, các clip `Survey` / `Walk` / `Run` — chỉ chạy 1 clip tại 1 thời điểm (theo ghi chú của Khronos). **`chest.glb`:** clip `open` / `close` / `open-close`.
6. **Chưa kiểm thử trong game:** các file mới chỉ kiểm chứng ở mức parse GLB + xem ảnh poster/preview của nguồn. Chưa load thử bằng `GLTFLoader` trong scene thật của Hán Lâm Ký — cần 1 vòng load thử trước khi chốt tích hợp (đặc biệt `pagoda.glb` 1,7 MB và `market-square.glb`).

---

## 5. KHÔNG TÌM ĐƯỢC (đã thử nhiều nguồn, vẫn trống)

### 5.1. ❌ Nhà dân kiểu Trung Hoa (tường trắng, mái ngói cong, cửa gỗ) — KHÔNG CÓ
Đây là hạng mục quan trọng nhất và vẫn trống hoàn toàn. Bằng chứng đã thử:
- **Poly Pizza** — tìm với từ khóa `chinese house` (139 kết quả), `temple` (57 kết quả), `pagoda` (47 kết quả): toàn bộ "nhà" trả về đều là nhà phương Tây/fantasy của Quaternius/Kenney (nhà gỗ mái dốc, nhà chalet, "Fantasy House", "House Long", "Gazebo"…) — **không có một nhà Trung Hoa nào**. Chỉ có tháp/đình Đông Á (đã lấy `pagoda.glb`, `pavilion.glb` ở trên).
- **Quaternius** (quaternius.com) — liệt kê toàn bộ pack trên trang chủ (ngày 2026-11-27): các pack nhà là `Medieval Village`, `Medieval Village Mega Kit`, `Ultimate Textured Buildings`, `Downtown City Mega Kit` (đều là kiến trúc châu Âu trung cổ/hiện đại); pack châu Á duy nhất là `Sushi Restaurant Kit` (kiểu Nhật). **Không có pack Trung Hoa.**
- **Kenney** — các pack nhà là `City Kit (Suburban/Industrial/Roads)`, `Castle Kit`, `Tiny Town`, `Modular Buildings` — toàn nhà phương Tây hiện đại/trung cổ, không có nhà mái cong.
- **KayKit (GitHub `KayKit-Game-Assets`)** — pack nhà là `KayKit Medieval Hexagon Pack` / `Medieval Builder Pack` (nhà châu Âu trung cổ, đã thấy qua tài liệu dự án khác), không có pack Trung Hoa.
- **Rail Island Factory** (factory.railisland.com, CC0) — có mô hình "Temple of Heaven" (Thiên Đàn) và "Gate of Heavenly Peace" (Thiên An Môn) nhưng trang là ứng dụng JS, **thử 4 mẫu URL GLB trực tiếp đều 404** (`/models/…glb`, `/api/models/…glb`, `/download/…glb`…) — không tải được bằng curl, cần trình duyệt bấm nút download.
- **Kết luận:** nhà dân Trung Hoa **không có sẵn miễn phí (CC0/CC-BY) ở dạng GLB tải trực tiếp**. Theo đúng yêu cầu, **không lấy nhà phương Tây gán làm nhà Trung Hoa**. Hướng xử lý: (a) dựng nhà bằng model riêng / thuê vẽ, (b) mua pack trả phí như "Low Poly Chinese Town" của EH98 trên itch.io (4,99 USD, 47 model nhà/cửa hàng/đình/chùa — xem mục 5.4), (c) xin tài khoản Sketchfab để tải "Low Poly Chinese Temple" (CC-BY 4.0).

### 5.2. ❌ Nhân vật cổ trang có rig + animation đi bộ — KHÔNG CÓ
- **Quaternius/KayKit/Kenney** chỉ có nhân vật fantasy phương Tây (hiệp sĩ, pháp sư, lính, zombie, nhân vật blocky) — có rig + animation đi bộ nhưng **không phải cổ trang**, mặc giáp/váy phương Tây. Không lấy bừa theo yêu cầu.
- **Poly Pizza** — tìm `chinese`/`character` không ra nhân vật cổ trang nào.
- **Three.js mẫu** (`Soldier.glb`, `Xbot.glb`, `RobotExpressive.glb`, giấy phép MIT, tải trực tiếp được từ `raw.githubusercontent.com/mrdoob/three.js/…`) là **lính/robot**, không phải cổ trang — **đã kiểm tra và không lấy**.
- **Kết luận:** hạng mục này vẫn trống. Cần nhân vật tự làm / thuê rig, hoặc dùng nhân vật procedural hiện tại của game.

### 5.3. ❌ Đèn lồng đỏ kiểu treo dây / đèn lồng đá Trung Hoa — chỉ có 1 mẫu
- Đã lấy được **1 mẫu đèn lồng đỏ duy nhất** (`red-lantern.glb`, Sophie Kim). Các mẫu "lantern" khác trên Poly Pizza đều là đèn kim loại/kính kiểu phương Tây (đã xem poster và loại — xem mục 6). Chưa có đèn lồng đá / đèn treo dây dài.

### 5.4. Các nguồn đã thử nhưng không tải trực tiếp được (ghi rõ lý do)
- **Poly Pizza API** (`api.poly.pizza/v1.1/search/…`): trả **401** khi không có API key — API cần tài khoản miễn phí + key. **Đã làm việc vòng qua:** dùng trang web tìm kiếm công khai của Poly Pizza (`poly.pizza/search/…`) + link GLB trực tiếp `static.poly.pizza/….glb` trong HTML trang model — tải được, không cần key.
- **Kenney** (`kenney.nl`): nút download dùng link ký qua `kenney.nl/download-link/<hex>` — lần đầu trả 403, nhưng **lấy cookie từ trang pack + header Referer thì lấy được link ký và tải ZIP thành công** (4 pack: Nature, Furniture, Survival, Mini Shop).
- **Quaternius** (quaternius.com): pack tải qua **Google Drive folder** (vd. Medieval Village) hoặc nút mua itch.io — không có link ZIP trực tiếp bằng curl; không tải pack. (Và pack nhà của họ là châu Âu, không phù hợp — xem 5.1.)
- **Sketchfab**: có model đúng nhu cầu ("Low Poly Chinese Temple" by annhatsady, "Chinese Palace" by Lol-pop, "Chinese Lantern" by Batuhan13 — đều CC-BY 4.0) nhưng **Download API yêu cầu tài khoản + API token** (`GET api.sketchfab.com/v3/models/{uid}/download` cần `Authorization`); không có tài khoản/token nên **không tải được**. Cần chủ dự án tạo tài khoản Sketchfab (miễn phí) rồi tải tay.
- **Meshy.ai**: có mục "Pagoda"/"Chinese" gắn mác CC0 nhưng là **model AI-generated, cần tạo tài khoản mới tải**, nguồn gốc quyền không rõ ràng — **không dùng**.
- **Blend Swap / Open3DModel**: kho chủ yếu là file `.blend` / `.obj` / `.fbx`, **không có GLB tải trực tiếp** phù hợp quy trình (cần convert bằng Blender, ngoài phạm vi task chỉ-tải-asset).
- **itch.io "Low Poly Chinese Town"** (eh98.itch.io, 4,99 USD): đúng thứ game cần nhất (47 model: chùa, tháp 7 tầng, cổng thành, nhà, sạp, đình, đèn lồng, cây mơ…) nhưng là **pack trả phí**, chỉ có 5 model demo miễn phí (quán trà, sư tử đá, cột đèn, chum gạo, cây mơ) và demo cũng cần bấm tải qua itch.io — **không mua/không tải trong đợt này**. Đề xuất cân nhắc mua (rẻ, đúng chuẩn) nếu chủ dự án đồng ý.

---

## 6. Đã tải về xem thử nhưng LOẠI (không đưa vào `assets/`)

Các file này đã tải thật + xem ảnh poster thật, nhưng **không đạt** nên không đưa vào để tránh làm loãng bộ asset:

| Model (nguồn) | Lý do loại |
|---|---|
| "Palace" — Poly Pizza `poly.pizza/m/1d1nN3qb1E7` (124 KB, CC-BY 3.0) | Nhìn poster: **cung điện mái vòm hành tây kiểu Nga/Ấn**, cửa vòm nhọn — không phải Trung Hoa. |
| "Bell Tower" — Quaternius, Poly Pizza `poly.pizza/m/ux44tbeQvj` (728 KB, CC0) | Tháp chuông **đá + khung gỗ kiểu châu Âu trung cổ**, mái ngói xanh — không phải lầu chuông Trung Hoa. |
| "Temple First Age" — Quaternius, Poly Pizza `poly.pizza/m/YrK9bureMV` (634 KB, CC0) | Tháp gỗ fantasy màu nâu, không rõ phong cách Trung Hoa; đã có tháp + đình tốt hơn. |
| "Shrine" — Kay Lousberg, Poly Pizza `poly.pizza/m/tFxdxO5clk` (23 KB, CC0) | Miếu đá xám **kiểu Nhật (hokora)**, không phải miếu Trung Hoa. |
| "Pagoda" — Poly by Google, Poly Pizza `poly.pizza/m/d1M5ncMBUDi` (493 KB, CC-BY 3.0) | Tháp 3 tầng đẹp nhưng **285 mesh trong 1 file + tỉ lệ file sai** (bbox ~8.500 đơn vị) — nặng draw call; `pagoda.glb` (1 mesh) tốt hơn hẳn. |
| "Lantern" / "Hanging Lantern" — Kay Lousberg, Poly Pizza (30–37 KB, CC0) | Đèn lồng **khung kim loại đen kiểu đèn đường phương Tây**, không phải lồng đỏ — đã có `red-lantern.glb` + `street-lantern-post.glb`. |
| "Lantern" — Poly by Google, Poly Pizza `poly.pizza/m/9YMVn5hMiv8` (70 KB, CC-BY 3.0) | Đèn nến kim loại đen hiện đại, tỉ lệ file sai (bbox ~567.000 đơn vị). |
| Khronos "Lantern" (`glTF-Sample-Assets`, 9,5 MB) | **Vượt giới hạn 3 MB/file** và là đèn cắm trại hiện đại, không phải lồng đỏ. |
| Kenney Mini Shop Kit (30 GLB) | Toàn đồ siêu thị hiện đại (máy tính tiền, tủ đông, máy gacha…) — không hợp làng cổ; đã tải ZIP về xem danh sách rồi loại cả pack. |
| Kenney Furniture Kit — đồ hiện đại (sofa, tủ lạnh, TV, bồn tắm…) | Chỉ trích 5 món gỗ trơn (mục 2.4); phần còn lại của pack không hợp cổ trang nên không lấy. |
| Three.js `Soldier.glb` / `Xbot.glb` / `RobotExpressive.glb` (MIT) | Lính/robot có animation nhưng **không phải cổ trang** — không lấy. |

---

## 7. Tóm tắt kết quả

- **Đã tải thật & kiểm chứng: 27 file GLB + 1 texture, tổng ~3,37 MB.**
- **Đủ dùng ngay:** tháp 5 tầng, đình mái cong, tre (2 loại), cây tán rộng (3 loại), đèn lồng đỏ, cột đèn đường, sạp chợ + cụm chợ, hàng rào, cầu gỗ, bàn/ghế/kệ gỗ, thùng/rương/biển/bếp lửa, bonsai, đá, bụi cây, cáo có animation.
- **Vẫn trống:** **(1) nhà dân kiểu Trung Hoa** — hạng mục quan trọng nhất, không có trong bất kỳ kho CC0/CC-BY nào đã thử; **(2) nhân vật cổ trang có rig + animation đi bộ** — chỉ có nhân vật fantasy phương Tây, không lấy bừa.
- **Cần chủ dự án quyết:** (a) mua pack "Low Poly Chinese Town" (4,99 USD, itch.io) để có nhà/chùa/cửa hàng chuẩn Trung Hoa, hoặc (b) tạo tài khoản Sketchfab (miễn phí) để tải "Low Poly Chinese Temple" CC-BY 4.0, hoặc (c) đặt làm model nhà riêng.
- **Attribution:** 5 model Poly Pizza + Fox là CC-BY — **bắt buộc ghi công** theo khối ở mục 3 khi phát hành công khai. Còn lại là CC0.
