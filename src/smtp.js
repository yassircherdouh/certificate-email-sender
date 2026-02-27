require("dotenv").config();
const nodemailer = require("nodemailer");

function createTransport() {
  const {
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_USER,
    EMAIL_PASSWORD,
  } = process.env;

  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    throw new Error(
      "EMAIL_USER and EMAIL_PASSWORD must be set in the environment."
    );
  }

  const host = EMAIL_HOST || "smtp.gmail.com";
  const port = Number(EMAIL_PORT || 465);
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
}

module.exports = {
  createTransport,
};

