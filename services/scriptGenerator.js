const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function buildPrompt(test) {

  let prompt = `
You are AssureRegress.

Generate a production-ready Playwright Javascript test.

Requirements:
- Use @playwright/test
- Generate complete executable code
- Generate one test for the supplied test case
- Use Page Object Model where appropriate
- Create assertions based on expected results
- Use test.describe and test()
- Return ONLY executable code
- Do not return markdown code fences

Requirement ID:
${test.requirementId}

Test Name:
${test.name}

Objective:
${test.objective}

Priority:
${test.priority}

Test Steps:
`;

  test.steps.forEach((s, index) => {

    prompt += `
Step ${index + 1}
Action:
${s.step}

Input Data:
${s.data || "N/A"}

Expected Result:
${s.result}
`;

  });

  return prompt;
}

async function generatePlaywrightScript(testCase) {

  const prompt = buildPrompt(testCase);
try {

  const response =
    await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content:
            "You are a senior Playwright automation engineer."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

  return response.choices[0].message.content;

} catch (error) {

  console.error(
    "OpenAI Error:",
    error.response?.data || error.message
  );

  throw error;
}

module.exports = {
  generatePlaywrightScript
};