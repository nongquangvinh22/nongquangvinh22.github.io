# Hán Lâm Ký · 汉林记

Game 3D học tiếng Trung giản thể, chạy trực tiếp trên trình duyệt.

## Chơi thử

https://nongquangvinh22.github.io/han-lam-ky/

## Vertical slice hiện tại — làng Thanh Khê

- Làng Thanh Khê: 8 nhà mái ngói cong, trường học, 4 sạp chợ, giếng, cầu gỗ qua sông, ruộng lúa, rừng trúc, cây, hoa, đèn lồng, chim bay, nước gợn, sương và ánh nắng.
- Nhân vật chính: thư sinh với áo dài, tóc búi, hoạt ảnh đi / chạy / đứng thở.
- 3 NPC: Thầy Đồ Lâm, Cô Bán Bánh, Anh Đưa Thư, mỗi người có ngoại hình và vị trí riêng.
- 3 nhiệm vụ học tiếng Trung: 你好 (Nǐ hǎo), 我要一个包子 (Wǒ yào yí gè bāozi), 谢谢 (Xièxie) — có chữ Hán, Pinyin có dấu thanh, nghĩa tiếng Việt, câu ví dụ và nghe phát âm.
- XP và cấp bậc khoa cử: 学童 → 童生 → 秀才 → 举人 → 贡士 → 进士.
- Lưu tiến trình trong trình duyệt (localStorage).

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

- Dùng joystick ảo ở góc dưới bên trái.
- Nút E ở góc dưới bên phải để tương tác.
- Chạm vào mặt đất để di chuyển; kéo trên màn hình để xoay góc nhìn.

## Công nghệ

- Three.js 0.180
- HTML, CSS, JavaScript
- GitHub Pages

## Giới hạn hiện tại

Đây vẫn là bản vertical slice. Tiến trình lưu cục bộ trong trình duyệt, chưa có đăng nhập trực tuyến / đồng bộ nhiều thiết bị. Nội dung bài học mới là phần mở đầu, chưa phải khóa HSK hoàn chỉnh. Mô hình 3D hiện được dựng bằng hình học thủ tục + texture vẽ bằng canvas trong code, chưa phải bộ asset nhân vật / kiến trúc thương mại.

© Nông Quang Vinh
