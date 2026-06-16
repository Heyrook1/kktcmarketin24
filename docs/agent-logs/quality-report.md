# Quality Report

Generated: 2026-05-02 05:00 UTC

## Requested checks

- `tsc --noEmit`
- `eslint .`
- `npm run test:qa`

## Results

| Check | Result | Details |
| --- | --- | --- |
| `pnpm typecheck` | Blocked | `pnpm: command not found` |
| `pnpm lint` | Blocked | `pnpm: command not found` |
| `pnpm test:qa` | Blocked | `pnpm: command not found` |
| `corepack enable pnpm` | Blocked | `corepack: command not found` |
| `npm run typecheck` | Blocked | `npm: command not found` |

## Notes

- The project scripts expose `pnpm typecheck`, `pnpm lint`, and `pnpm test:qa`
  equivalents for the requested commands.
- The repository has `pnpm-lock.yaml`, but this automation image does not expose
  Node package manager binaries on `PATH`; verification should be rerun in an
  environment with Node, Corepack, or pnpm installed.
