# Feature-Based Architecture

> **Note:** This guide explains feature-based architecture patterns. For complete project structure, see [docs/PROJECT_STRUCTURE.md](/docs/PROJECT_STRUCTURE.md).

We use a **vertical slice** architecture where each major business domain is a "feature". This keeps related code together and avoids the "layer" jumping (controllers -> services -> utils) common in MVC.

## Directory Structure

Each feature folder (e.g., `features/auth`, `features/billing`) should follow this internal structure:

- **`/components`**: React components specific to this feature.
  - *Example*: `AuthForm.tsx`, `LoginButton.tsx`.
- **`/hooks`**: Custom React hooks for this feature's logic.
  - *Example*: `useAuth.ts`, `usePermissions.ts`.
- **`/server`**: Server-side logic, specifically **Server Actions**.
  - *Example*: `actions.ts`.
- **`/types`**: TypeScript interfaces and Zod schemas specific to this feature.
  - *Example*: `types.ts`, `schema.ts`.

## Rules

1. **Colocation**: If a component is only used by the Auth feature, it belongs in `features/auth/components`, not `components/shared`.
2. **Public Interface**: If a feature needs to expose components to the rest of the app, export them from an `index.ts` file in the feature root (optional but good for boundaries).
3. **Shared Components**: Generic UI elements (Buttons, Cards, Inputs) remain in `@/components/ui`.
