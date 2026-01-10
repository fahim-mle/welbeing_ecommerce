# Workflow: Execute Feature 001 – Health Wellbeing Ecommerce

## Purpose

Execute the feature implementation defined in:
specs/001-health-wellbeing-store/tasks.md

This workflow is execution-only.
All product, architecture, and scope decisions are already finalized.

---

## Mandatory Constraints (Non-Negotiable)

- Follow all active Rules, including:
  - Git Version Control Strategy
- Do NOT modify:
  - spec.md
  - plan.md
  - tasks.md
- Do NOT introduce real payment processing
- Do NOT add admin creation or role escalation flows
- Authentication must support multiple providers per email
- Payment flow is simulated only

Violation of constraints invalidates execution.

---

## Execution Model

Execution proceeds **phase by phase**, never skipping ahead.

For each phase:

1. Create or switch to the phase branch (per Git Rules)
2. Execute tasks in listed order
3. Commit work incrementally per Git Rules
4. Run relevant tests
5. Stop and report if errors occur

Parallel execution is allowed ONLY for tasks marked `[P]`.

---

## Phase Execution Steps

### Step 1: Load Context (Read-Only)

- Read `spec.md` (context only)
- Read `plan.md` (context only)
- Read `tasks.md` (source of truth)
- Read Git Rules from:
  `.agent/workflows/git-version-control-strategy.md`

No files may be modified in this step.

---

### Step 2: Phase Initialization

For the current phase:

- Create phase branch if it does not exist
- Switch to phase branch
- Confirm clean working tree

---

### Step 3: Task Execution Loop

For each task in the phase:

1. Decide execution location:
   - Phase branch (default)
   - OR task branch (only if Git Rules require it)

2. Execute task strictly as written
   - Do not expand scope
   - Do not anticipate future tasks

3. Break task into logical implementation steps
   - Each step must be complete and testable

4. Commit after each logical step
   - Follow commit message conventions
   - Never commit partial or broken state

5. If task branch was used:
   - Merge task branch into phase branch
   - Delete task branch

6. Mark task as complete in report (not in tasks.md)

---

### Step 4: Phase Completion Check

Before ending a phase:

- All tasks in phase completed
- Tests pass
- No uncommitted changes
- Phase branch ready to merge

Merge phase branch into:
`001-health-wellbeing-store`

---

### Step 5: Reporting

After each phase:

- Report:
  - Completed tasks
  - Commits created
  - Branches merged/deleted
  - Any blockers or deviations

If a blocker exists:

- STOP execution
- Do not proceed to next phase

---

## Error Handling Policy

If an error occurs:

- Do NOT refactor unrelated code
- Do NOT “improve” architecture
- Do NOT bypass failing tests
- Stop execution and report the issue clearly

---

## Completion Criteria

The workflow is complete when:

- All 7 phases are executed
- Feature branch is up to date
- No temporary task branches remain
- All tests pass

---

## Authority Hierarchy

If instructions conflict, follow this order:

1. spec.md
2. plan.md
3. tasks.md
4. Git Version Control Strategy (Rule)
5. This Workflow
6. Agent defaults (lowest priority)
