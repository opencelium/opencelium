# Contributing to OpenCelium

Thank you for taking the time to contribute. This document explains everything you need to know before opening a pull request — from how to set up your environment to where each type of test belongs, how to name it, and what reviewers expect to see.

Please read this guide in full before submitting your first PR. It exists to make review faster, history cleaner, and onboarding easier for everyone who comes after you.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Database setup](#2-database-setup)
3. [Getting started](#3-getting-started)
4. [Project structure](#4-project-structure)
5. [Test structure and package purposes](#5-test-structure-and-package-purposes)
   - 5.1 [src/test — unit and slice tests](#51-srctest--unit-and-slice-tests)
   - 5.2 [src/integrationTest — full-stack integration tests](#52-srcintegrationtest--full-stack-integration-tests)
   - 5.3 [Test resources](#53-test-resources)
6. [Test file location](#6-test-file-location)
7. [Test naming conventions](#6-test-naming-conventions)
8. [Running the tests](#7-running-the-tests)
9. [Test dependencies](#8-test-dependencies)
10. [Pull request standards](#9-pull-request-standards)
    - 10.1 [What a PR must include](#91-what-a-pr-must-include)
    - 10.2 [What to leave out](#92-what-to-leave-out)
    - 10.3 [PR size](#93-pr-size)
    - 10.4 [PR description template](#94-pr-description-template)
    - 10.5 [Commit message format](#95-commit-message-format)
11. [Code review standards](#10-code-review-standards)
    - 11.1 [Reviewer responsibilities](#101-reviewer-responsibilities)
    - 11.2 [Comment conventions](#102-comment-conventions)
12. [PR lifecycle](#11-pr-lifecycle)
13. [Migrating existing tests](#12-migrating-existing-tests)

---

## 1. Prerequisites

Before contributing, ensure the following tools are installed and available on your `PATH`:

| Tool | Minimum version       | Purpose |
|------|-----------------------|---------|
| JDK | 17                    | Compilation and test execution |
| Docker | 24                    | Testcontainers (integration tests only) |
| Gradle | wrapper (`./gradlew`) | Build and test orchestration |
| MariaDB | Running locally on the default port `3306` |
| MongoDB | Running locally on the default port `27017` |

Docker is required only to run integration tests locally. Unit and slice tests run without it.

---

## 2. Database setup

Import the initial database schema and seed data before starting the application
for the first time:
```bash
mysql -u <username> -p  < database/data.sql
```

This only needs to be done once. If the schema changes in a future version,
the change will be applied automatically by Liquibase on the next application
start

## 3. Getting started

```bash
# Clone the repository
git clone https://github.com/opencelium/opencelium.git
cd opencelium
```

### Build
```bash
# Compile and package — skips tests for a faster build
./gradlew build -x test

# Compile and package including unit + slice tests
./gradlew build
```

### Run
```bash
# Run directly via Gradle
./gradlew bootRun

# Or run the packaged jar
java -jar build/libs/opencelium-x.x.jar
```

The application starts on `http://localhost:9090` by default.
API documentation is available at `http://localhost:9090/docs`.

### Run the tests
```bash
# Unit and slice tests only — no Docker
./gradlew test

# Integration tests only — requires Docker
./gradlew integrationTest

# Full test suite
./gradlew clean check integrationTest
```

---

## 4. Project structure

```
src/
  main/
    java/com/opencelium/          # Production source code
    resources/
      application.yml             # Base Spring configuration

  test/
    java/com/opencelium/
      unit/                       # Pure unit tests — no Spring context
      slice/                      # Spring slice tests (@WebMvcTest, @DataJpaTest, …)
      integration/                # Lightweight in-memory integration (optional)
      testutil/                   # Shared fixtures, builders, fakes, custom assertions
        fixture/                  # object mothers and builders
        fake/                     # in-memory implementations of repositories or services
        assertion/                # custom AssertJ assertion classes
        annotation/               # composed test annotations (@SliceTest, @IntegrationTest)
    resources/
      application-test.yml        # Spring config for profile "test"
      json/                       # JSON payloads for MockMvc and JSONassert
      fixtures/                   # SQL seed scripts, CSV data files

  integrationTest/
    java/com/opencelium/
      integration/                # Full @SpringBootTest + Testcontainers (*IT.java)
    resources/
      application-integration.yml # Spring config for profile "integration"
```

---

## 5. Test structure and package purposes

The project uses **two Gradle source roots** to keep fast tests entirely separate from slow, Docker-dependent ones.

| Source root | Gradle task | Docker? | Test types |
|-------------|-------------|---------|------------|
| `src/test/` | `./gradlew test` | No | Unit, slice, lightweight integration |
| `src/integrationTest/` | `./gradlew integrationTest` | Yes | Full `@SpringBootTest` + Testcontainers |

### 5.1 `src/test` — unit and slice tests

#### `unit/`

Pure Java tests — no Spring context, no database, no network. The class under
test is instantiated directly with `new` and its collaborators are replaced with
Mockito mocks. Because nothing starts up, these tests run in milliseconds and
should cover the bulk of your logic: service methods, validation rules, mapping
behaviour, guard clauses, and exception paths.

- Instantiate the class under test with `new` or `@InjectMocks`
- Mock collaborators with `@ExtendWith(MockitoExtension.class)` and `@Mock`
- Never use `@SpringBootTest`, `@WebMvcTest`, or any Spring slice annotation

See [`UserRoleServiceImplTest.java`][unit-example] for a working example covering
`existsById` and `getOne`.

#### `slice/`

Spring slice tests that load exactly one application layer. Much faster than a full context because Spring skips all beans unrelated to the slice under test.

Use the annotation that matches the layer you are testing:

| Annotation | What Spring loads |
|------------|------------------|
| `@WebMvcTest(MyController.class)` | Controller, `MockMvc`, filters — no service or repository beans |
| `@DataJpaTest` | JPA repositories, `EntityManager`, H2 — no web or service beans |
| `@DataMongoTest` | MongoDB repositories — no web or service beans |
| `@JsonTest` | Jackson `ObjectMapper` — nothing else |

Always declare `@ActiveProfiles("test")` on every slice test. Without it Spring
will not find `application-test.yml` and may attempt to connect to a real
database or fail to resolve required properties.

See [`RoleControllerTest.java`][slice-example] for a working example covering
`GET /role/{id}` (200 and 404) and `POST /role` (409 conflict).

---

#### `integration/` (inside `src/test/`)

Lightweight integration tests that load a partial Spring context and wire real
beans together without Docker. Use these when a unit test with mocks is not
enough — for example, verifying that `UserRoleServiceImpl` and its repository
interact correctly — but the overhead of a real database is not justified.

- Use `@SpringBootTest` with a limited component scan, or combine `@DataJpaTest`
  with `@Import` to bring in the service bean
- H2 replaces MariaDB; Flapdoodle replaces MongoDB
- Always declare `@ActiveProfiles("test")` so `application-test.yml` is loaded
- If the test needs real database behaviour that H2 cannot reproduce, move it
  to `src/integrationTest/` instead

See [`UserRoleServiceIntegrationTest.java`][integration-light-example] for a
working example.

[integration-light-example]: https://github.com/opencelium/opencelium/blob/main/src/test/java/com/becon/opencelium/backend/integration/service/UserRoleServiceIntegrationTest.java

#### `testutil/`

Shared test infrastructure used across all test layers. The goal is to eliminate
duplication — test data is built once, assertions are written once, and every
test class that needs them imports from here instead of repeating the setup
inline.

This package must never contain `@Test` methods. If it did, Gradle would treat
it as a test class, attempt to run it, and report failures for methods that have
no assertions.

| Sub-package | Purpose | Example |
|-------------|---------|---------|
| `testutil/fixture/` | Named, reusable test objects. Add new scenarios here rather than constructing domain objects inline in test classes. | `UserRoleFixture.aStandardUserRole()` |
| `testutil/fake/` | In-memory implementations of repositories or services. Use when a mock would require too much `when(…).thenReturn(…)` setup. | `InMemoryUserRoleRepository` |
| `testutil/assertion/` | Custom AssertJ assertion chains for domain objects. Wrap repeated field checks into readable one-liners. | `UserRoleAssertions.assertThat(role).isAdmin()` |
| `testutil/annotation/` | Composed annotations that bundle the boilerplate every slice or integration test needs. | `@SliceTest`, `@IntegrationTest` |

See the following files for working examples:

- [`UserRoleFixture.java`][fixture-example] — entity and resource builders
- [`UserRoleAssertions.java`][assertion-example] — custom AssertJ assertions for `UserRole`
- [`InMemoryUserRoleRepository.java`][fake-example] — use when a test needs
    realistic save/find/delete behaviour without a mock
- [`SliceTest.java`][slice-annotation] and [`IntegrationTest.java`][it-annotation]
  — apply one annotation instead of repeating the three-annotation combination
  on every test class
---

### 5.2 `src/integrationTest` — full-stack integration tests

#### `integration/`

Full application context tests that run against real databases provisioned by
Testcontainers. Spring starts every bean, the HTTP layer is live on a random
port, and MariaDB and MongoDB run in Docker containers. These are the slowest
tests in the project — run them deliberately, not on every save.

Every class in this package must:

- Use `@IntegrationTest` — the composed annotation that bundles
  `@SpringBootTest`, `@Testcontainers`, and `@ActiveProfiles("integration")`
- Declare a `@Container` field for every database the test touches
- Override datasource URLs at runtime with `@DynamicPropertySource` —
  never hard-code ports or credentials. See [`UserRoleFlowIT.java`][it-example]
  for a documented example of how and where to declare it.
- Use the `*IT` naming suffix so Gradle routes them to `integrationTest`
  and not to the default `test` task

See [`UserRoleFlowIT.java`][it-example] for a working example covering
role creation end-to-end and deletion against a real MariaDB container.

---

### 5.3 Test resources

#### `src/test/resources/application-test.yml`

Activated by `@ActiveProfiles("test")`. Used by all unit and slice tests.

- H2 in-memory datasource for JPA slices
- Flapdoodle embedded MongoDB for Mongo slices
- Logging: `root: WARN`, `com.opencelium: DEBUG`
- Do not add production infrastructure config here

#### `src/integrationTest/resources/application-integration.yml`

Activated by `@ActiveProfiles("integration")`. Used by all `*IT` tests.

- Datasource and MongoDB URI values are placeholders — `@DynamicPropertySource` overwrites them at runtime
- Logging: `root: WARN`, `com.opencelium: DEBUG`, `org.testcontainers: INFO`
- Do not hard-code ports or container credentials

#### `src/test/resources/json/`

JSON files used as MockMvc request bodies or in JSONassert comparisons.

```java
String body = new ClassPathResource("json/create-user-role.json")
                    .getContentAsString(StandardCharsets.UTF_8);

mockMvc.perform(post("/api/userRoles")
        .contentType(MediaType.APPLICATION_JSON)
        .content(body))
       .andExpect(status().isCreated());
```

Name each file after the operation it represents: `create-user-role.json`, `user-role-response.json`. Do not reuse payload files across unrelated tests.

#### `src/test/resources/fixtures/`

Flat data files for seeding test databases in slice and lightweight integration tests.

```java
@DataJpaTest
@Sql("fixtures/user-roles.sql")
class UserRoleRepositoryTest { … }
```

Use for SQL seed scripts (`.sql`) and CSV input tables for parameterised tests.

---

## 6. Test file location

Test files mirror the production class path. Replace `main` with the test source root and insert the layer (`unit`, `slice`, `integration`).

```
src/main/java/.../service/UserRoleServiceImpl.java
→ src/test/java/.../unit/service/UserRoleServiceImplTest.java
```

| Test type | Location |
|----------|--------|
| Unit | `src/test/.../unit/.../*Test.java` |
| Slice | `src/test/.../slice/.../*Test.java` |
| Integration | `src/integrationTest/.../integration/.../*IT.java` |

The package name follows the same structure:

```java
// Production
package com.example.service;

// Unit test
package com.example.unit.service;
```

Shared test utilities go under `testutil/`:

```
src/test/.../testutil/fixture/
src/test/.../testutil/assertion/
```

---

## 7. Test naming conventions

Consistent naming lets Gradle route tests to the correct task automatically and makes it immediately clear what a test is doing.

### Class names

| Test type | Required suffix | Source root | Example                          |
|-----------|----------------|-------------|----------------------------------|
| Unit test | `*Test` | `src/test/…/unit/` | `UserRoleServiceTest`            |
| Slice test | `*Test` | `src/test/…/slice/` | `UserRoleControllerTest`         |
| Lightweight integration | `*Test` | `src/test/…/integration/` | `UserRoleServiceIntegrationTest` |
| Full integration | `*IT` | `src/integrationTest/…/integration/` | `UserRoleControllerIT`           |
| Test utility | _(none)_ | `src/test/…/testutil/` | `UserRoleFixture`                |

> **Important:** Never use the `*IT` suffix in `src/test/`. Never use the `*Test` suffix in `src/integrationTest/`. The suffix determines which Gradle task picks up the class.

### Method names

Use plain English that describes the expected behaviour, written in camelCase. Do not use a `test_` prefix and do not describe the implementation.

Follow the `<MethodName><ExpectedBehavior>When<Condition>` pattern. Written in
camelCase, present tense, no `test_` prefix.

```java
// Correct
existsByIdReturnsTrueWhenRoleExists()
        existsByIdReturnsFalseWhenRoleDoesNotExist()
        getOneThrowsRoleNotFoundExceptionWhenIdDoesNotExist()
        findByIdReturnsEmptyWhenRoleNotFound()

// Avoid
        testExistsById()                          // redundant test prefix
        existsById_returnsTrueWhenRoleExists()    // underscore style
        existsByIdReturnedTrue()                  // past tense
        existsById_callsRepository()             // describes implementation, not behaviour
```

Use `@DisplayName` for additional human-readable context when the method name alone is not sufficient.

---

## 8. Running the tests

```bash
# Unit and slice tests only — fast, no Docker
./gradlew test

# Integration tests only — requires Docker
./gradlew integrationTest

# Full test suite (unit + slice + integration)
./gradlew clean test integrationTest

# Run a single unit or slice test class — full path
./gradlew test --tests "com.becon.opencelium.backend.unit.database.mysql.service.UserRoleServiceImplTest"

# Run a single unit or slice test class — short pattern
./gradlew test --tests "*.UserRoleServiceImplTest"

# Run a single integration test class — full path
./gradlew integrationTest --tests "com.becon.opencelium.backend.integration.controller.UserRoleControllerFlowIT"

# Run a single integration test class — short pattern
./gradlew integrationTest --tests "*.UserRoleControllerFlowIT"

# Run all tests in a package
./gradlew test --tests "com.becon.opencelium.backend.unit.*"
./gradlew integrationTest --tests "com.becon.opencelium.backend.integration.*"

# Run a single test method — full path
./gradlew test --tests "com.becon.opencelium.backend.unit.database.mysql.service.UserRoleServiceImplTest.existsByIdReturnsTrueWhenRoleExists"

# Run a single test method — short pattern
./gradlew test --tests "*.existsByIdReturnsTrueWhenRoleExists"

# Show full output when a test fails
./gradlew test --info
```

The `check` task runs `test` only. It does not run `integrationTest`. This is
intentional — integration tests require Docker and are triggered explicitly
in CI and locally.

---

## 9. Test dependencies

All test dependencies are declared in `build.gradle`. The `integrationTestImplementation` configuration extends `testImplementation`, so every dependency below is available in both source roots.

**Rules:**

- Do not duplicate a dependency already provided transitively by `spring-boot-starter-test`.
- Always use the Testcontainers BOM. Never pin individual Testcontainers module versions.
- Use `awaitility` for async assertions. Do not use `Thread.sleep()`.
- H2 is `testRuntimeOnly`. It must never appear in the `implementation` or `runtimeOnly` configurations.

---

## 10. Pull request standards

### 10.1 What a PR must include

**Title.** Written in imperative mood, 50 characters or fewer. The limit exists
because titles appear in git log, release notes, and JIRA — a long title gets
truncated or wrapped in all three.
```
# Correct — imperative mood, specific, short
Add UserRoleService existsByRole validation
Fix NPE in UserRoleServiceImpl getOne method

# Avoid — past tense
Fixed NPE in UserRoleServiceImpl

# Avoid — vague, could mean anything
Changes to user service
```

**Description.** Explains what changed and why — not how. Reviewers can read
the how in the diff. Include the linked JIRA ticket. Call out breaking changes
explicitly.
```
# Correct — what and why, ticket linked
Adds null check to getOne() to prevent NPE when the role id does not exist
in the database. Previously the service called repository.getOne() directly
which throws EntityNotFoundException instead of our domain RoleNotFoundException.
Closes OC-1389.

# Avoid — describes the how, not the why
Changed getOne() to use findById().orElseThrow() with a lambda.
```

**Tests.** Every logic change requires a test. Use this sentence pattern in
the description so reviewers know what to look for:
```
Added unit test UserRoleServiceImplTest.getOneThrowsRoleNotFoundExceptionWhenIdDoesNotExist
covering the exception path in UserRoleServiceImpl.getOne().
```

If no test is needed, explain why — for example "no logic change, documentation
only" or "covered by existing UserRoleControllerFlowIT".

**Scope.** One concern per PR. If you refactored unrelated code while working
on your change, open a separate PR or call it out clearly so reviewers can
assess it independently.

---

### 10.2 What to leave out

- **Unrelated refactors or style fixes.** They make diffs unreadable and mix
  concerns. Open a separate PR.
- **Commented-out code.** Delete it. Git history preserves everything — use
  `git log -S "the code you deleted"` to find it again if needed.
- **Debug or print statements.** These sneak into production. Review your own
  diff in the PR UI before requesting review.
- **Generated or build artefact files.** `.class` files, `build/`, `.gradle/`,
  IDE configs not covered by `.gitignore`.
- **WIP commits in the final branch.** Squash or rebase before marking the PR
  as Ready for Review. See section 10 for the full lifecycle. Commit messages
  like `wip`, `fixup`, and `asdf` pollute the history and make bisect useless.
- **Credentials or secrets.** If accidentally committed, rotate the credential
  immediately — do not wait for the PR to be closed or the branch to be deleted,
  the value is already in git history. Use environment variables or a secrets
  manager going forward.

### 10.3 PR size

| Lines changed | Status | Action |
|---------------|--------|--------|
| ≤ 200 | Ideal | No action needed |
| 200 – 400 | Acceptable | No action needed |
| 400 – 700 | Justify the size | Explain in the description why the PR cannot be split cleanly |
| > 700 | Split the PR | Open multiple smaller PRs |

Review quality drops noticeably above about 400 lines. Smaller PRs merge faster, receive better review, and are easier to revert safely.

**How to split a large PR:**

- Separate infrastructure from logic. For example: PR 1 adds the Gradle source set and empty folders; PR 2 migrates the first test class; PR 3 migrates the rest.
- Separate dependency additions from their usage. PR 1 adds Testcontainers to `build.gradle`; PR 2 introduces the first `*IT` test.
- Use stacked PRs. A dependent PR should target the parent PR’s branch so each change can be reviewed independently. After the parent PR is merged, rebase and retarget the child PR to `main`.

**Exception:** a pure rename or package restructure may be large but still acceptable if it contains no logic changes. In that case, state this clearly in the PR description and keep the change mechanically clean.

### 10.4 PR description template

Copy this template when opening a PR. The template is also available at
`.github/pull_request_template.md` and is pre-loaded by GitHub automatically.

- **What** — what changed, imperative mood, 1–3 sentences
- **Why** — why it is needed, ticket number, breaking changes if any
- **How to test** — which Gradle command, whether Docker is needed
- **Checklist** — self-audit before marking Ready for Review

---

\```markdown
## What


## Why
Closes OC-

## How to test


## Checklist
- [ ] Self-reviewed the diff
- [ ] `./gradlew test` passes locally
- [ ] Tests added or updated — name them here
- [ ] No secrets, debug logs, or commented-out code
- [ ] WIP commits squashed
  \```

See [`pull_request_template_example.md`][pr-example] for a fully filled-in example.

### 10.5 Commit message format

Every commit message must follow this format:

```
[Type] Ticket-Number #comment Subject #time XhYm
```

All four parts are required on a single line. No multi-line bodies or footers.

---

**Format breakdown:**

| Part | Syntax          | Description |
|------|-----------------|-------------|
| Type | `[Type]`        | Bracketed word describing the nature of the change. See type list below. |
| Ticket number | `OC-1234`       | The JIRA ticket this commit belongs to. Always include — commits without a ticket number cannot be traced. |
| `#comment` | literal keyword | Required keyword that separates the ticket from the subject. |
| Subject | plain text      | Short description of what changed. No trailing full stop. |
| `#time` | `#time Xh Ym`   | Time spent on this commit. Use `h` for hours, `m` for minutes. |

---

**Types:**

| Type | When to use |
|------|-------------|
| `Added` | New feature, class, endpoint, test, or file introduced |
| `Modified` | Change to existing behaviour, logic, or configuration |
| `Fixed` | Bug fix or correction |
| `Removed` | Deletion of code, files, or functionality |
| `Refactored` | Internal restructuring with no behaviour change |
| `Tested` | Test-only commit — no production code changed |
| `Documented` | Documentation, comments, or CONTRIBUTING changes only |

---

**Time format:**

| Spent | Write |
|-------|-------|
| 30 minutes | `#time 30m` |
| 1 hour | `#time 1h` |
| 1 hour 30 minutes | `#time 1h 30m` |
| 2 hours | `#time 2h` |

---

**Rules:**

- The ticket number must match an existing JIRA ticket. Do not invent numbers.
- `#comment` is a literal keyword — do not replace it with anything else.
- The subject describes *what* changed, not *why*. Keep it under 72 characters.
- `#time` reflects the time spent on this specific commit, not the whole ticket.
- Do not use past tense. Write "add unit tests" not "added unit tests".

---

**Examples:**

```
[Added] OC-1412 #comment add UserRoleService existsByRole validation #time 1h
[Modified] OC-1307 #comment minor modifications to UserRoleServiceImpl #time 10m
[Fixed] OC-1389 #comment fix NPE in UserRoleServiceImpl getOne when id not found #time 20m
[Tested] OC-1412 #comment add UserRoleServiceTest for existsById and getOne #time 2h
[Refactored] OC-1350 #comment extract UserRole mapping logic to UserRoleMapper #time 45m
[Documented] OC-1412 #comment add CONTRIBUTING_TEST.md test structure guide #time 30m
[Removed] OC-1401 #comment remove deprecated UserRole findAll unused overload #time 15m
```

---

## 11. Code review standards

### 11.1 Reviewer responsibilities

- **Respond within two business day.** Stale PRs block the team. If you cannot review in time, say so and suggest another reviewer.
- **Check out the branch for logic-heavy changes.** Complex business logic cannot be reviewed reliably from a diff alone.
- **Distinguish blocking comments from suggestions** using the prefixes described below. Ambiguity wastes everyone's time.
- **Approve with outstanding nits explicitly stated.** If only style-level comments remain, approve and note "feel free to address or ignore". Do not block a merge on nit-level issues.
- **Ask questions rather than issuing commands.** "Have you considered X?" is more productive than "Do X." It invites dialogue and may reveal context you were missing.
- **Do not rubber-stamp large PRs.** If a PR is too large to review meaningfully, request a split before approving.
- **Do not use review comments for architecture debates.** If the design needs broader discussion, open a ticket or schedule a sync. PR comments are for the code in front of you.

### 11.2 Comment conventions

Prefix every review comment with one of the following labels so the author knows immediately whether a response is required:

| Prefix | Meaning | Author action required? |
|--------|---------|------------------------|
| `blocking:` | Must be resolved before merge. Use for correctness bugs, security issues, missing tests, or violations of team standards. | Yes |
| `question:` | Genuinely unclear — not a change request. The author can answer inline or in the code. | Yes, if clarification is needed |
| `nit:` | Optional style or polish. Author's discretion. | No |
| `suggestion:` | An alternative worth considering. Include your reasoning. | No |

**Examples:**

```
blocking: userRoleService.getOne(id) throws a generic RuntimeException when
          the role is not found. This should be a domain-specific exception
          (e.g. UserRoleNotFoundException) so callers can handle it precisely.

question: Is there a reason findByRole returns Optional<UserRole> while
          findById returns Optional<UserRole> too — but getOne throws instead
          of returning Optional? Trying to understand the intended contract.

nit: Variable name `ur` could be `userRole` for readability.

suggestion: Consider adding existsByRole to the @SliceTest for UserRoleController
            so the 409 Conflict path is covered. See UserRoleServiceTest for precedent.
```

---

## 12. PR lifecycle



---

## 13. Migrating existing tests



---

<!-- ── Links ────────────────────────────────────────────────────────────────── -->
[unit-example]: https://github.com/opencelium/opencelium/blob/main/src/test/java/com/becon/opencelium/backend/unit/database/mysql/service/UserRoleServiceImplTest.java
[slice-example]: https://github.com/opencelium/opencelium/blob/main/src/test/java/com/becon/opencelium/backend/slice/controller/RoleControllerTest.java
[it-example]: https://github.com/opencelium/opencelium/blob/main/src/integrationTest/java/com/becon/opencelium/backend/integration/controller/UserRoleControllerFlowIT.java
[fixture-example]: https://github.com/opencelium/opencelium/blob/main/src/test/java/com/becon/opencelium/backend/testutil/fixture/UserRoleFixture.java
[assertion-example]: https://github.com/opencelium/opencelium/blob/main/src/test/java/com/becon/opencelium/backend/testutil/assertion/UserRoleAssertions.java
[fake-example]: https://github.com/opencelium/opencelium/blob/main/src/test/java/com/becon/opencelium/backend/testutil/fake/InMemoryUserRoleRepository.java
[slice-annotation]: https://github.com/opencelium/opencelium/blob/main/src/test/java/com/becon/opencelium/backend/testutil/annotation/SliceTest.java
[it-annotation]: https://github.com/opencelium/opencelium/blob/main/src/test/java/com/becon/opencelium/backend/testutil/annotation/IntegrationTest.java
[pr-example]: https://github.com/opencelium/opencelium/tree/dev/src/backend/docs/pull_request_template_example.md
