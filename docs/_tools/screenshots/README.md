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

Then copy `out/*.png` and `out51/*.png` over the files in
`docs/img/*/OC5_*.png`.

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
