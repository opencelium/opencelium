# PR & review examples

Worked examples for the rules in [CONTRIBUTING.md](../CONTRIBUTING.md) §5 (pull requests) and §6 (code review). The rules live there; this file only shows what they look like in practice.

---

## 1. A good PR description

PR title: `feat(execution): add LOOP operator for iterating over collections (OC-1501)`

```markdown
## What

Added the LOOP flow operator to the execution engine. A LOOP node takes a
collection-valued expression from the incoming payload, runs its body subgraph
once per element, and aggregates the per-iteration results into an ordered list
on the outgoing payload. Nested loops are supported; iteration state is kept
per execution, so parallel executions of the same workflow don't interfere.

## Why

Closes OC-1501

Workflows currently process only single objects. Syncing use cases
(e.g. "for every Jira ticket, create an OTRS entry") need per-element
iteration — this is the second of the two planned flow operators (IF landed
in OC-1489).

## How to test

    ./gradlew :execution:test --tests "*.LoopOperatorTest"
    ./gradlew :execution:test    # full engine suite

No Docker needed — everything is unit-level.

## Checklist
- [x] Self-reviewed the diff
- [x] `./gradlew build` passes locally
- [x] Tests added or updated — `LoopOperatorTest` (12 cases: empty collection,
      single element, nested loop, non-collection input rejected, aggregation
      order), extended `WorkflowEngineTest` with a LOOP-in-graph walk case
- [x] No secrets, debug logs, or commented-out code
- [x] WIP commits squashed
```

Why this works: "What" describes observable behavior, not file names. "Why" gives the product reason and links the ticket. "How to test" is copy-pasteable and says whether Docker is needed. The checklist names the actual test classes and what they cover.

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
- [x] No secrets, debug logs, or commented-out code
- [ ] WIP commits squashed
```

What's wrong, line by line:

- **"Loop changes"** — says nothing. Changed how? Added? Fixed? A reviewer must reverse-engineer the intent from the diff.
- **"Closes OC-"** — placeholder left in; either reference the real ticket or remove the line (tickets are encouraged, not mandatory — but a dangling `OC-` is neither).
- **"run the tests"** — which task, which module, Docker or not? The reviewer shouldn't have to guess.
- **Unchecked "Tests added"** — either the behavior is untested (blocking) or the box was skipped carelessly. Both read badly.
- **Unchecked "WIP commits squashed"** — the PR isn't Ready for Review yet; it should still be a Draft.

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
