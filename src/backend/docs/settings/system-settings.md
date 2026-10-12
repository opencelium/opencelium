# System settings — global, admin-managed configuration

**Status:** implemented (v5.1) · **Endpoint:** `/system-setting/{name}` · **Table:** `system_setting`

## Context

The frontend lets a user brand the UI from a small set of "seed" colors (type `CustomThemeSeeds`
in `src/frontend/src/shared/theme/palette/customPalette.ts`):

```json
{ "primary": "#1677ff", "accent": "#2f54eb", "neutral": "#8c8c8c", "sidebar": "#2c3d49" }
```

All values are 6-digit hex (`^#[0-9a-fA-F]{6}$` — no shorthand, no alpha, no named colors). The
frontend expands the seeds into full light and dark palettes itself; light/dark mode is a separate
setting and is **not** part of this JSON. Until now the seeds lived only in
`localStorage['oc_custom_theme_seeds']` — per browser, lost on another machine.

Product asked for a **global** theme: set once by an admin, applied for every user. Separately,
the backend had no storage for *any* system-wide setting — everything settings-shaped was per-user
(`detail`, `connection_editor_settings`, `widget_setting`), and non-user config lived in
`application.yml`, whose admin patch mechanism (`appYml` package) requires a restart to apply.

## Decision

One generic key-value table for global settings, with a generic admin API. The theme is merely the
first row.

```sql
CREATE TABLE system_setting (
    name       VARCHAR(100) PRIMARY KEY,  -- 'theme_colors'; later 'app_logo', migrated opencelium.* params
    value      TEXT DEFAULT NULL,          -- opaque JSON string, shape owned by the consumer
    updated_at TIMESTAMP NULL,
    updated_by INT NULL                    -- audit only, deliberately no FK to user
);
```

| Endpoint | Behavior | Access |
|---|---|---|
| `GET /system-setting/{name}` | 200 with the setting, 404 if absent | admin, **or** any authenticated user if the name is whitelisted |
| `PUT /system-setting/{name}` | upsert; body `{"value": { ... }}` — a real JSON value, not an encoded string. Rejected 400 `RESERVED_SYSTEM_SETTING` for `app_logo` (see below) | `@PreAuthorize("hasAuthority('Admin')")` |
| `DELETE /system-setting/{name}` | remove; clients fall back to their defaults; 204 (idempotent) | `@PreAuthorize("hasAuthority('Admin')")` |
| `POST /system-setting/app_logo` | multipart param `file`: upload or replace the system icon; 200 with the setting; 400 on empty/>5 MB/non-jpg-jpeg-png | `@PreAuthorize("hasAuthority('Admin')")` |
| `DELETE /system-setting/app_logo` | remove icon file + row; 204 (idempotent). Literal mapping beats the `/{name}` template (PathPatternParser) | `@PreAuthorize("hasAuthority('Admin')")` |

Pieces: entity `SystemSetting`, repository `SystemSettingRepository`, service
`SystemSettingServiceImp`, DTO `SystemSettingDTO`, controller `SystemSettingController`, read
policy `security/SystemSettingSecurity`, Liquibase changeset `5.1:4`.

### The value is opaque JSON on purpose

The API exposes `value` as a real JSON value (`JsonNode` in the DTO), but the backend never
interprets `primary`/`accent`/etc. — the node is serialized verbatim into the `value` column on
write and parsed back on read. The frontend owns the shape, so adding a fifth color or a font
needs **no backend change, no migration, no coordinated deploy**. Well-formedness comes free from
request parsing (a malformed body 400s in Jackson before reaching the controller); the service
adds two cheap guards so a raw API caller cannot poison the row: the value must not be missing or
JSON `null` (Jackson maps an explicit `null` to `NullNode`, which `@NotNull` cannot catch), and
its serialized form is capped at 1024 characters. A stored value corrupted outside the API
surfaces on read as 500 `CORRUPT_SYSTEM_SETTING_VALUE` rather than a crash.

**Consequence the frontend must honor:** semantic validation is theirs. Anything read from this
endpoint must pass their existing `isValidSeeds` hex check before being applied — the same way
they already distrust localStorage. A crafted value must never reach CSS custom properties
unvalidated (CSS injection / `url()` exfiltration).

### Per-setting read access: a whitelist in code

Most future settings (SMTP details, migrated yml parameters) must not be world-readable, while
branding must be. A single static `@PreAuthorize` cannot express "depends on the name", so the GET
uses SpEL delegating to a bean:

```java
@PreAuthorize("hasAuthority('Admin') or @systemSettingSecurity.isUserReadable(#name)")
```

`SystemSettingSecurity` holds a `Set.of("theme_colors", "app_logo")`. **Default-deny:** a new
setting is admin-only unless deliberately whitelisted — forgetting to classify fails closed.
Alternatives considered: a `user_readable` column (data-driven, but policy becomes mutable data an
admin typo can flip, plus a DB read inside the authorization check) and a `public.` name prefix
(access welded into the key forever). Both rejected; settings are introduced by code changes
anyway, so the whitelist update rides the same PR. Known cosmetic trade-off: a non-admin probing a
non-whitelisted name gets 403, which confirms the name exists; map to 404 later if that matters.

### The system icon (`app_logo`) is a setting that owns a file

The admin-uploaded application icon (shown in the UI instead of the OpenCelium logo) is one
`system_setting` row whose value references a stored file:

```json
{"filename": "3f1c…b2.png", "url": "./storage/files/3f1c…b2.png"}
```

The file itself goes through the existing `StorageService` into `upload-dir/`, named
`UUID.<ext>`, and is served by the already-public `GET /storage/files/{filename}` route — so the
logo renders even on the login page, with no security-config change. That route's
`Content-Disposition: attachment` / missing `Content-Type` is harmless for `<img src>` rendering
(role icons and profile pictures already prove it); inline disposition and cache headers remain
future work. Extension whitelist is jpg/jpeg/png via `FileNameUtils.isSupportedImageExtension` —
**no SVG** (script-capable, and the file is served unauthenticated). Size is capped at 5 MB by
`@FileValidator` on the controller param (class-level `@Validated` makes it fire), and rejections
use `GeneralServiceException` (400 `INVALID_SYSTEM_SETTING_ICON`) — never `StorageException`,
which has no handler and would surface as 500.

Because the row and the file must never drift apart, the generic write path refuses the name:
`save("app_logo", …)` throws 400 `RESERVED_SYSTEM_SETTING` (the guard lives in the **service**,
so no future internal caller can bypass it either), and the literal `DELETE /app_logo` mapping
shadows the generic `DELETE /{name}` for exactly this name. Operation ordering follows the
`UserRoleServiceImpl.uploadIcon` precedent, arranged so every failure mode degrades to an
**orphaned file** (harmless) rather than a **dangling reference** (broken logo): upload = store
new file → save row → delete old file last (a delete failure rolls back the `@Transactional` row
write to the still-existing old file); removal = delete row first → delete file (an IO failure
rolls the row back). A corrupt row value is parsed leniently and never blocks re-upload or
removal — it just orphans one file.

Note the authority string: authorities are the **raw role name** from the `role` table
(`UserPrincipals#getAuthorities`), so it must be exactly `hasAuthority('Admin')` —
`hasRole('ADMIN')` would never match. Role names are user-editable via `RoleController`; "Admin"
is a convention, not a constraint.

## Alternatives considered for the storage itself

- **JSON column on `detail` (per-user only).** Cheapest — three edits, no new endpoint — but
  cannot express a global value, and it inherits two defects of the `/userDetail` plumbing: `PUT
  /userDetail/{id}` has no ownership check (any authenticated user can overwrite any user's
  detail) and rebuilds the entity from scratch, so an outdated client wipes fields it omits.
- **Typed columns (`primary_color VARCHAR(7)`, …).** Real DB-level validation, but every frontend
  shape change becomes a schema migration — exactly the coupling this feature set out to avoid,
  and useless for the yml-parameter future.
- **Two tables now (`ui_setting` per-user + `system_setting` global).** The fuller design; the
  per-user half was descoped until a real request arrives. It slots in later as a sibling table
  (`user_id` + `name` composite key) and a resolving read (`own row → system row → client
  default`, response carrying `scope`) with zero changes to this code. Until then, personal themes
  simply stay in localStorage as before.
- **Single write endpoint with a scope parameter** (`PUT /ui-setting/{name}?scope=user|system`).
  Workable with SpEL, but the privilege boundary becomes request-data-dependent — every default,
  branch, and typo'd scope value is a potential escalation bug — and the two scopes are genuinely
  different resources. Rejected in favor of separate endpoints whose annotations a reviewer can
  read at a glance (and reflectively assert in tests).
- **`application.yml` via the existing `appYml` patch mechanism.** Admin-only already, but writes
  a file on disk, requires a restart to apply, doesn't survive image rebuilds, and can't hold an
  uploaded logo.

## Runtime behavior

- Frontend on load: `GET /system-setting/theme_colors` → 200 → parse, `isValidSeeds`, apply via
  the existing seed pipeline; 404 → hardcoded defaults. A personal theme in localStorage may still
  win locally — that precedence is entirely the frontend's call today.
- Admin theme screen: `PUT /system-setting/theme_colors` → applies to everyone on their next
  load. Non-admin gets 403 (rendered by the `AccessDeniedException` handler). If an admin has a
  personal localStorage theme, their own screen may not change — expected, worth surfacing in the
  UI ("you are viewing your personal theme").
- `updated_by` / `updated_at` stamp themselves via JPA auditing (`SecurityAuditorAware`,
  `@LastModifiedBy`) and Hibernate's `@UpdateTimestamp`.

## Future work

1. **Inline serving for the logo:** `GET /storage/files/{filename}` sends
   `Content-Disposition: attachment`, no `Content-Type`, and no cache headers. Fine for
   `<img src>`, but direct navigation downloads instead of displaying, and every page load
   re-fetches; worth fixing when it starts to matter.
2. **Per-user `ui_setting` table** when the per-user-in-DB request actually arrives (see above).
3. **Incremental yml migration:** move `opencelium.*` parameters here one at a time when there's a
   reason — seed the current value as a row, switch the consumer from its `@ConfigurationProperties`
   bean to `SystemSettingService` (with caching), keep the yml value as fallback default. Bootstrap
   config (datasource, port, JWT) can never move — it's needed before the DB connection exists.
4. The dormant `detail.theme` / `detail.theme_sync` columns predate this design and are unused;
   removing them is a separate cleanup.
