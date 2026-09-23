# Tooling

- Uses pnpm workspaces as the package manager, with root scripts for `dev`, `build`, `test`, `lint`, and `typecheck` executed recursively. Confidence: 0.8
- Frontend stack: Vite + TypeScript + Tailwind CSS + shadcn/ui components. Confidence: 0.85
- Backend stack: Express + TypeScript + Mongoose (MongoDB). Confidence: 0.85
- Uses Zustand for client state management. Confidence: 0.75
- Uses a single Axios instance configured in `src/setup/axiosSetup.ts` for API calls. Confidence: 0.8
- Expects environment configuration set up per app (`.env` plus a versioned `.env.example`). Confidence: 0.75
- Wants an `AGENTS.md` at the repository root documenting the structure and mapping of the monorepo. Confidence: 0.8
