// utils/sendEmail.js
import nodemailer from "nodemailer";

/**
 * Sends an email using configured SMTP transport.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject line
 * @param {string} [options.html] - HTML body (optional)
 * @param {string} [options.text] - Plain text fallback (optional)
 * @returns {Promise<{ success: boolean, info?: any, error?: any }>}
 */
export async function sendEmail({ to, subject, html, text }) {
  if (!to || !subject || (!html && !text)) {
    return { success: false, error: "Missing required fields" };
  }

  try {
    // 1️⃣ Configure transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
      secure: process.env.SMTP_SECURE !== "false", // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });

    // 2️⃣ Define email options
    const mailOptions = {
      from: {
        name: process.env.APP_NAME || "DripDesi",
        address: process.env.SMTP_FROM || process.env.SMTP_USER,
      },
      to,
      subject,
      text: text || "",
      html: html || `<p>${text}</p>`,
    };

    // 3️⃣ Send mail
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, info };
  } catch (error) {
    console.error("❌ Email send failed:", error);
    return { success: false, error };
  }
}
