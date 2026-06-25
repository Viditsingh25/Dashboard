import nodemailer from "nodemailer";

let transporter = null;

function isConfigured() {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_PASS);
}

function getTransporter() {
  if (transporter) return transporter;
  if (!isConfigured()) return null;
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });
  return transporter;
}

export { isConfigured as isEmailConfigured };

export async function sendOtpEmail(to, code) {
  const t = getTransporter();
  if (!t) {
    console.warn("GMAIL_USER/GMAIL_PASS not set — OTP email not sent");
    return false;
  }
  await t.sendMail({
    from: `"KIMS Dashboard" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your OTP for KIMS Dashboard Login",
    html: `<div style="font-family:sans-serif;padding:24px;max-width:480px">
      <h2 style="color:#062b1c">KIMS Dashboard — OTP Verification</h2>
      <p>Your one-time password is:</p>
      <div style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#062b1c;background:#f0f7f2;padding:16px;text-align:center;border-radius:12px;margin:16px 0">${code}</div>
      <p style="color:#666">This code expires in 10 minutes. Do not share it with anyone.</p>
    </div>`,
  });
  return true;
}
