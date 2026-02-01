# Git Branching & Execution Policy

This document defines **how Git must be used** during development.
It focuses only on **branch creation, naming conventions, and rules of use**.

This policy is intentionally simple and tool-agnostic.

---

## Special instructions

- `001-health-wellbeing-store` is the long-lived **trunk** branch for this project.
- Do not merge to trunk without review.
- **Docs live in `docs/` and are intended to be committed** (no secrets).
- Local scratch notes can go in `.docs/` (ignored by git).

## 1. Branch Naming Convention (Mandatory)

### Canonical Format

```md
<type>/<TYPE_LETTER><F-Frontend or B-Backend><NUMBER>-<slug>
Frontend Example: feature/FF001-admin-dashboard-analytics-on-product
Backend Example: chore/CB019-refactoring-auth-api-and-common-util-function-seperation
```

### Allowed Branch Types

| Type     | Prefix  | Letter | Purpose                     |
|----------|---------|--------|-----------------------------|
| Feature  | feature | F      | Large or long-running work  |
| Task     | task    | T      | Focused implementation work |
| Fix      | fix     | X      | Bug fixes                   |
| Chore    | chore   | C      | Tooling, config, refactors  |
| Test     | test    | S      | Tests only                  |
| Refactor | refactor| R      | Refactors only              |

### Examples

Use descriptive names that's easy to understand about the branch

feature/FB001-health-wellbeing-store-OAuth-implementation
feature/FF002-product-catalog-service-and-api-implementation

task/TF039-user-identity-linking (Should be a bit more descriptive than this)
fix/X012-order-total-bug (Should be a bit more descriptive than this)
chore/C004-prisma-migration (Should be a bit more descriptive than this)
test/S007-product-api-tests (Should be a bit more descriptive than this)
refactor/R003-backend-auth-service-refactor (Should be a bit more descriptive than this)

### Rules

- `<NUMBER>` must be zero-padded (e.g. `001`, `039`)
- `F` for frontend and `B` for backend, should be easier to understand later.
- `<slug>` must be lowercase, kebab-case
- IDs must be unique within their type
- Branch names must be descriptive and stable

### Prohibited

wip
temp
final
new-branch
bugfix
feature/login

---

## 2. Branch Creation Rules

### Trunk-based workflow

- Work happens on short-lived branches.
- Merge frequently back into trunk via PR.
- Prefer feature flags over long-lived branches.

### Branches

- Short-lived branches: `feature/*`, `fix/*`, `chore/*`, `refactor/*`, `test/*`
- Keep scope tight: one concern per branch.
- Merge target is usually trunk (`001-health-wellbeing-store`).

---

## 3. Commit Rules

### Do CR

- Make commits small, complete, and testable
- Use clear, conventional and descriptive with dashed (-) points commit messages, should describe the file changes briefly on each dashed points
- One logical change per commit

### Don’t CR

- Commit partial or broken work
- Mix unrelated changes in one commit
- Commit generated files unless required

---

## 4. Merge Rules

### Do

- Merge task/fix branches into their target branch
- Resolve conflicts on the source branch
- Ensure code builds and tests pass before merge

### Don’t

- Commit directly to `001-health-wellbeing-store`
- Merge unfinished work
- Force-push shared branches

---

## 5. Rebase Rules

### Allowed

- Local cleanup before pushing
- Personal branches not yet shared

### Forbidden

- Rebasing shared branches
- Rebasing after merge
- History rewriting on `main`

---

## 6. Hard Do’s and Don’ts

### Always Do

- Follow the naming convention exactly
- Keep branches focused and short-lived
- Delete branches after successful merge

### Never Do

- Create branches without an ID
- Use ambiguous branch names
- Push broken or untested code
- Rewrite shared history

---

## What not to commit

- Secrets (`.env`, tokens, credentials)
- `node_modules`, build outputs
- Local scratch docs under `.docs/`

## Summary

- Branch names must follow a strict, readable pattern
- Feature branches organize work
- Task-level branches isolate risk
- Clean history is mandatory
- No ad-hoc Git usage

This policy is designed to be **simple, enforceable, and scalable**.
