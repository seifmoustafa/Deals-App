// utils/mailer.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail(to, subject, html) {
  try {
    const response = await resend.emails.send({
      from: "Deals App <onboarding@resend.dev>", // لازم يبقى verified domain/subdomain
      to,
      subject,
      html,
    });
    console.log("📧 Mail sent:", response);
    return response;
  } catch (error) {
    console.error("❌ Mail error:", error);
    throw error;
  }
}

module.exports = { sendMail };
