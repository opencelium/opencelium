---
name: tasks
description: Cut a backend feature with an approved spec.md and plan.md into PR-sized tasks and write tasks.md. Each task is 1 pull request of 400 lines or less without the tests and gives 1 finished, hand-testable function. Use when the user asks for the tasks, the task list, the PR cut or the breakdown of a feature — or invokes /tasks.
---

# Task list writer

You draft `tasks.md`, step 3 of the lifecycle in `src/backend/docs/specs/README.md`. The
reviewer examines the cut into PRs. The task list is the only file of the spec folder with a
status; the `implement` skill updates it with each PR. The task list is in STE; this skill
prompt is not.

## Read first

1. `spec.md` and `plan.md` of the feature. The feature: the user names it; otherwise the only
   folder with a `plan.md` and no `tasks.md`; otherwise ask.
2. `src/backend/docs/specs/README.md` and `src/backend/docs/specs/templates/tasks.md`. Keep
   the fields and their order.
3. `src/backend/CONTRIBUTING.md`, section 5 (the PR rules, what to leave out, the size table)
   and section 9 (the test taxonomy, the test location, the test names).
4. `src/backend/docs/writing-guide.md` and `.claude/skills/shared/ste-checklist.md`.
5. The code of the modules that the plan names, for a realistic size estimate.

## Precondition

The reviewer confirms each decision of the plan before task 1 starts. If the user does not say
that the decisions are confirmed, say so in 1 line and continue only when the user says to.

## Procedure

1. List the criteria of `spec.md` and the test strategy of `plan.md`.
2. Cut the feature into tasks:
   - 1 task is 1 PR of 400 lines or less, without the tests and the generated code. The
     target is 200 or less (CONTRIBUTING 5.3). Estimate from similar packages in the code.
   - 1 task gives 1 finished function with a visible result that a person can hand-test: an
     endpoint answers, a screen shows a value, a log line appears, a setting takes effect, a
     command prints a result.
   - No test-only task and no groundwork-only task. New types go into the task of their first
     user. When the groundwork alone is near the limit, task 1 is the groundwork plus its
     smallest user, and the next tasks depend on task 1.
   - Each criterion of `spec.md` is in the Criteria line of at least 1 task. A criterion in
     2 tasks says in which task its test is written.
   - A task that changes the behaviour of a criterion changes `spec.md` in the same PR. Say so
     in the Function line.
   - Order: the dependencies first; the thinnest vertical slice first when possible, so that
     the reviewer sees the function early.
3. Fill each task with the fields of the template:
   - **Title.** The Conventional Commits form `<type>(<scope>): <description>`, 72 characters
     or less, lower case, imperative. It becomes the PR title and the squash commit.
   - **Criteria.** The IDs.
   - **Function.** 2 sentences: what is visible after the PR.
   - **Tests.** The test class and its cases, named as CONTRIBUTING 9.4 says
     (`<method><ExpectedBehavior>When<Condition>`), of the kind the plan names (unit, slice or
     full application), in the location of 9.2 (same module, same package, `src/test`). At
     least 1 case for each criterion of the task.
   - **Hand test.** Numbered steps, 20 words or less each, that a person does with the
     running application or with a command. The last step names the expected result.
   - **Size.** Approximately n lines, without the tests.
   - **Depends on.** The task number, or "nothing".
   - **Status.** open.
4. Write the file. Apply the check list; the hand test steps are instructions (20 words).
5. End your answer with, in this order: the path of the file; the filled check list; the size
   table; the criteria coverage; the next step. The next step: the reviewer examines the cut,
   then `/implement <feature>`.

## The size table

| Task | Title | Lines without tests | Test cases | Depends on |
|---|---|---|---|---|
| 1 | ... | approximately 150 | 4 | nothing |
| Total | | approximately n | n | |

A task above 400 lines is split before the output, never shown. The criteria coverage is 1
line per criterion: `LPL-01: task 1`.

## Rules for the document

- The Status line is the only status in the spec folder; `spec.md` and `plan.md` have none.
- No Jira ticket. No date, no commit hash. No Java class, except the test class in the Tests
  line: the test commit of a task is written from that line, and the task list does not
  change after the close of the feature.
- A task never adds a dependency, a module, a property or an abstraction that `plan.md` does
  not name. When the cut needs one, stop and ask; on the user's yes, the line goes into
  `plan.md` first.

## Output form

The end of the chat answer:

    Written: src/backend/docs/specs/<feature>/tasks.md

    STE check list
    - [x] ...

    Size table
    | Task | Title | Lines without tests | Test cases | Depends on |
    ...

    Criteria coverage
    LPL-01: task 1
    ...

    Next: the reviewer examines the cut; then /implement <feature>.
