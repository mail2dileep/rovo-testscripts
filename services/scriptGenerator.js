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
    .filter(
      el =>
        el.visible !== false &&
        (
          el.testId ||
          el.id ||
          el.ariaLabel ||
          el.text ||
          el.label ||
          el.placeholder ||
          el.recommendedLocator ||
          el.href
        )
    )
    .sort(
  (a, b) =>
    (a.locatorPriority || 99) -
    (b.locatorPriority || 99)
)
.slice(0, 300);

   const promptLocators =
  filteredLocators.map(el => ({
    tag: el.tag,
    text: el.text,
    label: el.label,
    inputType: el.inputType,
    radioGroup: el.radioGroup,
    options: el.options,
    role: el.role,
    testId: el.testId,
    ariaLabel: el.ariaLabel,
    currentValue: el.currentValue,
    id: el.id,
    href: el.href,
    recommendedLocator:
      el.recommendedLocator,
    locatorPriority:
      el.locatorPriority,
      displayName:
  el.label ||
  el.text ||
  el.ariaLabel
  }));

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
Do not include text before or after JSON.
Do not include comments outside generated TypeScript code.
Response must start with { and end with }.`;


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

${promptLocators.length === 0
  ? "No locators were discovered. Add TODO comments for missing locators."
  : JSON.stringify(promptLocators, null, 2)
}


LOCATOR RULES

- Use locators only from the Locator Catalog.
- Never invent selectors that do not exist in the Locator Catalog.
- Always use the recommendedLocator when it is available.
- Do not generate alternative selectors when recommendedLocator is present.
- Match test step action verbs (click, enter, select, choose, verify, submit, navigate) to the most appropriate element in the Locator Catalog.
- Match expected results with relevant page elements where applicable.
- Use locator metadata such as:
  - label
  - inputType
  - radioGroup
  - options
  - currentValue
  - ariaLabel
  - text
  - role
  to identify the correct element.
- When multiple matching locators exist, choose the locator with the lowest locatorPriority value.
- Prefer stable locators over text-based locators.
- NEVER generate:
page.locator('a[href=...]')
page.locator('.class')
page.locator('[attribute=value]')

unless the exact locator appears in recommendedLocator.

LOCATOR PREFERENCE ORDER

1. page.getByTestId()
2. page.getByRole()
3. page.getByLabel()
4. page.locator('#id')
5. page.getByPlaceholder()
6. page.getByText()

- Avoid XPath unless absolutely necessary.
- Do not generate placeholder selectors.
- Do not generate CSS selectors that are not present in the Locator Catalog.
- Do not use:
  - nth-child
  - xpath
  - dynamic CSS classes
  - brittle selectors

RADIO BUTTON RULES

- Use radioGroup and label information when selecting radio buttons.
- Prefer getByLabel() for radio button interactions.
- Generate meaningful methods such as:
  - selectResidentialService()
  - selectCommercialService()

DROPDOWN RULES

- Use available options metadata when generating selectOption() actions.
- Generate business-oriented methods instead of generic select methods.

LINK RULES

- Use href and link text metadata when generating navigation actions.
- Generate meaningful navigation methods.

FALLBACK RULES

- If no suitable locator exists in the Locator Catalog, add:


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
- Test Spec must instantiate the Page Object using:
  const pageObject = new <PageObjectClass>(page);
- Assertions must remain in the Test Spec.
- Page Object methods must not contain expect() statements.
- Every Page Object method must return Promise<void> unless a value is explicitly required.
- Use async/await for all Playwright interactions.
- Page Object constructor must accept Page from Playwright.


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

const jsonMatch =
  cleanedContent.match(
    /\{[\s\S]*\}/
  );

if (!jsonMatch) {
  throw new Error(
    "No JSON object returned"
  );
}

parsed =
  JSON.parse(jsonMatch[0]);
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
if (
  !parsed.pageObjectContent.includes("Page")
) {
  throw new Error(
    "Page Object class missing"
  );
}

if (
  !parsed.testFileContent.match(
    /new\s+\w+Page\s*\(/
  )
) {
  throw new Error(
    "Page Object instantiation missing"
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