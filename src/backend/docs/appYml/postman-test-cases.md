# Postman Test Cases — `/application-config`

End-to-end scenarios for the application-config admin API. Run against a locally-booted backend (`./gradlew bootRun`, port 9090) with a writable copy of `src/main/resources/application.yml` on disk.

## Setup (do once)

**Base URL:** `http://localhost:9090`

**Auth:** Every request needs an Admin JWT. Obtain it via your login endpoint, then set on the Postman collection:

```
Authorization: Bearer <admin-jwt>
Content-Type: application/json
```

**Config file under test:** path comes from `opencelium.config.file-path` in `application.yml` (defaults to `src/main/resources/application.yml`). Confirm the process has read+write permission.

**Reset between destructive tests:** `git checkout src/main/resources/application.yml`.

**Backup directory:** `runtime/backup/application/`. Every successful PATCH writes `application.yml.bak.<epochMillis>` here (up to `opencelium.config.backup.keep`, default 10).

---

## 1. GET — read whole tree

```
GET /application-config
```

**Expect 200.** Body:
```json
{
  "fields": [
    { "key": "server", "path": "server", "status": "active", "value": [ ... ], "comments": [ ... ] },
    ...
  ],
  "comments": [
    { "position": "header", "text": " ... " },
    { "position": "footer", "text": " ... " }
  ]
}
```

Spot-check:
- `server` → `status: "active"`.
- `opencelium.polyglot` → `status: "inactive"`, with inactive children (`enabled`, `protocol`, `host`, `port`, `launch.*`).
- `spring.mail.opencelium.enabled` → `status: "inactive"` (doubly-commented on line 47 — must still appear as a node).
- The `Polyglot Engine Configuration` `####` box appears as a multi-line `before` comment on the next node, **not** as a node.
- Inner doc comments inside the polyglot block (`# Enables or disables the polyglot service integration.`) appear in the `comments` of `opencelium.polyglot.enabled` with their inner `#` preserved (the "double-`#`" case).

---

## 2. PATCH — edit an active value

```
PATCH /application-config
```
```json
{
  "fields": [
    { "path": "server.port", "status": "active", "value": 8081 }
  ]
}
```

**Expect 200.** Body:
```json
{
  "status": "saved",
  "restartRequired": true,
  "message": "Configuration saved. Restart the application for changes to take effect."
}
```

On disk: `port: 8081`. Inline comment (if any) preserved.

---

## 3. PATCH — deactivate a child (leaf)

```json
{
  "fields": [
    { "path": "server.address", "status": "inactive" }
  ]
}
```

**Expect 200.** On disk: `address: 127.0.0.1` becomes `# address: 127.0.0.1`. `server.port` stays active.

---

## 4. PATCH — deactivate a parent (whole block cascades)

```json
{
  "fields": [
    { "path": "springdoc", "status": "inactive" }
  ]
}
```

**Expect 200.** On disk: `springdoc:` and every child line under it are prefixed with `# `.

---

## 5. PATCH — activate a previously-inactive block (cascade)

Activating a container enables its whole subtree — no need to list children.

```json
{
  "fields": [
    { "path": "opencelium.polyglot", "status": "active" }
  ]
}
```

**Expect 200.** On disk: leading `#`s on `polyglot:`, `enabled:`, `protocol:`, `host:`, `port:`, `launch:`, and every descendant are removed. Inner doc comments (`# Enables or disables the polyglot service integration.`) are untouched.

---

## 6. PATCH — activate a doubly-commented property in one go

`src/main/resources/application.yml:47` reads `  #  #    enabled: false`.

```json
{
  "fields": [
    { "path": "spring.mail", "status": "active" }
  ]
}
```

**Expect 200.** On disk: every `#` in the `spring.mail` block — including **both** `#`s on line 47 — is removed in one PATCH. Inner doc comments elsewhere (e.g. `# LDAP server URL` style) stay intact.

---

## 7. PATCH — add a new property

```json
{
  "fields": [
    { "path": "opencelium.new-flag", "status": "active", "value": "hello" }
  ]
}
```

**Expect 200.** On disk: a new line `new-flag: hello` is appended at the end of the `opencelium:` block, at the same indent as siblings.

---

## 8. PATCH — combined: edit + deactivate + activate in one call

```json
{
  "fields": [
    { "path": "server.port", "status": "active", "value": 9091 },
    { "path": "springdoc", "status": "inactive" },
    { "path": "opencelium.polyglot", "status": "active" }
  ]
}
```

**Expect 200.** All three effects applied atomically (temp file + rename). On failure of any step the original file is preserved untouched.

---

## 9. PATCH — partial activate + opt-out child

After case 6 (mail fully active), re-disable a specific child while keeping the rest active.

```json
{
  "fields": [
    { "path": "spring.mail.opencelium.enabled", "status": "inactive" }
  ]
}
```

**Expect 200.** On disk: `spring.mail` block stays active, but `enabled: false` gets one `#` prepended → `#     enabled: false`.

---

## 10. Activate a deep leaf — cascade-up auto-enables ancestors, leaves siblings commented

```json
{
  "fields": [
    { "path": "websocket.ssl.key-store-password", "status": "active" }
  ]
}
```

**Expect 200.** On disk:
- `ssl:` line uncommented (auto-activated ancestor).
- `key-store-password: root` uncommented (requested leaf).
- `enabled:`, `key-store-type:`, `key-store:`, `key-password:`, `key-alias:` stay commented — siblings are **not** auto-activated.

Use this pattern when the user wants to enable exactly one field of an otherwise-disabled block.

---

## 11. Disable cascades up when last active sibling is gone

To exercise the deepest cascade, first set up a container with exactly one active child, then disable it. Easiest setup: a freshly-added test field.

```json
{
  "fields": [
    { "path": "opencelium.testblock.only-flag", "status": "active", "value": true }
  ]
}
```

This adds `opencelium.testblock.only-flag: true` (creating both `testblock` and `only-flag`). Then disable that single leaf:

```json
{
  "fields": [
    { "path": "opencelium.testblock.only-flag", "status": "inactive" }
  ]
}
```

**Expect 200.** On disk:
- `only-flag: true` becomes `#    only-flag: true`.
- `testblock:` becomes `#  testblock:` (auto-disabled — no remaining active child).
- `opencelium:` stays active (it has other subtrees like `version`, `config`, `connector`).

If you stack the same pattern several levels deep, each ancestor that empties out is disabled in turn; the cascade stops at the first ancestor that still has another active subtree.

---

## 12. Validation — disable unknown path → 400

```json
{
  "fields": [
    { "path": "nope.does.not.exist", "status": "inactive" }
  ]
}
```

**Expect 400.** Message: `Cannot disable unknown path 'nope.does.not.exist'`.

---

## 13. Validation — activate unknown path → 400

```json
{
  "fields": [
    { "path": "totally.fake.path", "status": "active" }
  ]
}
```

**Expect 400.** Message: `Cannot enable unknown path 'totally.fake.path'`.

---

## 14. Validation — missing `fields` → 400

```json
{ "comments": [] }
```

**Expect 400.**

---

## 15. Validation — `fields` not an array → 400

```json
{ "fields": { "path": "server.port" } }
```

**Expect 400.**

---

## 16. Validation — node missing `path` → 400

```json
{
  "fields": [
    { "value": 8080 }
  ]
}
```

**Expect 400.**

---

## 17. Validation — malformed JSON → 400

```
{ not-valid-json
```

**Expect 400.**

---

## 18. Validation — envelope not an object → 400

```json
[1, 2, 3]
```

**Expect 400.**

---

## 19. Auth — non-admin → 403

Log in as a non-Admin user, set their JWT on the request, then hit any endpoint:

```
GET /application-config
```

**Expect 403.**

---

## 20. Idempotency — deactivate an already-inactive path

```json
{
  "fields": [
    { "path": "opencelium.polyglot.enabled", "status": "inactive" }
  ]
}
```

**Expect 200.** No file change — filtered as no-op (this is intentional).

---

## 21. Backup verification

After any successful PATCH:

```
ls runtime/backup/application/
```

Expect at least one `application.yml.bak.<epochMillis>` file. After 10+ writes, oldest backups are pruned.

---

## Recommended order

1, 2, 7 (safe, easy revert) → 3, 4, 5, 6, 8, 9 (state-changing — `git checkout` between groups) → 10–18 (errors, no state change) → 19 (auth) → 20 (idempotency) → 21 (backups).
