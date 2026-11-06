# PR & review examples

Worked examples for the rules in [CONTRIBUTING.md](../CONTRIBUTING.md) §5 (pull requests) and §6 (code review). The rules live there; this file only shows what they look like in practice.

---

## 1. A good PR description

PR title: `feat(execution): add LOOP operator for iterating over collections (OC-1501)`

```markdown
## What

Adds the LOOP flow operator to the execution engine. A LOOP node takes a
collection-valued expression from the incoming payload, runs its body subgraph
once per element, and aggregates the per-iteration results into an ordered list
on the outgoing payload. Nested loops work; the iteration state is kept per
execution, so parallel executions of the same workflow do not interfere.

## Why

Spec: src/backend/docs/specs/loop-operator/spec.md, criteria LPL-01 to LPL-05. Task 2 of tasks.md.

## How to test

- Run a workflow with a LOOP node over a list of 3 elements; the outgoing payload holds 3 results in the input order.
- Confirmed: `./gradlew build`: green, 418 tests, 2026-11-06. Hand test: step 1, done by the agent.
- Not confirmed: nothing.
- Assumptions and follow-ups: (assumption) an empty collection gives an empty list, not an error; follow-up: the parallel batch size is task 3.
```

Why this works: "What" describes observable behavior, not file names. "Why" names the spec, the criteria and the task, so the reviewer finds the acceptance criteria without a search. "How to test" is a hand test that a person can repeat, and "Confirmed" carries the build command with its result and date instead of "the tests pass". Nothing follows "How to test": the tests are in commit 1 of the PR, and the checks of CONTRIBUTING 5.1 are the author's own work, not text in the PR.

---

## 2. The same PR, done badly

```markdown
## What

Loop changes

## Why

Closes OC-

## How to test

run the tests

## Checklist
- [x] Self-reviewed the diff
- [x] `./gradlew build` passes locally
- [ ] Tests added or updated — name them here
```

What's wrong, line by line:

- **"Loop changes"** — says nothing. Changed how? Added? Fixed? A reviewer must reverse-engineer the intent from the diff.
- **"Closes OC-"** — a placeholder, and the wrong content: a task PR names its spec, its criteria and its task. A ticket is linked only when one exists; a dangling `OC-` is neither.
- **"run the tests"** — no hand test step and no "Confirmed" line with the build command and its result. "The tests pass" without the command is not a claim.
- **The Checklist** — not part of the PR form (CONTRIBUTING 5.4). The checks of 5.1 are the author's own work before "Ready for Review"; an unchecked box in a PR says that the PR is still a Draft.

---

## 3. Review comments — one example per prefix

Written against plausible code in this project.

### `blocking:` — must be resolved before merge

> **blocking:** `WorkflowEngine.run` catches `Exception` around the node loop and
> returns a success result with the failed node silently skipped. A workflow that
> half-ran must not report success — callers will act on incomplete data.
> Fail the execution and record which node failed, or route to an error output
> if we add one. Needs a test either way: `runFailsExecutionWhenNodeThrows`.

Correctness issue + concrete failure scenario + a way forward. Blocking comments always say *why* it blocks.

### `question:` — needs an answer, not a change

> **question:** `LoopOperator` copies the payload for every iteration. Is that to
> isolate iterations from each other's mutations, or just defensive? If isolation
> is the contract, it's worth a sentence of Javadoc and a test pinning it — if
> not, a large collection pays for copies it doesn't need.

The reviewer genuinely doesn't know the intent and says what hinges on the answer.

### `nit:` — author's discretion

> **nit:** `res` in `IfOperator.evaluate` could be `branchResult` — the method
> has three locals called `res`, `r`, and `result`.

Small, concrete, no obligation.

### `suggestion:` — an alternative worth weighing

> **suggestion:** Instead of `Map<String, Object>` for iteration variables,
> consider a small `IterationContext` record (element, index, parent context).
> Same data, but nested-loop access becomes type-safe, and it gives Javadoc a
> place to state scoping rules. Fine as a follow-up ticket if you agree but
> don't want to grow this PR.

Includes the reasoning *and* respects PR scope.

---

## 4. A healthy review exchange, start to finish

1. **Reviewer** comments on `LoopOperator.java`:
   > **blocking:** An empty collection currently short-circuits to `null` output.
   > Downstream nodes will NPE on it — should be an empty list so aggregation
   > stays type-stable.
2. **Author** replies in-thread:
   > Agreed — fixed in `a3f91c2`, and added
   > `runProducesEmptyListWhenCollectionIsEmpty` to pin it.
3. **Author** resolves the thread (author addressed it, so author resolves — the reviewer re-checks resolved threads before re-approving) and clicks **re-request review**. Re-requesting is explicit; reviewers don't poll PRs for changes.
4. **Reviewer** verifies the fix, approves with one outstanding nit:
   > Approved. The `res` naming nit stands — address or ignore as you like.
5. **Author** squash-merges into `next`, deletes the branch, moves OC-1501 to Done.

Total elapsed: one round trip. That's the goal — precise comments and explicit re-requests keep it to one.
