---
name: app-conf-memory
description: "How the /application-config endpoint reads and patches src/main/resources/application.yml, plus the design decisions that produced the current behavior."
metadata: 
  node_type: memory
  type: project
  originSessionId: 1ef0d806-7baf-4108-bb18-d21ec6f5ca6f
---

## What this feature is

Admin-only `/application-config` endpoint that lets the UI **read** the on-disk `application.yml` as a JSON tree and **PATCH** it back. Changes are persisted to disk but require an application restart to take effect. Lives under `src/main/java/com/becon/opencelium/backend/appYml/` (DTOs in `dto/`, logic in `service/`, controller is `controller/ApplicationConfigController.java`).

**Why:** so operators can manage backend config from the OC web UI instead of SSHing into the server.

**How to apply:** treat this as a *file editor*, not a config framework. Every change is a textual edit to `application.yml` that preserves comments and formatting; nothing here drives Spring's runtime configuration directly.

## Key design decisions (in conversation order)

1. **Inactive (commented-out) blocks must be visible in the tree.** Commented YAML like `# ssl: ...` is exposed as a `ConfigNode` with `status: "inactive"` and inactive children. Implemented by [[yaml-shadow]]: a textual pass detects "anchor" lines (commented YAML keys), builds a shadow YAML with the outer `#` removed, and snakeyaml parses that. Nodes whose source line is in an inactive block are marked inactive.
2. **Anchor regex requires lowercase YAML key start (`[a-z_$]`).** This is the *one* thing that distinguishes a commented-out property from a documentation sentence: `# Note: foo` (uppercase N) stays a comment; `# note: foo` becomes an inactive node. Same trick keeps "inner doc comments" inside an inactive block (`#    # LDAP server URL`) from being mistaken for properties.
3. **Decorative `####` boxes are checked first.** A caption like `#   notification:   #` would otherwise match the anchor regex; the decorative pattern (line that starts and ends with `#`) is tested before the anchor pattern.
4. **Doubly-commented properties (`# # key: value`) are exposed as a single inactive node** and activating them strips **both** `#`s in one PATCH. The anchor regex accepts multiple leading `#`s; the strip removes every leading `#` from anchor lines. The bundled file has exactly one such line at `src/main/resources/application.yml:47` (`#  #    enabled: false`).
5. **Activate and deactivate both cascade down.** A single `{path: "spring.mail", status: "active"}` enables the whole `spring.mail` subtree on disk; `{path: "spring.mail", status: "inactive"}` disables the whole subtree. The validator was updated to expand the activate set to all descendants so the active-container invariant doesn't reject a parent-only activation.
6. **Both activate and deactivate cascade in both directions, but asymmetrically.** Activate down-cascade: explicit activate of a container enables every descendant. Activate up-cascade: activate of a deep leaf auto-enables the inactive ancestor key lines (NOT the ancestor's siblings — they stay commented unless explicitly listed). Deactivate down-cascade: writer.commentOut already covers the whole subtree (via line range). Deactivate up-cascade: if a disable leaves an ancestor with no remaining active children, that ancestor is auto-disabled too, and the walk keeps going up — sibling subtrees that still have active leaves stop the cascade. Earlier impl rejected both up cases with "active-parent" / "active-container" 400s; both were reversed at the user's request because the UI shouldn't make operators enumerate the chain. Remaining 400s: `inactive` on an ancestor combined with `active` on a descendant in the same patch, or `active` on a container combined with `inactive` on all its descendants. Writer no longer auto-cascades via line range on uncomment — it strips ONLY the key line of each path it's given; commentOut still cascades down via line range because every line in the block needs its `#` regardless. The service is what computes the exact path set passed to the writer.
7. **Doc-comment shapes are preserved verbatim.** Decorative `####` boxes group as a multi-line `before` comment on the next node; single-line `# text` becomes one `before` entry; multi-line `# text` collapses into one `before` entry joined with `\n`. Inner `#`s inside inactive blocks (`#  # text`) keep their inner `#` in the comment text — the shadow only strips anchor lines, so snakeyaml sees the inner `#` as a comment marker and the value after it as text.
8. **Comment text is "everything after the leading `#`", per spec.** A `# Webserver configuration` line yields text `" Webserver configuration"` (with the leading space).
9. **Removal is out of scope.** `value: null` writes the literal `null`; it does not delete the key. The user confirmed: do not implement key removal.
10. **Editing a value on an inactive path is currently treated as deactivation+ignore.** This is a known minor gap from the original spec (which allowed editing the value of a still-disabled field). It hasn't been raised again and isn't blocking.
11. **`commentOut` prepends `#` at column 0, never inside the indent.** The bundled-file convention is `#  ssl:` (`#` at col 0, content shifted right by one). `commentOut` and `uncomment` must be byte-exact inverses or repeated activate↔deactivate cycles drift the column and eventually break YAML parsing for nested inactive blocks. Earlier impl prepended `# ` (2 chars) but stripped only `#` (1 char) — caused a real bug where activating `websocket.ssl` then deactivating it left lines 15-21 with mismatched indents that snakeyaml couldn't compose. The round-trip is now locked in by `commentOutAndUncommentAreInversesAcrossARoundTrip` in [YamlConfigWriterTest](../../src/test/java/com/becon/opencelium/backend/unit/applicationConfig/YamlConfigWriterTest.java).

## Architecture map

| File | Role |
| --- | --- |
| `controller/ApplicationConfigController.java` | REST surface. `GET` reads; `PATCH` envelope `{ fields, comments }` — `comments` are ignored on write. |
| `dto/ApplicationConfigResponse.java`, `ConfigNode.java`, `NodeComment.java`, `ApplicationConfigPatchResponse.java` | Wire shape. `ConfigNode.ACTIVE = "active"`, `INACTIVE = "inactive"`. |
| `service/YamlShadow.java` | **Anchor detection** + **shadow building**, shared between reader and writer. Single source of truth for "what counts as a commented-out property line." |
| `service/YamlConfigReader.java` | snakeyaml-engine parses the shadow with `parseComments=true`; nodes inheriting lines from inactive blocks are marked inactive. |
| `service/YamlConfigWriter.java` | Three operations, each text-edit-based with snakeyaml source positions: `merge` (value edit + new keys), `commentOut` (deactivate, cascades via line range), `uncomment` (activate, cascades via line range, strips **all** leading `#`s on anchor lines). |
| `service/AtomicFileWriter.java` | Backup + temp-file-and-rename. Every successful PATCH: snapshot to `<backup-dir>/application.yml.bak.<epochMillis>`, write to temp file in target's parent dir, atomic-move over target, best-effort prune to `opencelium.config.backup.keep` (default 10). Restore is NOT exposed over HTTP on purpose — a stolen Admin token shouldn't be able to roll back security settings silently; rollback is `cp <backup> <target>` from a shell + restart. |
| `service/ApplicationConfigServiceImpl.java` | Orchestrates: parse patch envelope, expand activate cascade, validate the merged-state invariants, then write in order **uncomment → merge → commentOut**. |

## Invariants the validator enforces

1. **Conflicting activate + ancestor-disable** → `400` ("ancestor X is being disabled in the same patch"). Active-leaf-without-active-parent is NOT an error any more — cascade-up auto-fixes it.
2. **Conflicting activate-of-container + disable-all-its-descendants** → `400` ("Cannot activate X while disabling all its descendants"). Triggered when the disable cascade-up would otherwise also disable the explicitly-activated container. Active-container-without-active-child is NOT an error any more — cascade-up auto-disables empty containers.
3. **Disable/enable of unknown paths** → `400`. Disable of an already-inactive path is silently filtered to a no-op (idempotent).

Containers are evaluated **deepest-first** so error messages name the most-specific section.

## Patch flow (one transaction)

1. Parse envelope, group fields into `(activatePaths, disablePaths, valueTree)`.
2. Read current file, build the inactive-aware tree.
3. **Cascade-expand activates** to include on-disk inactive descendants.
4. Filter no-ops (disable of already-inactive, activate of already-active).
5. **Validate** contradiction (activate + ancestor-disable) and active-container invariants on the merged state. Fail-fast with `400`; file untouched.
6. Apply writer ops in order: `uncomment` → `merge` → `commentOut`. Each op re-parses the file it just produced.
7. `AtomicFileWriter` writes a backup, then temp file + rename.

## Test layout

- `src/test/.../unit/appYml/YamlConfigReaderTest.java` — 16 tests for inactive detection, comment grouping, double-`#` exposure, real-file smoke against `src/main/resources/application.yml`.
- `src/test/.../unit/appYml/YamlConfigWriterTest.java` — 22 tests for `merge`, `commentOut`, and `uncomment` (single-`#`, double-`##`, inner-doc preservation).
- `src/test/.../unit/appYml/ApplicationConfigServiceImplTest.java` — 11 tests for orchestration: read/patch, cascade activate, active-parent rejection, doubly-commented activation, idempotent disable.
- `src/test/.../slice/controller/ApplicationConfigControllerTest.java` — `@WebMvcTest` for the REST surface (admin-only, envelope validation, exception → status mapping).

Run with `./gradlew test --tests "*ApplicationConfig*" --tests "*YamlConfig*"` (61 tests).

## Docs

- Feature spec + frontend notes: `src/backend/docs/application-config/feature.md`
- Postman acceptance cases: `src/backend/docs/application-config/postman-test-cases.md`

## Pitfalls / things to double-check before changing

- **Don't change the anchor regex** without re-running the bundled-file smoke test. The lowercase-first-char rule is load-bearing — many doc comments in the file (`# User search base`, `# LDAP server URL`) would be misclassified as inactive properties otherwise.
- **Don't touch `application.yml:47`** (the `#  #    enabled: false` line) as a "fix." It's the canonical doubly-commented test fixture; the reader and writer both rely on it being a real condition in the repo.
- **Don't add YAML-library validation** on PATCH bodies. The writer works textually so it survives quirks the YAML parser would normalize away (e.g. trailing spaces, quoting style, the `username: ####` value that strict YAML reads as null).
- **Don't introduce dependencies between writer ops.** The current order (uncomment → merge → commentOut) is deliberate: enabling lines first means `merge` sees them, and disabling last means a deactivate of an active path doesn't get re-enabled by a later cascade. Re-ordering would silently change behavior.
