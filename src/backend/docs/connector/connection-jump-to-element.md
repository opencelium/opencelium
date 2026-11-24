# Connection Jump-to-Element

How a method redirects execution to a user-defined element instead of running
the connection strictly sequentially.

By default `ConnectorExecutor.start()` walks a linearly-sorted `executables`
list (methods from `MethodMng` + operators from `OperatorMng`), advancing
`headPointer` one body-block at a time. Element order and nesting are encoded in
the hierarchical `index` path (e.g. `1_1_2_0`); `getTailPointer` finds an
operator's body by index-prefix matching. A **jump** lets a regular method
override its natural successor with a user-chosen target. The jump is
**unconditional**: once configured, the natural next element is never taken.

Because the jump is unconditional, the set of skipped elements is fully known
before execution — it is every executable positioned between the source's tail
and the target. This makes every structural rule below verifiable at save time.

---

## 1. Model and terminology

| Term | Backend meaning |
|------|-----------------|
| Element `index` | Hierarchical numeric path, e.g. `1_1_2_0`; sorted via `Comparators.NUMERIC_PARTS`. |
| **Level** | The sibling set sharing the same `index` prefix minus its last segment (same parent operator). |
| **Container operators of X** | The strict prefixes of `index(X)`, innermost-first. `1_3_0` → `1_3`, `1`. |
| **Operator** | `OperatorMng.type` = `if` (IF) or `for` / `forin` / `splitstring` (LOOP). Rendered as a rhombus. |
| **Regular method** | Any non-operator element, identified by `MethodMng.color`. |
| **Reference** | A method consuming another's output — `#<color>.(response).path`, `StatementMng.color`, `FieldBindingMng`. |

A jump connects a **source** (regular method) to a **target** (regular method).

---

## 2. Rules

A jump `source → target` is valid only when **all** of the following hold.
There are nine rules; the original rule 5 has been folded into **R1**, and the
remaining rules renumbered so numbering is continuous.

| # | Rule | Meaning |
|---|------|---------|
| R1 | Forward, same level | A method may jump to a later method sharing its **own** parent (same level) — including when that parent is a loop body, where a method **already inside** the loop may jump forward among its loop-body siblings. (Subsumes the original rule 5.) It does **not** mean jumping *into* a loop from outside (R5) nor escaping a loop outward (R4). |
| ~~R2~~ | ~~No skipped reference~~ | **Not enforced.** A method may reference the output of any node, including one the jump skips. At run time an unresolved reference is written to the execution log (`segment=REF_NOT_FOUND`) and replaced with an empty value, so it never aborts an execution and must not block a jump. |
| R3 | No backward jump | The target must run strictly after the source. |
| R4 | Loop is a ceiling | A method inside a LOOP body may jump only **within that loop body**; it cannot escape the loop outward. Same-level jumps inside the loop stay allowed (R1). |
| R5 | No jumping into a loop | A method cannot jump **into** a LOOP body it is not itself part of. |
| R6 | No jumping into an if | A method cannot jump **into** an IF body it is not itself part of. |
| R7 | Escape through IFs | A method may jump **outward** through enclosing IF operators to an ancestor level, up to the nearest enclosing LOOP (see R4). |
| R8 | Operator is never a source | An operator (IF/LOOP) cannot start a jump. |
| R9 | Operator is never a target | An operator (IF/LOOP) cannot be jumped to. `R9 overrides R1` — where a rule's examples name an operator, that operator is still not a valid target. |

### Reachable targets — the algorithm

```
isValidJump(source, target):
  if isOperator(source): reject            # R8
  if isOperator(target): reject            # R9

  # Which levels can the source reach? (R4 / R5 / R6 / R7)
  reachable = { own level, anchor = source }          # R1
  for c in containersOf(source) innermost -> outermost:
      if type(c) == LOOP: break                        # R4 — loop ceiling
      reachable += { level containing c, anchor = c }  # R7 — escape one IF

  if parentOf(target) not among reachable levels: reject   # R5 / R6
  anchor = reachable.anchorFor(level(target))
  if lastIndex(target) <= lastIndex(anchor): reject        # R1 / R3 forward-only

  # No data-dependency check — references are never a jump violation (R2 retired)
  accept
```

The **anchor** is the source's own ancestor that lives at the landing level;
the target must come after it. For the source's own level the anchor is the
source itself.

---

## 3. Worked examples

Reference graph (operators marked; body elements indented under their operator):

```
ROOT: 0 → 1 → 2 → 3 → 4 → 5 → 6
  1  [IF]  : 1_0, 1_1[LOOP], 1_2, 1_3[IF], 1_4
    1_1    : 1_1_0, 1_1_1[IF], 1_1_2[LOOP], 1_1_3, 1_1_4
      1_1_1: 1_1_1_0, 1_1_1_1
      1_1_2: 1_1_2_0, 1_1_2_1, 1_1_2_2
    1_3    : 1_3_0, 1_3_1
  4  [IF]  : 4_0
  6  [LOOP]: 6_0
```

| Source | Legal targets | Rule exercised |
|--------|---------------|----------------|
| `2` | `3`, `5` | R1 — forward, same level (`4`, `6` excluded by R9) |
| `5` | — | R3 — nothing forward but the operator `6` |
| `1_0` | `1_2`, `1_4`, `2`, `3`, `5` | R1 + R7 — escapes IF `1` |
| `1_4` | `2`, `3`, `5` | R7 |
| `1_1_0` | `1_1_3`, `1_1_4` | R1 — same level, loop body only (R4 blocks escape) |
| `1_1_4` | — | **R4** — cannot leave loop `1_1` |
| `1_1_1_0` | `1_1_1_1`, `1_1_3`, `1_1_4` | R7 — escapes IF `1_1_1`, stops at LOOP `1_1` (R4) |
| `1_3_0` | `1_3_1`, `1_4`, `2`, `3`, `5` | **R7** |
| `1_3_1` | `1_4`, `2`, `3`, `5` | **R7** |
| `4_0` | `5` | R7 — escapes IF `4` |
| `6_0` | — | R4 — loop `6` |

---

## 4. Validation — two enforcement points, one validator

The rule logic lives in a single pure `JumpValidator` (no Spring/web coupling)
so it can be shared once execution is separated from core.

- **Save time** — the connection-save service runs `JumpValidator`; any
  violation **blocks the save** and returns `400` with the violation list
  (code + message + source/target ids) so the UI can highlight both elements.
- **Execution time** — `ConnectorExecutor.start()` re-runs the validator before
  rewriting `headPointer` to the jump target; a violation aborts execution with
  an exception carrying the code. This guards against stale or hand-edited
  connection definitions once execution no longer trusts the save-time check.

### Error catalog

| Code | Rule | Message (ids filled in at runtime) |
|------|------|------------------------------------|
| `JUMP_SOURCE_IS_OPERATOR` | R8 | "'{source}' is a {IF/LOOP} operator and cannot start a jump. Move the jump to a method." |
| `JUMP_TARGET_IS_OPERATOR` | R9 | "'{target}' is a {IF/LOOP} operator and cannot be a jump target. Pick a method instead." |
| `JUMP_TARGET_INSIDE_OPERATOR` | R5/R6 | "'{target}' is inside the {IF/LOOP} '{op}', which '{source}' is not part of. Jump only to methods at your own level or an enclosing level." |
| `JUMP_ESCAPES_LOOP` | R4 | "'{source}' is inside loop '{loop}' and can only jump within that loop's body. '{target}' is outside the loop." |
| `JUMP_BACKWARD` | R1/R3 | "'{target}' runs before '{source}'. Jumps must go forward." |
| ~~`JUMP_SKIPS_REFERENCED_METHOD`~~ | ~~R2~~ | No longer emitted. The constant is kept so the frontend contract and stored payloads stay valid. |
| `JUMP_TARGET_NOT_FOUND` | — | "Jump target '{targetId}' does not exist in this connection." |
| `JUMP_TO_SELF` | — | "A method cannot jump to itself." |

Every message names the **source**, the **target**, and the **fix**. The raw
ids are returned alongside the rendered message so the frontend drives
highlighting/navigation rather than parsing text.

---

## Notes

- **Jump lives on the method, not the operator.** The jump target is stored on
  the regular-method executable. It must never be added to `OperatorMng` — an
  operator can be neither a source (R8) nor a target (R9).
- **R5 and R6 are the same restriction for the two operator kinds.** Both forbid
  jumping *into* a body from outside — R5 for LOOP, R6 for IF. They are kept
  separate for clarity; a single `JUMP_TARGET_INSIDE_OPERATOR` code covers both.
- **Skipped set is deterministic.** Because the jump is unconditional, the
  skipped set equals the linear range `(tail(source), target)`. It is no longer
  used for validation: reference integrity — whether the referenced method ran
  at all — is a run-time concern the engine resolves by substituting an empty
  value, and is out of scope for `JumpValidator`.
- **`index` is the source of truth for structure.** Level, containers, and
  forward/backward ordering are all derived from the `index` path and the same
  `Comparators.NUMERIC_PARTS` ordering the executor already uses.
