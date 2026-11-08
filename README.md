# Recall

Study notes and topics become flashcards and quizzes through Gemini. Built with React, TypeScript, Vite, Express, and Zod.

## Local development

Requires Node.js 22.12+ (22.x) and npm.

```sh
npm ci
cp .env.example .env
# Set GEMINI_API_KEY in .env before starting.
npm start
```

Open [localhost:3000](http://localhost:3000). Use `npm run dev` for automatic server restarts. Three labeled example sets are available without credentials.

Get a key from [Google AI Studio](https://aistudio.google.com/apikey). Credentials stay on the server; `.env` is excluded from Git and Docker. Never use a `VITE_` variable for a secret.

| Environment variable | Default                 | Purpose                                 |
| -------------------- | ----------------------- | --------------------------------------- |
| `GEMINI_API_KEY`     | Required for generation | Server-side API credential              |
| `GEMINI_MODEL`       | `gemini-2.5-flash`      | Model supporting JSON-schema output     |
| `PORT`               | `3000`                  | HTTP port                               |
| `LLM_TIMEOUT_MS`     | `45000`                 | Provider deadline, capped at 45 seconds |

## Production

```sh
npm ci
npm run build
npm prune --omit=dev
npm run serve
```

The production server serves the compiled frontend and API on one origin. Supply `GEMINI_API_KEY` through the host's secret or environment settings. `GET /api/health` reports configuration without exposing credentials or calling Gemini.

Docker uses a multi-stage build and runs as the unprivileged `node` user:

```sh
docker build -t recall .
docker run --rm -p 3000:3000 --env-file .env recall
```

The current application serves one user with browser-local storage. A shared public deployment needs authentication and request/usage limits at the API boundary.

For Vercel, import the GitHub repository using the Vite preset. `vercel.json` sets the build command and `dist` output; `api/index.ts` serves the existing API as one function. Add `GEMINI_API_KEY` and optionally `GEMINI_MODEL` to the project's environment variables before deploying. No start command is needed on Vercel.

## Checks

```sh
npm run check           # Type checking, unit/API tests, production build
npm run format:check
npx playwright install chromium
npm run test:e2e        # Desktop/mobile workflows and accessibility
npm audit
```

With Google Chrome installed, use `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`. Browser tests start the server automatically. Automated generation tests use controlled upstream responses and do not spend API credits.

## Code structure

- `src/`: React screens, components, hooks, styles, and example sets.
- `server/`: HTTP API, Gemini integration, bounded responses, deadlines, and safe errors.
- `shared/`: Zod contracts, inferred types, and generation timeout budgets.
- `tests/`: API, parsing, request lifecycle, persistence, and browser regression tests.

Input and generated output are validated on the server and again in the browser. Failed generation preserves the notes and never substitutes an example silently. Cancelled or stale responses cannot replace the active request.

The browser retains the latest 20 sets and card mastery. Quiz attempts reset when leaving the quiz. Generated facts should be checked against the source material.
