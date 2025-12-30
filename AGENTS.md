# Repository Guidelines

## Project Structure & Module Organization
- Root-level Node.js project defined by `package.json`.
- Primary entry point is `index.js` (per `main` in `package.json`). If you add new modules, keep them near the entry point or introduce a `src/` directory and update `main` accordingly.
- Dependencies are managed via npm and stored in `node_modules/` (do not edit or commit).

## Build, Test, and Development Commands
- `npm install`: installs runtime dependencies listed in `package.json`.
- `npm test`: currently exits with “no test specified”; replace with a real test runner when tests are added.
- `node index.js`: run the app directly if/when the entry point exists.

## Coding Style & Naming Conventions
- Use 2-space indentation for JavaScript files.
- Prefer `camelCase` for variables/functions and `PascalCase` for classes.
- Keep filenames lowercase with dashes if you create new modules (example: `prompt-utils.js`).
- Favor small, focused modules; avoid monolithic files for prompts or chains.

## Testing Guidelines
- No testing framework is configured yet. When adding tests, place them in `test/` or alongside modules (example: `foo.test.js`).
- Update `npm test` to run the chosen framework (e.g., `vitest`, `jest`, or `node --test`).

## Commit & Pull Request Guidelines
- No commit message convention is established in this repository. Use clear, imperative messages (example: `Add OpenAI chat chain`).
- PRs should include a short description, the motivation, and any required setup steps. If behavior changes, include sample input/output or logs.

## Security & Configuration
- Use `.env` for secrets (example: `OPENAI_API_KEY=...`) and load via `dotenv` in local runs.
- Do not commit secret files or API keys.
