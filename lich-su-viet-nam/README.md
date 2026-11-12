# Lịch Sử Việt Nam – Thử thách ABCD

Website trắc nghiệm tĩnh, chạy trên Windows hoặc GitHub Pages. Không cần cài thư viện hay cấu hình máy chủ để mở bản demo.

## Tính năng

- Ngân hàng **3.000 lượt câu hỏi ABCD** về lịch sử Việt Nam.
- Chọn chủ đề, độ khó và thời gian trả lời (10/15/20/30 giây).
- Chấm đáp án A/B/C/D, tính điểm và bảng xếp hạng.
- Mô phỏng bình luận người chơi và phản hồi trên màn hình.
- Chạy cục bộ, không cần tài khoản hoặc API key.

## Nói rõ về con số 3.000

Ngân hàng được tạo từ **125 dữ kiện/câu hỏi nền**: 100 câu lịch sử trong bộ dữ liệu lịch sử của dự án tham chiếu và 25 mốc lịch sử hiện đại được bổ sung. Mỗi dữ kiện có 24 biến thể (cách dẫn câu hỏi và thứ tự đáp án), tạo thành đúng 3.000 lượt câu hỏi. Vì vậy, các lượt khác nhau có thể kiểm tra lại cùng một kiến thức; đây không phải 3.000 sự kiện lịch sử độc lập.

## Chạy trên Windows

**Cách 1 – Mở trực tiếp**

1. Tải thư mục này về máy (GitHub → Code → Download ZIP).
2. Giải nén.
3. Mở `index.html` bằng Chrome hoặc Edge.

**Cách 2 – Dùng máy chủ cục bộ (khuyên dùng khi thử nghiệm)**

Mở PowerShell tại thư mục dự án và chạy:

```powershell
py -m http.server 8000
```

Mở trình duyệt tại `http://localhost:8000`. Dừng máy chủ bằng `Ctrl + C`.

## Cách thử

1. Chọn chủ đề và độ khó, sau đó nhấn **Bắt đầu**.
2. Chọn đáp án trên màn hình hoặc nhập tên người chơi và bình luận A/B/C/D ở phần **Mô phỏng bình luận người chơi**.
3. Mỗi người chỉ được tính điểm một lần trong một câu; trả lời đúng được 10 điểm.
4. Nhấn **Hiện đáp án** hoặc **Câu tiếp theo** để chuyển lượt.

> Phần bình luận chỉ mô phỏng trong trình duyệt. Ứng dụng hiện không kết nối, không đọc và không gửi bình luận tới TikTok LIVE.

## Đưa lên GitHub Pages

Kho đang chứa dự án này là `nongquangvinh22/nongquangvinh22.github.io`, thư mục riêng là `/lich-su-viet-nam/`. Nếu GitHub Pages đã bật cho kho, trang có thể được mở tại:

`https://nongquangvinh22.github.io/lich-su-viet-nam/`

Nếu chưa bật, vào **Settings → Pages** của kho và cấu hình nguồn xuất bản theo hướng dẫn GitHub Pages.

## Nguồn tham khảo lịch sử

- Bộ câu hỏi lịch sử tham chiếu: [workaipvlinh-byte/lop-hoc-chu – 24-lich-su-su.txt](https://github.com/workaipvlinh-byte/lop-hoc-chu/blob/master/src/game/cau-hoi/24-lich-su-su.txt). Phần dữ liệu này được sử dụng theo giấy phép MIT; xem tệp `LICENSE`.
- [Bộ Ngoại giao Việt Nam – Lịch sử](https://mofa.gov.vn/lich-su1).
- [Cổng thông tin Chính phủ – Giai đoạn 1945–1954](https://chinhphu.vn/giai-doan-1945-1954-khang-chien-va-kien-quoc).
- [Columbia University – Vietnam timeline](https://afe.easia.columbia.edu/timelines/vietnam_timeline.htm).
- [U.S. Department of State – Vietnam](https://history.state.gov/countries/vietnam).

## Giấy phép và ghi công

Phần mã giao diện trong thư mục này được viết mới. Một phần dữ liệu câu hỏi lịch sử được chuyển thể từ bộ câu hỏi của `workaipvlinh-byte/lop-hoc-chu`, vốn được công bố theo giấy phép MIT. Tệp `LICENSE` giữ nguyên thông báo bản quyền của dự án nguồn cùng thông báo cho phần mới.
