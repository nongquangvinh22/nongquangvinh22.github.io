# Hán Lâm Ký · 汉林记

Game 3D học tiếng Trung giản thể, chạy trực tiếp trên trình duyệt.

## Chơi thử

https://nongquangvinh22.github.io/han-lam-ky/

## Vertical slice hiện tại — làng Thanh Khê

- Làng Thanh Khê: 8 nhà mái ngói cong (tường khung gỗ, cửa sổ chạm khắc, đầu hồi, sừng mái vểnh), trường học, trường thi, 4 sạp chợ + 1 sạp GLB, giếng, cầu gỗ qua sông, ruộng lúa có bù nhìn, rừng trúc, cây, hoa, đèn lồng, chim bay, nước gợn, sương và ánh nắng. Thêm: tháp 5 tầng (landmark phía Bắc), đình làng mái cong, dãy núi xa + đồi cỏ bao quanh, mây trôi, cổng làng 牌坊 2 đầu đường, bàn ghế/thùng/giỏ/hàng rào/đèn đá/bó rơm, lau sậy ven sông.
- Nhân vật chính: thư sinh với áo dài, tóc búi, hoạt ảnh đi / chạy / đứng thở.
- 7 NPC: Thầy Đồ Lâm, Cô Bán Bánh, Anh Đưa Thư, 3 học trò ngồi học trong lớp, Quan Khảo Thí ở trường thi. Thêm 3 dân làng đi lại trong làng (Bà Lão Mai, Anh Nông Dân, Cô Gái Trẻ) và 1 con cáo đi dạo quanh rừng trúc (asset GLB có animation).
- 4 nhiệm vụ học tiếng Trung: 你好 (Nǐ hǎo), 我要一个包子 (Wǒ yào yí gè bāozi), 谢谢 (Xièxie), hỏi đường 请问，去学校怎么走？ — có chữ Hán, Pinyin có dấu thanh, nghĩa tiếng Việt, câu ví dụ và nghe phát âm.
- Trường học và trường thi đi vào được: cửa mở bằng E, bàn ghế, bảng đen, sách, bút lông, nghiên mực; trường thi có 6 bàn thi riêng, ngồi vào bàn để làm bài thi thăng cấp.
- Giáo trình vỡ lòng Bài 0–5 trong Sổ học tập (tự chọn, không chặn nhiệm vụ 你好): Pinyin, 4 thanh điệu (nghe từng thanh mā/má/mǎ/mà/ma), thanh mẫu dễ/khó, vận mẫu và cấu tạo chữ, biến điệu. Chuẩn HSK 3.0 (các cấp 300/500/1.000/2.000/3.600/5.400/11.000 từ). Nội dung HSK 1 đang theo đề cương HSK 3.0, chưa phải danh sách đầy đủ đã kiểm chứng chuyên môn.
- Cấp bậc khoa cử: 学童 → 童生 → 秀才 → 举人 → 贡士 → 进士. Cấp bậc CHỈ đổi khi đỗ kỳ thi trong trường thi; XP chỉ là điểm tích lũy, không tự lên cấp. Bản lưu cũ có XP cao sẽ bắt đầu lại từ 学童 và cần thi thăng cấp.
- Ôn tập spaced repetition: từ sai 2 lần được đánh dấu "cần ôn", ôn sau 1/3 ngày trong game; Sổ học tập có mục từ đã học, từ cần ôn, điểm yếu.
- Lưu tiến trình trong trình duyệt (localStorage). Chưa có đăng nhập trực tuyến / đồng bộ nhiều thiết bị.

## Điều khiển chuột

- Nhấp chuột trái vào mặt đất: nhân vật đi đến vị trí đó.
- Nhấp đúp chuột trái vào mặt đất: nhân vật chạy đến vị trí đó.
- Giữ chuột phải và kéo: xoay camera.
- Cuộn bánh xe: zoom camera gần/xa.
- Nhấp vào NPC: nhân vật tự đi đến gần NPC và mở hội thoại.

## Điều khiển bàn phím

- W/A/S/D hoặc phím mũi tên: di chuyển theo hướng camera.
- Shift: chạy.
- E: tương tác với NPC ở gần.
- Esc: đóng hộp thoại.

## Điện thoại

- Chơi ngang (landscape): mở dọc sẽ hiện hướng dẫn xoay ngang; game thử khóa ngang khi bắt đầu (trình duyệt có thể không cho).
- Joystick ảo bên trái (8 hướng, tốc độ theo lực kéo) + vùng vuốt camera bên phải — dùng được cùng lúc bằng 2 ngón (multi-touch, mỗi vùng quản lý Pointer ID riêng).
- Nút RUN để chạy, nút Tương tác (E) để nói chuyện / mở cửa / ngồi thi.
- Chạm vào mặt đất để di chuyển; kéo trên màn hình để xoay góc nhìn.

## Công nghệ

- Three.js 0.180
- HTML, CSS, JavaScript
- GitHub Pages

## Giới hạn hiện tại

Đây vẫn là bản vertical slice. Tiến trình lưu cục bộ trong trình duyệt, chưa có đăng nhập trực tuyến / đồng bộ nhiều thiết bị. Nội dung bài học mới là phần mở đầu, chưa phải khóa HSK hoàn chỉnh. Một phần mô hình 3D đã dùng asset GLB có giấy phép (tháp, đình, cây, tre, đèn lồng, sạp chợ, đồ gỗ — xem `ASSETS.md`); nhà dân, nhân vật và phần lớn nội thất vẫn dựng bằng hình học thủ tục + texture vẽ bằng canvas trong code, vì chưa tìm được nhà kiểu Trung Hoa và nhân vật cổ trang có rig trong các kho CC0/CC-BY tải trực tiếp được.

## Ghi công asset 3D (CC-BY — bắt buộc khi phát hành công khai)

- "Pagoda", "Bamboo", "Bonsai" — Poly by Google, CC-BY 3.0 (qua Poly Pizza).
- "red lantern" — Sophie Kim, CC-BY 3.0 (qua Poly Pizza).
- Fox: model © PixelMannen (CC0); rigging & animation © tomkranis (CC-BY 4.0); chuyển đổi glTF © AsoboStudio và scurest (CC-BY 4.0) — Khronos glTF-Sample-Assets.
- Các asset còn lại dùng CC0 (Quaternius, Kenney, Kay Lousberg). Chi tiết đầy đủ: `ASSETS.md`, `ASSETS_FOUND.md`.

© Nông Quang Vinh
