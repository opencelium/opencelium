# Contributing to OpenCelium

This document defines the git policy and contribution workflow for the OpenCelium rewrite. The git policy (branching, commits, pull requests, versioning) applies to the whole repository; the code and test standards are specific to the backend (`src/backend`).

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Getting started](#2-getting-started)
3. [Branching model](#3-branching-model)
4. [Commit messages](#4-commit-messages)
5. [Pull requests](#5-pull-requests)
6. [Code review standards](#6-code-review-standards)
7. [Versioning](#7-versioning)
8. [Backend code standards](#8-backend-code-standards)
9. [Testing](#9-testing)
10. [What not to commit](#10-what-not-to-commit)

---

## 1. Prerequisites

| Tool | Minimum version | Purpose |
|---|---|---|
| JDK | 25 | Compilation and test execution (Gradle toolchain downloads it if absent) |
| Docker | 24 | Testcontainers — integration tests only |
| Gradle | wrapper (`./gradlew`) | Build and test orchestration |
| MongoDB | 7.0+ | Document store — needed only to *run* the core app locally |

Unit and slice tests run without Docker or any locally installed database.

All `./gradlew` commands in this guide run from `src/backend/`.

## 2. Getting started

```bash
./gradlew build                      # compile everything + run all tests
./gradlew :core:bootRun              # run the core app (http://localhost:9090)
./gradlew :worker:bootRun            # run the worker app (http://localhost:9091)
./gradlew :core:bootJar :worker:bootJar   # deployable jars in <module>/build/libs
```

## 3. Branching model

| Branch | Purpose | Rules |
|---|---|---|
| `prod` | Production releases. Every commit on `prod` is a released, tagged version. | Never commit directly. Only `next` (releases) and `hotfix/*` branches merge here. |
| `next` | Integration branch — the current state of development. | Never commit directly. Changes arrive only via pull requests. |
| `feature/<short-description>` | New functionality. Branched off `next`. | e.g. `feature/workflow-engine-loop-operator` |
| `fix/<short-description>` | Bug fixes for unreleased code. Branched off `next`. | e.g. `fix/if-operator-null-comparison` |
| `hotfix/<short-description>` | Urgent fixes for production. Branched off `prod`. | Merged into `prod` **and** back into `next`. |

Flow: branch off `next` → open a PR into `next` → review + green CI → squash-merge. When a release is cut, `next` is merged into `prod` and tagged.

### Branch naming

- Lowercase, hyphen-separated: `feature/node-type-registry`, not `feature/NodeTypeRegistry`.
- If a ticket exists, include its number: `feature/OC-123-node-type-registry`.
- Keep branches short-lived (days, not weeks). Rebase onto `next` if you fall behind; never rebase a branch others are working on, and never force-push a branch that is under active review without coordinating with the reviewer.

## 4. Commit messages

We follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <description> (OC-NNNN)

[optional body]

[optional footer(s)]
```

**Types:**

| Type | Use for |
|---|---|
| `feat` | New user-facing functionality |
| `fix` | Bug fixes |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvements |
| `test` | Adding or correcting tests |
| `docs` | Documentation only |
| `build` | Build system, Gradle, dependencies |
| `ci` | CI configuration |
| `chore` | Maintenance that touches no src/test code |

**Scope** is optional but encouraged; use the module or area: `core`, `worker`, `execution`, `common`, `frontend`.

**Ticket references** are encouraged, not mandatory: when a Jira ticket exists, append it to the subject — `feat(core): add role endpoint (OC-1412)`. Small chores without a ticket are fine.

**Examples:**

```
feat(execution): add LOOP operator for iterating over collections (OC-1501)
fix(core): reject workflow definitions with cyclic connections (OC-1489)
build: bump Spring Boot to 4.1.2
refactor(common)!: rename Connector to NodeType

BREAKING CHANGE: public API renamed; update stored workflow definitions.
```

**Rules:**

- Imperative mood, lower case, no trailing period: `add LOOP operator`, not `Added LOOP operator.`
- Subject line ≤ 72 characters; details go in the body.
- Breaking changes: append `!` after the type/scope and add a `BREAKING CHANGE:` footer.
- One logical change per commit. Don't mix a refactor with a feature.
- Squash WIP commits before marking a PR ready; every remaining commit follows this format.

## 5. Pull requests

Every change to `next` or `prod` goes through a PR — no direct pushes.

### 5.1 What a PR must include

Before a PR is marked Ready for Review, all of these hold:

| Requirement | Detail |
|---|---|
| **Green build** | `./gradlew build` passes locally; integration tests too when the PR touches integration paths. |
| **Tests for the change** | Every changed behavior has at least one covering test, named in the description. |
| **One logical change** | A feature and its refactor ship separately unless truly inseparable. |
| **Ticket reference** | The Jira ticket (`OC-NNNN`) is linked when one exists. |
| **Complete description** | Every template section filled in — no placeholders left. |
| **Self-review done** | You read your own diff first; typos, stray TODOs, and obvious gaps are yours to catch, not the reviewer's. |

PR titles follow the Conventional Commits format (they become the squash-merge commit message).

### 5.2 What to leave out

A PR contains its one change and nothing else:

- **No drive-by edits.** Refactors of classes you happened to open, unrelated test fixes, and restyling of untouched files each get their own PR.
- **No commented-out code and no debug leftovers.** Git history is the archive; `System.out.println`, `log.debug("here")`, and temporary `@Disabled` never reach review.
- **No secrets** — not even in test resources. Externalize via environment variables or property placeholders.
- **No formatter noise.** Reformatting files the PR doesn't otherwise touch buries the real diff.
- **No dependency bumps riding along with features.** A version upgrade affects the whole project and must be revertable on its own.
- **No orphan TODOs.** Either fix it in this PR or open a ticket and reference it: `// TODO OC-1500 — replace with domain exception`.

### 5.3 PR size

Small PRs merge faster and revert safer. Measured in changed lines excluding tests and generated code:

| Size | Expectation |
|---|---|
| ≤ 200 | The target — reviewable thoroughly in one sitting. |
| 201–400 | Fine for a self-contained feature; open with a short orienting summary. |
| 401–700 | Split it if any natural seam exists (data layer vs. service layer, feature vs. refactor). |
| > 700 | Needs prior agreement with the reviewer — break it up or pair on it instead. |

To split a large change: put the shared groundwork (new types, interfaces) in a base branch off `next`, stack follow-on PRs against that base branch, and finish with one thin PR merging the base branch into `next`.

### 5.4 PR description template

```markdown
## What


## Why
Closes OC-

## How to test


## Checklist
- [ ] Self-reviewed the diff
- [ ] `./gradlew build` passes locally
- [ ] Tests added or updated — name them here
- [ ] No secrets, debug logs, or commented-out code
- [ ] WIP commits squashed
```

A fully filled-in example — and a bad counter-example with annotations — is in [docs/pr-and-review-examples.md](docs/pr-and-review-examples.md).

### 5.5 PR lifecycle

```
Draft → Ready for Review → In Review → Changes Requested → Approved → Merged
```

- Open as **Draft** while work is in progress; CI runs, reviewers don't engage.
- Mark **Ready for Review** only when §5.1 is satisfied; assign at least one reviewer.
- Reviewers respond within **2 business days** or hand off.
- On **Changes Requested**: resolve every `blocking:` comment, answer every `question:`, then re-request review explicitly. Resolve your own threads once addressed.
- **Do not merge your own PR** without at least one approval from someone else. CI must be green — a red pipeline is a reason to fix the build, not to skip review.
- Merge strategy: **squash merge** into `next`; `next → prod` release merges are regular merge commits, tagged `vX.Y.Z`. Delete the source branch after merging.
- Don't leave a PR open more than 5 business days without a status update.

## 6. Code review standards

Worked examples of every comment type and a full review exchange: [docs/pr-and-review-examples.md](docs/pr-and-review-examples.md).

Every review comment starts with a prefix that tells the author how to treat it:

| Prefix | Means | Author must respond? |
|---|---|---|
| `blocking:` | Merge-stopper: a correctness bug, security issue, missing test, or standards violation. | Yes — resolve before merge |
| `question:` | The reviewer needs to understand something; not a change request. | Yes — answer inline or in code |
| `nit:` | Style or polish. | No — author's discretion |
| `suggestion:` | An alternative the reviewer finds worth weighing, with reasoning included. | No — author's discretion |

How to review:

- For logic-heavy changes, check out the branch and run it — a diff alone doesn't reveal behavioral subtleties.
- When only nits remain, approve and say "address or ignore as you like" — nit-level issues never hold a merge hostage.
- Prefer "have you considered X?" over "do X" — it invites context you may be missing.
- A PR too large to review meaningfully gets a split request, not a rubber stamp.
- Architecture disagreements move to a ticket or a call; PR comments are for the code in front of you.

## 7. Versioning

[Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

- `fix:` → patch, `feat:` → minor, `BREAKING CHANGE` → major.
- Releases are tagged on `prod` as `vX.Y.Z`.

## 8. Backend code standards

Why the backend is shaped this way — modules, deployment shapes, recorded design decisions — is documented in [docs/architecture.md](docs/architecture.md). The rules below follow from it.

- Java 25, Spring Boot 4.x, Gradle multi-module. Base package `io.opencelium.<module>`.
- Respect the module boundaries — the dependency direction is `core`/`worker` → `execution` → `common`, never the reverse:
  - shared contracts and DTOs → `common`
  - workflow execution logic (nodes, IF, LOOP) → `execution`
  - REST API, persistence, auth, scheduling → `core`
  - `worker` stays a thin wrapper around `execution`
- Both deployment shapes must keep working: single jar (`:core:bootJar`, embedded execution) and two jars (`:core:bootJar` + `:worker:bootJar`, remote execution).
- New code comes with tests — see below.

## 9. Testing

### 9.1 Test taxonomy

Fast tests are kept strictly separate from slow, Docker-dependent ones:

| Kind | Source root | Suffix | Gradle task | Docker? | Where |
|---|---|---|---|---|---|
| Unit | `src/test` | `*Test` | `test` | No | all modules — the default; `common` and `execution` contain *only* these |
| Slice | `src/test` | `*Test` | `test` | No | `core`, `worker` |
| Full integration | `src/integrationTest` | `*IT` | `integrationTest` | Yes | `core`, `worker` |

> The `integrationTest` source root and Gradle task are a defined convention, wired into the build when the first real integration test lands. Until then, everything lives in `src/test`.

**Unit tests** — pure Java: no Spring context, no database, no network. Instantiate the class under test with `new` (or `@InjectMocks`), mock collaborators with `@ExtendWith(MockitoExtension.class)` + `@Mock`. These run in milliseconds and should cover the bulk of the logic — the engine, IF/LOOP operators, mapping, validation, exception paths. Never use `@SpringBootTest` or slice annotations in a unit test.

**Slice tests** — load exactly one Spring layer: `@WebMvcTest(MyController.class)` for controllers, `@DataMongoTest` for Mongo repositories, `@JsonTest` for serialization. Declare `@ActiveProfiles("test")` on every slice test.

**Integration tests** — full `@SpringBootTest` against real databases provisioned by Testcontainers. `*IT` suffix, never in `src/test`. Override datasource URLs with `@DynamicPropertySource` — never hard-code container ports or credentials. These are the slowest tests; run them deliberately. They are excluded from `check` and triggered explicitly in CI.

Rule of thumb: push logic down into `execution`/`common` where it's cheap to unit-test, and keep `@SpringBootTest` for wiring checks and end-to-end paths.

### 9.2 Test file location

Tests mirror the production class's package — same module, same package, `test` source root:

```
execution/src/main/java/io/opencelium/execution/engine/WorkflowEngine.java
→ execution/src/test/java/io/opencelium/execution/engine/WorkflowEngineTest.java
```

Same-package placement allows package-private access; the module split plus the `*Test`/`*IT` suffixes handle test routing. A test never lives in a different module than the code it tests. Test fixtures/resources go in `<module>/src/test/resources`.

### 9.3 Shared test utilities — `testutil/`

Each module may have an `io.opencelium.<module>.testutil` package in its test root for shared test infrastructure:

| Sub-package | Purpose | Example |
|---|---|---|
| `testutil/fixture/` | Named, reusable test objects (object mothers/builders) | `WorkflowFixture.aLinearTwoNodeWorkflow()` |
| `testutil/fake/` | In-memory implementations of repositories/services, when mocks need too much setup | `InMemoryWorkflowRepository` |
| `testutil/assertion/` | Custom AssertJ assertions for domain objects | `WorkflowAssertions.assertThat(wf).hasNode("http-1")` |
| `testutil/annotation/` | Composed annotations bundling boilerplate | `@SliceTest`, `@IntegrationTest` |

`testutil` must never contain `@Test` methods.

### 9.4 Naming conventions

A test method name states the expected behavior, not the mechanics: `<methodName><ExpectedBehavior>When<Condition>`, camelCase, present tense. Reading the name alone should tell you what broke when it fails:

```java
// Correct
existsByIdReturnsTrueWhenWorkflowExists()
runThrowsCyclicWorkflowExceptionWhenGraphHasCycle()

// Avoid
testExistsById()                        // redundant prefix
existsById_returnsTrue()                // underscore style
existsByIdReturnedTrue()                // past tense
runCallsNodeExecutor()                  // describes implementation
```

Use `@DisplayName` for extra context only when the method name isn't sufficient.

### 9.5 Running tests

```bash
./gradlew test                                        # all fast tests, all modules
./gradlew :execution:test                             # one module
./gradlew :core:test --tests "*.CoreApplicationTest"  # one class (short pattern)
./gradlew :core:test --tests "io.opencelium.core.CoreApplicationTest.contextLoads"  # one method
./gradlew build                                       # full verification (what CI runs)
./gradlew test --info                                 # full output on failure
```

Gradle skips tests when nothing changed; add `--rerun-tasks` to force a run.

### 9.6 Test dependencies

- `spring-boot-starter-*-test` brings JUnit 5, Mockito, AssertJ, JSONassert, and Spring Test transitively — do not redeclare them.
- Use the Testcontainers BOM; never pin individual Testcontainers module versions.
- Use Awaitility for async assertions — never `Thread.sleep()`.
- New test-only dependencies go under `testImplementation` (or `testRuntimeOnly` for drivers), never `implementation`.

## 10. What not to commit

- Secrets, credentials, API keys — ever. Use environment variables / externalized config.
- IDE files, build output, `.DS_Store` (covered by `.gitignore`).
- Generated artifacts (jars, `build/` directories).
- Code copied from the legacy OpenCelium codebase — this is a ground-up rewrite. Legacy material is reference for analysis only.
