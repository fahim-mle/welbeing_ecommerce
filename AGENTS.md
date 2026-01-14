# AGENTS.md

This file guides agentic coding tools working in this repo.

## Scope

- Applies to the whole repository unless a deeper `AGENTS.md` overrides it.

## Build / Lint / Test Commands

### Workspace (root)

- Install all deps: `npm run install:all`
- Run all builds: `npm run build`
- Run all tests: `npm run test`
- Run all lint: `npm run lint`
- Run both dev servers: `npm run dev`

### Backend (`src/backend`)

- Dev server: `npm run dev`
- Build: `npm run build`
- Start production build: `npm run start`
- Lint: `npm run lint`
- Tests (all): `npm run test`
- Run a single test (jest): `npx jest path/to/test-file.test.ts`
- Run tests by name: `npx jest -t "test name"`
- DB migrate: `npm run db:migrate`
- DB seed: `npm run db:seed`

### Frontend (`src/frontend`)

- Dev server: `npm run dev`
- Build: `npm run build`
- Preview build: `npm run preview`
- Lint: `npm run lint`
- Tests (all): `npm run test`
- Run a single test (vitest): `npx vitest run path/to/test-file.test.tsx`
- Run tests by name: `npx vitest run -t "test name"`

## Code Style Guidelines

### General

- Use TypeScript everywhere (strict types preferred).
- Prefer small, composable functions.
- Keep changes minimal and scoped to the task.
- Avoid introducing new dependencies unless required.
- Use descriptive names; avoid one-letter identifiers.

### Formatting

- Use 2-space indentation.
- Use semicolons consistently.
- Prefer single quotes for strings in TS/TSX.
- Use trailing commas where existing code does.

### Imports

- Group imports: external libs first, then local modules.
- Sort local imports from top-level to deeper paths.
- Avoid unused imports; keep imports explicit.

### Naming Conventions

- Variables/functions: `camelCase`.
- Types/interfaces: `PascalCase`.
- Components: `PascalCase`.
- Files: `camelCase.ts` or `PascalCase.tsx` depending on component usage.

### Error Handling

- Backend: throw `AppError`, `BusinessRuleError`, or `ValidationError` from `src/backend/src/types/shared`.
- Catch errors at the global handler (`src/backend/src/app.ts`) only.
- Always return structured JSON errors (no raw stack traces).

### API and Services

- Keep route handlers thin: validate input, call services.
- Put business logic in `src/backend/src/services`.
- Use Prisma via `src/backend/src/lib/prisma`.
- Use Zod schemas for request validation where possible.

### React / Frontend

- Use functional components and hooks.
- Keep API calls in `src/frontend/src/api`.
- Use shared UI in `src/frontend/src/components`.
- Prefer reusable components and consistent Tailwind classes.

## Docs and Specs

- API reference: `src/backend/API_DOCS.md`
- Swagger setup: `SWAGGER_SETUP.md`
- Task lists: `.docs/*.md`

## Agent Workflow (Gemini + Codex)

Use the following agent logic to process frontend improvement tasks.

### Requirements

- Read the frontend task list file.
- For each task:
  - Identify relevant files and docs.
  - Build a Gemini prompt with the required template.
  - Call Gemini in headless mode.
  - Parse the JSON response into steps.
  - Implement steps via Codex (or other codegen tool).
  - Log progress and mark tasks as done.

### Gemini Prompt Template (MUST USE)

```txt
You are an expert MERN developer.
Task: <task description>
Files: <list of specific file paths relevant to the task>
Docs: <list of relevant documentation file paths>
Return only a JSON array of detailed step-by-step instructions:
[
  {
    "description": "...",
    "codeSnippet": "...",  # optional example code
    "testSuggestions": [ "...", "..." ]
  },
  ...
]
```

### Agent Logic (JavaScript-style pseudocode)

```js
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const TASKLIST = '.docs/frontend_improvement_tasklist.md';
const DOCS_DIR = '.docs';
const FRONTEND_DIR = 'src/frontend';
const BACKEND_DIR = 'src/backend';

function parseTaskList(markdown) {
  return markdown
    .split('\n')
    .filter((line) => line.trim().startsWith('- [ ]'))
    .map((line) => line.replace('- [ ]', '').trim());
}

function findRelevantFiles(task) {
  const rules = [
    { match: /profile|account/i, files: ['src/frontend/src/pages/Profile.tsx'] },
    { match: /checkout/i, files: ['src/frontend/src/pages/Checkout.tsx'] },
    { match: /cart/i, files: ['src/frontend/src/pages/Cart.tsx'] },
    { match: /admin/i, files: ['src/frontend/src/pages/admin', 'src/frontend/src/components/admin'] },
    { match: /orders?/i, files: ['src/frontend/src/pages/Orders.tsx', 'src/frontend/src/api/orders.ts'] },
    { match: /product/i, files: ['src/frontend/src/pages/ProductDetail.tsx', 'src/frontend/src/api/catalog.ts'] },
    { match: /auth|password|verify/i, files: ['src/frontend/src/pages/auth', 'src/frontend/src/api/auth.ts'] },
  ];

  const matches = new Set();
  rules.forEach((rule) => {
    if (rule.match.test(task)) {
      rule.files.forEach((file) => matches.add(file));
    }
  });

  return Array.from(matches);
}

function buildPrompt(task, files, docs) {
  return `You are an expert MERN developer.\nTask: ${task}\nFiles: ${files.join(', ') || 'N/A'}\nDocs: ${docs.join(', ') || 'N/A'}\nReturn only a JSON array of detailed step-by-step instructions:\n[\n  {\n    "description": "...",\n    "codeSnippet": "...",  # optional example code\n    "testSuggestions": [ "...", "..." ]\n  }\n]`;
}

function runGemini(prompt, includeDirs) {
  const cmd = `gemini -p ${JSON.stringify(prompt)} --include-directories ${includeDirs.join(',')} --output-format json`;
  const output = execSync(cmd, { encoding: 'utf-8' });
  return JSON.parse(output);
}

async function codexImplement(step) {
  // Replace with real Codex tool invocation
  console.log(`Codex implementing: ${step.description}`);
}

async function processTasks() {
  const markdown = fs.readFileSync(TASKLIST, 'utf-8');
  const tasks = parseTaskList(markdown);
  const docs = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith('.md')).map((f) => path.join(DOCS_DIR, f));

  for (const task of tasks) {
    const files = findRelevantFiles(task);
    const prompt = buildPrompt(task, files, docs);
    const geminiResponse = runGemini(prompt, [FRONTEND_DIR, BACKEND_DIR]);

    const steps = geminiResponse.response || geminiResponse;
    for (const step of steps) {
      await codexImplement(step);
    }

    console.log(`Done: ${task}`);
  }
}

processTasks().catch(console.error);
```

## Notes for Agents

- Do not commit unless explicitly asked.
- Prefer existing patterns in `src/backend/src` and `src/frontend/src`.
- Update `.docs` tasklists when tasks are completed.
