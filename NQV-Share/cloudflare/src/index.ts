import { AwsClient } from "aws4fetch";

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  ACCOUNT_ID: string;
  R2_BUCKET_NAME: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  APP_PASSWORD?: string;
}

type UploadRow = {
  id: string;
  object_key: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  created_at: number;
  expires_at: number | null;
  status: "pending" | "ready";
};

const DAY_MS = 24 * 60 * 60 * 1000;
const PENDING_TTL_MS = 60 * 60 * 1000;
const MAX_FILE_BYTES = 5 * 1024 * 1024 * 1024;
const DAILY_UPLOAD_LIMIT = 10;
const DAILY_BYTE_LIMIT = 10 * 1024 * 1024 * 1024;
const UPLOAD_URL_SECONDS = 15 * 60;
const DOWNLOAD_URL_SECONDS = 2 * 60;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function secureEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < length; i++) mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return mismatch === 0;
}

function authorized(request: Request, env: Env): boolean {
  const expected = `Bearer ${env.APP_PASSWORD || ""}`;
  return Boolean(env.APP_PASSWORD) && secureEqual(request.headers.get("Authorization") || "", expected);
}

function randomToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function cleanFileName(value: unknown): string {
  const raw = typeof value === "string" ? value : "file";
  const cleaned = raw.replace(/[\\/\u0000-\u001f\u007f]/g, "_").trim().slice(0, 240);
  return cleaned || "file";
}

function s3Client(env: Env): AwsClient {
  return new AwsClient({
    service: "s3",
    region: "auto",
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  });
}

function objectUrl(env: Env, key: string, expiresSeconds: number, method: "GET" | "PUT", mime?: string, disposition?: string): string {
  const endpoint = `https://${env.ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const url = new URL(`${endpoint}/${env.R2_BUCKET_NAME}/${key}`);
  url.searchParams.set("X-Amz-Expires", String(expiresSeconds));
  if (disposition) url.searchParams.set("response-content-disposition", disposition);
  return url.toString();
}

async function signObjectUrl(env: Env, key: string, expiresSeconds: number, method: "GET" | "PUT", mime?: string, disposition?: string): Promise<string> {
  const url = objectUrl(env, key, expiresSeconds, method, mime, disposition);
  const request = new Request(url, {
    method,
    headers: method === "PUT" && mime ? { "Content-Type": mime } : undefined,
  });
  const signed = await s3Client(env).sign(request, {
    aws: { signQuery: true, ...(method === "PUT" ? { allHeaders: true } : {}) },
  });
  return signed.url.toString();
}

async function clientHash(request: Request, env: Env): Promise<string> {
  // Store only a one-way hash of the client IP; never persist the raw address.
  const ip = request.headers.get("CF-Connecting-IP") || "local-development";
  const data = new TextEncoder().encode(env.ACCOUNT_ID + ":" + ip);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function reserveDailyQuota(env: Env, ipHash: string, bytes: number): Promise<boolean> {
  const dayKey = new Date().toISOString().slice(0, 10);
  const sql = "INSERT INTO daily_usage (ip_hash, day_key, file_count, bytes_reserved) " +
    "VALUES (?, ?, 1, ?) " +
    "ON CONFLICT(ip_hash, day_key) DO UPDATE SET " +
    "file_count = daily_usage.file_count + 1, " +
    "bytes_reserved = daily_usage.bytes_reserved + excluded.bytes_reserved " +
    "WHERE daily_usage.file_count < ? " +
    "AND daily_usage.bytes_reserved + excluded.bytes_reserved <= ? " +
    "RETURNING file_count";
  const reserved = await env.DB.prepare(sql)
    .bind(ipHash, dayKey, bytes, DAILY_UPLOAD_LIMIT, DAILY_BYTE_LIMIT)
    .first<{ file_count: number }>();
  return Boolean(reserved);
}
async function getRow(env: Env, id: string): Promise<UploadRow | null> {
  return await env.DB.prepare("SELECT * FROM uploads WHERE id = ? LIMIT 1").bind(id).first<UploadRow>();
}

function validShare(row: UploadRow | null): row is UploadRow {
  return Boolean(row && row.status === "ready" && row.expires_at && row.expires_at > Date.now());
}

function htmlPage(token: string): Response {
  const safeToken = token.replace(/[^a-f0-9]/gi, "");
  const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f7f8fc"><title>NQV Share</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f7f8fc;color:#172b4d;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;min-height:100vh;display:grid;place-items:center;padding:22px}.card{width:min(100%,520px);background:white;border:1px solid #e6eaf0;border-radius:24px;padding:28px;box-shadow:0 18px 50px #172b4d12}.brand{font-weight:850;letter-spacing:.14em;font-size:13px;color:#2563eb}.icon{width:54px;height:54px;border-radius:16px;background:#eff4ff;display:grid;place-items:center;font-size:27px;margin:20px 0 14px}h1{font-size:23px;line-height:1.25;overflow-wrap:anywhere;margin:0 0 8px}.muted{color:#69788d;font-size:14px;line-height:1.6}.meta{display:flex;justify-content:space-between;gap:12px;padding:15px 0;border-top:1px solid #edf0f4;margin-top:20px;font-size:13px}.preview{width:100%;max-height:360px;object-fit:contain;border-radius:14px;background:#101828;margin-top:16px}.download{display:block;text-align:center;text-decoration:none;background:#2563eb;color:#fff;font-weight:700;padding:15px 18px;border-radius:14px;margin-top:20px}.foot{text-align:center;color:#8994a5;font-size:12px;margin-top:20px}.error{color:#b42318;background:#fff2f0;border-radius:12px;padding:14px;line-height:1.5}
</style></head><body><main class="card"><div class="brand">NQV SHARE</div><div class="icon">↗</div><h1 id="name">Đang kiểm tra tệp…</h1><p id="desc" class="muted">Đang kiểm tra link chia sẻ.</p><div id="content"></div><div id="meta" class="meta" hidden><span id="size"></span><span id="expiry"></span></div><a id="download" class="download" href="#" hidden>Tải tệp gốc xuống</a><div class="foot">Chia sẻ nguyên bản · Link có hiệu lực 24 giờ<br>Bản quyền Nông Quang Vinh</div></main>
<script>
(async()=>{const token=${JSON.stringify(safeToken)};const name=document.getElementById('name'),desc=document.getElementById('desc'),content=document.getElementById('content'),meta=document.getElementById('meta'),download=document.getElementById('download');try{const r=await fetch('/api/share/'+token,{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Link không còn khả dụng.');name.textContent=d.fileName;desc.textContent='Tệp đang được lưu nguyên bản trên Cloudflare R2.';document.getElementById('size').textContent=d.sizeLabel;document.getElementById('expiry').textContent='Hết hạn: '+new Date(d.expiresAt).toLocaleString('vi-VN');meta.hidden=false;if(d.contentType.startsWith('image/')){const img=document.createElement('img');img.className='preview';img.alt=d.fileName;img.src='/api/preview/'+token;content.appendChild(img)}else if(d.contentType.startsWith('video/')){const video=document.createElement('video');video.className='preview';video.controls=true;video.playsInline=true;video.src='/api/preview/'+token;content.appendChild(video)}else if(d.contentType.startsWith('audio/')){const audio=document.createElement('audio');audio.controls=true;audio.src='/api/preview/'+token;audio.style.width='100%';audio.style.marginTop='18px';content.appendChild(audio)}else if(d.contentType==='application/pdf'){const pdf=document.createElement('iframe');pdf.className='preview';pdf.src='/api/preview/'+token;pdf.style.height='520px';pdf.title='Xem trước PDF';content.appendChild(pdf)}else{const note=document.createElement('p');note.className='muted';note.textContent='Định dạng này không hỗ trợ xem trước trực tiếp. Bạn có thể tải tệp gốc bằng nút bên dưới.';content.appendChild(note)}download.href='/api/download/'+token;download.hidden=false;}catch(e){name.textContent='Không thể mở tệp';desc.textContent='';const box=document.createElement('div');box.className='error';box.textContent=e.message||'Link đã hết hạn hoặc không tồn tại.';content.appendChild(box)}})();
</script></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

function humanSize(size: number): string {
  if (size < 1024) return `${size} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = size;
  let index = -1;
  do { value /= 1024; index++; } while (value >= 1024 && index < units.length - 1);
  return `${value.toFixed(1)} ${units[index]}`;
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "GET" && (path === "/" || path === "/health")) {
    return path === "/health"
      ? json({ ok: true, service: "NQV Share", linkLifetimeHours: 24, maxFileBytes: MAX_FILE_BYTES, dailyFilesPerIp: DAILY_UPLOAD_LIMIT, dailyBytesPerIp: DAILY_BYTE_LIMIT })
      : new Response("NQV Share API is running. Open a share link or use the Android app.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  if (request.method === "POST" && path === "/api/upload-url") {
    let data: { fileName?: unknown; contentType?: unknown; sizeBytes?: unknown };
    try { data = await request.json(); } catch { return json({ error: "Dữ liệu gửi lên không hợp lệ." }, 400); }
    const fileName = cleanFileName(data.fileName);
    const contentType = typeof data.contentType === "string" ? data.contentType.toLowerCase().slice(0, 120) : "";
    const sizeBytes = Number(data.sizeBytes);
    if (!contentType || contentType.length > 120) return json({ error: "Không nhận diện được định dạng tệp." }, 415);
    if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_FILE_BYTES) return json({ error: "Dung lượng phải từ 1 byte đến 5 GB trong phiên bản hiện tại." }, 413);

    const ipHash = await clientHash(request, env);
    const allowed = await reserveDailyQuota(env, ipHash, sizeBytes);
    if (!allowed) {
      return json({ error: "Thiết bị này đã đạt giới hạn trong ngày: tối đa 10 lượt gửi và 10 GB/ngày. Vui lòng thử lại vào ngày mai." }, 429);
    }

    const id = randomToken();
    const objectKey = `uploads/${id}`;
    const now = Date.now();
    await env.DB.prepare("INSERT INTO uploads (id, object_key, file_name, content_type, size_bytes, created_at, expires_at, status) VALUES (?, ?, ?, ?, ?, ?, NULL, 'pending')")
      .bind(id, objectKey, fileName, contentType, sizeBytes, now).run();

    const uploadUrl = await signObjectUrl(env, objectKey, UPLOAD_URL_SECONDS, "PUT", contentType);
    return json({ uploadId: id, uploadUrl, uploadHeaders: { "Content-Type": contentType }, uploadUrlExpiresAt: now + UPLOAD_URL_SECONDS * 1000 });
  }

  if (request.method === "POST" && path === "/api/complete") {
    let data: { uploadId?: unknown };
    try { data = await request.json(); } catch { return json({ error: "Dữ liệu gửi lên không hợp lệ." }, 400); }
    const id = typeof data.uploadId === "string" ? data.uploadId : "";
    if (!/^[a-f0-9]{32}$/i.test(id)) return json({ error: "Mã lượt tải lên không hợp lệ." }, 400);
    const row = await getRow(env, id);
    if (!row || row.status !== "pending" || row.created_at < Date.now() - PENDING_TTL_MS) return json({ error: "Lượt tải lên đã hết hạn. Vui lòng gửi lại tệp." }, 404);
    const object = await env.BUCKET.head(row.object_key);
    if (!object) return json({ error: "Không tìm thấy tệp trên R2. Hãy gửi lại." }, 409);
    if (object.size !== row.size_bytes) {
      await env.BUCKET.delete(row.object_key);
      await env.DB.prepare("DELETE FROM uploads WHERE id = ?").bind(id).run();
      return json({ error: "Dung lượng tệp nhận được không khớp. Hãy thử gửi lại." }, 409);
    }
    const expiresAt = Date.now() + DAY_MS;
    await env.DB.prepare("UPDATE uploads SET status = 'ready', expires_at = ? WHERE id = ? AND status = 'pending'")
      .bind(expiresAt, id).run();
    return json({ shareUrl: `${url.origin}/s/${id}`, expiresAt: new Date(expiresAt).toISOString(), lifetimeHours: 24 });
  }

  const shareMatch = path.match(/^\/api\/share\/([a-f0-9]{32})$/i);
  if (request.method === "GET" && shareMatch) {
    const row = await getRow(env, shareMatch[1]);
    if (!validShare(row)) return json({ error: "Link đã hết hạn hoặc không tồn tại." }, 410);
    return json({
      fileName: row.file_name,
      contentType: row.content_type,
      sizeBytes: row.size_bytes,
      sizeLabel: humanSize(row.size_bytes),
      expiresAt: new Date(row.expires_at!).toISOString(),
    });
  }

  const previewMatch = path.match(/^\/api\/preview\/([a-f0-9]{32})$/i);
  const downloadMatch = path.match(/^\/api\/download\/([a-f0-9]{32})$/i);
  const fileMatch = previewMatch || downloadMatch;
  if (request.method === "GET" && fileMatch) {
    const row = await getRow(env, fileMatch[1]);
    if (!validShare(row)) return json({ error: "Link đã hết hạn hoặc không tồn tại." }, 410);
    const disposition = downloadMatch
      ? `attachment; filename*=UTF-8''${encodeURIComponent(row.file_name)}`
      : `inline; filename*=UTF-8''${encodeURIComponent(row.file_name)}`;
    const signed = await signObjectUrl(env, row.object_key, DOWNLOAD_URL_SECONDS, "GET", undefined, disposition);
    return Response.redirect(signed, 302);
  }

  const pageMatch = path.match(/^\/s\/([a-f0-9]{32})$/i);
  if (request.method === "GET" && pageMatch) return htmlPage(pageMatch[1]);

  if (request.method === "DELETE" && path.startsWith("/api/share/")) {
    if (!authorized(request, env)) return json({ error: "Mật khẩu gửi tệp không đúng." }, 401);
    const id = path.slice("/api/share/".length);
    if (!/^[a-f0-9]{32}$/i.test(id)) return json({ error: "Mã link không hợp lệ." }, 400);
    const row = await getRow(env, id);
    if (!row) return json({ error: "Không tìm thấy tệp." }, 404);
    await env.BUCKET.delete(row.object_key);
    await env.DB.prepare("DELETE FROM uploads WHERE id = ?").bind(id).run();
    return json({ deleted: true });
  }

  return json({ error: "Không tìm thấy đường dẫn." }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try { return await route(request, env); }
    catch (error) {
      console.error("NQV Share error", error);
      return json({ error: "Máy chủ gặp lỗi. Hãy thử lại sau." }, 500);
    }
  },

  async scheduled(_event: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    const now = Date.now();
    const pendingCutoff = now - PENDING_TTL_MS;
    const due = await env.DB.prepare(
      "SELECT id, object_key FROM uploads WHERE (status = 'ready' AND expires_at <= ?) OR (status = 'pending' AND created_at <= ?) LIMIT 500",
    ).bind(now, pendingCutoff).all<{ id: string; object_key: string }>();
    const rows = due.results || [];
    // Remove objects in small parallel batches, then delete their D1 rows in one statement.
    for (let i = 0; i < rows.length; i += 25) {
      const batch = rows.slice(i, i + 25);
      const deletedIds = (await Promise.all(batch.map(async (row) => {
        try {
          await env.BUCKET.delete(row.object_key);
          return row.id;
        } catch (error) {
          console.error("Cleanup failed for upload", row.id, error);
          return null;
        }
      }))).filter((id): id is string => id !== null);
      if (deletedIds.length) {
        const placeholders = deletedIds.map(() => "?").join(", ");
        await env.DB.prepare("DELETE FROM uploads WHERE id IN (" + placeholders + ")")
          .bind(...deletedIds).run();
      }
    }
    const oldDay = new Date(now - 3 * DAY_MS).toISOString().slice(0, 10);
    await env.DB.prepare("DELETE FROM daily_usage WHERE day_key < ?").bind(oldDay).run();
  },
};
