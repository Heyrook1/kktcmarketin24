# kktcmarketin24

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_a4UaV6laHYrnssDOye0PQCar5kBr)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

## Autonomous orchestrator

This repository includes a TypeScript orchestrator for routine autonomous checks.

Run once immediately (without keeping the scheduler alive):

```bash
npm run orchestrator:once
```

Run continuously with minute-based scheduling:

```bash
npm run orchestrator:start
```

The orchestrator logs to `docs/agent-logs/orchestrator.log` and runs:
- 09:00: QA scan + backend API health checks
- 14:00: frontend UI structure checks + backend connection checks
- 22:00: critical page existence checks + QA quality checks

<a href="https://v0.app/chat/api/kiro/clone/Heyrook1/kktcmarketin24" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
