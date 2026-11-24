# StoryDraw AI Android · Local AI MVP 0.2.0

**Mục tiêu:** dán kịch bản một lần → chạm `TẠO VIDEO MP4` → ứng dụng tự sinh ảnh, đọc lời kể offline, mô phỏng phác thảo/đi nét/tô màu nước, tạo phụ đề và xuất MP4.

Ứng dụng không gọi OpenAI API, không gọi dịch vụ suy luận ảnh, không mua credit theo lần dùng. Mô hình ảnh được tải về điện thoại một lần qua Wi‑Fi (khoảng 1,15 GB); sau đó MNN thực hiện suy luận trên thiết bị.

## Luồng sử dụng

1. Cài APK trên vivo X200 Pro.
2. Kết nối Wi‑Fi và bấm **TẢI MÔ HÌNH AI 1,15 GB**. Bộ tải hỗ trợ tiếp tục tệp `.part` nếu tải bị gián đoạn.
3. Cài/tải một voice tiếng Việt **offline** trong cài đặt Text-to-Speech Android. Ứng dụng chỉ chọn voice tiếng Việt không yêu cầu mạng; ưu tiên tên có dấu hiệu `male`/`nam`, nếu không sẽ hạ pitch của voice offline sẵn có. Android TTS không cung cấp metadata giới tính đáng tin cậy, do đó không thể bảo đảm mọi máy đều có giọng nam tự nhiên.
4. Dùng nút **SAO CHÉP PROMPT MẪU ĐỂ NHỜ CHATGPT VIẾT KỊCH BẢN**, thay chủ đề rồi nhờ ChatGPT viết kịch bản 10–20 phút kèm prompt ảnh theo cấu trúc bên dưới.
5. Dán kết quả vào ứng dụng, chọn video ngang 16:9 cho YouTube dài (mặc định) hoặc dọc 9:16, rồi bấm **TẠO VIDEO MP4 – MỘT NÚT**.
6. Khi hoàn tất, MP4 được lưu trong `Movies/StoryDraw`; file phụ đề SRT trong `Download/StoryDraw`.

## Định dạng kịch bản khuyến nghị

```text
[TIÊU ĐỀ] Trận Bạch Đằng năm 1288

[NHÂN VẬT]
Trần Hưng Đạo: vị tướng Việt Nam lớn tuổi, râu dài bạc, áo giáp lam sẫm, khăn/giáp thời Trần; giữ đúng tạo hình này ở mọi cảnh.

[CẢNH 1]
[LỜI KỂ]: Năm 1288, quân Nguyên tiến vào Đại Việt...
[PROMPT HÌNH ẢNH]: Watercolor historical illustration of a 13th-century Vietnamese river fortress...

[CẢNH 2]
[LỜI KỂ]: Trần Hưng Đạo quan sát dòng sông...
[PROMPT HÌNH ẢNH]: The same Tran Hung Dao character, same face, same dark blue Tran dynasty armor...
```

`PROMPT HÌNH ẢNH` nên viết bằng tiếng Anh vì Stable Diffusion 1.5 thiên về prompt tiếng Anh. Nếu dán văn bản thuần không có prompt ảnh, app sẽ chia đoạn và tạo prompt cơ bản từ lời kể; chất lượng tạo hình có thể thấp hơn.

## Engine ảnh và model

- Runtime: [Alibaba MNN](https://github.com/alibaba/MNN), Android arm64, OpenCL ưu tiên và CPU fallback. Build ghim MNN commit `a5c3dd91fe4509aea0d27cec80dc44f7f2d636d7`.
- Diffusion model: [taobao-mnn/stable-diffusion-v1-5-mnn-opencl](https://huggingface.co/taobao-mnn/stable-diffusion-v1-5-mnn-opencl), 8-bit MNN, khoảng 1.15 GB. Model repo hiển thị giấy phép Apache-2.0; model nền Stable Diffusion 1.5 có điều khoản CreativeML OpenRAIL-M cần đọc và tuân thủ.
- CLIP tokenizer: `tokenizer.mtok` được đặt vào assets ở bước build từ bản đã ghim commit của `PickleHik3/termux-launcher` (xem `THIRD_PARTY_NOTICES.md`).
- Tạo ảnh mặc định: 512×512, 10 bước; video được dựng ở 1920×1080 hoặc 1080×1920.

## Hiệu ứng “vẽ từng nét”

App trích đường biên từ ảnh AI rồi phát lần lượt các đường phác chì, đường viền mực và các vệt cọ màu nước. Đây là **mô phỏng đồ họa của thứ tự nét**, không phải video ghi lại thao tác của họa sĩ.

## Tính nhất quán nhân vật

Ứng dụng lặp lại character bible trong mọi prompt để tăng tính nhất quán. Stable Diffusion 1.5 text-to-image thuần không khóa danh tính nhân vật tuyệt đối; mặt, trang phục và chi tiết có thể lệch giữa cảnh.

## Build APK

Build được cấu hình trong GitHub Actions workflow `.github/workflows/build-storydraw-ai-local.yml`.

- Runner Ubuntu cài JDK 17, Android SDK/NDK, clone MNN và build `libMNN.so` với Diffusion + LLM tokenizer + OpenCL.
- Workflow lấy tokenizer MNN, đóng gói native library vào APK arm64 và xuất debug APK.
- Artifact Actions có thời hạn 30 ngày; GitHub Release prerelease giữ APK trong repo.

## Giới hạn và trung thực về hiệu năng

- Chưa có benchmark thực tế trên vivo X200 Pro trong quá trình build. MNN OpenCL có thể phụ thuộc driver; app thử OpenCL trước, rồi fallback CPU nếu OpenCL không khởi tạo hoặc không tạo được file ảnh hợp lệ.
- Lần đầu cần khoảng 1.15 GB dữ liệu tải qua Wi‑Fi và thêm dung lượng tạm để lưu model/ảnh/video.
- Tạo hàng chục ảnh AI và dựng video 10–20 phút có thể mất nhiều thời gian, làm điện thoại nóng và tiêu hao pin. Nên cắm sạc, để app mở và thử video ngắn trước.
- Video được render 24 fps bằng Android MediaCodec, vì vậy riêng giai đoạn dựng có thể gần bằng độ dài video đầu ra.
- Giọng nam thật phụ thuộc voice offline đã cài trên điện thoại; không thể bảo đảm mọi máy đều có giọng nam tự nhiên.
- Không có LLM local để viết lại hoặc kiểm chứng lịch sử bên trong app. ChatGPT dùng ở bên ngoài để soạn kịch bản/prompt; StoryDraw không gọi ChatGPT API.
- 0 đồng ở đây nghĩa là không phí API/credit cho mỗi lần tạo. Vẫn có chi phí điện, dữ liệu Internet lần đầu và hao mòn thiết bị.

## License notes

- MNN: Apache-2.0.
- MNN Stable Diffusion package trên Hugging Face được ghi Apache-2.0; mô hình Stable Diffusion v1.5 gốc được công bố theo CreativeML OpenRAIL-M. Hãy xem giấy phép và các điều khoản hạn chế sử dụng trước khi xuất bản/kiếm tiền.
- Ứng dụng tạo một ambient chord bed bằng code, không tải hoặc sao chép bản nhạc thương mại.
