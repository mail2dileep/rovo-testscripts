const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function buildPrompt(test) {

  let prompt = `
You are AssureRegress, a Senior QA Automation Architect.

Generate enterprise-grade Playwright TypeScript automation following strict Page Object Model (POM) architecture.

MANDATORY REQUIREMENTS:

- Use Playwright with @playwright/test
- Use TypeScript
- Follow Page Object Model (POM)
- Generate TWO artifacts:
  1. Page Object Class
  2. Playwright Test Spec

Page Object Requirements:
- Create a dedicated Page Object class
- Encapsulate all locators inside the Page Object
- Encapsulate all actions inside the Page Object
- Do NOT use page.locator(), page.click(), page.fill(), page.getByRole(), etc. directly in the test spec
- Use meaningful method names

Test Spec Requirements:
- Use test.describe()
- Use test()
- Instantiate Page Objects
- Use Page Object methods only
- Keep assertions in the test layer
- Follow reusable enterprise automation framework patterns

Framework Structure:

pages/
  <PageName>Page.ts

tests/generated/
  <TestName>.spec.ts

Return ONLY valid JSON.

Response Format:

{
  "pageObjectFileName": "<PageName>Page.ts",
  "pageObjectContent": "<full page object code>",
  "testFileName": "<test-name>.spec.ts",
  "testFileContent": "<full playwright test code>"
}
  The Page Object file name must end with Page.ts.

Example:
RateCalculatorPage.ts

The Test Spec file name must end with .spec.ts.

Example:
verify-rate-calculator.spec.ts

Do NOT return markdown.
Do NOT return code fences.
Do NOT return explanations.
Return JSON only.

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

const content =
  response.choices[0].message.content;

let parsed;

try {

  parsed = JSON.parse(content);
  parsed.pageObjectFileName =
  parsed.pageObjectFileName?.trim();

parsed.testFileName =
  parsed.testFileName?.trim();

} catch(error) {

  console.error(
    "Invalid JSON returned by GPT:"
  );

  console.error(content);

  throw error;

}

if (
  !parsed.pageObjectFileName ||
  !parsed.pageObjectContent ||
  !parsed.testFileName ||
  !parsed.testFileContent
) {

  throw new Error(
    "Incomplete POM response from GPT"
  );

}

if (
  !parsed.pageObjectFileName.endsWith("Page.ts")
) {

  throw new Error(
    "Invalid Page Object filename"
  );

}

if (
  !parsed.testFileName.endsWith(".spec.ts")
) {

  throw new Error(
    "Invalid Test Spec filename"
  );

}

return parsed;

} catch (error) {

  console.error(
    "OpenAI Error:",
    error.response?.data || error.message
  );

  throw error;
}
}

module.exports = {
  generatePlaywrightScript
};