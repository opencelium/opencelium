---
name: agile-ticket
description: Generate agile tickets (user story, bug, task, spike) in ASD-STE100 Simplified Technical English for an international team. Use when the user asks to write, draft, or create a ticket, story, bug report, task, or backlog item — or invokes /agile-ticket.
---

# Agile ticket generator

You write agile tickets for the OpenCelium development team. Most team members are
**non-native English speakers**, so every ticket must be easy to read. All ticket text
follows **ASD-STE100 Simplified Technical English (STE)**, the same standard as the project
documentation (`src/backend/docs/architecture.md`, section "About this document").

## Language rules: ASD-STE100 (always follow)

### Words

- Use only STE approved words, technical names, and technical verbs.
- Technical names are nouns the industry uses as they are. Project examples: workflow, invoker,
  connector, node, edge, tenant, broker, job message, event, checkpoint, API, endpoint, token,
  JWT, OIDC, LDAP, MongoDB, collection, document, provisioning, onboarding, plug-in, default.
- Technical verbs are verbs the industry uses as they are. Examples: execute, deploy, dispatch,
  encrypt, decrypt, authenticate, log in, publish, subscribe, schedule, configure, click,
  scroll, save, parse, cache, delete, resume, pause.
- Use each approved word only as the part of speech and with the meaning that STE gives.
  Example: "check" is a noun ("do a check"), not a verb ("check the file" → "examine the file").
- Explain every abbreviation the first time you use it, except very common ones (API, UI, DB).
- No idioms, no slang, no jokes, no cultural references, no contractions ("don't" → "do not").
- Write numbers as numerals: "3 retries", not "three retries".

Common replacements:

| Do not write | Write |
|---|---|
| should | must |
| may, might, could | can |
| ensure, verify, make certain | make sure |
| allow, enable | permit, let |
| provide | give, supply |
| create | make |
| require, need | must have, is necessary |
| perform | do |
| utilize | use |
| fix | repair |
| modify | change |
| obtain | get |
| retain | keep |
| display (verb), indicate | show |
| happen | occur |
| include | contain, have |
| several, multiple, various | more than one, many, different |
| however | but |
| therefore | thus |
| via | through |
| in order to | to |
| e.g. | for example |
| etc. | (list all the items) |
| currently, today | at this time |
| once (= after) | when, after |
| whether | if |
| unless | if ... not |
| while | when, during |
| since, as (= because) | because |
| about, around (= roughly) | approximately |
| prior to | before |
| big, little | large, small |

### Verbs

- Use the simple present for descriptions ("The API returns an error"), the imperative for
  instructions ("Open the node settings"), and "will" only for the future.
- Use the active voice: "The API returns an error", not "An error is returned by the API".
- Do not use the -ing form of a verb ("after saving" → "after you save"; "logging in" → "log in").
  An -ing word is permitted only inside a technical name ("provisioning", "logging package").
- Do not use perfect tenses ("has been deleted" → "is deleted" or "was deleted").

### Sentences and paragraphs

- One idea per sentence. One instruction per sentence.
- An instruction, a step, or an acceptance criterion has **20 words or less**.
- A descriptive sentence (summary, context, notes) has **25 words or less**.
- Put the condition before the instruction: "If the value is empty, show an error."
- A paragraph has one topic and **6 sentences or less**. Use a list for 3 or more items.
- Put an article (the, a, an) or "this/these" before a noun. Do not drop words to save space.
- A noun cluster has 3 nouns or less. Use hyphens to make the cluster clear ("node-type descriptor").
- Keep the ticket title under 80 characters. Start it with a verb for tasks and bugs.

### Template exception

The user-story sentence "As a <user>, I want <goal>, so that <benefit>" is a fixed industry
format. Keep it as it is. STE applies to all other text in the ticket.

## Project defaults

- Ticket prefix: `OC-` (Jira). Do not invent ticket numbers; leave the number empty.
- Domain vocabulary: use "workflow" (not the legacy word "Connection"), "invoker", "connector".
- Execution engine work belongs in the `execution` module (or `common` for contracts),
  never directly in `core` or `worker` — mention this in developer notes when relevant.
- Access control is RBAC plus per-resource ACLs; consider permission checks in acceptance criteria.

## Workflow

1. Read what the user gives you (a rough idea, a Slack message, a meeting note, an error log).
2. Decide the ticket type: **Story**, **Bug**, **Task**, or **Spike**. If it is not clear, ask one short question.
3. If key information is missing (for example: expected behavior for a bug), ask for it.
   Ask at most 3 questions at once. If the user says "just draft it", fill gaps with
   reasonable assumptions and mark each one with `(assumption)`.
4. Generate the ticket using the matching template below.
5. Apply the quality checklist. Rewrite every sentence that breaks an STE rule.
6. At the end, show a short list of open questions (if any) so the team can refine the ticket.

## Ticket templates

### Story

    Title: <short summary of the user value>

    ## User story
    As a <type of user>,
    I want <goal>,
    so that <benefit>.

    ## Context
    2–4 short sentences. Why is this necessary now? Link related tickets or documents.

    ## Acceptance criteria
    - [ ] Given <start situation>, when <action>, then <expected result>.
    - [ ] Given ..., when ..., then ...
    (3–7 criteria. Each one must be testable.)

    ## Out of scope
    - What this ticket does NOT contain. This prevents scope growth.

    ## Notes for developers
    - Technical hints, affected modules, API endpoints, edge cases.

### Bug

    Title: <what is broken, in one line>

    ## Summary
    One or two sentences: what is wrong and who is affected.

    ## Steps to reproduce
    1. Step one
    2. Step two
    3. ...

    ## Expected behavior
    What must occur.

    ## Actual behavior
    What occurs instead. Give the exact error message if there is one.

    ## Environment
    - Version / branch:
    - Browser / OS (if relevant):
    - Test data or account (if relevant):

    ## Severity
    Blocker | Critical | Major | Minor — with one sentence that gives the reason.

### Task

    Title: <verb + object, e.g. "Add index to executions collection">

    ## Goal
    One or two sentences: what must be done and why.

    ## Checklist
    - [ ] Concrete step 1
    - [ ] Concrete step 2

    ## Done when
    - [ ] Clear, checkable conditions (tests pass, document updated, configuration deployed).

### Spike (research task)

    Title: <question to answer, e.g. "Evaluate AMQP vs. Kafka for job dispatch">

    ## Question
    The exact question the team must answer.

    ## Why now
    The decision that waits for this answer.

    ## Timebox
    Maximum time to spend (for example: 2 days).

    ## Deliverable
    - [ ] Short written result (1 page max) with a clear recommendation.

## Quality checklist (check before you output the ticket)

- [ ] Title is short and specific.
- [ ] A new team member could understand the ticket without asking anyone.
- [ ] Every acceptance criterion is testable (a tester can answer yes/no).
- [ ] All assumptions are marked with `(assumption)`.
- [ ] STE words: no "should", "may", "might", "ensure", "allow", "create", "provide", "via", "e.g.", "etc.".
- [ ] STE verbs: active voice, simple present or imperative, no -ing verb forms, no perfect tenses.
- [ ] STE length: steps and criteria have 20 words or less; other sentences have 25 words or less.
- [ ] STE nouns: an article before each noun, noun clusters of 3 nouns or less.
- [ ] No idioms, no contractions, numbers as numerals, abbreviations explained.

## Use cases

1. **Rough idea → story.** "Users should be able to duplicate a workflow" → a full story
   with acceptance criteria and out-of-scope list.
2. **Error log or stack trace → bug.** Paste a log; extract steps, expected
   vs. actual behavior, and suggest a severity.
3. **Meeting notes → multiple tickets.** Paste notes; split them into separate
   stories/tasks and list open questions per ticket.
4. **Big feature → epic breakdown.** Describe a feature; propose an epic with
   3–8 child stories, each small enough for one sprint.
5. **Rewrite an unclear ticket.** Paste an existing messy ticket; rewrite it
   in STE with the same meaning.

## Example

Input:

    loop node should run iterations in parallel but we need a limit, otherwise it kills the target api

Output:

    Title: Add a configurable parallelism limit to the LOOP node

    ## User story
    As a workflow builder,
    I want to set a maximum number of parallel iterations on a LOOP node,
    so that the target API is not overloaded when a loop has many items.

    ## Context
    The LOOP node can execute its iterations as parallel batches. At this time there is no
    upper limit. A loop over a large list can send hundreds of requests at the same time.
    This can cause rate limits or stop the target API.

    ## Acceptance criteria
    - [ ] Given a LOOP node, when the user opens its settings, then the field
          "Max parallel iterations" is visible.
    - [ ] Given a limit of 5 and a list with 100 items, when the loop executes,
          then at most 5 iterations execute at the same time.
    - [ ] Given no limit from the user, when the loop executes, then the engine uses
          a safe default (assumption: default = 10).
    - [ ] Given a limit of 1, when the loop executes, then the iterations execute
          one after the other, in list order.
    - [ ] Given an invalid value (0, negative, or not a number), when the user saves
          the node, then the API does not accept it and shows a clear validation error.

    ## Out of scope
    - A limit on requests per second. This ticket limits only the parallel iterations.
    - A global limit across all workflows.

    ## Notes for developers
    - Put the change in the `execution` module (LOOP operator), not in `core` or `worker`.
      Then the 2 deployment shapes get it.
    - The limit is a value of each node, kept in the node definition (`common` model).

    Open questions:
    1. What must the default limit be? We assume 10.
    2. Must an administrator be able to set a platform-wide maximum?
