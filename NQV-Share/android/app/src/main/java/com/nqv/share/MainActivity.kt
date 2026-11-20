package com.nqv.share

import android.content.ClipData
import android.content.ClipboardManager
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.provider.OpenableColumns
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.setPadding
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okio.BufferedSink
import org.json.JSONArray
import org.json.JSONObject
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

private data class ShareRecord(
    val name: String,
    val url: String,
    val size: Long,
    val createdAt: Long,
    val expiresAt: Long
)

class MainActivity : ComponentActivity() {
    private val http = OkHttpClient.Builder()
        .connectTimeout(25, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.SECONDS)
        .writeTimeout(0, TimeUnit.SECONDS)
        .callTimeout(0, TimeUnit.SECONDS)
        .build()
    private val executor = Executors.newSingleThreadExecutor()
    private val history = mutableListOf<ShareRecord>()

    private lateinit var serverInput: EditText
    private lateinit var chooseButton: Button
    private lateinit var progress: ProgressBar
    private lateinit var statusText: TextView
    private lateinit var selectedText: TextView
    private lateinit var resultBox: LinearLayout
    private lateinit var linkText: TextView
    private lateinit var qrImage: ImageView
    private var currentQrBitmap: Bitmap? = null
    private lateinit var historyList: LinearLayout
    private lateinit var receiveInput: EditText
    private var currentShareUrl: String? = null

    private val filePicker = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        uri?.let { startUpload(it) }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        loadHistory()
        buildUi()
        handleIncomingShare(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIncomingShare(intent)
    }

    private fun buildUi() {
        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(14), dp(20), dp(30))
        }
        val scroll = ScrollView(this).apply {
            isFillViewport = true
            background = GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                intArrayOf(Color.rgb(224, 239, 255), Color.rgb(247, 240, 255), Color.rgb(225, 250, 246))
            )
            addView(content)
        }
        ViewCompat.setOnApplyWindowInsetsListener(scroll) { _, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            content.setPadding(dp(20) + bars.left, dp(14) + bars.top, dp(20) + bars.right, dp(30) + bars.bottom)
            insets
        }

        // Branded header: the copyright notice is intentionally visible at the top.
        val header = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20))
            background = GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                intArrayOf(Color.rgb(20, 73, 170), Color.rgb(37, 99, 235), Color.rgb(95, 83, 220))
            ).apply { cornerRadius = dp(26).toFloat() }
            elevation = dp(5).toFloat()
        }
        header.addView(text("BẢN QUYỀN CỦA NÔNG QUANG VINH", 11f, Color.rgb(220, 232, 255), true).apply {
            letterSpacing = 0.07f
        })
        val logoRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        logoRow.addView(ImageView(this).apply {
            setImageResource(R.drawable.nqv_logo)
            scaleType = ImageView.ScaleType.FIT_CENTER
            contentDescription = "Logo NQV Share"
        }, LinearLayout.LayoutParams(dp(76), dp(76)).apply { marginEnd = dp(12) })
        logoRow.addView(text("NQV SHARE", 29f, Color.WHITE, true).apply {
            letterSpacing = 0.16f
        })
        header.addView(logoRow)
        header.addView(text("Chia sẻ tệp gốc theo cách thật đơn giản", 14f, Color.rgb(235, 242, 255), false))
        val featureLine = text("ẢNH  •  VIDEO  •  PDF  •  TÀI LIỆU  •  ÂM THANH", 10f, Color.WHITE, true).apply {
            setPadding(dp(10), dp(8), dp(10), dp(8))
            background = rounded(Color.rgb(255, 255, 255), 30)
            setTextColor(Color.rgb(35, 72, 145))
            gravity = Gravity.CENTER
        }
        header.addView(featureLine, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
            topMargin = dp(14)
        })
        content.addView(header)

        content.addView(text("Không nén tệp • Link 24 giờ • Mã QR tức thì", 12f, Color.rgb(100, 116, 139), true).apply {
            gravity = Gravity.CENTER
            setPadding(0, dp(13), 0, dp(16))
        })

        // The Worker URL is bundled into public builds after the owner deploys Cloudflare.
        // People who receive the APK do not need an upload password.
        val settingsCard = card()
        settingsCard.addView(sectionTitle("Máy chủ chia sẻ"))
        settingsCard.addView(text("Địa chỉ máy chủ NQV Share", 13f, Color.rgb(71, 85, 105), true).apply {
            setPadding(0, dp(12), 0, dp(5))
        })
        val savedServer = getPreferences(Context.MODE_PRIVATE).getString("server", "").orEmpty()
        serverInput = inputField("https://nqv-share.ten-tai-khoan.workers.dev").apply {
            setText(savedServer.ifBlank { BuildConfig.WORKER_URL })
            isEnabled = BuildConfig.WORKER_URL.isBlank() || savedServer.isNotBlank()
        }
        settingsCard.addView(serverInput, matchWidth())
        settingsCard.addView(text(
            if (BuildConfig.WORKER_URL.isNotBlank()) "Máy chủ đã được cài sẵn. Người nhận app không cần nhập mật khẩu."
            else "Sau khi Cloudflare được kết nối, địa chỉ máy chủ sẽ được tích hợp sẵn vào APK để mọi người dùng ngay.",
            12f, Color.rgb(100, 116, 139), false
        ).apply { setPadding(0, dp(8), 0, dp(2)) })
        settingsCard.addView(button("KIỂM TRA KẾT NỐI", Color.rgb(15, 118, 110)) { checkConnection() }, matchWidth().apply {
            topMargin = dp(10)
        })
        content.addView(settingsCard)

        // Upload section.
        val sendCard = card()
        sendCard.addView(sectionTitle("Gửi tệp"))
        sendCard.addView(text(
            "Chọn ảnh, video, PDF, nhạc hoặc tài liệu. Ứng dụng giữ nguyên dữ liệu gốc, không nén và không đổi độ phân giải.",
            13f, Color.rgb(100, 116, 139), false
        ).apply { setPadding(0, dp(8), 0, dp(13)) })
        chooseButton = button("＋  CHỌN TỆP TỪ THIẾT BỊ", Color.rgb(37, 99, 235)) { openPicker() }
        sendCard.addView(chooseButton, matchWidth())
        selectedText = text("Chưa chọn tệp", 12f, Color.rgb(100, 116, 139), false).apply {
            setPadding(0, dp(12), 0, dp(5))
        }
        sendCard.addView(selectedText)
        progress = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            progress = 0
            visibility = View.GONE
        }
        sendCard.addView(progress, matchWidth().apply { height = dp(7) })
        statusText = text("Mỗi link chia sẻ có hiệu lực 24 giờ sau khi tải lên hoàn tất.", 12f, Color.rgb(100, 116, 139), false).apply {
            setPadding(0, dp(10), 0, 0)
        }
        sendCard.addView(statusText)
        content.addView(sendCard)

        // Result card with QR and share actions.
        resultBox = card().apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            visibility = View.GONE
        }
        resultBox.addView(sectionTitle("Link và mã QR của bạn"))
        resultBox.addView(text("Quét mã QR hoặc gửi đường link cho thiết bị nhận.", 12f, Color.rgb(100, 116, 139), false).apply {
            setPadding(0, dp(5), 0, dp(8))
        })
        linkText = text("", 13f, Color.rgb(37, 99, 235), true).apply {
            gravity = Gravity.CENTER
            setPadding(dp(8), dp(12), dp(8), dp(12))
            background = rounded(Color.rgb(239, 245, 255), 14)
        }
        resultBox.addView(linkText, matchWidth())
        qrImage = ImageView(this).apply {
            adjustViewBounds = true
            scaleType = ImageView.ScaleType.FIT_CENTER
            setBackground(rounded(Color.WHITE, 18))
            setPadding(dp(9))
        }
        resultBox.addView(qrImage, LinearLayout.LayoutParams(dp(220), dp(220)).apply {
            gravity = Gravity.CENTER
            topMargin = dp(14)
            bottomMargin = dp(14)
        })
        val resultActions = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }
        resultActions.addView(button("SAO CHÉP", Color.rgb(37, 99, 235)) { copyLink() },
            LinearLayout.LayoutParams(0, dp(46), 1f).apply { marginEnd = dp(5) })
        resultActions.addView(button("CHIA SẺ", Color.rgb(15, 118, 110)) { shareLink() },
            LinearLayout.LayoutParams(0, dp(46), 1f).apply { marginStart = dp(5); marginEnd = dp(5) })
        resultActions.addView(button("MỞ LINK", Color.rgb(71, 85, 105)) { openCurrentLink() },
            LinearLayout.LayoutParams(0, dp(46), 1f).apply { marginStart = dp(5) })
        resultBox.addView(resultActions)
        resultBox.addView(button("LƯU MÃ QR VÀO THƯ VIỆN ẢNH", Color.rgb(111, 55, 190)) { saveQrToGallery() }, matchWidth().apply {
            topMargin = dp(10)
        })
        content.addView(resultBox)

        // Receive section: supports pasted links and Android share-sheet input.
        val receiveCard = card()
        receiveCard.addView(sectionTitle("Nhận tệp"))
        receiveCard.addView(text("Dán link NQV Share bạn nhận được, hoặc dùng nút Dán để lấy link từ bộ nhớ tạm.", 13f,
            Color.rgb(100, 116, 139), false).apply { setPadding(0, dp(7), 0, dp(10)) })
        receiveInput = inputField("https://.../s/").apply {
            inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_URI
        }
        receiveCard.addView(receiveInput, matchWidth())
        val receiveActions = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }
        receiveActions.addView(button("DÁN LINK", Color.rgb(71, 85, 105)) { pasteLink() },
            LinearLayout.LayoutParams(0, dp(47), 1f).apply { marginEnd = dp(6); topMargin = dp(10) })
        receiveActions.addView(button("MỞ TỆP", Color.rgb(15, 118, 110)) { openReceivedLink() },
            LinearLayout.LayoutParams(0, dp(47), 1f).apply { marginStart = dp(6); topMargin = dp(10) })
        receiveCard.addView(receiveActions)
        content.addView(receiveCard)

        // Local history survives closing and reopening the app.
        val historyCard = card()
        val historyHeader = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        historyHeader.addView(sectionTitle("Chia sẻ gần đây"), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        historyHeader.addView(text("Tối đa 20 mục", 11f, Color.rgb(148, 163, 184), false))
        historyCard.addView(historyHeader)
        historyCard.addView(text("Lịch sử được lưu trên điện thoại này.", 12f, Color.rgb(100, 116, 139), false).apply {
            setPadding(0, dp(5), 0, dp(10))
        })
        historyList = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        historyCard.addView(historyList)
        content.addView(historyCard)
        redrawHistory()

        // Footer: the same copyright notice is visible at the bottom.
        content.addView(text("NQV SHARE", 13f, Color.rgb(37, 99, 235), true).apply {
            gravity = Gravity.CENTER
            letterSpacing = 0.18f
            setPadding(0, dp(12), 0, dp(4))
        })
        content.addView(text("Bản quyền của Nông Quang Vinh", 12f, Color.rgb(100, 116, 139), true).apply {
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(8))
        })

        setContentView(scroll)
    }

    private fun openPicker() {
        val base = serverInput.text.toString().trim().trimEnd('/')
        if (!base.startsWith("https://")) {
            toast("Máy chủ chưa được cấu hình. Hãy nhập địa chỉ Worker HTTPS.")
            return
        }
        getPreferences(Context.MODE_PRIVATE).edit().putString("server", base).apply()
        filePicker.launch(arrayOf("*/*"))
    }

    private fun checkConnection() {
        val base = serverInput.text.toString().trim().trimEnd('/')
        if (!base.startsWith("https://")) {
            toast("Hãy nhập Worker URL hợp lệ")
            return
        }
        getPreferences(Context.MODE_PRIVATE).edit().putString("server", base).apply()
        statusText.text = "Đang kiểm tra máy chủ..."
        executor.execute {
            try {
                val request = Request.Builder().url("$base/health").get().build()
                val result = http.newCall(request).execute().use { response ->
                    val body = response.body?.string().orEmpty()
                    if (!response.isSuccessful) throw IOException("Máy chủ phản hồi HTTP ${response.code}")
                    JSONObject(body).optBoolean("ok", false)
                }
                runOnUiThread {
                    statusText.text = if (result) "Đã kết nối thành công với NQV Share Worker." else "Máy chủ đã phản hồi nhưng chưa xác nhận dịch vụ."
                    toast(statusText.text.toString())
                }
            } catch (e: Exception) {
                runOnUiThread {
                    statusText.text = "Chưa kết nối được: ${e.message ?: "Lỗi mạng"}"
                    toast(statusText.text.toString())
                }
            }
        }
    }

    private fun startUpload(uri: Uri) {
        val server = serverInput.text.toString().trim().trimEnd('/')
        if (!server.startsWith("https://")) {
            toast("Máy chủ chưa được kết nối. Hãy kiểm tra địa chỉ Worker.")
            return
        }
        val meta = queryFile(uri)
        val name = meta.first
        val size = meta.second
        val mime = contentResolver.getType(uri) ?: guessMime(name)

        if (size <= 0L) {
            toast("Không đọc được dung lượng tệp này. Hãy chọn lại tệp.")
            return
        }
        if (size > 5L * 1024L * 1024L * 1024L) {
            toast("Phiên bản hiện tại hỗ trợ tối đa 5 GB mỗi tệp")
            return
        }

        currentShareUrl = null
        resultBox.visibility = View.GONE
        chooseButton.isEnabled = false
        progress.visibility = View.VISIBLE
        progress.progress = 0
        selectedText.text = "$name  •  ${formatBytes(size)}"
        statusText.text = "Đang chuẩn bị tải tệp..."

        executor.execute {
            try {
                val initBody = JSONObject()
                    .put("fileName", name)
                    .put("contentType", mime)
                    .put("sizeBytes", size)
                    .toString().toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
                val initRequest = Request.Builder()
                    .url("$server/api/upload-url")
                    .post(initBody)
                    .build()
                val initJson = http.newCall(initRequest).execute().use { response ->
                    val body = response.body?.string().orEmpty()
                    if (!response.isSuccessful) throw IOException(apiError(body, "Không tạo được link tải lên"))
                    JSONObject(body)
                }
                val uploadId = initJson.getString("uploadId")
                val uploadUrl = initJson.getString("uploadUrl")

                runOnUiThread { statusText.text = "Đang tải tệp lên Cloudflare R2..." }
                val requestBody = object : RequestBody() {
                    override fun contentType() = mime.toMediaTypeOrNull()
                    override fun contentLength() = size
                    override fun writeTo(sink: BufferedSink) {
                        val input = contentResolver.openInputStream(uri) ?: throw IOException("Không mở được tệp")
                        input.use { stream ->
                            val buffer = ByteArray(256 * 1024)
                            var sent = 0L
                            var lastPercent = -1
                            while (true) {
                                val count = stream.read(buffer)
                                if (count < 0) break
                                sink.write(buffer, 0, count)
                                sent += count
                                val percent = ((sent * 100L) / size).toInt().coerceIn(0, 100)
                                if (percent != lastPercent) {
                                    lastPercent = percent
                                    runOnUiThread { progress.progress = percent }
                                }
                            }
                        }
                    }
                }
                val putRequest = Request.Builder()
                    .url(uploadUrl)
                    .put(requestBody)
                    .header("Content-Type", mime)
                    .build()
                http.newCall(putRequest).execute().use { response ->
                    if (!response.isSuccessful) throw IOException("R2 từ chối tải lên (${response.code}). Hãy thử lại.")
                }

                runOnUiThread { statusText.text = "Đã tải xong. Đang tạo link chia sẻ 24 giờ..." }
                val completeBody = JSONObject().put("uploadId", uploadId).toString()
                    .toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
                val completeRequest = Request.Builder()
                    .url("$server/api/complete")
                    .post(completeBody)
                    .build()
                val completed = http.newCall(completeRequest).execute().use { response ->
                    val body = response.body?.string().orEmpty()
                    if (!response.isSuccessful) throw IOException(apiError(body, "Không hoàn tất được lượt tải lên"))
                    JSONObject(body)
                }
                val shareUrl = completed.getString("shareUrl")
                val expiry = try {
                    java.time.Instant.parse(completed.getString("expiresAt")).toEpochMilli()
                } catch (_: Exception) {
                    System.currentTimeMillis() + 24L * 60L * 60L * 1000L
                }
                val record = ShareRecord(name, shareUrl, size, System.currentTimeMillis(), expiry)
                runOnUiThread {
                    addHistory(record)
                    showResult(shareUrl)
                }
            } catch (e: Exception) {
                runOnUiThread {
                    statusText.text = "Lỗi: ${e.message ?: "Không xác định"}"
                    toast(statusText.text.toString())
                }
            } finally {
                runOnUiThread {
                    chooseButton.isEnabled = true
                    progress.visibility = View.GONE
                }
            }
        }
    }

    private fun showResult(url: String) {
        currentShareUrl = url
        linkText.text = url
        try {
            val matrix = QRCodeWriter().encode(url, BarcodeFormat.QR_CODE, 560, 560)
            val bitmap = Bitmap.createBitmap(560, 560, Bitmap.Config.RGB_565)
            for (x in 0 until 560) for (y in 0 until 560) {
                bitmap.setPixel(x, y, if (matrix[x, y]) Color.BLACK else Color.WHITE)
            }
            currentQrBitmap = bitmap
            qrImage.setImageBitmap(bitmap)
        } catch (_: Exception) {
            toast("Không tạo được mã QR")
        }
        resultBox.visibility = View.VISIBLE
        statusText.text = "Hoàn tất! Link có hiệu lực 24 giờ kể từ lúc tải lên xong."
        progress.progress = 100
    }

    private fun saveQrToGallery() {
        val bitmap = currentQrBitmap
        if (bitmap == null) {
            toast("Chưa có mã QR để lưu")
            return
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            toast("Tính năng lưu QR tự động cần Android 10 trở lên")
            return
        }
        var savedUri: Uri? = null
        try {
            val values = ContentValues().apply {
                put(MediaStore.Images.Media.DISPLAY_NAME, "NQV-Share-QR-${System.currentTimeMillis()}.png")
                put(MediaStore.Images.Media.MIME_TYPE, "image/png")
                put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/NQV Share")
                put(MediaStore.Images.Media.IS_PENDING, 1)
            }
            val uri = contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
                ?: throw IOException("Không tạo được tệp ảnh QR")
            savedUri = uri
            val output = contentResolver.openOutputStream(uri)
                ?: throw IOException("Không mở được thư mục ảnh")
            output.use {
                if (!bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)) {
                    throw IOException("Không lưu được ảnh QR")
                }
            }
            val complete = ContentValues().apply { put(MediaStore.Images.Media.IS_PENDING, 0) }
            contentResolver.update(uri, complete, null, null)
            toast("Đã lưu mã QR vào Ảnh > Pictures/NQV Share")
        } catch (e: Exception) {
            savedUri?.let { contentResolver.delete(it, null, null) }
            toast("Lưu QR thất bại: ${e.message ?: "Lỗi không xác định"}")
        }
    }

    private fun copyLink() {
        val link = currentShareUrl ?: return
        copyText(link, "Đã sao chép link")
    }

    private fun shareLink() {
        val link = currentShareUrl ?: return
        val send = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, "Tệp được chia sẻ bằng NQV Share (link có hiệu lực 24 giờ):\n$link")
        }
        startActivity(Intent.createChooser(send, "Chia sẻ link NQV Share"))
    }

    private fun openCurrentLink() {
        val link = currentShareUrl ?: return
        openUrl(link)
    }

    private fun pasteLink() {
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        val value = clipboard.primaryClip?.getItemAt(0)?.coerceToText(this)?.toString().orEmpty()
        if (value.isBlank()) {
            toast("Bộ nhớ tạm chưa có nội dung")
        } else {
            receiveInput.setText(value.trim())
            toast("Đã dán nội dung từ bộ nhớ tạm")
        }
    }

    private fun openReceivedLink() {
        val link = receiveInput.text.toString().trim()
        if (!link.startsWith("https://")) {
            toast("Link cần bắt đầu bằng https://")
            return
        }
        openUrl(link)
    }

    private fun handleIncomingShare(source: Intent?) {
        if (source?.action != Intent.ACTION_SEND) return
        val raw = source.getCharSequenceExtra(Intent.EXTRA_TEXT)?.toString()?.trim().orEmpty()
        if (raw.isBlank() || !::receiveInput.isInitialized) return
        val sharedUrl = Regex("https://\\S+").find(raw)?.value?.trimEnd('.', ',', ')', ']', '>') ?: raw
        receiveInput.setText(sharedUrl)
        toast("Đã nhận link được chia sẻ. Nhấn MỞ TỆP để tiếp tục.")
    }

    private fun openUrl(url: String) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        } catch (_: Exception) {
            toast("Không tìm thấy ứng dụng phù hợp để mở link")
        }
    }

    private fun addHistory(record: ShareRecord) {
        history.removeAll { it.url == record.url }
        history.add(0, record)
        while (history.size > 20) history.removeAt(history.lastIndex)
        saveHistory()
        redrawHistory()
    }

    private fun loadHistory() {
        val raw = getPreferences(Context.MODE_PRIVATE).getString("share_history", "[]") ?: "[]"
        try {
            val array = JSONArray(raw)
            for (i in 0 until array.length()) {
                val item = array.optJSONObject(i) ?: continue
                val url = item.optString("url")
                if (!url.startsWith("https://")) continue
                history.add(
                    ShareRecord(
                        item.optString("name", "Tệp đã chia sẻ"),
                        url,
                        item.optLong("size", 0L),
                        item.optLong("createdAt", 0L),
                        item.optLong("expiresAt", 0L)
                    )
                )
            }
        } catch (_: Exception) {
            history.clear()
        }
    }

    private fun saveHistory() {
        val array = JSONArray()
        history.forEach { item ->
            array.put(JSONObject()
                .put("name", item.name)
                .put("url", item.url)
                .put("size", item.size)
                .put("createdAt", item.createdAt)
                .put("expiresAt", item.expiresAt))
        }
        getPreferences(Context.MODE_PRIVATE).edit().putString("share_history", array.toString()).apply()
    }

    private fun redrawHistory() {
        if (!::historyList.isInitialized) return
        historyList.removeAllViews()
        if (history.isEmpty()) {
            historyList.addView(text("Chưa có tệp nào được chia sẻ trên thiết bị này.", 12f, Color.rgb(148, 163, 184), false).apply {
                gravity = Gravity.CENTER
                setPadding(0, dp(18), 0, dp(12))
            })
            return
        }
        history.forEach { record ->
            val item = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setPadding(dp(12))
                background = rounded(Color.rgb(245, 248, 253), 16)
            }
            item.addView(text(record.name, 13f, Color.rgb(30, 41, 59), true))
            val expires = if (record.expiresAt > 0L && record.expiresAt <= System.currentTimeMillis()) {
                "Đã hết hạn"
            } else {
                "Hết hạn: ${formatDate(record.expiresAt)}"
            }
            item.addView(text("${formatBytes(record.size)}  •  $expires", 11f, Color.rgb(100, 116, 139), false).apply {
                setPadding(0, dp(4), 0, dp(9))
            })
            val actions = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            actions.addView(smallButton("MỞ", Color.rgb(37, 99, 235)) { openUrl(record.url) },
                LinearLayout.LayoutParams(0, dp(39), 1f).apply { marginEnd = dp(4) })
            actions.addView(smallButton("SAO CHÉP", Color.rgb(15, 118, 110)) { copyText(record.url, "Đã sao chép link") },
                LinearLayout.LayoutParams(0, dp(39), 1f).apply { marginStart = dp(4); marginEnd = dp(4) })
            actions.addView(smallButton("BỎ", Color.rgb(100, 116, 139)) {
                history.removeAll { it.url == record.url }
                saveHistory()
                redrawHistory()
            }, LinearLayout.LayoutParams(0, dp(39), 1f).apply { marginStart = dp(4) })
            item.addView(actions)
            historyList.addView(item, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                bottomMargin = dp(9)
            })
        }
    }

    private fun copyText(value: String, message: String) {
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText("NQV Share", value))
        toast(message)
    }

    private fun queryFile(uri: Uri): Pair<String, Long> {
        var fileName = "tep-tin"
        var size = -1L
        contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE), null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
                if (nameIndex >= 0) fileName = cursor.getString(nameIndex) ?: fileName
                if (sizeIndex >= 0) size = cursor.getLong(sizeIndex)
            }
        }
        return fileName to size
    }

    private fun guessMime(name: String): String {
        val ext = name.substringAfterLast('.', "").lowercase(Locale.ROOT)
        return when (ext) {
            "jpg", "jpeg" -> "image/jpeg"
            "png" -> "image/png"
            "webp" -> "image/webp"
            "gif" -> "image/gif"
            "heic", "heif" -> "image/heic"
            "mp4", "m4v" -> "video/mp4"
            "mov" -> "video/quicktime"
            "mkv" -> "video/x-matroska"
            "webm" -> "video/webm"
            "mp3" -> "audio/mpeg"
            "m4a" -> "audio/mp4"
            "wav" -> "audio/wav"
            "ogg" -> "audio/ogg"
            "pdf" -> "application/pdf"
            "txt" -> "text/plain"
            "zip" -> "application/zip"
            "doc" -> "application/msword"
            "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            "xls" -> "application/vnd.ms-excel"
            "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            "ppt" -> "application/vnd.ms-powerpoint"
            "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation"
            else -> "application/octet-stream"
        }
    }

    private fun apiError(body: String, fallback: String): String = try {
        JSONObject(body).optString("error", fallback)
    } catch (_: Exception) { fallback }

    private fun formatBytes(bytes: Long): String {
        if (bytes < 1024) return "$bytes B"
        val units = arrayOf("KB", "MB", "GB", "TB")
        var value = bytes.toDouble()
        var index = -1
        do { value /= 1024.0; index++ } while (value >= 1024 && index < units.lastIndex)
        return String.format(Locale.US, "%.1f %s", value, units[index])
    }

    private fun formatDate(timestamp: Long): String {
        if (timestamp <= 0L) return "Không rõ"
        return SimpleDateFormat("dd/MM HH:mm", Locale("vi", "VN")).format(Date(timestamp))
    }

    private fun card() = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(16))
        background = rounded(Color.WHITE, 22)
        elevation = dp(2).toFloat()
        layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
            bottomMargin = dp(15)
        }
    }

    private fun sectionTitle(value: String) = text(value, 17f, Color.rgb(23, 43, 77), true)

    private fun text(value: String, size: Float, color: Int, bold: Boolean) = TextView(this).apply {
        text = value
        textSize = size
        setTextColor(color)
        if (bold) typeface = Typeface.create("sans-serif", Typeface.BOLD)
    }

    private fun inputField(hintText: String) = EditText(this).apply {
        hint = hintText
        textSize = 13f
        setSingleLine(true)
        setPadding(dp(12))
        background = rounded(Color.rgb(245, 247, 251), 13)
        setTextColor(Color.rgb(30, 41, 59))
    }

    private fun button(label: String, color: Int, action: () -> Unit) = Button(this).apply {
        text = label
        isAllCaps = false
        textSize = 13f
        typeface = Typeface.create("sans-serif", Typeface.BOLD)
        setTextColor(Color.WHITE)
        background = rounded(color, 14)
        minHeight = dp(46)
        setPadding(dp(8), 0, dp(8), 0)
        setOnClickListener { action() }
    }

    private fun smallButton(label: String, color: Int, action: () -> Unit) = Button(this).apply {
        text = label
        isAllCaps = false
        textSize = 10f
        typeface = Typeface.create("sans-serif", Typeface.BOLD)
        setTextColor(Color.WHITE)
        background = rounded(color, 11)
        minHeight = dp(38)
        setPadding(dp(2), 0, dp(2), 0)
        setOnClickListener { action() }
    }

    private fun rounded(color: Int, radiusDp: Int) = GradientDrawable().apply {
        setColor(color)
        cornerRadius = dp(radiusDp).toFloat()
    }

    private fun matchWidth() = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(50))
    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
    private fun toast(message: String) = Toast.makeText(this, message, Toast.LENGTH_LONG).show()

    override fun onDestroy() {
        executor.shutdownNow()
        super.onDestroy()
    }
}

private fun String.toRequestBody(mediaType: okhttp3.MediaType?) =
    okhttp3.RequestBody.create(mediaType, this)
