---
name: plan
description: Draft plan.md of a backend feature from its approved spec.md: the approach, the module and package placement, the numbered decisions for the reviewer, the interfaces and contracts, the test strategy, the risks and the definition of done. Use when the user asks for a plan, an implementation plan or a design for a feature that has a spec — or invokes /plan.
---

# Plan writer

You draft `plan.md`, step 2 of the lifecycle in `src/backend/docs/specs/README.md`. The plan
says HOW: which module and package, which decisions, which contracts, which tests. The reviewer
confirms each decision before task 1 starts. The plan is in STE (the rules-only tier; the
decisions themselves are strict STE); this skill prompt is not.

## Read first

1. `src/backend/docs/specs/<feature>/spec.md`. The feature: the user names it; otherwise the
   only folder with a `spec.md` and no `plan.md`; otherwise ask.
2. `src/backend/docs/specs/README.md` and `src/backend/docs/specs/templates/plan.md`. Keep
   the section order of the template.
3. `src/backend/docs/architecture.md`, all of it; at least sections 2, 3, 5, 6 and 7. The
   decisions in section 7 are fixed: a plan never opens one again without a sentence that
   says why, and it cites a decision instead of a new one.
4. `src/backend/CONTRIBUTING.md`, section 8 (the code standards and the module rules) and
   section 8.1 (how to add a configuration value).
5. `src/backend/docs/writing-guide.md` and `.claude/skills/shared/ste-checklist.md`.
6. The code of the packages that the feature touches, to see the existing patterns. A plan that
   repeats an existing pattern is better than a plan with a new one.

## Precondition

The plan starts after the reviewer approves the spec. If the user does not say that the spec is
approved, say so in 1 line and continue only when the user says to.

## Procedure

1. **Approach.** 1 paragraph: the shape of the solution, in the words of the spec.
2. **Modules and packages.** The module of each new package, `io.opencelium.<module>.<feature>`.
   Apply the rules: the dependency direction core/worker → execution → common, never the
   reverse; a class that fits 2 modules goes into the lower one, so say why a lower module is
   not possible; an execution feature is never in `core` or `worker` (contracts in `common`);
   a feature never adds a module; both deployment shapes keep working, and when the behaviour
   differs between the monolith and the distributed shape, say how each shape gets it.
3. **Decisions.** Numbered. Each decision has the question, the options, the recommendation
   and the reason. Only the decisions that the feature needs. A decision with an effect on the
   whole system gets the mark "candidate for section 7 of the architecture document; the
   architect agent drafts the record". A decision that closes an open decision of section 7
   says so. A decision of section 7 is never an option: cite it by number.
4. **Interfaces and contracts.** The new public types by responsibility, not by class name.
   The SPI changes. The endpoints: method, path, purpose, the permission. The runtime settings
   and the bootstrap properties, each with the answers to the 3 questions of architecture
   section 6.4 and the reason: the property list must not grow without one. When the feature
   has endpoints, list them here; write `api.yaml` only when the user asks, because the
   contract style (contract-first or code-first) is not decided.
5. **Test strategy.** For each criterion ID: a unit test, a slice test or a full-application
   test, as the test concept (architecture 6.8) and CONTRIBUTING section 9 say. `common` and
   `execution` get unit tests only; code that touches MongoDB gets a full-application test
   against the local MongoDB; external APIs are mocked at the Spring RestClient interface.
   Name the fakes and fixtures of `testsupport` that the tests use. The test class names come
   later, in `tasks.md`.
6. **Risks.** The table of the template: the risk and how the plan handles it.
7. **Definition of done.** The 4 lines of the template plus the items of this feature.
8. Write the file. Apply the check list; rewrite each sentence that breaks a rule.
9. End your answer with, in this order: the path of the file; the filled check list; the list
   "Decisions to confirm before task 1" (number, title, the recommendation, 1 line each); the
   next step. The next step is gate 2: the architect agent examines the module placement and
   the decisions when `.claude/agents/architect.md` exists, otherwise the reviewer examines
   them against sections 3 and 7. Then the reviewer confirms each decision, then `/tasks`.

## Rules for the document

- No status, no date, no commit hash. No Jira ticket. No Java class or interface name; a
  package, a property, a collection, a jar or a port is permitted when it is a contract.
- No new dependency, no new module, no abstraction with 1 user and no new bootstrap property
  without a decision or a line in "Interfaces and contracts" with the reason. The `implement`
  skill refuses them otherwise.
- Copy nothing from the legacy codebase or from a tutorial where the project has its own
  pattern.
- After task 1 starts, the plan changes only through a PR that says what changed and why.
  After the close of the feature it does not change at all.

## Output form

The end of the chat answer:

    Written: src/backend/docs/specs/<feature>/plan.md

    STE check list
    - [x] ...

    Decisions to confirm before task 1
    1. <Title>: recommended <a>, because <reason>.
    2. ...

    Next: gate 2 — <the architect agent | the reviewer> examines the module placement and the
    decisions; then the reviewer confirms each decision; then /tasks <feature>.
