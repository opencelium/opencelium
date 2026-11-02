# OpenCelium AI gateway

Local service that turns a plain-language prompt into an OpenCelium workflow, using an open-weights model through
[Ollama](https://ollama.com). Nothing leaves the machine; no paid or cloud model is involved.

The model never writes the backend connection payload. It writes a small **workflow DSL** (`src/dsl/workflowDsl.schema.ts`):
a tree of `method`, `if` and `loop` steps whose values are literals or `ref`s to an earlier method step or an enclosing
loop. The frontend converts the DSL into graph nodes.

## How a request is handled

1. The `from` / `to` invokers are read from the backend's invoker XMLs (`src/backend/runtime/invoker`, read-only).
2. A JSON schema is built **for this request**: one method variant per operation, each allowing only that operation's
   endpoint params and body fields on the connector that owns it. Ollama enforces it while decoding, so unknown
   operations, misplaced operations and invented fields cannot be produced.
   Invokers too large for the context (Netbox, weclapp, Proxmox, …) are narrowed first (`focusConnectors.ts`): a build
   from a reviewed plan is told only about the operations the plan calls; otherwise the operations the request names
   and the example templates call are kept, plus the closest ones in meaning, within half the context.
3. What a schema cannot express is checked afterwards (`validateWorkflow.ts`): refs point to an earlier method step or an
   enclosing loop, step ids are unique, response paths exist (unknown paths are warnings), a condition reads a step and
   `contains` gets a list. Conditions with an obvious intent are rewritten instead (`normalizeCondition.ts`): the right
   side of `exists`/`empty` is cleared, `= ""` / `!= ""` become `empty` / `exists`, a step value moves to the left.
4. With `useTemplates` (default on), the closest stored templates (`src/examples/templateFlows.ts`: similarity in meaning
   plus how many of their operations the request's systems offer, on the same side) are shown as worked examples: the
   planner sees their steps, the build also the fields they set. Calls the installed invokers no longer have are marked.
5. A build also gets, per operation it calls, how templates call that operation (`src/examples/operationUsages.ts`):
   the loops and conditions around the call, its endpoint params, fixed values and field sources. These are found by
   operation name on the installed invoker, so they help even when no whole template fits the request; the calls are
   ranked by closeness to the plan step, then by the same other system.
6. Errors go back to the model for up to `AI_MAX_REPAIR_ATTEMPTS` repairs; the best attempt is returned with its issues.

## Run

Requires Node 24+ (runs TypeScript directly, no build step) and Ollama with the model pulled:

```bash
brew install ollama && brew services start ollama
ollama pull qwen2.5-coder:14b qwen2.5-coder:7b nomic-embed-text

# Voice commands (optional): whisper.cpp with a multilingual model, loopback only
brew install whisper.cpp
mkdir -p ~/models/whisper && curl -L -o ~/models/whisper/ggml-large-v3-turbo-q5_0.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin
whisper-server -m ~/models/whisper/ggml-large-v3-turbo-q5_0.bin --host 127.0.0.1 --port 8178 -l auto -nt -sns

npm install
npm start                       # http://127.0.0.1:8787
npm run generate -- jira zammad "Create a Zammad ticket for every Jira issue"
npm test && npm run typecheck
npm run eval:commands           # routes 18 prompts through the running gateway, reports misroutes
npm run eval:guides             # routes "where is …" requests (en + de) to workflow guides and methods
npm run eval:help                     # 30 help questions: is the answering page among the sources, are undocumented ones refused
npm run eval:templates -- --limit 20   # rebuilds templates from their descriptions (each hidden from the examples)
                                       # and scores operations, call placement and fields; --templates on|off|both
```

## API

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| GET | `/health` | — | `{ status: 'ok' \| 'degraded', ollama, workflowModel, invokerCount, speech: { available } }` |
| GET | `/invokers` | — | `[{ name, description, operationCount }]` |
| POST | `/workflow/plan` | `{ prompt, from, to?, useTemplates? }` | `{ pattern, steps: [{ text, depth }], templates: [{ id, name }], durationMs, model }`: plain-language plan for review, field rules as `<Operation> set <field> = <value>` lines; `templates` are the stored templates shown as worked examples |
| POST | `/script/generate` | `{ prompt, target?, inputs: [{ name: 'VAR_n', source, sample? }], currentScript? }` | `{ code, description, problems, durationMs, model }`: one transformation script for the editor |
| POST | `/command/search` | `{ query, commands: [{ id, phrase, description }], limit? }` | `{ matches: [{ id, score }] }`: palette commands close in meaning |
| POST | `/command/route` | `{ prompt, commands, page?, language? }` | `{ commandId \| null, argument, reply, candidates, durationMs, model }`: one command for a request; the frontend resolves `argument` to a record |
| POST | `/guide/intent` | `{ prompt, guides: [{ id, description }], methods? }` | `{ guideId \| null, method, durationMs, model }`: which "show me where" guide a request asks for, and the method it names (one of `methods`, or empty) |
| POST | `/run/explain` | `{ language, workflowTitle, failure: { kind, message, stepName, system, operation, context, request?, response? }, step?, earlierSteps }` | `{ summary, cause, fix: string[], isRequestFixable, durationMs, model }`: why a test run failed, in plain language |
| POST | `/run/fix` | same as `/run/explain` (needs `step`) | `{ body, changes, problems, durationMs, model }`: the failed call's corrected request body; references the step had are kept, or the body comes back unchanged with advice only |
| POST | `/invoker/draft` | `{ docs, name? }` (OpenAPI/Swagger JSON or YAML up to 20 MB, or docs as text/HTML) | `{ draft, source: 'openapi' \| 'ai', isTruncated, durationMs }`: an OpenAPI document is converted without the model; other docs are read by it |
| POST | `/invoker/xml` | `{ draft }` (the reviewed draft) | `{ xml }`: the backend's invoker XML, with a separate `TestConnection` operation |
| POST | `/mapping/suggest` | `{ language, instruction?, target: { step, operation, system, fields: [{ path, current }] }, sources: [{ id, step, system, path }] }` | `{ suggestions: [{ field, source, reason }], durationMs, model }`: which earlier value fills each body field; the model can only choose among the given fields and source ids |
| POST | `/workflow/explain` | `{ language, title?, outline }` (the workflow as indented lines, built by the editor) | `{ description, explanation: string[], durationMs, model }`: a template-style description and a plain step-by-step explanation |
| POST | `/connector/explain-error` | `{ language, connector?, invoker?, status: 'DOWN' \| 'AUTH_FAILED' \| 'UNKNOWN', error? }` | `{ summary, cause, checks: string[], fixIn: 'connector' \| 'remoteSystem' \| 'network', kind, durationMs, model }`: why a connector test failed; the error is classified first, the invoker's settings and test call are looked up |
| POST | `/notification/draft` | `{ language, type?, templateName?, instruction, placeholders: [{ token, description? }], current? }` | `{ subject, body, removedPlaceholders, durationMs, model }`: a notification template text that uses only the given `{{aggregator.arg}}` placeholders |
| POST | `/condition/suggest` | `{ language, instruction, sources: [{ id, step, system, path }] }` | `{ conjunction, not, rules: [{ left, operator, right }], explanation, durationMs, model }`: an if step's rules from a sentence; sides are source ids or fixed values, operators the editor's own |
| POST | `/help/ask` | `{ language, messages: [{ role, content }], page?, commands? }` | streamed lines: `{ type: 'sources', question, sources }`, `{ type: 'delta', text }`…, `{ type: 'done', commands }`: an answer from the documentation (`AI_DOCS_DIR`), sources linked to `AI_DOCS_URL`, offered commands from the given catalog |
| POST | `/speech/transcribe` | WAV audio (`audio/wav`, 16 kHz mono, up to ~30 s) | `{ text, language, durationMs }`: a spoken command, with system names (from the invokers) as vocabulary |
| POST | `/workflow/generate` | `{ prompt, from, to?, plan?, useTemplates? }` (invoker names, case-insensitive; `plan` = the reviewed plan text) | `{ dsl, issues, attempts, model, templateExampleCount, templates, operationExampleCount }` |

Errors: `{ error: { type: 'BAD_REQUEST' \| 'UNKNOWN_INVOKER' \| 'GENERATION_FAILED' \| 'SPEECH_UNAVAILABLE', message, details? } }` with 400 / 404 / 502 / 503.

## Configuration

| Variable | Default |
| --- | --- |
| `AI_GATEWAY_HOST` / `AI_GATEWAY_PORT` | `127.0.0.1` / `8787` (loopback only: the gateway has no auth yet) |
| `OLLAMA_URL` | `http://127.0.0.1:11434` |
| `AI_WORKFLOW_MODEL` | `qwen2.5-coder:14b` |
| `AI_INVOKER_DIR` | `../backend/runtime/invoker` |
| `AI_TEMPLATE_DIR` | `../backend/runtime/templates` (the closest templates are worked examples for plans and builds; their transformation scripts are examples for generated ones) |
| `AI_EMBED_MODEL` | `nomic-embed-text` (finds the most similar templates and template scripts; without it, no examples are used) |
| `AI_COMMAND_MODEL` | `qwen2.5-coder:7b` (picks command palette commands) |
| `AI_SPEECH_URL` | `http://127.0.0.1:8178` (whisper-server; empty turns voice commands off) |
| `AI_DOCS_DIR` / `AI_DOCS_URL` | `../../docs` / `https://docs.opencelium.io/en/prod` (the help assistant's documentation, and where it is published) |
| `AI_HELP_MODEL` | `AI_WORKFLOW_MODEL` (writes help answers; a follow-up is first rewritten by `AI_COMMAND_MODEL`) |
| `AI_CORS_ORIGINS` | `http://localhost:5173` (comma-separated) |
| `AI_MAX_REPAIR_ATTEMPTS` | `2` |
| `AI_CONTEXT_TOKENS` | `16384` |
| `AI_CHAT_TIMEOUT_MS` | `900000` (15 min per model answer; large plan-fixed builds can exceed 5 min) |
| `LOG_LEVEL` | `info` |

Prompts and audio are not logged (speech logs size, language and duration only); each generation logs invoker names, token counts, durations and issue count.
