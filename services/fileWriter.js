const fs = require("fs");
const path = require("path");

function saveScript(fileName, script) {

  const outputFolder = path.join(
    process.cwd(),
    "generated-tests"
  );

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, {
      recursive: true
    });
  }

  const fullPath = path.join(
    outputFolder,
    fileName
  );

  fs.writeFileSync(
    fullPath,
    script,
    "utf8"
  );

  console.log(`✅ Saved script: ${fullPath}`);

  return fullPath;
}

module.exports = {
  saveScript
};