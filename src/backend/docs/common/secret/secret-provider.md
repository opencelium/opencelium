# Secrets

The contract for handling credentials. Plain Java, no framework — features depend on this,
not on where secrets are stored.

## The types

| Type | What it is |
| --- | --- |
| `SecretValue` | A credential in memory. Prints as `***` in logs, serialises as `"***"`, but can be read *from* a request body. Constant-time comparison |
| `SecretRef` | An opaque handle. Holds no secret material, so it is safe to store, log and return |
| `SecretProvider` | `store`, `retrieve`, `delete` — each scoped to a client |

## Using it

```java
// Saving: keep the reference, never the value
SecretRef ref = secretProvider.store(tenant, SecretValue.of(request.apiToken()));
connector.setApiToken(ref);

// Using: resolve where the value is needed, not when the entity is loaded
SecretValue token = secretProvider.retrieve(tenant, connector.apiToken());

// Replacing: store, swap, delete
SecretRef updated = secretProvider.store(tenant, SecretValue.of(request.apiToken()));
SecretRef previous = connector.getApiToken();
connector.setApiToken(updated);
secretProvider.delete(tenant, previous);
```

There is no update method on purpose: a reference points at the same value for its whole life.

## Rules

* **Never put a `SecretValue` in a response, an event, a log argument or an exception
  message.** The masking is a safety net, not permission.
* **Report presence, not value** — `{"apiToken": {"set": true}}`.
* **Resolve late**, and hold the value only as long as the call that needs it.
* **Delete with the owner**: removing a connector removes its secrets.

## Failures

| Exception | Meaning |
| --- | --- |
| `SecretNotFoundException` | No secret with that reference for that client |
| `SecretIntegrityException` | The stored data was edited, belongs elsewhere, or the master key changed |
