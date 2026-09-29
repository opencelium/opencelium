# Secret storage

The default implementation of [`SecretProvider`](../../../common/secret/secret-provider.md):
AES-256-GCM ciphertext in the customer's own MongoDB.

## What is stored

```json
{
  "_id":        "sec_9f2c…",
  "tenantId":   "t-123",
  "alg":        "AES-256-GCM",
  "keyId":      "v1",
  "iv":         "<12 random bytes>",
  "ciphertext": "<encrypted value + authentication tag>"
}
```

No field holds the value, its length, or a hash of it. Reading the collection directly — as
the customer's own database administrator, for instance — shows ciphertext and nothing else.

## What the encryption guarantees

* **A fresh IV per value**, so the same password stored twice looks different each time.
* **The client and the secret id are bound into the encryption** as associated data.
  Ciphertext edited in place, or copied to another document or another client, fails to
  decrypt rather than returning a wrong value — `SecretIntegrityException`, naming the
  reference and never the content.
* **One client's reference never resolves for another**: every lookup matches on the client
  as well as the id.

## The master key

`opencelium.security.master-key`, base64 for exactly 32 bytes, from the environment.

* Decoded and checked while the context starts, so a bad key stops the application
  immediately rather than when a credential is first needed.
* Never logged, and never included in a failure message.
* **Losing it makes every stored credential unreadable.** There is no recovery path.
* `keyId` is stored with each document so keys can be rotated later without rewriting them.

## Which database

`TenantDatabaseProvider` answers "which database does this client's data live in".
`StaticTenantDatabaseProvider` covers the single-customer installation: one database from
`spring.mongodb.uri`, for every client. Per-client routing implements the same interface, so
nothing here changes when it lands.

`SecretRepository` is the seam between encryption and storage — it keeps the rules testable
without a database, and it is where that routing plugs in.

## Tests

```bash
./gradlew :core:test --tests "io.opencelium.core.config.secret.*"   # no Docker
./gradlew :core:integrationTest                                     # real MongoDB, needs Docker
```

The integration test proves what a fake cannot: only ciphertext reaches the database, an edit
made in the collection is detected, one client cannot read another's secret, and the value
never appears in the log.
