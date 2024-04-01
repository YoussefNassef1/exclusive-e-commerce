const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.email",
    port: 25,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.USER_GMAIL,
      pass: process.env.PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  const mailOpts = {
    from: "Expensive App <progahmedelsayed@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  await transporter.sendMail(mailOpts);
};

module.exports = sendEmail;
