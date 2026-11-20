# NQV Share

Ứng dụng Android chia sẻ ảnh, video, PDF, âm thanh và tài liệu nguyên bản lên Cloudflare R2, tạo link chia sẻ riêng có hiệu lực 24 giờ và mã QR để quét trên máy tính/điện thoại nhận.

## Cách hoạt động

1. Ứng dụng gọi Worker công khai để lấy một URL PUT ký sẵn (có hiệu lực 15 phút); người cài app không cần nhập mật khẩu.
2. Android tải trực tiếp các byte của tệp lên R2. Không nén, không đổi kích thước, không chuyển mã.
3. Worker xác nhận kích thước đối tượng, sau đó cấp link ngẫu nhiên 128-bit hết hạn đúng 24 giờ.
4. Người nhận mở link hoặc quét QR. Worker chuyển hướng tải xuống tới URL R2 ký sẵn ngắn hạn.
5. Worker từ chối link ngay khi hết hạn; Cron chạy mỗi phút để xóa object và metadata đã hết hạn khỏi R2/D1.

**Hạn mức thử nghiệm cá nhân:** tổng dung lượng gửi tối đa 10 GiB mỗi ngày UTC, không giới hạn số lượt gửi. Hạn mức là một mức dùng chung cho toàn bộ ứng dụng và được làm mới lúc 00:00 UTC. Do Worker hiện dùng một lần PUT (chưa hỗ trợ multipart/resume), mỗi tệp riêng lẻ vẫn tối đa 5 GiB. Dữ liệu được gửi nguyên bản, không nén hay chuyển mã.

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
npx wrangler d1 execute nqv-share-db --remote --file=./migrations/0002_public_quota.sql
```

Tạo R2 API token có quyền Object Read & Write cho bucket `nqv-share-files`. Dùng Access Key ID và Secret Access Key của token làm secrets cho Worker. Không đưa các giá trị này vào app hoặc GitHub.

```powershell
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
```

`APP_PASSWORD` không còn cần cho thao tác gửi công khai trong ứng dụng. Nó chỉ là tùy chọn nếu chủ máy chủ sau này dùng endpoint xóa tệp quản trị.

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
2. Trong bản hiện tại, dán Worker URL vào ô máy chủ và bấm **KIỂM TRA KẾT NỐI**. Sau khi chủ dự án triển khai Worker, hãy tích hợp địa chỉ đó vào `WORKER_URL` trong `android/app/build.gradle.kts` rồi build APK phát hành. Khi đó mọi người cài app có thể dùng ngay mà không cần nhập địa chỉ máy chủ.
3. Bấm **CHỌN TỆP TỪ THIẾT BỊ** và chọn ảnh, video, PDF, âm thanh hoặc định dạng tệp khác.
4. Chờ tiến trình tải hoàn tất. App hiển thị link, mã QR và các nút sao chép, chia sẻ, mở link, lưu QR vào thư viện ảnh.
5. Người nhận không cần cài app hoặc nhập mật khẩu; chỉ cần quét QR hoặc mở link trong trình duyệt. Trang nhận hỗ trợ xem trước ảnh, video, âm thanh và PDF (tùy khả năng của trình duyệt), đồng thời có nút tải tệp gốc.

Lịch sử chỉ được lưu trên từng điện thoại. Bỏ một mục khỏi lịch sử không xóa tệp trên máy chủ.

Mỗi link hoạt động đúng 24 giờ tính từ lúc tải lên hoàn tất. Tại mốc hết hạn, Worker lập tức chặn xem trước/tải xuống. Cron chạy mỗi phút để xóa vật lý tệp và metadata hết hạn; thời điểm xóa thực tế là lần quét kế tiếp, thường trong khoảng một phút sau hạn (có thể trễ hơn nếu Cloudflare đang trì hoãn lịch chạy). Link là dạng bearer link: chỉ gửi cho người nhận dự kiến.

## Bảo mật

- R2 bucket không bật public access.
- R2 API credentials chỉ được lưu trong Worker Secrets. `APP_PASSWORD` không bắt buộc cho gửi tệp; chỉ thiết lập nếu chủ máy chủ cần khóa endpoint xóa tệp quản trị.
- App lưu Worker URL trong preferences; người dùng cuối không cần biết hoặc nhập R2 API credentials.
- Upload được cấp URL PUT riêng cho một object, hết hạn sau 15 phút.
- Link chia sẻ dùng token ngẫu nhiên 128-bit; download URL R2 chỉ tồn tại 2 phút.
- Tệp chia sẻ không cần tài khoản người nhận, nên người có link có thể truy cập trong 24 giờ.
- API gửi công khai có hạn mức dung lượng tổng cộng 10 GiB mỗi ngày UTC cho toàn bộ ứng dụng; không giới hạn số lượt gửi. Mỗi tệp vẫn tối đa 5 GiB do đang dùng một lần PUT.

## Cấu trúc

- `android/`: ứng dụng Android Kotlin.
- `cloudflare/`: Worker API, R2/D1 config, schema và CORS config.
- `.github/workflows/nqv-share-build.yml`: GitHub Actions build APK.

## Ghi chú kỹ thuật

R2 lưu nguyên byte được gửi lên. App không sử dụng encoder hoặc compressor. Ảnh/video được trình duyệt xem trước qua endpoint Worker; tải xuống sử dụng `Content-Disposition: attachment`. Worker dùng `aws4fetch` để tạo URL ký sẵn theo AWS Signature V4.
