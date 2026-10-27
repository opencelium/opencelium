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
3. What a schema cannot express is checked afterwards (`validateWorkflow.ts`): refs point to an earlier method step or an
   enclosing loop, step ids are unique, response paths exist (unknown paths are warnings).
4. Errors go back to the model for up to `AI_MAX_REPAIR_ATTEMPTS` repairs; the best attempt is returned with its issues.

## Run

Requires Node 24+ (runs TypeScript directly, no build step) and Ollama with the model pulled:

```bash
brew install ollama && brew services start ollama
ollama pull qwen2.5-coder:14b

npm install
npm start                       # http://127.0.0.1:8787
npm run generate -- jira zammad "Create a Zammad ticket for every Jira issue"
npm test && npm run typecheck
```

## API

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| GET | `/health` | — | `{ status: 'ok' \| 'degraded', ollama, workflowModel, invokerCount }` |
| GET | `/invokers` | — | `[{ name, description, operationCount }]` |
| POST | `/workflow/plan` | `{ prompt, from, to? }` | `{ pattern, steps: [{ text, depth }], durationMs, model }`: plain-language plan for review, field rules as `<Operation> set <field> = <value>` lines |
| POST | `/workflow/generate` | `{ prompt, from, to?, plan? }` (invoker names, case-insensitive; `plan` = the reviewed plan text) | `{ dsl, issues, attempts, model }` |

Errors: `{ error: { type: 'BAD_REQUEST' \| 'UNKNOWN_INVOKER' \| 'GENERATION_FAILED', message, details? } }` with 400 / 404 / 502.

## Configuration

| Variable | Default |
| --- | --- |
| `AI_GATEWAY_HOST` / `AI_GATEWAY_PORT` | `127.0.0.1` / `8787` (loopback only: the gateway has no auth yet) |
| `OLLAMA_URL` | `http://127.0.0.1:11434` |
| `AI_WORKFLOW_MODEL` | `qwen2.5-coder:14b` |
| `AI_INVOKER_DIR` | `../backend/runtime/invoker` |
| `AI_TEMPLATE_DIR` | `../backend/runtime/templates` (their transformation scripts are examples for generated ones) |
| `AI_EMBED_MODEL` | `nomic-embed-text` (finds the most similar template scripts; without it, no examples are used) |
| `AI_CORS_ORIGINS` | `http://localhost:5173` (comma-separated) |
| `AI_MAX_REPAIR_ATTEMPTS` | `2` |
| `AI_CONTEXT_TOKENS` | `16384` |
| `LOG_LEVEL` | `info` |

Prompts are not logged; each generation logs invoker names, token counts, durations and issue count.
