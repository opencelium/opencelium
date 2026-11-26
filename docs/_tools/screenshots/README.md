# Documentation screenshots

`capture.mjs` regenerates the 5.0 UI screenshots from a running OpenCelium
instance, so they can be refreshed after a UI change instead of being re-shot by
hand. `capture-51.mjs` does the same for the 5.1 editor features — joints,
comment boxes, the change-history panel and the test-run mode dialog.

```sh
npm i playwright-core
BASE=http://127.0.0.1 \
OC_USER=admin@opencelium.io OC_PASS=1234 \
OC_MASTER=<master-password> \
node capture.mjs

# 5.1 shots -> out51/. Needs a workflow with three methods outside every loop
# and something skippable between two of them.
OC_WORKFLOW='Fetching all WATO folders from CheckMK' node capture-51.mjs

# The debug controls, which only exist while a run is playing. This one EXECUTES
# the workflow, so only ever point it at one that is safe to run for real.
OC_WORKFLOW='GetSwitches fast (static if-condition)' node capture-51-debug.mjs
```

```sh
# 5.2 shots -> out52/. Needs a small workflow whose steps read each other's
# fields (OC_LINKS_WF) and a big one with validation problems and an IF with at
# least two conditions (OC_MINIMAP_WF; OC_IF_WFS lists where to look for the IF).
OC_LINKS_WF=1 OC_MINIMAP_WF=42 node capture-52.mjs
# a single shot:
ONLY=minimap node capture-52.mjs
```

```sh
# 5.3 shots -> out53/. Shot against a 5.3 backend on a COPY of the database
# (see "Shooting 5.3 safely" below), after seeding it with seed-53.mjs.
API=http://127.0.0.1:9190 OC_WF=182 node seed-53.mjs
BASE=http://127.0.0.1:8053 OC_WF=182 OC_DEMO_USER=5 node capture-53.mjs
ONLY=calendar-week,gv-list node capture-53.mjs
```

Then copy `out/*.png`, `out51/*.png`, `out52/*.png` and `out53/*.png` over the files in
`docs/img/*/OC5_*.png` (the onboarding, help-menu and changelog shots go to
`docs/img/start/`; global variables, users and the password-link dialog to
`docs/img/admin5/`; calendar and cron preview to `docs/img/schedule/`).

## Things that will bite you

* **Shoot the production build.** nginx on `:80` serves `dist/`. The Vite dev
  server on `:5173` runs MSW mocks, so its data is fabricated.
* **Set `OC_MASTER`.** Without it the System Configuration page only shows the
  master-password gate, not the configuration tree.
* **Do not click canvas buttons by index.** The test-run control sits among them;
  clicking it starts a real execution and creates a temporary test connection.
  Use the `data-testid` handles (`rf__node-*`, `workflow-menu`,
  `workflow-schedules-pill`). If a test run is triggered by accident, clean up
  with `DELETE /connection/test`.
* **Reopen the editor per shot.** `Escape` does not reliably dismiss antd
  modal/drawer overlays; a leftover `.ant-modal-wrap` silently blocks every
  later click and you get 30 s timeouts far from the real cause.
* **`input[role="combobox"]` is ambiguous.** The cmdk command palette input
  carries that role too, so scope dialog selects to `.ant-modal` /
  `[role="dialog"]`.
* **Commands need a highlighted suggestion.** Typing a full command such as
  `help` empties the suggestion list, and `Enter` then does nothing — type a
  prefix (`hel`) instead.
* **The dashboard needs ~9 s** before the socket delivers metrics, and its
  bottom row of cards is *Coming soon* placeholder content, so it is cropped off.

## Things that will bite you in capture-51.mjs

* **A note is created above its step**, so on the canvas's top row it lands
  off-screen and cannot be typed into. `panDown()` moves the graph first.
* **Park the pointer after selecting a node.** Leaving it on the node raises that
  node's connector tooltip right in the middle of the shot.
* **Fast automation collapses the change history.** Edits inside the 350 ms
  coalescing window become one `Multiple changes` row. Renaming nodes, one at a
  time, is what produces a legible list.
* **Never press either button in the test-run mode dialog.** Opening it is safe —
  the run starts only on a start button — and the script asserts afterwards that
  no debug panel appeared.

## What is deliberately not automated

The schedule row kebab menu (per-schedule *Notifications*, *Support logs*) does
not open reliably under automation; the notifications dialog is captured through
the bulk action instead. Support-log masking levels are still documented in text
only.

The loop node's **jump to iteration** input, and the *Jump to next iteration*
control beside it, only appear while the replay is paused *inside a loop that is
actually iterating*. `capture-51-debug.mjs` tries for them and reports
`replay never paused inside a loop` when it cannot get there.

On this instance it cannot: the only workflow that is safe to execute
(`GetSwitches fast`, whose single call is a read) fails at that first call,
because its i-doit endpoint — `dg-service.westeurope.cloudapp.azure.com:8080` —
is not reachable from here. The loop therefore never receives a list to iterate
over. Nothing is written anywhere; the run simply ends as `TEST FAILED`.

To capture those two controls you need an instance where a **safe** workflow
both succeeds and loops: a step returning a JSON array, a `Loop` over it, and no
write anywhere. Then pause inside the loop and shoot
`[data-testid^=workflow-node-iteration-input-]`.

## Things that will bite you in capture-52.mjs

* **The onboarding tour covers every page for an admin.** Its progress lives only
  in `localStorage` (`opencelium:onboarding:<userId>`), so the script marks it done
  through an init script for every shot except the onboarding ones, which use a
  fresh browser context. Nothing about the tour is stored on the server.
* **Never click a theme card in the tour.** The theme *is* stored on the server;
  the script only uses the tour's own Next button.
* **Step 6 depends on the instance.** With API definitions already installed it
  only lists them; the script presses *Add another API definition* to show the
  three ways to add one.
* **Check for personal data before committing.** List pages show *Modified By*
  with real user names — that is why the connector list is not re-shot here.
* **Shooting the 5.2 UI against an older backend works** for everything here,
  because none of these shots need the new endpoints. Build the frontend, serve
  `dist/` with `/api` and `/ws` proxied to `:9090`, and set the port in
  `dist/config.json` — an empty port makes the app call `:80`.
* **The workflow tutorial needs `/workflow/create`** and is started through the
  palette (`help work` + Enter); it runs on its own fake backend.

## Shooting 5.3 safely

The 5.3 shots need demo data (global variables, schedules with cron
expressions, a user without email) that should not be created on a real
instance. They were shot like this:

1. Build the 5.3 backend and frontend from the release branch in a scratch
   directory (`./gradlew -x test bootJar`, `npm install && npm run build`).
2. Copy the databases: MariaDB `opencelium` -> `opencelium_docs53`
   (`mysqldump | mysql`), MongoDB `opencelium` -> `opencelium_docs53`
   (`mongodump --archive | mongorestore --nsFrom 'opencelium.*' --nsTo 'opencelium_docs53.*'`),
   and copy `runtime/` and `upload-dir/` next to the scratch backend.
3. In the scratch `application.yml` point both databases at the copies
   (Mongo needs `?authSource=opencelium`), set `server.port: 9190`,
   **`spring.quartz.auto-startup: false`** (no schedule ever fires) and
   **`opencelium.online-services.active: false`** (no usage reports or syncs
   with the Service Portal under the real subscription). Also set every
   `QRTZ_TRIGGERS.TRIGGER_STATE` in the copy to `PAUSED`.
4. Serve `dist/` on its own port with `/api` and `/ws` proxied to `:9190`, and
   set `server`/`socket` host and port in `dist/config.json` (`"protocol": "http:"`
   with the colon) — an empty port makes the app call the real instance on `:80`.
5. Seed with `seed-53.mjs`, then run `capture-53.mjs`.

Drop the copies afterwards (`DROP DATABASE opencelium_docs53`,
`db.dropDatabase()` in `opencelium_docs53`).

## Things that will bite you in capture-53.mjs

* **"New" feature cards** pop up over the editor; the script marks them all
  dismissed in `localStorage` (`opencelium:new-features:dismissed`).
* **The demo workflow's description** carries an automation marker; `snap()`
  replaces it on screen before every shot.
* **Never press Send, cURL or Run now.** Send calls the real API with the
  connector's credentials, opening the cURL panel runs the connector's
  authentication and prints real credentials, *Run now* on a calendar run card
  starts the schedule, *Send test message* in the notification dialog posts to
  the webhook. None of these is automated.
* **The problems panel needs a problem.** The script adds an IF without a
  condition and never saves; the editor is reopened for the next shot.
* **The user wizard is autofilled** by Chromium with the sign-in credentials;
  the script clears the fields and types a demo username.
* **Reference fields open their error tooltip by themselves** for ~5 s; wait
  before shooting (the paste-check dialog has two broken references).
* **Not captured:** *Open in Playground* in the execution log (needs a stored
  execution — the docs copy has none, and producing one means running a
  workflow against real systems), the reference validation tooltip (closes
  under automation) and the cURL panel (real credentials).
