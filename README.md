# Playwright Real World App

<p align="center">
  <img alt="Real World App Logo" src="./src/svgs/rwa-logo-light.svg#gh-dark-mode-only" />
  <img alt="Real World App Logo" src="./src/svgs/rwa-logo.svg#gh-light-mode-only" />
</p>

<p align="center">
  <a href="https://github.com/lordbaldwin1/playwright-rwa/actions/workflows/playwright.yml">
    <img src="https://github.com/lordbaldwin1/playwright-rwa/actions/workflows/playwright.yml/badge.svg?branch=develop" alt="Playwright Tests" />
  </a>
</p>

<p align="center">
  A payment application adapted from the <a href="https://github.com/cypress-io/cypress-realworld-app">Cypress Real World App</a> for learning and practicing <strong>real-world</strong> test automation with <a href="https://playwright.dev">Playwright</a>.
</p>

<p align="center">
  <img style="width: 70%" alt="Real World App screenshot" src="./public/img/rwa-readme-screenshot.png" />
</p>

> This application is for demonstration and education only. It is not a production system. Use it to practice E2E and API testing patterns against a full-stack app that behaves like real software.

## TODO
- [x] switch to serial test execution due to shared database.json file
- [ ] fix mobile viewport tests that assert things on nav menu

## About this fork

This repo migrates the Cypress RWA test suite to Playwright, including:

- **E2E (UI) tests** — page objects, fixtures, and helpers under [`playwright/`](./playwright/)
- **API setup in tests** — user creation, login, and bank-account setup via the backend API (see [`playwright/fixtures/`](./playwright/fixtures/))
- **CI** — GitHub Actions runs Playwright on push/PR ([`.github/workflows/playwright.yml`](./.github/workflows/playwright.yml))

The original Cypress tests remain under [`cypress/`](./cypress/) for reference but are not the focus of this fork.

## App stack

Built with [React](https://reactjs.org), [XState](https://xstate.js.org), [Express](https://expressjs.com), [lowdb](https://github.com/typicode/lowdb), [Material-UI](https://mui.com), and [TypeScript](https://typescriptlang.org).

- Full-stack Express + React with local JSON database (no external DB)
- Local username/password authentication
- Database seeding for repeatable tests

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) — see [.node-version](./.node-version)
- [Yarn Classic](https://classic.yarnpkg.com/) (v1)

```shell
npm install yarn@latest -g
```

> **Note:** This project uses Yarn Classic (v1), not Yarn Modern (v2+). If you use Corepack, the repo is configured for Yarn v1.

### Installation

```shell
git clone https://github.com/lordbaldwin1/playwright-rwa.git
cd playwright-rwa
yarn
```

**Mac (Apple Silicon):** if install fails on Chromium/Puppeteer, try:

```shell
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true yarn install
```

### Environment

The repo ships with a [`.env`](./.env) file. Key variables:

**Ports**

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `PORT` | `3000` | React frontend |
| `VITE_BACKEND_PORT` | `3001` | Express API |

**Database seeding** (used by `yarn dev`, `yarn db:seed`, and Playwright global setup)

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `SEED_USERBASE_SIZE` | `5` | Number of users in the seed DB; Playwright worker fixtures expect at least 2 |
| `SEED_DEFAULT_USER_PASSWORD` | `s3cret` | Password for all seeded users |
| `SEED_CONTACTS_PER_USER` | `3` | Contacts per user |
| `SEED_PAYMENTS_PER_USER` | `15` | Payments per user |
| `SEED_REQUESTS_PER_USER` | `10` | Requests per user |
| `SEED_BANK_ACCOUNTS_PER_USER` | `1` | Bank accounts per user |
| `SEED_LIKES_PER_USER` | `2` | Likes per user |
| `SEED_COMMENTS_PER_USER` | `2` | Comments per user |
| `SEED_NOTIFICATIONS_PER_USER` | `5` | Notifications per user |
| `SEED_BANK_TRANSFERS_PER_USER` | `5` | Bank transfers per user |
| `PAGINATION_PAGE_SIZE` | `10` | API pagination page size |

Playwright reads `PORT`, `VITE_BACKEND_PORT`, `SEED_DEFAULT_USER_PASSWORD`, and `SEED_USERBASE_SIZE` via [`playwright/config.ts`](./playwright/config.ts).

> Keep default ports (`3000` / `3001`) in CI. If you change ports locally, update `.env` only — do not commit port overrides meant for local dev.

Optional Auth0, Okta, Cognito, and Google variables are documented in `.env` (commented out) for the legacy `yarn dev:auth0` / `dev:okta` flows from the upstream app.

### Run the app

```shell
yarn dev
```

- Frontend: `http://localhost:3000` (or `PORT`)
- API: `http://localhost:3001` (or `VITE_BACKEND_PORT`)

Log in with any user from [`data/database.json`](./data/database.json). Default password for seeded users: `s3cret` (or your `SEED_DEFAULT_USER_PASSWORD`).

List dev users:

```shell
yarn list:dev:users
```

## Playwright tests

Playwright starts the API and React app automatically via `webServer` in [`playwright.config.ts`](./playwright.config.ts). A global setup project reseeds the database before tests run.

### Run tests

```shell
# Install browsers (first time)
yarn playwright install --with-deps

# Run all Playwright tests (headless)
yarn pw:test

# Interactive UI mode
npx playwright test --ui

# Headed browser
npx playwright test --headed

# Open last HTML report
npx playwright show-report
```

### Test layout

| Type | Location | Notes |
| ---- | -------- | ----- |
| Global setup | [`playwright/tests/global.setup.ts`](./playwright/tests/global.setup.ts) | Reseeds DB via `/testData/seed` |
| UI (E2E) | [`playwright/tests/ui/`](./playwright/tests/ui/) | Auth, bank accounts, transactions |
| Page objects | [`playwright/pages/`](./playwright/pages/) | Sign-in, home, bank accounts, etc. |
| Fixtures | [`playwright/fixtures/index.ts`](./playwright/fixtures/index.ts) | Seeded users, unique API users, logged-in state |

### Auth in tests

This SPA needs both a session cookie and XState in `authorized` state. Use [`loginWithXState`](./playwright/helpers/auth.ts) (or the `loggedInTestUser` / `uniqueLoggedInUser` fixtures) instead of UI sign-in alone when you need a ready-to-use session.

## Database

- Data file: [`data/database.json`](./data/database.json) ([lowdb](https://github.com/typicode/lowdb))
- Seed source: [`data/database-seed.json`](./data/database-seed.json)
- Reseed manually: `yarn db:seed`
- Empty DB demo: `yarn start:empty`

`yarn dev` reseeds on start. Playwright global setup reseeds before each test run.

## Useful scripts

| Script | Description |
| ------ | ----------- |
| `yarn dev` | Start API (watch) + frontend |
| `yarn start` | Start API + frontend (no watch) |
| `yarn pw:test` | Run Playwright tests |
| `yarn db:seed` | Regenerate seed data in `/data` |
| `yarn list:dev:users` | Print seeded user ids and usernames |
| `yarn types` | Typecheck the project |

See [`package.json`](./package.json) for the full list (including legacy Cypress scripts).

## CI

Playwright runs on GitHub Actions for branches `main`, `master`, and `develop`. Failed runs upload the `playwright-report` artifact for 30 days.

## License

MIT — see [LICENSE](./LICENSE).

Based on [cypress-io/cypress-realworld-app](https://github.com/cypress-io/cypress-realworld-app).
