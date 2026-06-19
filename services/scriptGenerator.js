const {
  GoogleGenerativeAI
} = require("@google/generative-ai");

const genAI =
  new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
  );
if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY not configured"
  );
}


function buildPrompt(test, locatorCatalog) {

 const elements =
  Array.isArray(locatorCatalog)
    ? locatorCatalog
    : locatorCatalog?.elements || [];

const filteredLocators =
  elements
    .filter(el =>
      el.testId ||
      el.id ||
      el.ariaLabel ||
      el.text
    )
    .slice(0, 100);

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
Return JSON only.`;
prompt += `

PAGE ANALYSIS RESULTS

The following locators were extracted
from the application page.

Use ONLY these locators when
generating the Page Object.

Prefer locator priority:

1. data-testid
2. aria-label
3. id
4. role
5. text

Do NOT invent selectors.

Locator Catalog:

${filteredLocators.length === 0
  ? "No locators were discovered. Add TODO comments for missing locators."
  : JSON.stringify(filteredLocators, null, 2)
}


LOCATOR RULES

- Use locators from Locator Catalog.
- Match test step action verbs (click, enter, select, verify, submit) to the most appropriate element in the Locator Catalog.
- Match expected results with relevant page elements where applicable.
- Do not generate placeholder selectors.
- Do not invent CSS selectors.
- Prefer locator generation in this order:

1. page.getByTestId()
2. page.getByRole()
3. page.getByLabel()
4. page.locator('#id')
5. page.getByText()

- Avoid XPath unless absolutely necessary.
- If multiple locators match, prefer the most stable locator according to the locator priority order.

- If data-testid is unavailable use getByRole().
- If role is unavailable use id locator.
- Use the most relevant locator from the catalog based on the action being performed.
- If no matching locator exists add:

// TODO: Locator not found in catalog

PAGE OBJECT DESIGN RULES

- Group related locators into business actions.
- Create reusable methods.
- Avoid one method per locator.
- Methods should represent business actions rather than UI actions.
- Prefer reusable workflow methods over atomic click/fill methods.

POM ENFORCEMENT

- All locators must exist only in the Page Object.
- All page interactions must exist only in the Page Object.
- Test Spec must call Page Object methods only.
- Test Spec must not contain page.locator(), page.getByTestId(), page.getByRole(), page.fill(), page.click().
- Import Page Objects into the test spec using relative imports.
- Generate compilable TypeScript.


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

async function generatePlaywrightScript(testCase,locatorCatalog) {

  const prompt = buildPrompt(testCase,locatorCatalog);
try {

  const model =
  genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

const result =
  await model.generateContent(prompt);

const content =
  result.response.text();

let parsed;

try {

  const cleanedContent =
  content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

parsed =
  JSON.parse(cleanedContent);
  parsed.pageObjectFileName =
  parsed.pageObjectFileName?.trim();

parsed.testFileName =
  parsed.testFileName?.trim();

  parsed.pageObjectContent =
  parsed.pageObjectContent?.trim();

parsed.testFileContent =
  parsed.testFileContent?.trim();

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
if (
  !parsed.pageObjectContent.includes("export class")
) {
  throw new Error(
    "Invalid Page Object generated"
  );
}

if (
  !parsed.testFileContent.includes("@playwright/test")
) {
  throw new Error(
    "Invalid Playwright test generated"
  );
}
return parsed;

} catch (error) {

 console.error(
  "Gemini Error:",
  error.message
);

  throw error;
}
}

module.exports = {
  generatePlaywrightScript
};