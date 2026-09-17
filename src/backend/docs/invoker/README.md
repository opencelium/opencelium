# Invokers — developer guide

How the invoker subsystem is built, why it is built that way, what it guarantees,
and what will surprise you if you don't know it in advance.

Read [architecture.md](../architecture.md) first; this guide assumes its module
boundaries. For writing invoker files as an author, see the format itself in
`core/src/main/resources/schema/invoker-6.0.xsd`.

---

## Contents

1. [What an invoker is](#1-what-an-invoker-is)
2. [The module at a glance](#2-the-module-at-a-glance)
3. [Using it](#3-using-it)
4. [Design decisions](#4-design-decisions)
5. [What this solves compared with 5.x](#5-what-this-solves-compared-with-5x)
6. [Behaviour reference](#6-behaviour-reference)
7. [Warnings](#7-warnings)
8. [Extending it](#8-extending-it)

---

## 1. What an invoker is

An invoker is the description of one external API: the settings a connector
needs (URL, credentials), the operations the API offers, and the shape of the
data those operations send and receive. A **connector** is an invoker bound to
one installation; a **workflow node** is one operation of a connector.

An invoker is a description, not code. It contains no logic beyond one small
exception: a response may carry a success condition, an expression evaluated by
the execution engine.

---

## 2. The module at a glance

The subsystem is split across two modules along one line: **the model** is shared,
**reading and writing files** belongs to core.

```
common  io.opencelium.common
├── http                      HttpMethod · Header · ContentType
└── invoker                   Invoker · InvokerId
    ├── setting               ConnectorSetting · Visibility
    ├── operation             Operation · OperationId · OperationRole
    │                         Request · QueryParameter · QueryStyle · Body · BodyEnvelope · XmlNamespace
    │                         Response · ResponseStatus · SuccessCondition
    ├── schema                Schema (ObjectSchema · ArraySchema · ScalarSchema · UndefinedSchema)
    │                         Field · XmlAttribute · ScalarType · Value (TextValue · ObjectValue · ArrayValue)
    └── pagination            Pagination · PageRule · PageParam · PageAction

core    io.opencelium.core.invoker
├── (contracts)               InvokerReader · InvokerWriter
│                             ReadResult · InvokerIssue · InvokerFormat · InvokerReadException
├── config                    InvokerConfiguration         wires the implementations
└── xml                       XmlInvokerReader · XmlInvokerWriter      implementations
                              (package-private: v6 reader, 5.x upgrader, secure XML, format detection)

core/src/main/resources/schema/invoker-6.0.xsd           the v6 file format
```

Dependencies point one way only: `core.invoker.xml` → `core.invoker` → `common.invoker`
→ `common.http`. Nothing in `common` knows that XML exists.

---

## 3. Using it

### Reading a file

Inject the contract, never the XML class.

```java
@Service
class InvokerUploadService {

    private final InvokerReader reader;

    InvokerUploadService(InvokerReader reader) {
        this.reader = reader;
    }

    Invoker accept(byte[] upload) {
        try {
            ReadResult result = reader.read(upload);
            if (result.upgraded()) {
                // a 5.x file: result.issues() lists what was changed, some worth reviewing
            }
            return result.invoker();
        } catch (InvokerReadException e) {
            // e.issues(): every problem found, each with a location in the file
            throw new InvalidUploadException(e.issues());
        }
    }
}
```

### Writing a file

```java
byte[] xml = writer.write(invoker);   // always the current format
```

### Building the model in code

Use the builders. Every `build()` runs the same checks as the record's constructor.

```java
Invoker invoker = Invoker.builder(InvokerId.of("service-desk"), "Service Desk")
        .hint("Enter your instance URL")
        .setting(ConnectorSetting.ofPublic("url"))
        .setting(ConnectorSetting.ofProtected("password"))
        .setting(ConnectorSetting.ofPrivate("token", "%{login.body.token}"))
        .operation(Operation.builder("listTickets", "List tickets")
                .request(Request.builder(HttpMethod.GET, "{url}/tickets")
                        .header("Authorization", "Bearer {token}")
                        .parameter(QueryParameter.of("limit", Schema.integer().withDefault("50"))))
                .response(Response.builder(ResponseStatus.of(200))
                        .body(Body.of(ContentType.APPLICATION_JSON, Schema.object(
                                Field.of("items", Schema.arrayOf(Schema.object(
                                        Field.of("id", Schema.integer()))))))))
                .response(Response.of(ResponseStatus.parse("4XX"))))
        .build();
```

### Inspecting the model

```java
invoker.operation(OperationId.of("listTickets"));    // Optional<Operation>
invoker.operationsWithRole(OperationRole.TEST);      // the Test connection operation
invoker.setting("password");                         // Optional<ConnectorSetting>
operation.responseFor(404);                          // most specific match, see §6.4
request.header("authorization");                     // case-insensitive
objectSchema.field("items");                         // Optional<Field>
```

Schemas and values are sealed, so switch over them rather than using `instanceof`
chains; the compiler rejects a switch that misses a kind:

```java
String describe(Schema schema) {
    return switch (schema) {
        case ObjectSchema object -> object.fields().size() + " fields";
        case ArraySchema array   -> "list of " + describe(array.items());
        case ScalarSchema scalar -> scalar.type().value();
        case UndefinedSchema u   -> "unknown";
    };
}
```

---

## 4. Design decisions

Each decision states what was chosen, why, and what it costs.

### 4.1 The model lives in `common` and knows nothing about files

**Decision.** `common.invoker` holds plain immutable Java types. No XML, no format
version, no Spring, no MongoDB, no Jackson annotations.

**Why.** Two modules need the same description: core manages invokers, and the
execution engine will receive resolved operations inside job messages. A model tied to
a file format would force the engine to depend on that format, and a model tied to
storage would break decision #9 (workers have no database). Keeping the format out
also means a file format can change without the model changing.

**Cost.** Serialising the model (for example into a job message) needs mapping or
serializer configuration elsewhere; see [§7](#7-warnings).

### 4.2 Immutable records, valid by construction

**Decision.** Every model type is a record or enum. Constructors validate their input
and copy collections on the way in. Invalid input throws `IllegalArgumentException`
(or `NullPointerException` for a missing required part) with a message naming the
problem and how to fix it.

**Why.** In 5.x a malformed invoker was accepted and failed later, often as a
`NullPointerException` during execution. Validating once, at construction, means code
holding an `Invoker` never re-checks it, and an immutable model can be cached and
shared across threads with no defensive copying.

**Cost.** You cannot build an invoker incrementally by mutation. Use the builders.

### 4.3 Closed sets are sealed

**Decision.** `Schema`, `Value` and `ResponseStatus` are sealed interfaces whose
variants are records.

**Why.** These concepts have a fixed set of variants. Sealing them makes a `switch`
exhaustive: adding a variant turns every incomplete switch into a compile error
instead of a runtime surprise. 5.x represented body fields as untyped
`Map<String, Object>` trees and re-derived the type with `instanceof` at every lookup.

### 4.4 Builders over long constructors

**Decision.** `Invoker`, `Operation`, `Request`, `Response` and `Body` have builders.
`build()` calls the canonical constructor.

**Why.** `Invoker` has nine components and `Operation` seven, several nullable. Code
passing them positionally is unreadable (`new Invoker(id, "Desk", null, null, null,
null, …)`). Routing `build()` through the constructor keeps a single place where the
rules live, so a builder can never produce what the constructor would reject.

### 4.5 Stable identifiers, separate from labels

**Decision.** `InvokerId` and `OperationId` identify an invoker and an operation.
`name` is a display label.

**Why.** In 5.x the invoker name was simultaneously the file name, the in-memory key
and the connector's foreign key, so renaming an invoker broke every connector using
it. An id that never changes lets the label change freely.

**Format rules.** An invoker id is lower-case letters and digits in hyphen-separated
groups, up to 100 characters (`service-desk`; a UUID also fits). An operation id is
letters, digits, `.`, `_` and `-`, up to 200 characters; dots are allowed because real
APIs name operations like `cmdb.objects.read`.

### 4.6 Every part of a request has exactly one place

**Decision.**

| Part | Lives in | Rejected elsewhere |
|---|---|---|
| query string | `QueryParameter`s | an endpoint containing `?` |
| path variables | `{placeholders}` in the endpoint | — |
| headers, cookies included | `Header`s | — |
| media type | `Body.contentType()` | a `Content-Type` header |

**Why.** 5.x stated the media type both as a header and through body attributes, and
two resolution paths weighted them differently. When there is one place, there is no
question of which declaration wins.

### 4.7 Responses are chosen by status, not by a success/fail label

**Decision.** An operation lists responses keyed by `ResponseStatus`: an exact code
(`404`), a class (`4XX`) or `default`. For APIs that answer `200` even on failure
(JSON-RPC, GraphQL), a `SuccessCondition` on the response decides success.

**Why.** 5.x allowed exactly one `success` and one `fail` block and decoded a response
using the success block whatever status actually came back. Status-keyed responses are
the OpenAPI model; the condition covers the case status codes cannot.

### 4.8 Arrays describe one element, defaults are separate

**Decision.** `ArraySchema` has one `items` schema shared by every element, and an
optional list of default `Value`s, checked against `items` when the array is built.

**Why.** 5.x stored an array as a one-element sample list, so path lookups read element
`0` and ignored the index. Which element a workflow binds to (`[0]`, `[*]`, the current
loop element) is a property of the reference, not of the schema.

### 4.9 Setting sources stay as strings

**Decision.** A private setting's `source` (`%{login.body.token}`,
`{username:password}`) is stored exactly as written.

**Why.** The execution engine resolves these expressions when a workflow runs. Parsing
them in the model would duplicate the engine's grammar and drift from it.

**Cost.** A source naming a missing operation or setting is not detected at import;
see [§7](#7-warnings).

### 4.10 HTTP types live outside `invoker`

**Decision.** `HttpMethod`, `Header` and `ContentType` are in `common.http`.

**Why.** Raw request nodes describe HTTP requests without any invoker behind them.
Neither should import the other's package to get a method or a media type.

### 4.11 Contracts in `core`, implementations behind them

**Decision.** `InvokerReader` and `InvokerWriter` are interfaces in `core.invoker`.
`XmlInvokerReader` and `XmlInvokerWriter` implement them and are named only in
`InvokerConfiguration`.

**Why.** Callers depend on what they need (read an invoker), not on how it is done
(XML). A future format reader is a new implementation, not a change to callers.

**Why not in `common`.** Only core reads or writes invoker files; workers receive
self-contained job messages and never do (architecture decision #9). A contract with a
single consumer belongs with that consumer. Move the interfaces and result types to
`common` if a second module ever needs them; the XML implementation stays in core.

### 4.12 XML is kept, validated by a schema, then mapped

**Decision.** v6 files are validated against `invoker-6.0.xsd` before they are mapped to
the model. The schema checks structure and fixed vocabularies; the model checks rules
about values and relationships.

**Why.** The reader looks up the elements and attributes it knows, so without the schema
a misspelled one would silently vanish. Measured on this code:

| Mistake in a v6 file | With the schema | Without it |
|---|---|---|
| `visiblity="protected"` | rejected, with line and column | imported, password **public** |
| `<headers>` instead of `<header>` | rejected | imported with **no headers** |
| `<endpont>` instead of `<endpoint>` | rejected | crashes with `NoSuchElementException` |

The model then gives readable, element-located messages for rules a schema cannot
express, such as unique response statuses.

**Cost.** Adding an element means changing both the schema and the reader.

### 4.13 No XML namespace; the root `version` attribute identifies the format

**Decision.** Invoker files declare `<invoker version="6.0" …>` and no `xmlns`.

**Why.** A namespace would add a line every author must copy exactly. 5.x files never
had a `version` attribute, so its presence is enough to tell the generations apart.

### 4.14 5.x files are upgraded in memory, and every change is reported

**Decision.** The reader accepts 5.x files, converts them to the current model, and
returns an `InvokerIssue` for each change, graded `INFO`, `WARNING` or `ERROR`.

**Why.** Self-hosted installations have existing invoker files that must keep working.
Some conversions cannot be exact (see §6.3), so they are reported rather than hidden.

### 4.15 Things deliberately left out

| Left out | Why |
|---|---|
| An invoker `type` / kind (`RESTful`, `openapi`) | Nothing used it; 5.x never read it either. |
| `required` on fields | Declared in 5.x files, read by nothing. Adding an optional attribute later is backward compatible. |
| A batch importer (folders, zip archives) | Removed; a single `read` covers the need. Batch concerns such as duplicate ids across files belong to the caller. |
| A registry or cache of invokers | Invokers are stored per tenant; a boot-time in-memory map cannot work in cloud mode. |

---

## 5. What this solves compared with 5.x

| 5.x | Now |
|---|---|
| Name was file name, map key and foreign key: renaming broke connectors | `InvokerId` / `OperationId`, separate from names |
| Untyped field maps; arrays as one-element samples; lookups ignored the index | Typed, sealed `Schema`; one `items` schema per array |
| `type="array"` meant child fields, comma-separated text, or unknown | `<items>`, `<value>`, and an explicit `undefined` |
| Fields and headers parsed into `HashMap`, losing order | Declaration order kept everywhere |
| One success and one fail; decoding ignored the real status | Status-keyed responses with most-specific matching and a success condition |
| `data`, `format` and `type` overlapped; content type resolved two ways | One `ContentType` on the body |
| Query parameters recovered by regex from the endpoint | Declared `QueryParameter`s with type, style and explode |
| Operation type read as `equals("auth")` and `contains("auth")` | Typed `OperationRole` set |
| Malformed files failed during execution | Rejected on read, every problem listed with its location |
| DOM parsing without protection against XML attacks | DOCTYPE refused, no external access, size limit |
| `category_tags` present in files but never read | Read and kept |

---

## 6. Behaviour reference

### 6.1 Reading

```
bytes ─► size check ─► secure parse ─► detect generation ─┬─► v6:  schema validation ─► map to model
                                                          └─► 5.x: convert and report changes
                                                                                    │
                                                  ReadResult (invoker, format, issues) or InvokerReadException
```

| Step | Behaviour |
|---|---|
| Size | Content over `XmlInvokerReader.MAX_CONTENT_BYTES` (10 MB) is rejected before parsing. |
| Parse | DOCTYPE declarations are refused, which rules out external entities and entity expansion. Comments are dropped. Nothing is fetched from the file system or the network. |
| Detect | Root must be `<invoker>` with no namespace. No `version` attribute → 5.x. `6.x` → v6. A higher major version → rejected as written for a newer OpenCelium. Anything else → rejected. |
| v6 validation | Every schema violation is reported at once, each with a line and column. |
| v6 mapping | Problems are collected per setting and per operation, each with an element path such as `/invoker/operations/operation[@operationId='list']/request`. |
| Text | Element text is trimmed. An empty element means no value. |

The contract, from `InvokerReader`:

- the result is either a valid invoker or an `InvokerReadException`, never `null` and
  never a partially read invoker;
- a failure lists every problem found, not only the first;
- `ReadResult.issues()` never contains an `ERROR`;
- implementations are thread-safe.

### 6.2 Writing

| Behaviour | Detail |
|---|---|
| Format | Always v6, whatever format the invoker was read from. |
| Round trip | Reading the output gives back an equal invoker (one exception in §7). |
| Defaults omitted | `visibility="public"`, `type="string"` on a setting, `style="form"`, and `explode` when it equals the default for its style. |
| Layout | UTF-8, indented by four spaces, elements in schema order. |
| Attributes | Written in alphabetical order by the JDK serializer, so `id` precedes `version`. |
| Deterministic | The same invoker always produces the same bytes. |

### 6.3 Upgrading 5.x files

Each row is one conversion and the severity it reports.

| 5.x | Converted to | Severity |
|---|---|---|
| `<name>` | invoker id derived from it: accents stripped, lower-cased, non-alphanumerics become `-` | INFO |
| root `type` attribute | ignored | — |
| operation `name` that is not a valid id | id with invalid characters replaced by `-`; display name kept | WARNING |
| two operations ending up with the same id | — | ERROR |
| private setting | value kept verbatim as its `source` | — |
| reference to an operation that was renamed | `%{Old Name.` rewritten to `%{New-Id.` | INFO |
| private setting with no value | — | ERROR |
| missing or unknown `visibility` | public | WARNING |
| setting type `text` or empty | string | — |
| operation type `test` / containing `auth` / `page` | `TEST` role / `AUTH` role / nothing (pagination implies it) | — |
| unknown operation type | ignored | WARNING |
| query string in `<endpoint>` | string query parameters | WARNING |
| `Content-Type` header | the body's `contentType`; dropped if there is no body | INFO |
| body media type | from the `Content-Type` header, else a media type in `data`, else `format`, else `application/json` | WARNING only for the last fallback |
| `data="graphql"` | GraphQL envelope on requests; dropped on responses | INFO |
| body `type="array"` | a list whose elements have the body's fields | — |
| array with child fields / comma-separated text / nothing | object items / string items with default values / `undefined` items | — / INFO / WARNING |
| unknown field type | string | WARNING |
| `required` attributes | dropped | INFO |
| example values in response fields | dropped | INFO |
| `__oc__attributes` field | XML attributes of the element | — |
| `__oc__value` field | dropped (see §9) | WARNING |
| `success` and `fail` with the same status | merged into one response: success fields plus non-clashing fail fields | WARNING — add a success condition |
| no `<response>` | a `default` response with no body | WARNING |
| missing status | success → `2XX`, fail → `default` | WARNING |
| unknown pagination element, or rule without action | skipped | WARNING |
| empty `limit`, `offset` or `page` | value `0`, as 5.x did | — |
| invoker-level `<pagination>` | copied to every operation without its own, as 5.x applied it | INFO |
| no operations, or an unknown HTTP method | — | ERROR |

The upgrade happens in memory. Nothing is written back to the original file; call the
writer if you want a v6 file.

### 6.4 Choosing a response

`Operation.responseFor(statusCode)` returns the most specific response covering the
code: an exact code beats a class, and a class beats `default`.

```java
// responses: 404, 4XX, default
responseFor(404)  // → 404
responseFor(409)  // → 4XX
responseFor(503)  // → default
```

If nothing covers the code and there is no `default`, the result is empty. Status values
are unique per operation; `4xx` is accepted and normalised to `4XX`.

### 6.5 Model rules worth knowing

| Type | Rule |
|---|---|
| `Invoker` | at least one operation; unique setting names; unique operation ids; category tags deduplicated in order |
| `Operation` | a request and at least one response; unique statuses |
| `Request` | endpoint not blank and without `?`; no `Content-Type` header; unique query parameter names; repeated headers allowed |
| `Response` | no `Content-Type` header |
| `Body` | XML namespace only on an XML body that has a schema; GraphQL envelope only on JSON; a form-encoded or multipart body with a schema must be an object |
| `ConnectorSetting` | private if and only if it has a source; private settings have no default; names use letters, digits, `.`, `_`, `-` |
| `QueryParameter` | a scalar uses `form`; a list holds scalars and uses `form`, `spaceDelimited` or `pipeDelimited`; an object uses `form` or `deepObject`; `undefined` is rejected. Defaults follow OpenAPI: `form`, exploded |
| `ArraySchema` | every default matches `items` |
| `ObjectSchema` | unique field names; unique attribute names; fields keep order |
| `PageRule` / `Pagination` | a rule has a value, a ref, or both; one rule per parameter; at least one rule |
| `Header` | name is an RFC 9110 token; compare names with `hasName`, which ignores case |
| `ContentType` | parameters such as `charset` dropped; stored lower-case; `isJson`/`isXml` include `+json`/`+xml` types |
| enums (`fromValue`) | case-insensitive |

---

## 7. Warnings

**Validation errors are exceptions.** Building a model from untrusted input (a request
body, another format) throws `IllegalArgumentException` for any rule violation. Catch it
at the boundary; the message is written for the person who supplied the data.

**Setting sources are not checked.** `%{login.body.token}` naming an operation that does
not exist imports successfully and fails when a workflow runs.

**Duplicate invoker ids across files are not detected.** The reader handles one file.
Two 5.x files named `fake api.xml` and `fake_api.xml` both become `fake-api`; check ids
before storing a batch, or the second overwrites the first.

**The 5.x rename rewrite assumes id-based resolution.** Rewriting `%{Get Token.…}` to
`%{Get-Token.…}` is correct only if the execution engine resolves operation references by
operation id.

**Merged 5.x responses need a condition.** A converted JSON-RPC operation whose success and
fail blocks shared status `200` has one response and no condition, so every failure is
treated as a success until someone adds `<condition success="…"/>`. The upgrade reports this
as a warning; surface warnings to users.

**The writer does not reproduce the original file.** Comments are dropped, attributes are
reordered, and attributes holding defaults are omitted. It produces an equivalent, canonical
file, not an identical one.

**One round-trip exception.** An empty object or empty list used as an array default is
written as `<value/>` and read back as empty text.

**v6 vocabularies are case-sensitive in files.** The model's `fromValue` methods ignore
case, but the schema does not: `<method>get</method>` is rejected in a v6 file while it is
accepted, and upgraded, in a 5.x file.

**Editors cannot find the schema by namespace.** There is none. Add
`xsi:noNamespaceSchemaLocation="invoker-6.0.xsd"` to a file, or configure the editor.

**Nullability is annotated, not enforced by tooling.** Nullable components carry JSpecify
`@Nullable`; everything else is non-null and checked at runtime. No package declares
`@NullMarked`, so static analysis will not flag a `null` passed where one is not allowed.

**The model has no JSON mapping.** There are no Jackson annotations. Serialising the sealed
types (`Schema`, `Value`, `ResponseStatus`) needs polymorphic type handling configured by
whoever serialises them.

**`authType` and category tags are descriptive.** Neither affects how requests are
authenticated or executed.

**Validate headers yourself when editing.** Adding a `Content-Type` header through a builder
throws; set `Body.contentType()` instead.

---

## 8. Extending it

**Adding an element or attribute to the format.**
1. Add it to the model type, and to its builder if the type has one.
2. Add it to `invoker-6.0.xsd`. An optional addition keeps existing files valid, so it stays
   within version 6.
3. Read it in `InvokerV6Reader` and write it in `XmlInvokerWriter`.
4. Decide what a 5.x file maps to, in `LegacyInvokerReader`.
5. Extend the round-trip test so reading the writer's output still gives an equal invoker.

**A breaking format change.** Create a new schema and a new major version. Teach
`XmlFormatDetector` the version and add a reader for it; keep the older readers, so
existing files continue to load.

**Another file format** (for example OpenAPI). Implement `InvokerReader` for it and wire it
in `InvokerConfiguration`. Callers do not change.

**A new kind of schema or response status.** Add a record to the sealed interface. The
compiler then lists every `switch` that must handle it.

---
