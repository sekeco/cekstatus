import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      "⚠️  SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Email will be logged only."
    );
    transporter = {
      sendMail: async (mailOptions: nodemailer.SendMailOptions) => {
        console.log("📧 [EMAIL]", {
          to: mailOptions.to,
          subject: mailOptions.subject,
        });
        return { messageId: "logged-only" };
      },
    } as unknown as nodemailer.Transporter;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  transporter.verify((err) => {
    if (err) {
      console.error("❌ SMTP connection failed:", err.message);
    } else {
      console.log(`✅ SMTP connected: ${host}:${port}`);
    }
  });

  return transporter;
}

function buildHtmlText(text: string): string {
  const appName = "CekStatus";
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${appName}</title>
</head>
<body style="
  margin: 0;
  padding: 0;
  background-color: #f4f4f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        ">
          <tr>
            <td style="padding: 32px 32px 0; text-align: center;">
              <h1 style="
                margin: 0;
                font-size: 20px;
                font-weight: 600;
                color: #09090b;
                letter-spacing: -0.02em;
              ">
                ${appName}
              </h1>
              <p style="
                margin: 4px 0 0;
                font-size: 14px;
                color: #71717a;
              ">
                Kelola pesanan bisnis dengan mudah
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px 32px;">
              <div style="
                background-color: #fafafa;
                border: 1px solid #e4e4e7;
                border-radius: 8px;
                padding: 24px;
                font-size: 14px;
                line-height: 1.6;
                color: #18181b;
                white-space: pre-wrap;
              ">${text.replace(/\n/g, "<br>")}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 24px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                &copy; ${new Date().getFullYear()} ${appName}
                &mdash; <a href="${baseUrl}" style="color: #71717a; text-decoration: underline;">${baseUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send an email via SMTP (nodemailer).
 * Falls back to console.log when SMTP is not configured.
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  let from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@cekstatus.id";

  if (!from.includes("<")) {
    from = `"CekStatus" <${from}>`;
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html || buildHtmlText(options.text),
  };

  const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  if (!hasSmtp) {
    await getTransporter().sendMail(mailOptions);
    return;
  }

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log(`📧 Email sent to ${options.to}: ${info.messageId}`);
  } catch (err) {
    console.error(`📧 Email failed to ${options.to}:`, err);
    throw err;
  }
}
