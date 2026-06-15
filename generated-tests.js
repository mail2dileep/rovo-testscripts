const fs = require("fs");
const path = require("path");
const outputFolder =
  path.join(__dirname, "generated-tests");

if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder);
}

fs.writeFileSync(
  path.join(outputFolder, fileName),
  script,
  "utf8"
);