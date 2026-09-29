const RESEND_API_URL = "https://api.resend.com/emails";

const getRequiredEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const sendEmail = async ({ to, subject, html, text }) => {
  const apiKey = getRequiredEnv("RESEND_API_KEY");
  const from = getRequiredEnv("RESEND_FROM_EMAIL");

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    let details = "";

    try {
      const body = await response.json();
      details = body?.message || "";
    } catch {
      // Keep provider details out of the user-facing response.
    }

    throw new Error(
      `Resend email request failed (${response.status})${details ? `: ${details}` : ""}`
    );
  }

  return response.json();
};

const sendVerificationEmail = async ({ name, email, token }) => {
  const frontendUrl = getRequiredEnv("FRONTEND_URL").replace(/\/+$/, "");
  const verificationUrl =
    `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const safeName = escapeHtml(name);

  return sendEmail({
    to: email,
    subject: "Verify your TLC Vault email",
    text: [
      `Hey ${name},`,
      "",
      "Welcome to TLC Vault.",
      "Please verify your email address to activate your account.",
      "",
      `Verify your email: ${verificationUrl}`,
      "",
      "This link expires in 30 minutes.",
      "If you didn't create this account, you can ignore this email.",
      "",
      "TLC Vault",
      "The Last Commit",
    ].join("\n"),
    html: `
      <!doctype html>
      <html>
        <body style="margin:0;background:#f6f1e8;font-family:Arial,Helvetica,sans-serif;color:#111827;">
          <div style="padding:40px 16px;">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              <div style="padding:28px 32px;border-bottom:1px solid #eeeae2;">
                <div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;">TLC Vault</div>
                <div style="margin-top:5px;font-size:12px;color:#6b7280;">The Last Commit</div>
              </div>

              <div style="padding:36px 32px;">
                <div style="display:inline-block;padding:6px 9px;border-radius:6px;background:#fff0ea;color:#d94f1f;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
                  Email verification
                </div>

                <h1 style="margin:20px 0 12px;font-size:28px;line-height:1.15;letter-spacing:-.03em;">
                  Verify your email
                </h1>

                <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#4b5563;">
                  Hey ${safeName},
                </p>

                <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#4b5563;">
                  Welcome to TLC Vault. Please verify your email address to activate your account.
                </p>

                <a href="${verificationUrl}"
                   style="display:inline-block;background:#f36631;color:#111827;text-decoration:none;font-size:14px;font-weight:700;padding:13px 20px;border-radius:7px;">
                  Verify Email
                </a>

                <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#9ca3af;">
                  This link expires in 30 minutes.
                </p>

                <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#9ca3af;">
                  If you didn't create this account, you can ignore this email.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
};
