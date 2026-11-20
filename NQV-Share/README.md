# NQV Share

Ứng dụng Android chia sẻ ảnh, video, PDF, âm thanh và tài liệu nguyên bản lên Cloudflare R2, tạo link chia sẻ riêng có hiệu lực 24 giờ và mã QR để quét trên máy tính/điện thoại nhận.

## Cách hoạt động

1. Android app hỏi Worker lấy một URL PUT ký sẵn (có hiệu lực 15 phút).
2. Android tải trực tiếp các byte của tệp lên R2. Không nén, không đổi kích thước, không chuyển mã.
3. Worker xác nhận kích thước đối tượng, sau đó cấp link ngẫu nhiên 128-bit hết hạn đúng 24 giờ.
4. Người nhận mở link hoặc quét QR. Worker chuyển hướng tải xuống tới URL R2 ký sẵn ngắn hạn.
5. Worker từ chối link ngay khi hết hạn; tác vụ Cron dọn object và metadata trong R2/D1 mỗi giờ.

**Giới hạn hiện tại:** một tệp tối đa 5 GB (PUT đơn, chưa có multipart/resume). Dùng mạng ổn định khi tải tệp lớn. Dữ liệu được gửi nguyên bản, không nén hay chuyển mã.

## Chức năng trong ứng dụng Android

- Gửi ảnh, video, PDF, âm thanh và các định dạng tài liệu/tệp khác.
- Tạo link riêng có hiệu lực 24 giờ và mã QR sau khi tải lên hoàn tất.
- Sao chép, chia sẻ hoặc mở link ngay trong ứng dụng.
- Nhận link từ ứng dụng khác qua bảng Chia sẻ Android, hoặc dán link để mở trên trình duyệt.
- Lịch sử lưu cục bộ tối đa 20 lượt chia sẻ, có thao tác mở, sao chép và xóa khỏi lịch sử.
- Kiểm tra trạng thái kết nối với Cloudflare Worker.
- Dòng bản quyền Nông Quang Vinh hiển thị ở đầu và cuối giao diện.

Lưu ý: lịch sử chỉ được lưu trên điện thoại tạo lượt chia sẻ. Nút bỏ mục trong lịch sử chỉ xóa mục khỏi ứng dụng, không xóa tệp đã tải lên máy chủ.

## 1. Triển khai Cloudflare Worker

Mở PowerShell hoặc CMD, vào thư mục `cloudflare`:

```powershell
cd cloudflare
npm install
npx wrangler login
npx wrangler r2 bucket create nqv-share-files
npx wrangler d1 create nqv-share-db
```

Lệnh tạo D1 trả về `database_id`. Mở `wrangler.toml`, thay:

- `REPLACE_WITH_D1_DATABASE_ID` bằng ID D1 vừa tạo.
- `REPLACE_WITH_CLOUDFLARE_ACCOUNT_ID` bằng Account ID trong Cloudflare Dashboard.

Sau đó khởi tạo bảng:

```powershell
npx wrangler d1 execute nqv-share-db --remote --file=./migrations/0001_init.sql
```

Tạo R2 API token có quyền Object Read & Write cho bucket `nqv-share-files`. Dùng Access Key ID và Secret Access Key của token làm secrets cho Worker. Không đưa các giá trị này vào app hoặc GitHub.

```powershell
npx wrangler secret put APP_PASSWORD
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
```

Khi lệnh hỏi giá trị, nhập một mật khẩu dài, riêng tư cho `APP_PASSWORD`, rồi nhập hai khóa R2 tương ứng.

Cấu hình CORS (cập nhật `AllowedOrigins` trong `cors.json` thành địa chỉ Worker thực tế nếu sau này dùng web upload):

```powershell
npx wrangler r2 bucket cors set nqv-share-files --file cors.json
```

Triển khai:

```powershell
npx wrangler deploy
```

Ghi lại địa chỉ Worker, ví dụ `https://nqv-share.<ten-tai-khoan>.workers.dev`. Kiểm tra bằng cách mở địa chỉ đó cộng `/health`; kết quả phải có `"ok":true`.

## 2. Build APK bằng GitHub Actions (không cần máy mạnh)

Bản dự án này được chuẩn bị để GitHub Actions biên dịch APK trên máy chủ GitHub. Không cần cài Android Studio hoặc Gradle trên máy cá nhân.

Sau khi mã nguồn được đưa lên repository và workflow chạy thành công:

1. Mở repository trên GitHub → tab **Actions**.
2. Chọn workflow **NQV Share Android APK**.
3. Mở lần chạy mới nhất có dấu ✓ xanh.
4. Tại phần **Artifacts**, tải `NQV-Share-debug-apk.zip` và giải nén.
5. Cài `app-debug.apk` lên điện thoại Android.

Workflow có thể chạy tự động khi mã nguồn được cập nhật hoặc chạy thủ công bằng **Run workflow**. APK debug dùng để thử nghiệm, chưa phải bản phát hành ký số.

Nếu tự build bằng Android Studio, mở thư mục `android`, cài Android SDK Platform 35 và chạy `assembleDebug`. APK nằm tại `android/app/build/outputs/apk/debug/app-debug.apk`.

## 3. Sử dụng

1. Mở NQV Share trên Android.
2. Dán Worker URL vào ô địa chỉ máy chủ.
3. Nhập đúng `APP_PASSWORD` đã lưu trên Worker.
4. Bấm **CHỌN TỆP TỪ THIẾT BỊ** và chọn ảnh, video, PDF, âm thanh hoặc định dạng tệp khác.
5. Chờ tiến trình tải hoàn tất. App sẽ hiện link, mã QR, nút sao chép và chia sẻ.
6. Quét QR bằng máy nhận hoặc mở link trên máy tính. Trang nhận hỗ trợ xem trước ảnh, video, âm thanh và PDF (tùy khả năng của trình duyệt), cùng nút tải tệp gốc.

Mỗi link hoạt động trong 24 giờ tính từ lúc tải lên hoàn tất. Hết thời gian, link trả về trạng thái hết hạn; Cron dọn tệp đã hết hạn mỗi giờ. Link là dạng bearer link: chỉ gửi cho người nhận dự kiến.

## Bảo mật

- R2 bucket không bật public access.
- R2 API credentials và `APP_PASSWORD` chỉ lưu trong Worker Secrets.
- App chỉ giữ Worker URL trong preferences; mật khẩu không được lưu lâu dài.
- Upload được cấp URL PUT riêng cho một object, hết hạn sau 15 phút.
- Link chia sẻ dùng token ngẫu nhiên 128-bit; download URL R2 chỉ tồn tại 2 phút.
- Tệp chia sẻ không cần tài khoản người nhận, nên người có link có thể truy cập trong 24 giờ.

## Cấu trúc

- `android/`: ứng dụng Android Kotlin.
- `cloudflare/`: Worker API, R2/D1 config, schema và CORS config.
- `.github/workflows/nqv-share-build.yml`: GitHub Actions build APK.

## Ghi chú kỹ thuật

R2 lưu nguyên byte được gửi lên. App không sử dụng encoder hoặc compressor. Ảnh/video được trình duyệt xem trước qua endpoint Worker; tải xuống sử dụng `Content-Disposition: attachment`. Worker dùng `aws4fetch` để tạo URL ký sẵn theo AWS Signature V4.
