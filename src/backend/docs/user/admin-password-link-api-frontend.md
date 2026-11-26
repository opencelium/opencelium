# Admin set-password link — frontend integration guide

Audience: frontend developers. Backend ticket: OC-1702.

An admin can create a **one-time link** with which a user sets a new password, for example when
the user is locked out or has no working email for the self-service "forgot password" flow. The
link opens the existing **`/set-password`** page, which already calls `POST /auth/reset-password`.
**That page needs no change.** What is new for the frontend is the admin side: an action that
creates the link and shows it once.

Same origin and JWT auth as every other API (`Authorization: Bearer <token>`).

---

## Flow

```
Admin (user list / user detail)                     User
  │
  │ POST /user/{id}/password-link?sendEmail=false
  │ ← 200 { link, expiresAt }
  │
  │ shows the link once, admin passes it on ───────▶ opens the link
                                                     /set-password?token=…
                                                       │
                                                       │ POST /auth/reset-password
                                                       │ ← 200 { message }
                                                       ▼
                                                     logs in with the new password
```

## What to build

1. An admin-only action on a user, e.g. **"Create set-password link"**, with an option
   **"Also send it by email"**.
2. On confirm, call `POST /user/{id}/password-link` (below).
3. Show the returned `link` **once**, with a copy button and the expiry (`expiresAt`, shown in
   local time). Once the dialog is closed the link cannot be fetched again; creating a new one is
   the only way to get another.
4. Tell the admin that a new link cancels the user's previous one.
5. Map the error codes (table below) to messages.

The user API does not expose whether a user signs in through LDAP, so the action cannot be hidden
for LDAP users in advance; the backend answers `400 PASSWORD_MANAGED_EXTERNALLY` for them.

---

## POST /user/{id}/password-link

Creates the link. **Admins only.**

| Part | Value |
|---|---|
| Path `id` | the user's ID (number) |
| Query `sendEmail` | `true` / `false`, optional, default `false`. With `true` the backend also emails the link to the user. |
| Body | none |

```ts
interface PasswordLink {
    /** Full URL of the set-password page with the one-time token. A secret: show once, never store. */
    link: string
    /** ISO-8601 UTC, whole seconds, e.g. "2026-11-27T10:15:30Z". */
    expiresAt: string
}

const { data } = await apiFetchWithHeaders<PasswordLink>(
    `/user/${userId}/password-link?sendEmail=${sendEmail}`,
    { method: 'POST' },
)
```

**200 OK** (response header `Cache-Control: no-store`)

```json
{
  "link": "https://oc.example.com/set-password?token=Hk3v0QpN2xT7bW9cLq4mR8sYv1aD5eF6gH0jK3nP2uZ",
  "expiresAt": "2026-11-27T10:15:30Z"
}
```

- The host and path of `link` come from the backend setting `opencelium.forgot-psw.base-url`
  (see [Deployment note](#deployment-note)). The token is 43 URL-safe characters
  (`A–Z a–z 0–9 - _`).
- `link` is returned even when `sendEmail=true`, so the admin can still copy it.
- The link is valid for 24 hours by default.

**Errors**

| Status | `error` | When | Suggested UI |
|---|---|---|---|
| 400 | `PASSWORD_MANAGED_EXTERNALLY` | The user signs in through LDAP; the directory manages the password | "This user's password is managed by LDAP." |
| 400 | `EMAIL_NOT_FOUND` | `sendEmail=true`, but the user has no email | "The user has no email. Create the link without email and pass it on yourself." |
| 401 | — | Not logged in, or the session expired | Usual login redirect |
| 403 | `FORBIDDEN` | The caller is not an admin | Should not happen if the action is admin-only |
| 404 | `USER_NOT_EXIST` | No user has this ID (e.g. deleted meanwhile) | "User not found." and refresh the list |
| 503 | `EMAIL_RECOVERY_FAILED` | The email could not be sent. **No link was created**, and the user's previous link still works | "The email could not be sent. Create the link without email, or check the mail settings." |

---

## POST /auth/reset-password (existing, no change)

Already used by `SetPasswordForm`. Public: no `Authorization` header. The same endpoint redeems
self-service reset links and admin links.

```json
{
  "token": "<token query parameter of the link>",
  "newPassword": "<at least 8 characters>",
  "confirmPassword": "<same as newPassword>"
}
```

**200 OK**

```json
{ "message": "password updated" }
```

**Errors**

| Status | `error` | When |
|---|---|---|
| 400 | `INVALID_TOKEN` | The token is unknown, already used, expired, or replaced by a newer link |
| 400 | — (Spring's standard validation body, no `error` code) | `token` is blank, `newPassword` is shorter than 8 characters, or the two passwords differ. The form schema already prevents this. |

On success the user's existing sessions are ended; the user then logs in with the new password.

---

## Error body

Errors with a code look like this:

```json
{
  "timestamp": "2026-11-26T10:15:30.123+00:00",
  "status": 404,
  "error": "USER_NOT_EXIST",
  "message": "User not found."
}
```

Read the code from **`body.error`**, as `isInvalidToken` in `SetPasswordForm` does.
`ApiFetchError.code` reads `body.code`, which these endpoints do not send. `message` is English
backend text; show a translated message chosen by `error` instead.

---

## Behaviour to know

- **One use.** A link works exactly once; a second use answers `400 INVALID_TOKEN`, also when two
  requests arrive at the same moment.
- **Newest link wins.** Creating a link cancels the user's earlier admin links and any pending
  self-service reset link.
- **Nothing changes until the link is used.** Creating a link leaves the user's password,
  sessions and two-factor login as they are. Using it sets the new password and ends all of the
  user's sessions.
- **Forgot-password is blocked meanwhile.** While an admin link is valid, the user's own "forgot
  password" request answers `429`: the user already has a link.
- **Lifetime.** 24 hours by default, set on the backend by
  `opencelium.forgot-psw.admin-link-activity-time` (milliseconds). Always show `expiresAt` from
  the response rather than assuming 24 hours.
- **Treat the link like a password.** Do not log it, send it to analytics, put it into the admin
  UI's own URL, or keep it in state or storage after the dialog closes. The backend stores only a
  hash of the token and cannot show the link again.

---

## Deployment note

`opencelium.forgot-psw.base-url` should point at the frontend's set-password page, e.g.
`https://oc.example.com/set-password`.

The placeholder used to end in `/reset-password`, and installations may still have that path:
no upgrade rewrites a configured URL. Since OC-1660 the frontend forwards `/reset-password` to
`/set-password` and keeps `?token=…`, so admin links and self-service reset emails built from the
old path still work. A frontend without OC-1660 has no `/reset-password` route, and such links
lead to a page that does not exist. Either way, correcting the path in `application.yml` to
`/set-password` is the clean fix.

---

## Quick test with curl

```bash
# admin: create a link (ADMIN_JWT is the Bearer token from POST /login)
curl -i -X POST "http://localhost:9090/user/42/password-link?sendEmail=false" \
  -H "Authorization: Bearer $ADMIN_JWT"

# user: set the password with the token from the link
curl -X POST "http://localhost:9090/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{"token":"<token>","newPassword":"<new password>","confirmPassword":"<new password>"}'
```
