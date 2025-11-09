// utils/sendEmail.js
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@example.com";

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

/**
 * sendEmail
 * @param {{ to: string, subject: string, text?: string, html?: string }} opts
 * @returns {Promise<{ success: boolean, info?: any, error?: any }>}
 */
export async function sendEmail({ to, subject, text, html }) {
  if (!to) return { success: false, error: new Error("Missing 'to'") };
  if (!subject) subject = "Notification";

  const mailOptions = {
    from: FROM_EMAIL,
    to,
    subject,
    text: text || undefined,
    html: html || undefined,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };
  } catch (error) {
    console.error("sendEmail error:", error);
    return { success: false, error };
  }
}
