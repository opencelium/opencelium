# Application Config — Feature Documentation

Admin-only API for reading and patching the on-disk `application.yml` from the UI. Changes are persisted but **require an application restart to take effect**.

- **Base URL:** `http://<host>:9090`
- **Auth:** existing JWT in `Authorization: Bearer <token>`; caller must have the `Admin` role.
- **Content type:** `application/json`
- **Controller:** [`ApplicationConfigController`](../../src/main/java/com/becon/opencelium/backend/controller/ApplicationConfigController.java)
- **Service:** [`ApplicationConfigServiceImpl`](../../src/main/java/com/becon/opencelium/backend/appYml/service/ApplicationConfigServiceImpl.java)
- **Reader / Writer:** [`YamlConfigReader`](../../src/main/java/com/becon/opencelium/backend/appYml/service/YamlConfigReader.java), [`YamlConfigWriter`](../../src/main/java/com/becon/opencelium/backend/appYml/service/YamlConfigWriter.java), [`YamlShadow`](../../src/main/java/com/becon/opencelium/backend/appYml/service/YamlShadow.java)

---

## Model overview

The file is projected to a **tree of field nodes**. Every key in `application.yml` — whether enabled or commented-out — is one `ConfigNode`. A node carries its own `status` (`active` = uncommented on disk, `inactive` = commented-out) and its own documentation `comments`. Nesting is expressed through `value`: a leaf's `value` is a scalar (or scalar array); a container's `value` is an array of child nodes.

Commented-out config is no longer opaque comment text — it is parsed into real `inactive` nodes the UI can toggle. Doubly-commented properties (`# # key: value`) are also exposed as inactive nodes; the activate flow strips both `#`s in one call.

### `ConfigNode`

| Field | Type | Notes |
| --- | --- | --- |
| `key` | string | Last segment of `path`. |
| `path` | string | Dot-separated absolute path, e.g. `spring.mail.host`. Arrays use `[n]`. **Stable id** used for PATCH diffs. |
| `status` | string | `"active"` or `"inactive"`. Per-node — a parent may be active while a child is inactive (e.g. `server` active, `server.ssl` inactive). |
| `value` | scalar \| `ConfigNode[]` | **Leaf** → primitive (number/string/bool/null) or JSON array of primitives. **Container** → array of child nodes. |
| `comments` | `Comment[]` | Documentation attached to this node. Omitted or `[]` when none. Read-only on write. |

### `Comment` (per-node)

| Field | Type | Notes |
| --- | --- | --- |
| `position` | string | `"before"` (block above the key), `"inline"` (same line as value), `"after"` (block below the value). |
| `text` | string | Comment body without the leading `#`. May be multi-line — adjacent block lines for the same node/position are joined with `\n`. Inner `#` inside an inactive block is preserved (the "double-`#`" case). |

Different positions on the same node stay separate entries.

---

## Comment shapes (preserved verbatim)

| Pattern | Example | Treated as |
| --- | --- | --- |
| Decorative box | `############`, `#   Title   #` | Block boundary. Grouped into one multi-line `before` comment on the next node, or as a header/footer orphan if at the top/bottom of the file. Never parsed as a node. |
| Single-line doc | `# the http port` | One `before` entry on the following node. |
| Multi-line doc | three consecutive `# ...` lines | One `before` entry joined with `\n`. |
| Inline | `port: 9090   # default http port` | `inline` entry on that node. |
| Inner doc inside inactive block | `#    # Enables...` | Outer `#` is the block marker, inner `#` is preserved in the comment text (the "double-`#`" case). |

Detection of an "inactive block" relies on an **anchor regex** that requires a lowercase YAML key start (`[a-z_$]`). This is what distinguishes a commented-out property from a documentation sentence — `# Note: foo` (uppercase N) stays a comment, `# note: foo` becomes an inactive node.

---

## `GET /application-config`

Returns the entire `application.yml` as a node tree, plus an envelope-level `comments` list holding only **orphan** comments that belong to no field (file header/footer).

### Response — `200 OK`

```json
{
  "fields": [
    {
      "key": "server", "path": "server", "status": "active",
      "comments": [ { "position": "before", "text": " Webserver configuration section" } ],
      "value": [
        { "key": "port",    "path": "server.port",    "status": "active",  "value": 9090,
          "comments": [ { "position": "inline", "text": " default http port" } ] },
        { "key": "address", "path": "server.address", "status": "active",  "value": "127.0.0.1", "comments": [] },
        {
          "key": "ssl", "path": "server.ssl", "status": "inactive", "comments": [],
          "value": [
            { "key": "enabled",        "path": "server.ssl.enabled",        "status": "inactive", "value": true,     "comments": [] },
            { "key": "key-store-type", "path": "server.ssl.key-store-type", "status": "inactive", "value": "PKCS12", "comments": [] }
          ]
        }
      ]
    }
  ],
  "comments": [
    { "position": "header", "text": " OpenCelium application configuration" },
    { "position": "footer", "text": " End of file" }
  ]
}
```

> The response may include secrets (`opencelium.token.secret`, `opencelium.connector.master-password`, `spring.datasource.password`, …) in full. Mask in the UI by default and never log the body.

### Errors

| Status | When | Body |
| --- | --- | --- |
| `403` | Caller is not Admin | `ErrorResource` |
| `500` | File missing / parse failure | `ErrorResource` |

---

## `PATCH /application-config`

Applies changes to the on-disk `application.yml`, matching nodes **by `path`**. Same envelope shape as GET for round-trip symmetry. Send only the nodes you changed; everything else on disk is left untouched, including all comments and formatting.

> `comments` (both per-node and envelope-level) are **read-only on write** — accepted for shape compatibility but ignored. Comments on disk are preserved automatically by the writer.

### What you can change

| Change | How | On-disk effect |
| --- | --- | --- |
| **Edit a value** | Send the node with `path` and new `value` | Replaces the value in place; inline comment preserved when value stays scalar. |
| **Enable a disabled setting** | Send `status: "active"` (parent alone is enough — cascades) | Removes **every** leading `#` on each anchor line in the node's block. Inner doc comments inside the block stay. |
| **Disable an active setting** | Send `status: "inactive"` | Prepends `# ` to every uncommented line of the node's block (cascades). |
| **Add a new key** | Send a new `path` with `status: "active"` and `value` | Appended at the end of its parent's block, at the parent's child indent. |
| **Remove a key** | Not supported (out of scope). |

### Cascading semantics

- **Activate cascades down.** `{path: "X", status: "active"}` for a container enables `X` and every on-disk descendant.
- **Activate also cascades up.** `{path: "X", status: "active"}` for a deep leaf auto-enables each inactive ancestor's key line — **but not the ancestor's siblings**. So `{path: "websocket.ssl.key-store-password", status: "active"}` enables `ssl:` (the ancestor) and `key-store-password:` (the requested leaf) while leaving other `ssl` children commented.
- **Deactivate cascades down.** `{path: "X", status: "inactive"}` disables `X` and every descendant.
- **Deactivate cascades up when an ancestor empties.** If disabling a path leaves an ancestor with no remaining active children, that ancestor is auto-disabled too. The cascade keeps walking up — if the now-disabled ancestor was the last active subtree of *its* parent, that parent is disabled as well, and so on. Sibling subtrees that are still active stop the cascade.
- **Contradictions reject.** Activating a path while explicitly disabling one of its ancestors in the same PATCH is a `400`. Activating a container while disabling all of its descendants is also a `400`.

### Doubly-commented properties

A line like `  #  #    enabled: false` (the file ships with one at `application.yml:47`) is exposed as a single inactive node. Activating it — or activating any ancestor — strips **both** `#`s on that line in one PATCH. The reader uses a multi-`#`-aware anchor regex; the writer's strip removes every leading `#` from anchor lines.

Inner doc comments — `#    # LDAP server URL` style — are **not** affected because the anchor regex requires a lowercase-letter start. They remain as comments before/after their adjacent property.

### Request body examples

#### Edit one scalar
```json
{ "fields": [ { "path": "server.port", "status": "active", "value": 8080 } ] }
```

#### Enable a block (cascade)
```json
{ "fields": [ { "path": "opencelium.polyglot", "status": "active" } ] }
```

#### Disable a leaf
```json
{ "fields": [ { "path": "opencelium.debug-mode", "status": "inactive" } ] }
```

#### Round-trip — re-send the envelope received from GET with edits
```json
{ "fields": [ /* edited node tree */ ], "comments": [ /* ignored */ ] }
```

### Merge / diff semantics

- Nodes are matched to disk **by `path`**.
- **`status` changed** → toggle: `active → inactive` comments the node (and its whole subtree) in place; `inactive → active` uncomments it (and its whole subtree).
- **`value` changed** → replacement. Object-valued nodes deep-merge per child; arrays are replaced wholesale.
- **Unknown `path`** with `status: "active"` and a `value` → appended as a new key at the parent's child indent.
- **`value: null`** writes `null` into the YAML — does **not** delete the key.
- A node you don't send is left exactly as-is.
- **Validation runs against the merged result** (your changes on top of what's on disk) **before anything is written**; on failure the file is untouched.

### Invariants enforced (`400`)

1. **No simultaneous disable + descendant-activate.** If the same patch disables a path AND activates one of its descendants, the cascade-up refuses to fight the explicit disable and the request is rejected.

2. **No activate-of-container + disable-all-its-descendants.** If a patch explicitly activates a container but disables every child it would have, the cascade-up disable would want to also disable the container — that contradicts the explicit activate, so the request is rejected.

Both "active container without active children" and "active leaf without active parent" are no longer separate errors — they're handled by the cascade rules.

Error messages name the offending path.

### Response — `200 OK`

```json
{
  "status": "saved",
  "restartRequired": true,
  "message": "Configuration saved. Restart the application for changes to take effect."
}
```

Surface `restartRequired: true` to the operator — settings are written but the running process is still on the old config.

### Side effects on disk — backups & atomic write

Implemented in [`AtomicFileWriter`](../../src/main/java/com/becon/opencelium/backend/appYml/service/AtomicFileWriter.java). Every successful PATCH performs the following sequence; on any failure mid-sequence the original file is left untouched and the caller gets `500`.

1. **Ensure backup directory exists** (`opencelium.config.backup.directory`, default `runtime/backup/application`). Created on first write.
2. **Snapshot the current file** to `<backup-dir>/<filename>.bak.<epochMillis>` — `Instant.now().toEpochMilli()` gives a monotonically increasing suffix so each backup is uniquely named even at sub-second frequency.
3. **Write to a temp file** in the same parent directory as the target (so the move stays on the same filesystem and can be atomic).
4. **Atomic-move** the temp file over the target with `StandardCopyOption.ATOMIC_MOVE` + `REPLACE_EXISTING`. Either the new bytes are in place or the old bytes are; readers never see a half-written file.
5. **Prune old backups** so at most `opencelium.config.backup.keep` (default 10) remain per target filename. Best-effort — pruning failures are swallowed since the write has already succeeded.

If the temp-file write or move fails, the temp file is deleted (best-effort) and the original file is left exactly as it was — the backup just made is the same bytes as the still-on-disk file, so no data is lost.

**Restoring** a backup is **not exposed over HTTP**. Roll back from a shell:

```bash
cp runtime/backup/application/application.yml.bak.<epochMillis> src/main/resources/application.yml
# then restart the backend so it picks up the rolled-back file
```

This is deliberate: an HTTP restore endpoint would let a stolen Admin token undo security-relevant changes invisibly. If a UI rollback is needed, it should ship with audit logging and a separate authorization check.

### Errors

| Status | When | Body |
| --- | --- | --- |
| `400` | Malformed JSON, body not an object, missing `fields`, `fields` not an array, node missing `path` | `ErrorResource` |
| `400` | Activating a container while disabling all its descendants in the same patch | `ErrorResource` |
| `400` | Activating a path whose ancestor is being disabled in the same patch | `ErrorResource` |
| `400` | Disable / enable an unknown `path` | `ErrorResource` |
| `403` | Caller is not Admin | `ErrorResource` |
| `500` | File I/O failure (not writable, disk full, parse error on existing file). Original file untouched. | `ErrorResource` |

---

## `ErrorResource` shape (shared)

```json
{
  "timestamp": "2026-05-28T17:30:12.345+00:00",
  "status": 403,
  "error": "FORBIDDEN",
  "message": "Access is denied",
  "path": "/application-config"
}
```

---

## Configuration keys

| Key | Default | Purpose |
| --- | --- | --- |
| `opencelium.config.file-path` | `./application.yml` | Path to the YAML file the endpoint reads/writes. Service falls back to the classpath copy on read if the configured file doesn't exist, but writes always require an on-disk file. |
| `opencelium.config.backup.directory` | `runtime/backup/application` | Where pre-write backups go. Created on first write. |
| `opencelium.config.backup.keep` | `10` | Max backups retained per target file; older ones are pruned best-effort. |

---

## Notes for the frontend

- **Render as a tree.** Walk `fields` recursively; a node is a leaf when `value` is a scalar/array and a container when `value` is a `ConfigNode[]`.
- **Status is per-node.** Render inactive nodes greyed/toggleable.
- **Toggling cascades.** Flipping a container to `active`/`inactive` enables/disables its whole subtree on disk — the UI does not need to send every child.
- **Cascade-up is automatic.** Toggling a deep child to `active` enables its ancestor key lines without the UI having to enumerate them. Siblings stay commented unless explicitly listed. The only thing to avoid is mixing an explicit `inactive` on an ancestor with an `active` on its descendant in the same payload — that's a `400`.
- **Comments live on the node.** Render a node's `comments` next to it; only `header`/`footer` orphans come from the envelope-level `comments`.
- **Secrets are returned in full.** Mask them by default and require an explicit "reveal" action. Never log the response body.
- **`text` can be multi-line** — split on `\n` for line-by-line rendering or feed into a `<pre>`.
- **PATCH by path, partial allowed.** Send only changed nodes; identify each by `path`.
- **Re-fetch after PATCH** for the canonical post-merge view (scalar quoting / re-emission may differ slightly).
- **Surface `restartRequired: true`** — the change is on disk but not in the running process; an operator restart is required.

---

## Test references

- Reader unit tests: [`YamlConfigReaderTest`](../../src/test/java/com/becon/opencelium/backend/unit/applicationConfig/YamlConfigReaderTest.java)
- Writer unit tests: [`YamlConfigWriterTest`](../../src/test/java/com/becon/opencelium/backend/unit/applicationConfig/YamlConfigWriterTest.java)
- Service unit tests: [`ApplicationConfigServiceImplTest`](../../src/test/java/com/becon/opencelium/backend/unit/applicationConfig/ApplicationConfigServiceImplTest.java)
- Controller slice tests: [`ApplicationConfigControllerTest`](../../src/test/java/com/becon/opencelium/backend/slice/controller/ApplicationConfigControllerTest.java)
- Postman smoke / acceptance: [`postman-test-cases.md`](./postman-test-cases.md)

Run with:

```
./gradlew test --tests "*ApplicationConfig*" --tests "*YamlConfig*"
```
