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
    `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`;

  const payload = {
    message:
      `AssureRegress generated ${fileName}`,
    content:
      encodedContent,
    branch
  };

  // Check if file already exists
  try {

    const existing =
      await axios.get(
        url,
        {
          params: {
            ref: branch
          },
          headers: {
            Authorization:
              `Bearer ${token}`,
            Accept:
              "application/vnd.github+json"
          }
        }
      );

    payload.sha =
      existing.data.sha;

    console.log(
      `Updating existing file: ${fileName}`
    );

  } catch(error) {

    if (
      error.response?.status === 404
    ) {

      console.log(
        `Creating new file: ${fileName}`
      );

    } else {

      throw error;

    }

  }

  await axios.put(
    url,
    payload,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
        Accept:
          "application/vnd.github+json"
      }
    }
  );
console.log(
  `GitHub commit successful: ${fileName}`
);
}

module.exports = {
  commitFile
};