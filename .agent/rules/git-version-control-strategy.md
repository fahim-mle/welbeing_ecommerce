---
trigger: always_on
glob:
description:

# Git Version Control Strategy (Execution Policy)

This document defines how execution agents (e.g., Antigravity Open Agent Manager)
must use Git when implementing tasks from:

`specs/001-health-wellbeing-store/tasks.md`

This policy exists to ensure:
- Predictable Git history
- No “big bang” commits
- Clean separation of concerns
- Zero deviation from Spec Kit intent

This file governs **execution only**. It does NOT change specifications or plans.

---

## 1. Canonical Feature Branch

All work ultimately integrates into the canonical feature branch:

001-health-wellbeing-store

Rules:

- spec.md, plan.md, tasks.md are read-only during execution
- No execution may occur directly on main
- No execution may rename or replace the feature branch

---

## 2. Phase Branch Strategy (Primary Execution Layer)

Each phase in tasks.md MUST be executed on its own phase branch.

### Phase Branch Naming Convention

Format:
phase/001/phase-<number>-<slug>

Examples:

- phase/001/phase-1-setup
- phase/001/phase-2-foundation
- phase/001/phase-3-browsing
- phase/001/phase-4-checkout
- phase/001/phase-5-admin
- phase/001/phase-6-auth
- phase/001/phase-7-polish

### Phase Branch Rules

- Phase branches are created from 001-health-wellbeing-store
- All tasks in a phase execute against the phase branch by default
- Phase branches are merged back into 001-health-wellbeing-store
  after all tasks in that phase are complete and verified
- Phase branches may be deleted after successful merge

---

## 3. Task Branch Strategy (Selective, Not Mandatory)

Task branches are OPTIONAL and must be created **only when justified**.

### When a Task Branch MUST be Created

Create a task branch if the task:

- Modifies database schema or migrations
- Touches authentication or authorization logic
- Affects admin security boundaries
- Spans backend + frontend + tests in one task
- Is explicitly complex, risky, or cross-cutting

Examples from this feature:

- T033 (Admin Auth Middleware)
- T039–T041 (User Identity & Auth)
- Any Prisma schema changes beyond initial setup

### When NOT to Create a Task Branch

- Simple UI components
- Isolated API endpoints
- Styling, polish, or test-only tasks

### Task Branch Naming Convention

Format:
task/001/<TASK_ID>-<short-slug>

Examples:

- task/001/T033-admin-auth-middleware
- task/001/T039-user-identity-linking
- task/001/T014-product-catalog

### Task Branch Rules

- Task branches are created from the relevant phase branch
- Task branches are temporary
- Task branches MUST be merged back into the phase branch
- Task branches MUST be deleted after merge

---

## 4. Commit Strategy (Mandatory)

### Commit Granularity

- Commits must represent complete, testable units of work
- Never commit partial task state
- Never mix unrelated concerns in a single commit

### Commit Frequency

- At least one commit per completed task
- Multiple commits are encouraged for complex tasks

### Commit Message Convention

Use conventional prefixes:

feat(scope): new functionality
fix(scope): bug fix
test(scope): tests only
chore(scope): tooling, config, cleanup

Examples:

- feat(catalog): add product query service
- feat(api): implement GET /products with filters
- test(api): add product listing integration tests
- feat(auth): add user identity linking model
- fix(admin): restrict admin routes via middleware

---

## 5. Merge Strategy

### Order of Merges

1. task/*branch → phase/* branch
2. phase/* branch → 001-health-wellbeing-store

### Merge Rules

- Use non-fast-forward merges for task branches
- Ensure tests pass before merging
- Do not squash task branches unless explicitly instructed

---

## 6. Prohibited Actions (Hard Rules)

Execution agents MUST NOT:

- Modify spec.md, plan.md, or tasks.md
- Change feature scope or architecture
- Introduce real payment processing
- Add admin creation or role escalation UI
- Create Git branches outside this policy
- Commit everything in a single commit

Violations invalidate the execution.

---

## 7. Execution Order Enforcement

Execution must follow:

1. Phase order as defined in tasks.md
2. Task order within each phase
3. Dependency rules defined in tasks.md

Parallel execution is allowed ONLY for tasks marked [P].

---

## 8. Authority Hierarchy

If conflicts arise, precedence is:

1. spec.md
2. plan.md
3. tasks.md
4. THIS FILE (execution policy)
5. Agent defaults (lowest priority)

---

## Summary

- One feature branch
- One branch per phase
- Selective task branches only when justified
- Small, descriptive commits
- No speculative execution
- No Git decisions made ad hoc

Execution agents must follow this policy strictly.

---
