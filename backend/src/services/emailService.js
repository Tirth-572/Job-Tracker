const nodemailer = require('nodemailer');
const { getEmailTemplate } = require('./emailTemplates');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { rejectUnauthorized: false },
});

const sendEmail = async ({ to, subject, template, data }) => {
  const html = getEmailTemplate(template, data);
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};

module.exports = { sendEmail };
