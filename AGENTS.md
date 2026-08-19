# Frontend agent instructions

## Mandatory TAMI Git workflow

These rules are mandatory for humans and all coding agents:

- Fetch the remote and create every work branch from the latest `origin/dev`.
- Open feature, fix, documentation, Entity, and migration PRs against `dev`, never `main`.
- Never merge or enable auto-merge. Never bypass branch protection or approve your own PR. A teammate must provide all required reviews and approvals.
- Keep Entity/schema mapping changes, new database migrations, and application logic in separate branches and separate PRs.
- Existing committed or shared-environment migrations are immutable. Never edit, delete, rename, reorder, or overwrite them. Add a new forward-only migration.
- After opening a PR, return its clickable URL for the Jira ticket, request review only from known teammates or configured CODEOWNERS, and report `Pending code review/approval`.
- Notify the team chat/Zalo with PR type, changed Entities (or none), added migrations (or none), data impact, and PR URL. Without delivery access or evidence, prepare the exact message and report `Pending Zalo notification`; never claim it was sent.
- A task request never authorizes a merge. Stop after PR handoff and wait for teammate approval.

Before changing code, inspect the production `src` tree and follow the existing architecture, naming, module boundaries, validation, and test conventions. Do not copy code from demo projects or invent a parallel structure.

## Frontend architecture

- This repository is a React, TypeScript, Vite, Tailwind CSS application.
- Inspect the current `src` structure before adding files and keep domain UI, API access, state, validation, and tests within the established feature boundaries.
- Reuse the shared API client and existing UI components; do not create parallel application shells or duplicate infrastructure.
- Add focused component/unit tests and browser verification for user-visible behavior.
- Run the repository's relevant typecheck, lint, test, and build commands before opening a PR.
