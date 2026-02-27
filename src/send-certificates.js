require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { createTransport } = require("./smtp");
const { loadTemplate, renderTemplate } = require("./templates");

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (const arg of args) {
    const [key, value] = arg.split("=");
    if (key && value) {
      parsed[key.replace(/^--/, "")] = value;
    }
  }

  return parsed;
}

function loadEventConfig(event) {
  const configPath = path.join(
    __dirname,
    "..",
    "events",
    event,
    "config.json"
  );

  if (!fs.existsSync(configPath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function sanitizeFilename(name) {
  return name.replace(/[/\\?%*:|"<>]/g, "_");
}

async function main() {
  const { event, type, format: argFormat } = parseArgs();

  if (!event || !type) {
    console.error(
      'Usage: node src/send-certificates.js --event=ETCODE3 --type=<role>'
    );
    process.exit(1);
  }

  const rootDir = path.join(__dirname, "..");
  const eventDir = path.join(rootDir, "events", event);
  const dataFile = path.join(eventDir, "data", `${type}.json`);
  const certDir = path.join(eventDir, "certificates", type);

  if (!fs.existsSync(dataFile)) {
    console.error(`Data file not found: ${dataFile}`);
    process.exit(1);
  }

  if (!fs.existsSync(certDir)) {
    console.error(
      `Certificates directory not found: ${certDir}. Run the generate script first.`
    );
    process.exit(1);
  }

  const config = loadEventConfig(event);
  const subjects = (config.subjects || {});
  const subject =
    subjects[type] || process.env.CERT_SUBJECT || `Certificate - ${event}`;

  const templateHtml = loadTemplate(event, type);

  const list = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  const transport = createTransport();

  const formatEnv =
    (process.env.CERT_OUTPUT_FORMAT || "").toLowerCase().trim();
  const requestedFormat =
    (argFormat || formatEnv || "pdf").toLowerCase().trim();
  const primaryExt = requestedFormat === "png" ? "png" : "pdf";
  const secondaryExt = primaryExt === "pdf" ? "png" : "pdf";

  const fromName =
    process.env.FROM_NAME || (config && config.fromName) || "";
  const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_USER;
  const fromAddress = fromEmail
    ? fromName
      ? `${fromName} <${fromEmail}>`
      : fromEmail
    : undefined;

  for (const [index, { name, email }] of list.entries()) {
    const safeName = sanitizeFilename(name);
    const primaryPath = path.join(
      certDir,
      `certificate_${safeName}.${primaryExt}`
    );
    const secondaryPath = path.join(
      certDir,
      `certificate_${safeName}.${secondaryExt}`
    );

    let attachmentPath = null;
    let extUsed = null;

    if (fs.existsSync(primaryPath)) {
      attachmentPath = primaryPath;
      extUsed = primaryExt;
    } else if (fs.existsSync(secondaryPath)) {
      attachmentPath = secondaryPath;
      extUsed = secondaryExt;
    }

    if (!attachmentPath) {
      console.warn(
        `[${index + 1}/${list.length}] Certificate not found (pdf/png), skipping: ${primaryPath}`
      );
      continue;
    }

    const html = renderTemplate(templateHtml, { fullname: name });

    try {
      await transport.sendMail({
        from: fromAddress,
        to: email,
        subject,
        html,
        attachments: [
          {
            filename: `certificate.${extUsed}`,
            contentType:
              extUsed === "pdf" ? "application/pdf" : "image/png",
            path: attachmentPath,
          },
        ],
      });

      console.log(`[${index + 1}/${list.length}] Sent to ${email}`);
    } catch (error) {
      console.error(
        `[${index + 1}/${list.length}] Failed to send to ${email}:`,
        error.message
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

