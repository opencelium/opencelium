# Settings and secrets: the tasks

Each task is 1 pull request. The size rule of a task is in CONTRIBUTING.md, section 5.3.
The status line is the only status in this folder.
A task that changes the behaviour of a criterion changes spec.md in the same PR.

## Task 1: feat(core): read the settings of the installation as an admin
- **Criteria:** SS-01, SS-05, SS-06. **Status:** done

## Task 2: feat(core): change and reset the settings of the installation
- **Criteria:** SS-02, SS-03, SS-04, SS-05, SS-06. **Status:** done

## Task 2a: feat(core): refuse control characters in the text settings
- **Criteria:** SS-03. **Status:** done

## Task 3: feat(core): keep the broker password as an encrypted secret
- **Criteria:** SS-02, SS-03, SS-04, SS-07, SS-08. **Status:** done

## Task 4: build: fail the build when a class breaks a build rule
- **Criteria:** SS-09. **Status:** done

## Task 5: docs: record the settings and secrets decisions
- **Criteria:** none; the definition of done of plan.md
- **Read:** plan: Decisions, Definition of done; architecture: 3.4, 4.1, 6.3, 6.4, 6.5, 6.9, section 7
- **Function:** Section 7 of the architecture document has records 20 to 25, and the other sections, CONTRIBUTING.md and the writing guide have the changes of the definition of done of plan.md.
- **Tests:** none; the hand test reads the documents.
- **Hand test:** 1. Read section 7 of `docs/architecture.md`: records 20 to 25 exist. 2. Read the list of the open decisions: the 4 new entries exist. 3. Read sections 3.4, 4.1, 6.3, 6.4, 6.5 and 6.9: each item of the definition of done is there. 4. Read sections 8 and 8.1 of CONTRIBUTING.md: no note on a check by hand and no "Planned" note. 5. Search the architecture document for a status marker, a date or a ticket number: nothing.
- **Size:** approximately 0 lines of code, plus the documents
- **Depends on:** 4
- **Status:** open
