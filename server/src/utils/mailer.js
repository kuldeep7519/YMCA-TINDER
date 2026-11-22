import nodemailer from "nodemailer";

// Creates a resilient nodemailer transporter with sanitized credentials
const getTransporter = () => {
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : "";
  // Strip all spaces Google adds in App Passwords (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim().replace(/\s+/g, "") : "";

  if (user && pass) {
    if (process.env.EMAIL_HOST) {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === "true",
        auth: { user, pass },
      });
    }

    // Default to Gmail Service (App Passwords)
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: { user, pass },
    });
  }

  return null;
};

export const sendVerificationEmail = async ({ toEmail, studentName, otp, type = "signup" }) => {
  const transporter = getTransporter();

  const isReset = type === "reset";
  const emailHeading = isReset ? "Reset Your Account Password" : "Verify Your Student Email";
  const emailSubtitle = isReset
    ? `Hey ${studentName || "there"}! Use this 6-digit code to securely reset your password on YMCA Match.`
    : `Hey ${studentName || "there"}! Use this 6-digit code to verify your student account and start matching with batchmates at JC Bose UST.`;
  const emailSubject = isReset
    ? `Your YMCA Match Password Reset Code: ${otp}`
    : `Your YMCA Match Verification Code: ${otp}`;

  // Console log for local visibility
  console.log(`
======================================================
🔐 [YMCA Match] ${isReset ? "PASSWORD RESET" : "EMAIL VERIFICATION"} CODE
📧 Recipient: ${toEmail} (${studentName || "Student"})
🔑 6-Digit OTP: ${otp}
⏳ Valid for: 10 minutes
======================================================
  `);

  if (!transporter) {
    return {
      sent: true,
      mode: "development",
      message: "OTP logged to server console",
    };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #07080E; color: #FFFFFF; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: #111422; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); padding: 32px; text-align: center; }
        .logo { font-size: 28px; font-weight: 900; background: linear-gradient(135deg, #6366F1, #A855F7, #EC4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .badge { display: inline-block; padding: 4px 12px; background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.3); border-radius: 9999px; font-size: 11px; font-weight: 700; color: #D8B4FE; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px; }
        .heading { font-size: 22px; font-weight: 800; color: #FFFFFF; margin-top: 24px; margin-bottom: 8px; }
        .subtitle { font-size: 13px; color: #94A3B8; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(236,72,153,0.15)); border: 2px dashed #A855F7; border-radius: 16px; padding: 20px; margin: 24px 0; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #FFFFFF; text-shadow: 0 0 15px rgba(168,85,247,0.5); }
        .notice { font-size: 12px; color: #64748B; margin-top: 20px; }
        .footer { font-size: 11px; color: #475569; margin-top: 30px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">YMCA Match 🔥</div>
        <div class="badge">JC Bose UST Campus Security</div>
        <div class="heading">${emailHeading}</div>
        <div class="subtitle">${emailSubtitle}</div>
        
        <div class="otp-box">${otp}</div>
        
        <div class="notice">
          ⏱️ This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.
        </div>
        
        <div class="footer">
          JC Bose University of Science and Technology (YMCA), Faridabad<br>
          © 2026 YMCA Match. Made for students.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const user = process.env.EMAIL_USER.trim();
    const info = await transporter.sendMail({
      from: `"YMCA Match" <${user}>`,
      to: toEmail,
      subject: emailSubject,
      html: htmlContent,
    });

    console.log(`✅ [YMCA Match] Email successfully delivered to ${toEmail}! MessageId: ${info.messageId}`);
    return { sent: true, mode: "smtp", messageId: info.messageId };
  } catch (error) {
    console.error("❌ Failed to send email via SMTP:", error);
    return { sent: false, error: error.message };
  }
};
