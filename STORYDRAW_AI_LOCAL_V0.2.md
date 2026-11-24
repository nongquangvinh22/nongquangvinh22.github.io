# StoryDraw AI Local — kế hoạch và bản thử nghiệm 0.2.0

**Định nghĩa sản phẩm:** người dùng chỉ dán kịch bản do ChatGPT viết, nhấn TẠO VIDEO MP4, rồi nhận video hoàn chỉnh để xem và đăng. Không yêu cầu người dùng tự tìm/tải ảnh, ghép cảnh hay chỉnh timeline.

## Không phí API
Ứng dụng không gọi OpenAI API, API tạo ảnh, API TTS trả phí hoặc dịch vụ tạo video trả phí. Mô hình ảnh được tải một lần qua Wi‑Fi xuống điện thoại (xấp xỉ 1,15 GB). Sau khi model tải xong, bước sinh tranh chạy local. Vẫn tốn điện, dung lượng và dữ liệu tải model lần đầu.

## Thiết bị đích
vivo X200 Pro 16GB/512GB, Dimensity 9400, Android/OriginOS. APK chỉ build cho arm64-v8a.

## Tính năng được đưa vào nguồn 0.2.0
- Nhập kịch bản; nút sao chép prompt mẫu để nhờ ChatGPT soạn kịch bản.
- Chia kịch bản thành cảnh và trích prompt hình ảnh.
- Sinh ảnh Stable Diffusion 1.5 đã chuyển định dạng MNN/OpenCL ngay trên điện thoại.
- Tải model lần đầu qua Wi‑Fi; tải tiếp phần còn thiếu nếu bị gián đoạn.
- Đọc lời kể bằng Android TextToSpeech không yêu cầu mạng nếu người dùng đã cài voice tiếng Việt offline.
- Mô phỏng phác chì → đi nét → tô màu nước từ đường biên tranh.
- Tạo phụ đề SRT, âm nền ambient tự tạo bằng mã nguồn, video H.264/AAC MP4.
- Chọn YouTube ngang 16:9 hoặc video dọc 9:16.

## Các giới hạn phải thử trên máy thật
1. Chưa có benchmark MNN OpenCL trên chính vivo X200 Pro. Nếu driver OpenCL không tương thích, engine thử CPU fallback; fallback có thể rất chậm.
2. SD 1.5 không bảo đảm giữ khuôn mặt/nhân vật giống hệt qua mọi cảnh chỉ bằng prompt. Đây là bước cải thiện sau MVP.
3. Hiệu ứng “từng nét” là mô phỏng đường nét/contour đã trích từ tranh, không phải video ghi lại chính xác nét bút của họa sĩ.
4. Giọng nam tiếng Việt phụ thuộc voice offline cài trên Android. Ứng dụng ưu tiên tên voice có dấu hiệu nam và chỉnh pitch trầm; Android không cung cấp metadata giới tính đáng tin cậy, nên không thể bảo đảm tất cả máy có giọng nam tự nhiên. Không sử dụng voice online.
5. 10–20 phút video có thể cần hàng chục cảnh; thời gian tạo ảnh và render có thể dài, máy nóng và tốn pin. Cắm sạc, đóng app khác và thử trước bằng kịch bản 1–2 phút. Không giả định có thể hoàn tất nhanh.
6. Ứng dụng không viết kịch bản hoặc gọi ChatGPT trong app. ChatGPT được dùng ở bên ngoài để viết kịch bản/prompt rồi người dùng dán vào.
7. Trước khi dùng để kiếm tiền, đọc điều khoản mô hình: gói MNN-converted ghi Apache-2.0 nhưng mô hình nền Stable Diffusion 1.5 có CreativeML OpenRAIL-M với các điều khoản hạn chế. Cần tuân thủ license và chính sách YouTube.

## Cách dùng
1. Cài APK trên vivo X200 Pro.
2. Kết nối Wi‑Fi, bấm TẢI MÔ HÌNH AI 1,15 GB.
3. Vào cài đặt Android Text-to-Speech và cài voice tiếng Việt offline. Chọn giọng nam nếu thiết bị cung cấp.
4. Dùng prompt mẫu trong app để nhờ ChatGPT viết kịch bản, yêu cầu mỗi cảnh có [LỜI KỂ] và [PROMPT HÌNH ẢNH] (tiếng Anh có ích cho SD 1.5).
5. Dán kịch bản, chọn tỷ lệ 16:9 cho YouTube video dài, bấm TẠO VIDEO MP4.
6. Khi xong, video được lưu trong Movies/StoryDraw; phụ đề SRT trong Downloads/StoryDraw.

## Build
Workflow .github/workflows/build-storydraw-ai-local.yml:
- Tải source Android từ các chunk base64 trong projects/storydraw-ai-local-source-*.b64.
- Build Alibaba MNN từ commit đã ghim với Android arm64, Diffusion, LLM tokenizer và OpenCL.
- Lấy tokenizer CLIP ViT-L/14 từ repo đã ghim commit, build native libMNN.so, sau đó Gradle assemble debug APK.
- Đưa APK vào GitHub Actions artifact và GitHub Release prerelease.

Build thành công không đồng nghĩa runtime đã được kiểm chứng trên vivo. Chỉ gọi MVP dùng được sau khi cài APK, tải model, tạo thử ảnh và xuất một video ngắn trên máy thật.
