import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysia/openapi";
import { auth } from "./auth";

import { statusTemplatesRouter } from "./modules/status-templates";
import { statusSeedRouter } from "./modules/status-templates/seed";
import { customersRouter } from "./modules/customers";
import { ordersRouter } from "./modules/orders";
import { trackingRouter } from "./modules/tracking";
import { settingsRouter } from "./modules/settings";
import { dashboardRouter } from "./modules/dashboard";
import { reportRouter } from "./modules/dashboard/report";
import { attachmentsRouter } from "./modules/attachments";
import { membersRouter } from "./modules/members";

const PORT = Number(process.env.PORT) || 8000;

const app = new Elysia()
  .use(
    openapi({
      path: "/docs",
      provider: "scalar",
      documentation: {
        info: {
          title: "CekStatus API",
          version: "1.0.0",
          description: `CekStatus adalah platform tracking pesanan/order white-label untuk UMKM Indonesia.

## Base URL

\`\`\`
http://localhost:8000
\`\`\`

## Autentikasi

API ini mendukung **dua metode** autentikasi:

### 1. Session Cookie (Browser)
Digunakan oleh dashboard frontend. Login via Better Auth endpoint, session otomatis dikirim via cookie.

### 2. API Key (Programmatic)
Untuk akses dari aplikasi eksternal / script. Kirim header:
\`\`\`
x-api-key: <api_key_anda>
\`\`\`

> API Key dibuat dan dikelola per organisasi melalui dashboard.

## Organization Slug

Semua endpoint protected diawali dengan:
\`\`\`
/api/organizations/:slug/...
\`\`\`

**\`slug\`** adalah identifikasi unik toko/bisnis (contoh: \`bengkel-abc\`, \`laundry-cepat\`).
Setiap request ke endpoint ini akan memverifikasi bahwa Anda adalah anggota dari organisasi tersebut.

## Rate Limiting

- **Session auth:** 100 req/menit
- **API Key:** 1000 req/jam

## Response Format

Semua response menggunakan JSON, kecuali endpoint export CSV.

### Error Response
\`\`\`json
{
  "message": "Deskripsi error"
}
\`\`\`

### HTTP Status Codes
| Status | Makna |
|--------|-------|
| 200 | Sukses |
| 201 | Berhasil dibuat |
| 400 | Validasi gagal |
| 401 | Tidak terautentikasi |
| 403 | Tidak punya akses |
| 404 | Resource tidak ditemukan |
| 409 | Konflik (duplikat, constraint) |
| 500 | Internal server error |

## Public Endpoints

Beberapa endpoint tidak memerlukan autentikasi:
- \"/api/health\" — Health check
- \"/api/organizations/:slug/public\" — Profil publik toko
- \"/api/track/:orderNumber\" — Tracking publik pesanan

---

Butuh bantuan? Lihat dokumentasi lengkap di [README](https://github.com/sekeco/cekstatus).
        `,
        },
        servers: [
          {
            url: "http://localhost:8000",
            description: "Development server",
          },
        ],
        externalDocs: {
          url: "https://github.com/sekeco/cekstatus",
          description: "Dokumentasi lengkap & panduan pengguna",
        },
        components: {
          securitySchemes: {
            sessionCookie: {
              type: "apiKey",
              in: "cookie",
              name: "better-auth_session",
              description:
                "Session cookie dari Better Auth. Login via /api/auth/sign-in",
            },
            apiKey: {
              type: "apiKey",
              in: "header",
              name: "x-api-key",
              description:
                "API key organisasi. Kelola di dashboard -> Settings -> API Keys",
            },
          },
        },
        tags: [
          { name: "Orders", description: "Manajemen pesanan" },
          { name: "Customers", description: "Data pelanggan" },
          { name: "Tracking", description: "Tracking publik" },
          { name: "Dashboard", description: "Dashboard & statistik" },
          { name: "Reports", description: "Generate dan kirim laporan" },
          { name: "Settings", description: "Pengaturan toko" },
          { name: "Status", description: "Template status pesanan" },
          { name: "Attachments", description: "Lampiran file per pesanan" },
          { name: "Members", description: "Manajemen anggota tim" },
          { name: "System", description: "Health check dan utility" },
        ],
      },
    }),
  )
  .use(
    cors({
      origin: [process.env.FRONTEND_URL || "http://localhost:3000"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  // Better Auth handler
  .mount(auth.handler)
  // API routes
  .use(statusTemplatesRouter)
  .use(statusSeedRouter)
  .use(customersRouter)
  .use(ordersRouter)
  .use(trackingRouter)
  .use(settingsRouter)
  .use(dashboardRouter)
  .use(reportRouter)
  .use(attachmentsRouter)
  .use(membersRouter)
  // Serve uploaded files
  .get(
    "/uploads/*",
    async ({ params, set }) => {
      const path = params["*"];
      if (!path) {
        set.status = 404;
        return { message: "File not found" };
      }
      const uploadDir = process.env.UPLOAD_DIR || "./storage/uploads";
      const filePath = `${uploadDir}/${path}`;
      const file = Bun.file(filePath);
      const exists = await file.exists();
      if (!exists) {
        set.status = 404;
        return { message: "File not found" };
      }
      return new Response(file);
    },
    {
      detail: {
        tags: ["System"],
        summary: "Serve uploaded files",
      },
    },
  )
  // Health check
  .get(
    "/api/health",
    () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
    {
      detail: {
        tags: ["System"],
        summary: "Health check endpoint",
      },
    },
  )
  .listen(PORT);

console.log(`🦊 CekStatus API running at http://localhost:${PORT}`);
console.log(`🔐 Auth endpoints at http://localhost:${PORT}/api/auth`);

export type App = typeof app;
