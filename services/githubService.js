const axios = require("axios");

async function commitFile(
  fileName,
  content
) {

  const owner =
    process.env.GITHUB_OWNER;

  const repo =
    process.env.GITHUB_REPO;

  const branch =
    process.env.GITHUB_BRANCH;

  const token =
    process.env.GITHUB_TOKEN;

  const encodedContent =
    Buffer.from(content)
      .toString("base64");

  const url =
    `https://api.github.com/repos/${owner}/${repo}/contents/tests/generated/${fileName}`;

  await axios.put(
    url,
    {
      message:
        `AssureRegress generated ${fileName}`,
      content: encodedContent,
      branch
    },
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
        Accept:
          "application/vnd.github+json"
      }
    }
  );
}

module.exports = {
  commitFile
};