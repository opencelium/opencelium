# STE check list for the documents that a skill writes

This file is the one copy of the ASD-STE100 Simplified Technical English (STE) rules that the
skills `spec`, `plan`, `tasks` and `agile-ticket` apply. The source of the rules, the 3 tiers and
the permitted technical names is `src/backend/docs/writing-guide.md`. When this file and the
writing guide differ, the writing guide wins; repair this file in the same PR.

A skill prompt is exempt from STE. Every document and every ticket that a skill writes is in STE.

## Which tier applies

| Tier | Applies to | Rule |
|---|---|---|
| Strict STE | Acceptance criteria, tickets, decisions and glossary entries of the architecture document, user documents | Approved words only, the technical names of the writing guide, all sentence rules |
| STE rules without the dictionary | Plans, the reasons of a decision, open questions, risks, proposals | All sentence rules; a word outside the approved list is permitted when it is clear |
| Exempt | Code, Javadoc, commit messages, PR descriptions, agent prompts, skills | None |

## Words

- Use only STE approved words, technical names and technical verbs. The permitted technical
  names and verbs are the groups in the writing guide, section "Technical names". A new industry
  term goes into that list (in the same PR) before a document uses it.
- Use each approved word only as the part of speech and with the meaning that STE gives.
  Example: "check" is a noun ("do a check"), not a verb ("check the file" → "examine the file").
- An acceptance criterion uses "must", never "shall". "The system shall ..." is not STE.
- Explain an abbreviation the first time you use it, except very common ones (API, UI, DB).
- No idioms, no slang, no jokes, no cultural references, no contractions ("don't" → "do not").
- Write numbers as numerals: "3 retries", not "three retries".

Common replacements:

| Do not write | Write |
|---|---|
| should | must |
| shall | must |
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

## Verbs

- Use the simple present for descriptions ("The API returns an error"), the imperative for
  instructions ("Open the node settings"), and "will" only for the future.
- Use the active voice: "The API returns an error", not "An error is returned by the API".
- Do not use the -ing form of a verb ("after saving" → "after you save"; "logging in" → "log in").
  An -ing word is permitted only inside a technical name ("provisioning", "logging package").
- Do not use perfect tenses ("has been deleted" → "is deleted" or "was deleted").

## Sentences and paragraphs

- One idea per sentence. One instruction per sentence.
- An instruction, a step, or an acceptance criterion has **20 words or less**.
- A descriptive sentence (summary, context, notes) has **25 words or less**.
- Put the condition before the instruction: "If the value is empty, show an error."
- A paragraph has one topic and **6 sentences or less**. Use a vertical list for 3 or more items.
- Put an article (the, a, an) or "this/these" before a noun. Do not drop words to save space.
- A noun cluster has 3 nouns or less. Use hyphens to make the cluster clear ("node-type descriptor").

## Names and references

- Name a building block by its responsibility ("the connection resolver"), never by a Java class
  or interface name. A code identifier appears only when it is a contract for an operator or for
  the build: a property, an environment variable, a jar, a port, a collection, a package. A product
  name that marks a selected technology (Spring RestClient, Quartz, MongoDB) is a technical name.
- Do not name a Jira ticket in a document: ticket numbers change and tickets are removed. A
  document points to a decision number or to a section heading of
  `src/backend/docs/architecture.md`; a story is named by its subject.
- "(decision 11)" points to the numbered list in architecture.md, section 7. The numbers do not
  change and are not used again.
- Domain words: "workflow" (never the legacy word "Connection"), "invoker", "connector", "node",
  "edge".
- A spec, a plan and a document of the architecture have no status, no date, no commit hash and
  no "Document history". Only `tasks.md` has a status line.

## Template exception

The user-story sentence "As a <user>, I want <goal>, so that <benefit>" is a fixed industry
format. Keep it as it is. STE applies to all other text.

## The check list

Go through the list after you write the document. Rewrite each sentence that breaks a rule.
Then put the filled list at the end of your chat answer, each item `[x]` or `[ ]`; for an open
item, name the sentence that remains and why. The list never goes into the document itself.

```
- [ ] Words: no "should", "shall", "may", "might", "ensure", "allow", "create", "provide", "via", "e.g.", "etc.".
- [ ] Verbs: active voice, simple present or imperative, no -ing verb forms, no perfect tenses.
- [ ] Length: steps and criteria have 20 words or less; other sentences have 25 words or less.
- [ ] Paragraphs: one topic, 6 sentences or less; a vertical list for 3 or more items.
- [ ] Nouns: an article before each noun; noun clusters of 3 nouns or less.
- [ ] Form: no idioms, no contractions, numbers as numerals, abbreviations explained.
- [ ] Names: building blocks by responsibility; no Java class or interface; no Jira ticket; decisions by number.
- [ ] Testable: a tester can answer yes or no to each acceptance criterion.
- [ ] Assumptions: each guess is marked with "(assumption)".
- [ ] Status: no status, date or commit hash, except the status line of tasks.md.
```
