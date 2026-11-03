import nodemailer from "nodemailer";

let transportPromise = null;

async function createTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("SMTP is not configured");
  }
  const account = await nodemailer.createTestAccount();
  console.log("[email] SMTP not configured: using an Ethereal test inbox (development only)");
  return nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  });
}

function getTransport() {
  if (!transportPromise) {
    transportPromise = createTransport().catch((err) => {
      transportPromise = null;
      throw err;
    });
  }
  return transportPromise;
}

export async function sendEmail({ to, subject, html, text }) {
  const transport = await getTransport();
  const info = await transport.sendMail({
    from: {
      name: process.env.EMAIL_FROM_NAME || "Student Management System",
      address: process.env.EMAIL_FROM_ADDRESS || "no-reply@example.com",
    },
    to,
    subject,
    html,
    text,
  });
  return { messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) || null };
}
