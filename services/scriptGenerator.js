const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function buildPrompt(test) {

  let prompt = `
You are AssureRegress.

Generate a Playwright Javascript automation script.

Rules:
- Use @playwright/test
- Generate complete runnable code
- Use assertions based on expected results
- Return ONLY code

Test Name:
${test.name}

Objective:
${test.objective}

Steps:
`;

  test.steps.forEach((s, index) => {

    prompt += `
${index + 1}. ${s.step}

Expected:
${s.result}
`;

  });

  return prompt;
}

async function generatePlaywrightScript(testCase) {

  const prompt = buildPrompt(testCase);

  const response = await client.chat.completions.create({
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
    ],
    temperature: 0.2
  });

  return response.choices[0].message.content;
}

module.exports = {
  generatePlaywrightScript
};