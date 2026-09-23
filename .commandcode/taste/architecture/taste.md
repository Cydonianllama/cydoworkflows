# Architecture

- Organizes projects as a pnpm monorepo with `apps/*` (e.g. `api`, `webapp`) and `packages/*` for shared code. Confidence: 0.85
- Wants the `auth` package to be persistence-agnostic: the core defines only contracts/DTOs/flow and a port, and does not know the database until the API injects an adapter. Confidence: 0.85
- API source layout: `src/modules/*`, `src/middleware`, `src/setup`, and a top-level `src/index.ts`. Confidence: 0.8
- Frontend code organized by feature modules at `src/modules/{module}` with a fixed internal anatomy: `_test`, `catalog`, `components`, `actions`, `hooks`, `store`, `compositions`, `scaffold`, and `screen.tsx`. Confidence: 0.9
- `actions/` hooks are the only layer allowed to call the API layer (`lib/api`) and manipulate data. Confidence: 0.9
- Components must be agnostic of any business model: props are plain and values/state are injected by `compositions`, never read from store or API. Confidence: 0.9
- `catalog/` holds static select options/array data and configuration; components never query catalog data themselves — compositions pass it down. Confidence: 0.85
- The store contract must be agnostic of the state library: interfaces for state/actions are defined without importing the library; only one isolated implementation file binds it (Zustand), and components/actions/compositions must not import the state library directly. Confidence: 0.85
- Modules are hermetic: a module may not import another module's store, actions, or internal logic; cross-module communication happens via a typed EventBus. Confidence: 0.85
- EventBus events are typed with an explicit payload and name past-tense facts (`chat.message.created`), never commands aimed at another module; the publisher never knows the subscribers. Confidence: 0.85
- Tests are scoped to action hooks, not UI, so they stay resilient to changes in models or the API. Confidence: 0.85
- `features/` holds functionality reusable across modules with its own isolated state (e.g. notifications, global search, confirm dialogs). Confidence: 0.75
- `scaffold/` (module layout/distribution of components) is only created when explicitly requested. Confidence: 0.7
- `lib/api` is split per section (`auth`, `workflows`, ...) with one file per request plus DTO files, and shared `lib/types` for response envelopes. Confidence: 0.8
- Top-level `layout/` holds the app's main aside and header. Confidence: 0.7
- Reusable cross-module components live in the top-level `components/` (with `components/ui` for shadcn). Confidence: 0.7
