/**
 * Email diagnostic tool.
 * Run: bun --env-file=.env run --filter @cekstatus/backend src/lib/email-diagnostic.ts
 */
import { sendEmail } from "./email";

async function main() {
  console.log("🔍 Email Diagnostic Tool");
  console.log("========================\n");

  // Check env vars
  const checks = [
    { key: "SMTP_HOST", val: process.env.SMTP_HOST },
    { key: "SMTP_PORT", val: process.env.SMTP_PORT },
    { key: "SMTP_USER", val: process.env.SMTP_USER },
    { key: "SMTP_PASS", val: process.env.SMTP_PASS ? "✅ (tersedia)" : "❌ KOSONG" },
    { key: "SMTP_FROM", val: process.env.SMTP_FROM },
    { key: "FRONTEND_URL", val: process.env.FRONTEND_URL },
    { key: "BACKEND_URL", val: process.env.BACKEND_URL },
  ];

  let allSet = true;
  for (const c of checks) {
    const ok = !!c.val;
    if (!ok && c.key !== "SMTP_PASS") allSet = false;
    console.log(`   ${ok ? "✅" : "⚠️"} ${c.key} = ${c.val || "(tidak diset)"}`);
  }

  if (!allSet) {
    console.log("\n⚠️  Beberapa env var SMTP belum diset. Email tidak akan terkirim.");
  }

  console.log("");

  // Send test email
  const to = process.argv[2] || process.env.SMTP_USER || "test@example.com";
  console.log(`📤 Mengirim email test ke ${to} ...`);

  try {
    await sendEmail({
      to,
      subject: "🔧 Test Diagnostik CekStatus",
      text: [
        "Halo!",
        "",
        "Ini adalah email diagnostik dari CekStatus.",
        "Jika Anda menerima email ini, maka konfigurasi SMTP berfungsi dengan baik. 🎉",
        "",
        `Waktu: ${new Date().toLocaleString("id-ID")}`,
        `Host: ${process.env.SMTP_HOST}`,
        `Port: ${process.env.SMTP_PORT}`,
      ].join("\n"),
    });
    console.log("\n✅ Test selesai. Cek inbox / spam folder.");
  } catch (err: any) {
    console.error("\n❌ Test gagal:", err.message);
    if (err.code) console.error("   Code:", err.code);
    if (err.command) console.error("   Command:", err.command);
    if (err.responseCode) console.error("   Response Code:", err.responseCode);
    if (err.response) console.error("   Response:", err.response);
    process.exit(1);
  }
}

main();
