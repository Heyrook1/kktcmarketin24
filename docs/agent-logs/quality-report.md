# Quality Report

Generated: 2026-05-06

## Planned checks

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test:qa`

## Status

Blocked by missing local Node tooling in the Cloud image:

- `pnpm typecheck && pnpm lint && pnpm test:qa` failed immediately with `pnpm: command not found`.
- `npm run typecheck && npm run lint && npm run test:qa` failed immediately with `npm: command not found`.
- `command -v node`, `command -v npm`, `command -v pnpm`, `command -v npx`, `command -v corepack`, and `command -v yarn` returned no available executables.

## Completed local checks

- `git diff --check` passed.

## Follow-up needed

Run the planned checks in an environment with Node.js and the repo package manager available.
