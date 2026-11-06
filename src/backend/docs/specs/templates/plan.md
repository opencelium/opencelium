# <Feature name>: the plan

## Approach
1 paragraph: the shape of the solution.

## Modules and packages
Which module gets which package, and why a lower module is not possible.

## Decisions
Numbered. Each decision has the question, the options, the recommendation,
and the reason. The reviewer confirms each decision before task 1 starts.

1. **<Title>.** <Question.> Options: <a>, <b>. Recommended: <a>, because <reason>.

## Interfaces and contracts
The new public types, the SPI changes, the endpoints (method, path, purpose,
permission), the settings, and the bootstrap properties. The property list
must not grow without a reason in this section.

## Test strategy
Which criteria get unit tests, slice tests, and full-application tests.
Which fakes and fixtures the tests use.

## Risks
| Risk | How the plan handles it |
|---|---|

## Definition of done
- Each criterion of spec.md has a test that passes.
- `./gradlew build` is green.
- The hand tests of tasks.md are done.
- The architecture document and the writing guide are updated when the plan changes them.
