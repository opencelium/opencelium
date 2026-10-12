# System Setting API — frontend integration guide

Audience: frontend developers. Backend design rationale lives in
[system-settings.md](./system-settings.md).

System settings are **global** values that apply to every user, managed by admins. The first
setting is `theme_colors` — the system-wide UI theme. The backend treats every value as opaque
JSON: the frontend owns the shape and can evolve it without any backend change.

Base path: `/system-setting` (same origin and JWT auth as every other API; standard
`Authorization: Bearer <token>` header).

---

## GET /system-setting/{name}

Fetch one setting. Who may call depends on the setting: admins can read everything; regular
authenticated users can read only whitelisted settings. `theme_colors` and `app_logo` are
whitelisted — any logged-in user can fetch them.

```
GET /system-setting/theme_colors
```

**200 OK**

```json
{
  "name": "theme_colors",
  "value": {
    "primary": "#0f766e",
    "accent": "#f59e0b",
    "neutral": "#8c8c8c",
    "sidebar": "#2c3d49"
  },
  "updatedAt": "2026-08-20T18:55:00.000+00:00"
}
```

`value` is a real JSON value (for `theme_colors`, the seeds object) — no second parse step:

```ts
const dto = await response.json();          // { name, value, updatedAt }
const seeds = dto.value;                    // { primary, accent, neutral, sidebar? }
if (!isValidSeeds(seeds)) { /* fall back to defaults */ }
```

**Error responses** (standard `ErrorResource` shape: `timestamp`, `status` (number), `error`,
`message`):

| Status | `error` | When | Frontend reaction |
|---|---|---|---|
| 404 | `SYSTEM_SETTING_NOT_FOUND` | setting was never saved (or was deleted) | use the built-in defaults — this is a normal state, not a failure |
| 403 | — | setting is not whitelisted and caller is not admin | don't request non-whitelisted names as a regular user |
| 401 | — | missing/expired token | usual re-auth flow |

---

## PUT /system-setting/{name} — admin only

Create or update a setting (upsert — same call for both). Requires the `Admin` role; anyone else
gets **403**.

```
PUT /system-setting/theme_colors
Content-Type: application/json
```

```json
{
  "value": {
    "primary": "#0f766e",
    "accent": "#f59e0b",
    "neutral": "#8c8c8c",
    "sidebar": "#2c3d49"
  }
}
```

In TypeScript, pass the seeds object directly — no stringifying:

```ts
await api.put(`/system-setting/theme_colors`, { value: seeds });
```

**200 OK** — returns the saved setting in the same shape as GET.

**400 Bad Request** when:

- `value` is missing or JSON `null` (`error: "INVALID_SYSTEM_SETTING_VALUE"`),
- `value` is longer than **1024 characters** once serialized,
- the request body itself is not well-formed JSON (rejected by request parsing),
- `{name}` is blank or longer than 100 characters (`error: "INVALID_SYSTEM_SETTING_NAME"`),
- `{name}` is `app_logo` (`error: "RESERVED_SYSTEM_SETTING"`) — the icon is managed only through
  its own endpoints below, so its row and its stored file can't drift apart.

The backend does **not** understand colors — `value` can be any JSON shape. All
semantic validation (6-digit hex `^#[0-9a-fA-F]{6}$`, required keys) stays in the frontend, on
both write **and read**: always run `isValidSeeds` on what comes back from GET, exactly as you do
for localStorage, before feeding values into CSS custom properties.

---

## DELETE /system-setting/{name} — admin only

Removes the setting; afterwards GET returns 404 and every client falls back to its defaults. Use
this for the admin's "reset system theme" action.

```
DELETE /system-setting/theme_colors
```

**204 No Content** — always, including when the setting didn't exist (idempotent). Non-admins
get **403**.

---

## Integrating `theme_colors`

**On app bootstrap (any user):**

1. `GET /system-setting/theme_colors`.
2. 200 → take `dto.value` → `isValidSeeds` → feed into the existing custom-theme pipeline
   (`createCustomPalette` / register `custom-light` + `custom-dark`), same as seeds from
   localStorage.
3. 404 or invalid seeds → behave exactly as today with an empty `oc_custom_theme_seeds`.

**Precedence** is the frontend's decision. Recommended: a user's *personal* theme in localStorage
wins over the system theme; the system theme wins over hardcoded defaults. Consequence worth a UI
hint: an admin who changes the system theme won't see the change on their own screen if they have
a personal theme applied — show "you are viewing your personal theme" and/or offer "reset to
system theme" (clear the localStorage seeds).

**Admin theme screen:** gate visibility by the caller's role/permissions as usual (the backend
enforces regardless — a non-admin PUT gets 403). Save with the PUT above; reset with DELETE.

**Dark mode** is unchanged: it is not part of this payload. One seed set still produces both
`custom-light` and `custom-dark` variants client-side; the active mode remains a separate,
per-user choice.

## System icon — `app_logo`

The admin-uploaded application icon shown in the UI instead of the OpenCelium logo. It is a
regular system setting for **reading**, but it is **written via file upload**, not JSON.

### Read (any authenticated user)

```
GET /system-setting/app_logo
```

**200 OK**

```json
{
  "name": "app_logo",
  "value": {
    "filename": "3f1c9b2e-....png",
    "url": "./storage/files/3f1c9b2e-....png"
  },
  "updatedAt": "2026-08-21T10:12:00.000+00:00"
}
```

Put `value.url` straight into `<img src>` — the `/storage/files/**` route is public (no auth
header needed), so the logo also works on the **login page**. **404** means no icon is set → show
the default OpenCelium logo. Ignore `value.filename`; it's the backend's internal storage key.

### Upload / change (admin only)

```
POST /system-setting/app_logo
Content-Type: multipart/form-data
```

One part named `file` — jpg, jpeg, or png, at most **5 MB** (SVG is deliberately not accepted):

```ts
const form = new FormData();
form.append('file', selectedFile);
await api.post('/system-setting/app_logo', form);
```

**200 OK** with the same shape as GET (grab the fresh `value.url` — it changes on every upload).
Re-uploading replaces the previous icon; the old file is cleaned up server-side.

**400 Bad Request** (`error: "INVALID_SYSTEM_SETTING_ICON"` or a validation message) when the
file is missing, empty, larger than 5 MB, or not jpg/jpeg/png. **403** for non-admins.

### Remove (admin only)

```
DELETE /system-setting/app_logo
```

**204 No Content** — always, idempotent. Afterwards GET returns 404 and every client falls back
to the default logo. Use this for the admin's "reset to default logo" action.

Note: because each upload gets a new UUID filename, a changed logo shows up without cache-busting
tricks — the URL itself changes. Re-fetch `GET /system-setting/app_logo` (or use the POST
response) after an admin changes it.

## Adding future settings

The endpoint is generic — a new global setting is just a new `{name}` with its own JSON shape.
But **read access is default-deny**: a new setting readable by non-admins must be added to the
backend whitelist (`SystemSettingSecurity`) first; until then, regular users receive 403 for it.
Coordinate the name and readability with the backend team. Already in use: `theme_colors`
(user-readable, JSON write) and `app_logo` (user-readable, file upload — see above).
