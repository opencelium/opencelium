# Configuration

Settings for the installation itself. Everything here is read once at startup, from
`application.yaml` and the environment.

Related: [secret storage](secret/mongo-secret-store.md) · [the secrets API](../../common/secret/secret-provider.md)

## How a setting is defined

One immutable record per group, validated while the context starts:

```java
@Validated
@ConfigurationProperties(prefix = "opencelium.tenancy", ignoreUnknownFields = false)
public record TenancyProperties(@NotNull @DefaultValue("self-hosted") Mode mode, …) { }
```

* `@ConfigurationPropertiesScan` on `CoreApplication` picks up every record in this package.
* `ignoreUnknownFields = false` makes a misspelled key fail instead of being ignored.
* Defaults belong on the record, so the yaml carries only what differs.
* Use real types — `Duration`, enums, `URI`. An enum gives "must be one of" for free.
* Don't use `@Value`; inject the record.

## What can be configured today

| Property | Meaning | Default |
| --- | --- | --- |
| `opencelium.tenancy.mode` | `self-hosted` — one customer, database configured below | `self-hosted` |
| `opencelium.tenancy.self-hosted.verify-connection-on-startup` | Ping the database while starting | `true` |
| `opencelium.security.master-key` | Encrypts every stored credential. Base64, 32 bytes | — (required) |
| `opencelium.security.secret-provider` | Where secrets are stored | `mongo` |
| `spring.mongodb.uri` | The customer's database | `mongodb://localhost:27017/opencelium` |
| `server.port` | HTTP port | `9090` |

Cloud mode — one database per client, supplied at login — is not implemented yet.

## Overriding from the environment

Upper-case the property, dots to underscores, drop the dashes:

| Property | Variable |
| --- | --- |
| `opencelium.tenancy.mode` | `OPENCELIUM_TENANCY_MODE` |
| `opencelium.security.master-key` | `OC_MASTER_KEY` (mapped in `application.yaml`) |
| `spring.mongodb.uri` | `SPRING_MONGODB_URI` |

The environment wins over the file, so one image serves every environment.

## What stops the application at startup

| Situation | Result |
| --- | --- |
| A required setting is missing or blank | Fails, naming the property |
| A key is not base64, or is not 32 bytes | Fails; the message never contains the value |
| A key under `opencelium.*` is misspelled | Fails — unknown keys are rejected |
| A value is not an allowed option | Fails, listing what is allowed |
| No `spring.mongodb.uri` | Fails, instead of quietly using `localhost:27017` |
| The database is unreachable | Fails, naming the host — never the credentials |

Skip the connection check with
`opencelium.tenancy.self-hosted.verify-connection-on-startup=false` (the test profile does).

## Running locally

```bash
cd src/backend
printf 'OC_MASTER_KEY=%s\n' "$(openssl rand -base64 32)" > .env   # .env is gitignored
set -a; source .env; set +a
docker run -d -p 27017:27017 --name oc-mongo mongo:8
./gradlew :core:bootRun
```

Never put a key in `application.yaml`, not even as a default — it would ship the same key to
every installation.

## Troubleshooting

| Message | Fix |
| --- | --- |
| `opencelium.security … masterKey … must not be blank` | Set `OC_MASTER_KEY` |
| `… must decode to exactly 32 bytes for AES-256` | Regenerate: `openssl rand -base64 32` |
| `spring.mongodb.uri must be set …` | Point it at the customer's database |
| `Cannot reach MongoDB at <host>` | Start it, fix the URI, or disable the startup check |
| Unknown property under `opencelium.*` | A typo — the message names the key |
