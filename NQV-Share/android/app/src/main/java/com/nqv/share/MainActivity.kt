package com.nqv.share

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
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
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.ComponentActivity
import androidx.core.view.setPadding
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okio.BufferedSink
import org.json.JSONObject
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import java.io.IOException
import java.util.Locale
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class MainActivity : ComponentActivity() {
    private val http = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.SECONDS)
        .writeTimeout(0, TimeUnit.SECONDS)
        .callTimeout(0, TimeUnit.SECONDS)
        .build()
    private val executor = Executors.newSingleThreadExecutor()

    private lateinit var serverInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var chooseButton: Button
    private lateinit var progress: ProgressBar
    private lateinit var statusText: TextView
    private lateinit var selectedText: TextView
    private lateinit var resultBox: LinearLayout
    private lateinit var linkText: TextView
    private lateinit var qrImage: ImageView
    private lateinit var copyButton: Button
    private lateinit var shareButton: Button
    private var currentShareUrl: String? = null

    private val filePicker = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri: Uri? ->
        uri?.let { startUpload(it) }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        buildUi()
    }

    private fun buildUi() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20))
            setBackgroundColor(Color.rgb(247, 248, 252))
        }
        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(dp(20) + bars.left, dp(20) + bars.top, dp(20) + bars.right, dp(20) + bars.bottom)
            insets
        }
        val scroll = ScrollView(this).apply { isFillViewport = true }
        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(0, dp(12), 0, dp(24))
        }

        val brand = TextView(this).apply {
            text = "NQV SHARE"
            textSize = 27f
            letterSpacing = 0.12f
            setTextColor(Color.rgb(23, 43, 77))
            typeface = Typeface.create("sans-serif", Typeface.BOLD)
        }
        content.addView(brand)
        content.addView(text("Chia sẻ ảnh và video nguyên bản", 16f, Color.rgb(82, 96, 118), false).apply {
            setPadding(0, dp(5), 0, dp(18))
        })

        val settingsCard = card()
        settingsCard.addView(sectionTitle("Kết nối Cloudflare Worker"))
        settingsCard.addView(text("Địa chỉ máy chủ", 13f, Color.DKGRAY, true).apply { setPadding(0, dp(10), 0, dp(4)) })
        serverInput = EditText(this).apply {
            hint = "https://ten-worker.ten-tai-khoan.workers.dev"
            textSize = 14f
            setSingleLine(true)
            setText(getPreferences(Context.MODE_PRIVATE).getString("server", ""))
            setPadding(dp(12))
            setBackgroundColor(Color.rgb(244, 246, 250))
        }
        settingsCard.addView(serverInput, matchWidth())
        settingsCard.addView(text("Mật khẩu gửi tệp", 13f, Color.DKGRAY, true).apply { setPadding(0, dp(10), 0, dp(4)) })
        passwordInput = EditText(this).apply {
            hint = "Mật khẩu APP_PASSWORD đã đặt trên Worker"
            textSize = 14f
            inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
            setPadding(dp(12))
            setBackgroundColor(Color.rgb(244, 246, 250))
        }
        settingsCard.addView(passwordInput, matchWidth())
        content.addView(settingsCard)

        val sendCard = card().apply { setPadding(dp(16)) }
        sendCard.addView(sectionTitle("Gửi tệp"))
        sendCard.addView(text("Chọn ảnh hoặc video từ thiết bị. Tệp được tải thẳng lên R2, không nén và không đổi độ phân giải.", 14f, Color.rgb(82, 96, 118), false).apply {
            setPadding(0, dp(8), 0, dp(14))
        })
        chooseButton = button("CHỌN ẢNH / VIDEO") { openPicker() }
        sendCard.addView(chooseButton, matchWidth())
        selectedText = text("Chưa chọn tệp", 13f, Color.rgb(82, 96, 118), false).apply { setPadding(0, dp(10), 0, 0) }
        sendCard.addView(selectedText)
        progress = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            progress = 0
            visibility = View.GONE
        }
        sendCard.addView(progress, matchWidth())
        statusText = text("Link chia sẻ sẽ hết hạn sau 24 giờ.", 13f, Color.rgb(82, 96, 118), false).apply { setPadding(0, dp(10), 0, 0) }
        sendCard.addView(statusText)
        content.addView(sendCard)

        resultBox = card().apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            visibility = View.GONE
        }
        resultBox.addView(sectionTitle("Link chia sẻ của bạn"))
        linkText = text("", 14f, Color.rgb(37, 99, 235), true).apply {
            gravity = Gravity.CENTER
            setPadding(0, dp(12), 0, dp(10))
        }
        resultBox.addView(linkText)
        qrImage = ImageView(this).apply {
            adjustViewBounds = true
            scaleType = ImageView.ScaleType.FIT_CENTER
            setBackgroundColor(Color.WHITE)
        }
        resultBox.addView(qrImage, LinearLayout.LayoutParams(dp(220), dp(220)).apply {
            gravity = Gravity.CENTER
            topMargin = dp(8)
            bottomMargin = dp(12)
        })
        val actions = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER }
        copyButton = button("SAO CHÉP") { copyLink() }
        shareButton = button("CHIA SẺ") { shareLink() }
        actions.addView(copyButton, LinearLayout.LayoutParams(0, dp(48), 1f).apply { marginEnd = dp(6) })
        actions.addView(shareButton, LinearLayout.LayoutParams(0, dp(48), 1f).apply { marginStart = dp(6) })
        resultBox.addView(actions)
        content.addView(resultBox)

        content.addView(text("Bản quyền Nông Quang Vinh", 12f, Color.rgb(130, 140, 156), false).apply {
            gravity = Gravity.CENTER
            setPadding(0, dp(22), 0, dp(8))
        })
        scroll.addView(content)
        root.addView(scroll, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
        setContentView(root)
    }

    private fun openPicker() {
        val base = serverInput.text.toString().trim().trimEnd('/')
        val password = passwordInput.text.toString()
        if (!base.startsWith("https://")) {
            toast("Hãy nhập Worker URL bắt đầu bằng https://")
            return
        }
        if (password.isBlank()) {
            toast("Hãy nhập mật khẩu gửi tệp")
            return
        }
        getPreferences(Context.MODE_PRIVATE).edit().putString("server", base).apply()
        filePicker.launch(arrayOf("image/*", "video/*"))
    }

    private fun startUpload(uri: Uri) {
        val server = serverInput.text.toString().trim().trimEnd('/')
        val password = passwordInput.text.toString()
        val meta = queryFile(uri)
        val name = meta.first
        val size = meta.second
        val mime = contentResolver.getType(uri) ?: guessMime(name)
        if (!(mime.startsWith("image/") || mime.startsWith("video/"))) {
            toast("Chỉ hỗ trợ ảnh và video trong phiên bản này")
            return
        }
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
        selectedText.text = "$name · ${formatBytes(size)}"
        statusText.text = "Đang tạo lượt tải lên..."

        executor.execute {
            try {
                val initBody = JSONObject()
                    .put("fileName", name)
                    .put("contentType", mime)
                    .put("sizeBytes", size)
                    .toString().toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
                val initRequest = Request.Builder()
                    .url("$server/api/upload-url")
                    .header("Authorization", "Bearer $password")
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
                            val buffer = ByteArray(64 * 1024)
                            var sent = 0L
                            while (true) {
                                val count = stream.read(buffer)
                                if (count < 0) break
                                sink.write(buffer, 0, count)
                                sent += count
                                val percent = ((sent * 100L) / size).toInt().coerceIn(0, 100)
                                runOnUiThread { progress.progress = percent }
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
                    .header("Authorization", "Bearer $password")
                    .post(completeBody)
                    .build()
                val completed = http.newCall(completeRequest).execute().use { response ->
                    val body = response.body?.string().orEmpty()
                    if (!response.isSuccessful) throw IOException(apiError(body, "Không hoàn tất được lượt tải lên"))
                    JSONObject(body)
                }
                val shareUrl = completed.getString("shareUrl")
                runOnUiThread { showResult(shareUrl) }
            } catch (e: Exception) {
                runOnUiThread {
                    statusText.text = "Lỗi: ${e.message ?: "Không xác định"}"
                    toast(statusText.text.toString())
                }
            } finally {
                runOnUiThread { chooseButton.isEnabled = true }
            }
        }
    }

    private fun showResult(url: String) {
        currentShareUrl = url
        linkText.text = url
        try {
            val matrix = QRCodeWriter().encode(url, BarcodeFormat.QR_CODE, 640, 640)
            val bitmap = Bitmap.createBitmap(640, 640, Bitmap.Config.RGB_565)
            for (x in 0 until 640) for (y in 0 until 640) {
                bitmap.setPixel(x, y, if (matrix[x, y]) Color.BLACK else Color.WHITE)
            }
            qrImage.setImageBitmap(bitmap)
        } catch (_: Exception) {
            toast("Không tạo được mã QR")
        }
        resultBox.visibility = View.VISIBLE
        statusText.text = "Hoàn tất! Link có hiệu lực trong 24 giờ kể từ lúc tải lên xong."
        progress.progress = 100
    }

    private fun copyLink() {
        val link = currentShareUrl ?: return
        val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        clipboard.setPrimaryClip(ClipData.newPlainText("NQV Share link", link))
        toast("Đã sao chép link")
    }

    private fun shareLink() {
        val link = currentShareUrl ?: return
        val send = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, "Tệp được chia sẻ bằng NQV Share (link có hiệu lực 24 giờ):\n$link")
        }
        startActivity(Intent.createChooser(send, "Chia sẻ link NQV Share"))
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

    private fun card() = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(16))
        setBackgroundColor(Color.WHITE)
        elevation = dp(2).toFloat()
        val params = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        params.bottomMargin = dp(16)
        layoutParams = params
    }

    private fun sectionTitle(value: String) = text(value, 17f, Color.rgb(23, 43, 77), true)

    private fun text(value: String, size: Float, color: Int, bold: Boolean) = TextView(this).apply {
        text = value
        textSize = size
        setTextColor(color)
        if (bold) typeface = Typeface.create("sans-serif", Typeface.BOLD)
    }

    private fun button(label: String, action: () -> Unit) = Button(this).apply {
        text = label
        isAllCaps = false
        textSize = 14f
        setTextColor(Color.WHITE)
        setBackgroundColor(Color.rgb(37, 99, 235))
        setOnClickListener { action() }
    }

    private fun matchWidth() = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(52))
    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
    private fun toast(message: String) = Toast.makeText(this, message, Toast.LENGTH_LONG).show()

    override fun onDestroy() {
        executor.shutdownNow()
        super.onDestroy()
    }
}

private fun String.toRequestBody(mediaType: okhttp3.MediaType?) =
    okhttp3.RequestBody.create(mediaType, this)
