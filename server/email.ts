import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || "DirectTip <noreply@directtip.app>";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("SMTP credentials not configured. Emails will be logged to console only.");
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
    });
  } else {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
}

export async function sendOTPEmail(email: string, code: string): Promise<void> {
  const transport = getTransporter();

  const mailOptions = {
    from: SMTP_FROM,
    to: email,
    subject: "Your DirectTip verification code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2463EB;">DirectTip Verification Code</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="margin: 0; font-size: 36px; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 12px;">DirectTip - Tips go directly to workers</p>
      </div>
    `,
    text: `Your DirectTip verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, you can safely ignore this email.`,
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log("OTP email sent:", { email, messageId: info.messageId });
    
    if (!SMTP_USER || !SMTP_PASS) {
      console.log("OTP Code (dev mode):", code);
    }
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error("Failed to send verification email");
  }
}
