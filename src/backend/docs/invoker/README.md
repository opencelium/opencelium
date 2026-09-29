# Invokers — developer guide

This guide covers the overall structure of the invoker subsystem: why it is shaped this way,
and what can go wrong when you use it. It does not list rules, formats or conversions; each
class's Javadoc covers those.

Read [architecture.md](../architecture.md) first. The v6 file format is defined in
`core/src/main/resources/invoker-6.0.xsd`.

---

## 1. Structure

An **invoker** describes one external API: the settings a connector needs, the operations it
offers, and the shape of the data they exchange. A connector is an invoker bound to one
installation; a workflow node is one operation.

The code is split along one line: **the model is shared, reading files belongs to core.**

```
common  io.opencelium.common
└── invoker
    ├── setting
    ├── operation
    ├── schema
    └── pagination

core    io.opencelium.core.invoker
├── (SPI)                InvokerReader · ReadResult · InvokerIssue · InvokerFormat · InvokerReadException
└── xml
```

---

## 2. Structural decisions

**Model in `common`, file formats in `core`.** Core manages invokers, and the execution engine
will receive resolved operations inside job messages. If the model depended on XML, the engine
would depend on XML too. If it depended on storage, workers would need a database, which
architecture decision #9 rules out.

**Immutable records, valid by construction.** Every model type is a record or an enum, and its
constructor rejects invalid input. Code that holds an `Invoker` never needs to check it again,
and the model can be shared across threads. In 5.x a malformed invoker was accepted and failed
later, during execution.

**SPI in core, XML behind it.** Callers inject `InvokerReader`, never `XmlInvokerReader`, and get
exactly one of two outcomes: a valid `Invoker` with the notes from any upgrade, or an
`InvokerReadException` listing every problem. Never `null`, never a partial invoker. A reader for
another format (for example OpenAPI) is a new `InvokerReader` implementation, and callers don't
change. The SPI stays in `core` because core is its only consumer; move it to `common` when a
second module needs it.

**Responses are keyed by status.** Following OpenAPI, the most specific match wins (`404`, then
`4XX`, then `default`). For APIs that return `200` on failure, a `SuccessCondition` decides the
outcome.

**v6 is read in two passes: XSD, then the model.** The XSD rejects structural mistakes (a
misspelled element or attribute) with a line and column. The model then checks the rules a
schema can't express.

**The format is identified by `version`, not a namespace.** `<invoker version="6.0">`. 5.x files
never had the attribute, so its absence identifies them. A namespace would only be one more line
for every author to copy exactly.

**5.x files are upgraded in memory.** Existing self-hosted files must keep working. The upgrade
is lossy in places, so every change is returned as an `InvokerIssue` graded INFO, WARNING or
ERROR, not applied silently.

---

## 3. Risks, and how they are handled

### Solved by the design

| Risk | What could happen | How it is handled |
|---|---|---|
| Silent typos | A reader only looks up names it knows, so `visiblity="protected"` would be dropped and a password stored as **public** | v6 files are validated against the XSD first; unknown elements and attributes are errors |
| One error per upload | The author fixes one mistake and uploads again, over and over | Readers collect problems per setting and per operation and throw them all together |
| Hidden 5.x conversions | A merged JSON-RPC response silently treats every failure as success | Each conversion reports an issue; the success/fail merge is a WARNING that tells the author to add a condition |
| 5.x files 5.x itself tolerated | Real invokers repeat operation names (5.x ran only the first), field names (5.x kept the last) and query parameters (`filter=a&filter=b`, valid HTTP), so a strict upgrade rejects them | The first operation keeps its id and later ones get a method suffix (`article-post`); a repeated field keeps its last declaration; a repeated query parameter becomes one list parameter that writes the same query string. All are reported as WARNINGs |
| Shared mutable state | Two requests read files at the same time | Readers are stateless; 5.x conversion state lives in a per-file `Conversion` object |

### Accepted trade-offs: check these yourself

| Risk | What can go wrong | What to do |
|---|---|---|
| Validation happens through exceptions | Building the model from untrusted input (a REST body, another format) throws `IllegalArgumentException` | Catch it at the boundary; the messages are written for the person who supplied the data |
| One file at a time | Two 5.x files named `fake api` and `fake_api` both become id `fake-api`, and the second overwrites the first | Check ids against stored invokers before saving |
| Loose string fields | `method`, `visibility` and `envelope` are plain strings; in files the XSD checks them, in code nothing does | Use the values the XSD allows when building a model in code |
| Two places to change the format | A new element added to the reader but not to the XSD is rejected, and one added to the XSD but not the reader is ignored | Change both in the same PR, with a test for the new element |

---

## 4. Extending it

- **An optional element or attribute:** add it to the model, the XSD and `InvokerV6Reader`, and
  decide what a 5.x file maps to in `LegacyInvokerReader`. Existing files stay valid, so it stays
  version 6.
- **A breaking change:** add a new XSD and a new major version, teach `XmlFormatDetector` the
  version, and add a reader for it. Keep the old readers so existing files still load.
- **Another file format:** implement `InvokerReader`. Callers don't change.
- **A new schema kind or response status:** add a record to the sealed interface and let the
  compiler show you every switch to update.
