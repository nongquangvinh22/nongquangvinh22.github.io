# NQV Vivo Guard — 0.1.0

Ứng dụng Android thử nghiệm viết bằng Kotlin, hướng đến Vivo X200 Pro chạy OriginOS 5. Đây là bản debug để cài thử, chưa phải bản phát hành thương mại.

## Chức năng trong bản thử nghiệm

- Bảng tổng quan pin: mức pin, trạng thái sạc, nhiệt độ và tình trạng pin do Android cung cấp.
- Danh sách ứng dụng hệ thống/người dùng, tìm kiếm theo tên hoặc package.
- Đánh dấu package không có Activity khởi chạy (không có biểu tượng launcher). Đây không đồng nghĩa với ứng dụng độc hại.
- Thống kê thời gian ở foreground trong ngày khi người dùng tự cấp Usage Access.
- Liệt kê quyền nhạy cảm mà ứng dụng khai báo; danh sách này không chứng minh ứng dụng đang truy cập quyền đó.
- Tường lửa VPN cục bộ: app được chọn được đưa vào interface VPN không có máy chủ bên ngoài; gói tin của chúng bị loại bỏ trên thiết bị. Các app khác được loại khỏi VPN.

## Giới hạn và an toàn

- Không cần root.
- Không tự buộc dừng app khác, không tự thu hồi quyền app khác và không sửa sâu các thiết lập hệ thống.
- VPN cục bộ không dùng đồng thời với một VPN khác. Chặn mạng có thể làm app mất đồng bộ, thông báo, định vị hoặc các chức năng trực tuyến.
- Không nên chặn app ngân hàng, nhắn tin, cuộc gọi, đồng hồ, bảo mật hay dịch vụ hệ thống nếu vẫn cần chúng hoạt động.
- App không cam kết tăng thời lượng pin theo một tỷ lệ cụ thể. Hiệu quả thực tế phụ thuộc ứng dụng, OriginOS và cách sử dụng.
- Hãy thử trên Vivo X200 Pro trước với một ứng dụng ít quan trọng; kiểm tra dữ liệu di động, Wi-Fi và thông báo sau khi bật/tắt firewall.

## Quyền cần cấp khi dùng

- Usage Access: chỉ cần nếu muốn xem thời gian sử dụng ứng dụng.
- VPN: Android sẽ hiện hộp thoại xác nhận riêng khi bật tường lửa.
- Notifications: dùng để hiển thị trạng thái dịch vụ VPN trên Android 13 trở lên.

## Biên dịch

- JDK 17
- Android SDK Platform 35 / Build Tools 35
- Gradle 8.9
- Mở thư mục dự án bằng Android Studio, hoặc chạy `gradle --no-daemon assembleDebug`.

APK debug được tạo tại `app/build/outputs/apk/debug/app-debug.apk`.

## Tái tạo mã nguồn trên GitHub

Các phần archive `nqv-vivo-guard-source-*.b64` trong thư mục `projects/` là bản lưu đóng gói để workflow tự ghép lại. Mở tab Actions và chọn **Build NQV Vivo Guard APK** để biên dịch. Artifact của workflow chứa APK debug và source archive.
