const fs = require("fs");
const path = require("path");

function getTemplatePath(event, templateName) {
  return path.join(
    __dirname,
    "..",
    "events",
    event,
    "templates",
    `${templateName}.html`
  );
}

function loadTemplate(event, templateName) {
  const templatePath = getTemplatePath(event, templateName);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  return fs.readFileSync(templatePath, "utf8");
}

function renderTemplate(html, variables) {
  return Object.entries(variables).reduce((result, [key, value]) => {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    return result.replace(pattern, String(value));
  }, html);
}

module.exports = {
  getTemplatePath,
  loadTemplate,
  renderTemplate,
};

