# <Feature name>: the tasks

Each task is 1 pull request. The size rule of a task is in CONTRIBUTING.md, section 5.3.
A feature has 8 tasks or less. The status line is the only status in this folder.
A task that changes the behaviour of a criterion changes spec.md in the same PR.
When a task is done, its PR replaces the task with its done stub.

## Task 1: <title in the Conventional Commits form>
- **Criteria:** <ID>-01, <ID>-02
- **Read:** plan: <sections>, decisions <n>; architecture: <sections>, decisions <n>
- **Function:** <2 sentences: what is visible after the PR>
- **Tests:** <test class> (<unit | slice | full application>)
- **Hand test:** 1. <step> 2. <step> (5 steps or less)
- **Size:** approximately <n> lines
- **Depends on:** <task> or nothing
- **Status:** open | in work

## Task 2: <title of a done task>
- **Criteria:** <ID>-03. **Status:** done
