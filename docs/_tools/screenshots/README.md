# Documentation screenshots

`capture.mjs` regenerates the 5.0 UI screenshots from a running OpenCelium
instance, so they can be refreshed after a UI change instead of being re-shot by
hand.

```sh
npm i playwright-core
BASE=http://127.0.0.1 \
OC_USER=admin@opencelium.io OC_PASS=1234 \
OC_MASTER=<master-password> \
node capture.mjs
```

Then copy `out/*.png` over the files in `docs/img/*/OC5_*.png`.

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

## What is deliberately not automated

The schedule row kebab menu (per-schedule *Notifications*, *Support logs*) does
not open reliably under automation; the notifications dialog is captured through
the bulk action instead. Support-log masking levels are still documented in text
only.
