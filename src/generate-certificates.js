require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

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
      'Usage: node src/generate-certificates.js --event=ETCODE3 --type=<role>'
    );
    process.exit(1);
  }

  const rootDir = path.join(__dirname, "..");
  const eventDir = path.join(rootDir, "events", event);
  const dataFile = path.join(eventDir, "data", `${type}.json`);
  const baseImageFile = path.join(
    eventDir,
    "assets",
    `${type}.png`
  );
  const outputDir = path.join(eventDir, "certificates", type);

  if (!fs.existsSync(dataFile)) {
    console.error(`Data file not found: ${dataFile}`);
    process.exit(1);
  }

  if (!fs.existsSync(baseImageFile)) {
    console.error(`Base certificate image not found: ${baseImageFile}`);
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const list = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  const config = loadEventConfig(event);

  const typeConfig = (config.certificate && config.certificate[type]) || {};

  let fontPath =
    process.env.CERT_FONT_PATH ||
    typeConfig.fontPath ||
    "Formula1-Regular_web_0.ttf";
  if (!path.isAbsolute(fontPath)) {
    fontPath = path.join(eventDir, "assets", fontPath);
  }
  const xOffset =
    Number(process.env.CERT_X_OFFSET ?? typeConfig.xOffset ?? 0) || 0;
  const yOffset =
    Number(process.env.CERT_Y_OFFSET ?? typeConfig.yOffset ?? 0) || 0;
  const fontSize =
    Number(process.env.CERT_FONT_SIZE ?? typeConfig.fontSize ?? 72) || 72;
  const magickCmd = process.env.MAGICK_CMD || "magick";

  const formatEnv =
    (process.env.CERT_OUTPUT_FORMAT || "").toLowerCase().trim();
  const requestedFormat =
    (argFormat || formatEnv || "pdf").toLowerCase().trim();
  const outputFormat = requestedFormat === "png" ? "png" : "pdf";

  for (const [index, { name }] of list.entries()) {
    const safeName = sanitizeFilename(name);
    const outputPath = path.join(
      outputDir,
      `certificate_${safeName}.${outputFormat}`
    );

    if (fs.existsSync(outputPath)) {
      console.log(
        `[${index + 1}/${list.length}] Skipping, already exists: ${outputPath}`
      );
      continue;
    }

    const command = `${magickCmd} "${baseImageFile}" -pointsize ${fontSize} -font "${fontPath}" -stroke white -gravity center -fill white -draw "text ${xOffset},${yOffset} '${name}'" "${outputPath}"`;

    try {
      console.log(
        `[${index + 1}/${list.length}] Generating certificate for ${name}`
      );
      execSync(command, { stdio: "inherit" });
    } catch (error) {
      console.error(
        `Error generating certificate for ${name}: ${error.message}`
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

