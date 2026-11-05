# Setup wizard: the plan

## Approach
The wizard runs in 2 phases. Phase 1 runs before Spring, in plain Java: the questions, the MongoDB detection, download, installation and ping, the master key, and the file writes. Phase 2 runs after Spring starts on the written files: an application runner makes the admin through the user service and prints the login box. Thus the password hash and the user document exist exactly once. The steps run in a fixed order. Each step takes its value from the setup file, else from the prompter, and adds the files that it needs to a file plan. The summary shows the answers and writes the plan in 1 operation, with a rollback on each failure. The setup state is its own document in the database, not a runtime setting, so the wizard does not depend on the settings service.

The sections below give the build order. Each section ends in a state where `./gradlew build` is green and `java -jar oc-app.jar` starts.

### The foundations
The wizard uses 4 building blocks of core that exist before it. The bootstrap properties (`core.config`) bind the 3 `opencelium.*` properties by hand and apply the documented defaults with a `(default)` log line. A bad value stops the start with `Property: <name>`. The MongoDB connection (`core.config.mongo`) resolves `spring.mongodb.uri`, pings the server with a 5 s timeout and maps the failures to plain causes. The keys package (`core.secrets.keys`) resolves the root key in the order `OC_MASTER_KEY`, the key file, `<data-dir>/master.key`, generate. It refuses the generation when a wrapped DEK exists. Its probe mode finds the source without a write. The user service (`core.user`) makes the first admin with a hash and never plain text, and it refuses a second admin for the tenant. The start order is section 4.1 of the architecture document.

### The framework and the file writes
The launcher decides between the wizard and the normal start (the rules are in "Interfaces and contracts"). The prompter runs on a console seam, so the tests drive it with a scripted console. The steps data directory, port and summary ask their questions; nothing is made before the summary. The file plan collects the files. The writer stages each file next to its target, sets the permissions, moves it atomically and rolls back on each failure. The yml renderer and the env renderer give the file texts. The setup file gives the values of a run without a terminal, and `setup --template` prints its template. The screens use plain characters only. The yml file has no MongoDB URI until the MongoDB step runs: the documented default applies, and the start logs it as such.

### The MongoDB step
The detector probes `127.0.0.1:27017`, `mongod` on the PATH and `docker compose version`; the result decides the menu items and the default. The ping reuses the start ping and the client factory of `core.config.mongo`, which run without Spring. Thus each Mongo client comes from 1 path, and the causes are the same as at the start. The URI path asks the URI, pings, and offers the retry menu. The URI splitter moves the password to `OC_MONGO_PASSWORD` in the env file and writes the URI with the placeholder. The downloader reads the URL and the SHA-256 for the platform key from `mongodb-versions.properties`. It streams to `<data-dir>/downloads` with a progress bar, compares the checksum, and resumes with a `Range` header on a retry. The local installer unpacks the tarball and writes `mongod.conf` with `bindIp: 127.0.0.1` and `security.authorization: enabled`. It starts `mongod` once without authentication to make the user `opencelium` with `readWrite` on `opencelium`. Then it restarts `mongod` with authentication and pings with the new user. The Docker Compose installer writes `quickstart/docker-compose.yml` and `.env`, runs `docker compose up -d` and waits for the ping. A Logback configuration with the root level WARN keeps the driver quiet before Spring. The SSPL notice placeholder prints after the download.

### The master key and the admin
The master key step runs the guard first, in probe mode, against the pinged database. A wrapped DEK and no key print the restore-or-reset text and stop. Then the step offers generate, variable and file. Generate writes `<data-dir>/master.key` with the key generator, shows the backup box and asks for the confirmation. Variable and file validate the 32 bytes through the keys package and ask again on a bad value. With the variable option the wizard writes nothing: it prints the instruction to set `OC_MASTER_KEY` in the environment of the service. The admin step asks the username with the default `admin` and puts it into the pending actions. It skips itself when an admin exists: the user package gives that query, and it runs through the client factory before Spring. The pending actions are an object in memory: the admin username and the service specification. The launcher gives it to the Spring context as a singleton before the start. The completion runner, ordered last, makes the admin with the password `1234` through the typed-password path of the user service. It writes the setup state `REQUIRED`. It prints the box with the URL, the username and the password, and it clears the object.

### The setup state and the endpoints
The setup state is 1 document for each tenant scope. The wizard writes it as `REQUIRED` when it makes the admin, and `POST /setup/complete` sets it to `COMPLETE`. An admin without a setup state document is an installation from before the wizard: the state is `COMPLETE`, and the code writes the document. `GET /setup/status` returns the mode, the state, the open steps and the bootstrap facts, never a credential or the key. The setup-required filter runs after the authentication. It answers 409 for each route outside the allow-list when the state is `REQUIRED`. The real authentication is the authentication story. Until it lands, the filter reads the principal from the security context, and the tests use a mock admin user. The state and the filter apply in the self-host mode. In the cloud mode no wizard runs, and the Service Portal owns the first user (decision 10).

### The service registration
The host services SPI has 4 operations: detect the host, install the service, print the service, and install the `mongod` service. The detection: systemd when `/run/systemd/system` exists, launchd on macOS, Windows, or none. The systemd implementation makes the system user `opencelium` without a shell and copies the jar to `/opt/opencelium`. It writes the yml file with `0640 root:opencelium` and the env file with `0600 opencelium:opencelium`. It changes the owner of the data directory. Then it writes the unit file, runs `daemon-reload` and `enable --now`, and waits for the port. The `mongod` service of the local installation gets `Before=opencelium.service`. Without root rights, the sudo option serializes the file plan and the service specification to a temporary file with `0600`. Then it runs `sudo java -jar oc-app.jar install-service --plan <file>`. The child applies the plan and deletes the file. The show option prints the files and the commands; the skip option prints the reminder for a start by hand. The print-only implementation renders the launchd plist and the `sc.exe` commands. The subcommand `install-service` runs the service step alone. All commands go through a command runner seam, so the tests use a fake that records them.

### The print flag
`setup --print-values` reads the written yml file and env file and prints the setup file that reproduces the run. A password is `generate` or an env reference.

### The end-to-end test and the documents
An integration test runs a batch installation from a setup file against the local MongoDB. It makes sure that the files exist, that Spring starts and that `GET /setup/status` agrees. It searches the log files and a database dump for the database password and the key bytes. The VM matrix is a hand test: Ubuntu 24.04 with the download path and the service, Debian 12 with the URI path, the Docker Compose path, and macOS with the print fallback. The results go to `docs/setup-wizard-test-matrix.md`. The sample `application.yml`, the quickstart `docker-compose.yml` and the README section "First start" complete the feature. When the reviewer accepts the decisions, the architecture document gets the exception for the 2 secrets outside the database. Its first-run description gets the wizard.

### The order
The foundations, then the framework, then the MongoDB step, then the master key and the admin. The setup state and the service registration are independent of each other; both come after the MongoDB step. The print flag, then the end-to-end test and the documents close the feature. The login part of the setup state waits for the authentication story.

### What this feature waits for
- The local login strategy and the password-change screen (the authentication story): the filter test with a real login, and the login at `/setup`. They do not block the terminal part.
- The settings API and the setting registry (the configuration story): only the browser wizard. Nothing in this feature.
- The full secret provider and the DEK lifecycle (the secrets story): nothing here. The keys package has the guard and the canary already.
- The browser wizard screens (the frontend story): the first customer installation, not this feature.

## Modules and packages
All code is in `core`. The wizard writes the configuration of core, pings and installs the database of core, and makes users in it. `common` and `execution` have no database and no configuration, so a lower module is not possible. The worker has no wizard. It has no database (decision 9), it takes the broker address from the environment, and it logs "no database, no setup". Both deployment shapes keep working: the monolith runs the wizard on its host, and the distributed shape runs it on the core host only. The tenant ID record is in `common` already, because the job messages will carry it.

| Package | Responsibility |
|---|---|
| `io.opencelium.core.setup` | The launcher with the launch decision and the usage text, the wizard loop, the setup context, the cancel and failure exceptions. Also the pending actions, the completion runner, the setup state with its repository, the 2 endpoints and the setup-required filter. |
| `io.opencelium.core.setup.prompt` | The prompter contract, the console seam, the console prompter with the loops for bad input, `?` and `q`, the screen helpers. |
| `io.opencelium.core.setup.values` | The questions, the setup file reader, the template, the value source: the file, else the prompt, else the batch error. |
| `io.opencelium.core.setup.steps` | One step for each screen: data directory, port, MongoDB, master key, admin, service, summary. |
| `io.opencelium.core.setup.files` | The file plan, the atomic writer with the rollback, the yml, env and service-file renderers, the bootstrap values. |
| `io.opencelium.core.setup.mongo` | The detector, the downloader, the local installer, the Docker Compose installer, the URI splitter. The ping comes from `core.config.mongo`. |
| `io.opencelium.core.setup.host` | The host services SPI, the systemd and the print-only implementations, the sudo re-execution, the command runner seam. |

The wizard uses these packages:

- `core.config`: the bootstrap properties and the data directory default.
- `core.config.mongo`: the start ping and the client factory, before Spring. Each Mongo client comes from 1 path (section 6.6).
- `core.secrets.keys`: the probe, the 32-byte validation, the generator and the DEK repository of the guard. Cryptography stays in `core.secrets` (section 6.9).
- `core.user`: the first-admin command and the query "an admin exists", before Spring.

Test support in `core/src/test/java/io/opencelium/core/testsupport/`: `LocalMongo`, `MongoIntegrationTest`, `CoreStartup`, `MutableClock`, and `fake/ScriptedConsoleIo` (a queue of input lines and the captured output).

## Decisions
The reviewer confirms each decision before task 12, the first open task, starts.

1. **Two phases: before Spring and after Spring.** Where does the admin creation run? Options: (a) in phase 1, with the bare driver and an own hash, (b) in phase 2, through the user service after Spring starts. Recommended: (b), because the password hash and the user document then exist exactly once, in the user service.
2. **The setup state is its own document.** Is the setup state a runtime setting? Options: (a) a setting through the settings service, (b) a document `setup_state` with its own repository. Recommended: (b), because the state is data that the application owns, not a configuration value, and the settings service does not exist yet.
3. **Numbered choices, no arrow keys.** How does the user select an option? Options: (a) arrow keys through a terminal library, (b) a number and Enter on the JDK console. Recommended: (b), because it works in each terminal, through SSH and with piped input, and it needs no library.
4. **A real admin account, not a setup token.** How does the first user log in? Options: (a) a one-time setup token, (b) the first admin user through the normal login form. Recommended: (b), because a token is a second login path with its own expiry and cleanup. Candidate for section 7 of the architecture document; the architect agent drafts the record. The record also covers the setup gate: the 409 for the routes outside the allow-list.
5. **The database credentials are outside the yml file.** Where does the MongoDB password go? Options: (a) plain text in the yml file, (b) an env file with the placeholder in the yml file, (c) encryption under the master key. The env file has owner-only permissions, and the yml file holds `${OC_MONGO_PASSWORD}`. Recommended: (b), because the yml file is group-readable for the service, and the env file is the secret format of systemd and Docker. Option (c) is opened again only on customer request. Candidate for section 7: a bootstrap secret comes from the environment, and the yml file holds its placeholder. This extends decision 13 without a third place.
6. **Linux with systemd first.** Which hosts get a native service installation? Options: (a) systemd, launchd and the Windows service manager, (b) systemd only, with printed files for macOS and Windows. Recommended: (b), because the server platform is Linux. Native macOS and Windows come on customer request.
7. **`setup` wins over `--batch`.** What does `--batch` mean together with `setup`? Options: (a) `--batch` disables the wizard in each case, (b) `setup --batch` is the batch installation, and `--batch` alone is the normal start. Recommended: (b), because the batch installation of the spec is `setup --file <path> --batch`.
8. **A bootstrap value counts as a configuration.** Does a terminal without a configuration file get the wizard when the environment has a bootstrap value? Options: (a) yes, (b) no. Recommended: (b), because `docker run -it` has a terminal, and an operator who sets `SPRING_MONGODB_URI` or `--server.port` does not want questions.
9. **An unknown subcommand is an error.** What does a bare word other than `setup` do? Options: (a) Boot ignores it, (b) "Unknown command" with the usage text and the exit code 2. Recommended: (b), because a mistyped `install-service` must not start the application without a message.
10. **The written files have no timestamp.** What is the header line of the yml file? Options: (a) a timestamp, (b) fixed text. Recommended: (b), because a setup-file run and an interactive run then give byte-identical files, which the tests compare.
11. **Nothing is made before the summary.** When is the data directory made? Options: (a) at the question, (b) by Boot at the start. Recommended: (b), because the question validates the path, and a cancel leaves no trace.
12. **The exit codes.** Which exit code does each end of the wizard give? Options: (a) 0 and 1 only, (b) 4 codes: 0 for a cancel, 1 for a failure, 2 for a usage error, 130 for Ctrl+C. A cancel is `q` or a declined summary. A failure is an absent value in batch mode or a write failure. Recommended: (b), because a script can then tell a cancel from a failure.
13. **No own configuration-directory variable.** How does an operator name a 4th search location? Options: (a) an own variable `OC_CONFIG_DIR`, (b) the Spring variable `SPRING_CONFIG_ADDITIONALLOCATION`. Recommended: (b), because it is 1 contract less.
14. **The env file format.** Which format has the env file? Options: (a) `export KEY=value`, (b) `KEY=value`, 1 for each line, no `export`. Recommended: (b), because it is the format of systemd `EnvironmentFile` and of Docker `--env-file`. A start by hand uses `set -a; . ./config/opencelium.env; set +a; java -jar oc-app.jar`, because a plain `source` does not export the variables to the JVM.
15. **No mode step.** How does the yml file get the deployment mode? Options: (a) a mode question with self-host and cloud, (b) the fixed value `opencelium.deployment-mode: self-host`. Recommended: (b), because the wizard installs the self-host mode only. The cloud mode stays in core for hand-written configurations.
16. **The fixed admin password.** How does the admin step make the account with the password `1234`? Options: (a) the generated-password path of the user service, with the must-change flag and the lock, (b) the typed-password path, without them. Recommended: (b), because the spec forbids the forced change and the lock. The password generator and the lock job have no user in the wizard.
17. **A hand-written argument parser.** Which code parses the command line? Options: (a) a command-line library, (b) a hand-written parser. Recommended: (b), because a handful of flags does not justify a dependency.
18. **SnakeYAML reads the setup file; the code renders the yml file.** Which library reads and writes the yml files? Options: (a) a Jackson YAML module, which is not on the classpath, (b) SnakeYAML, which Boot brings, without the type detection of YAML. Recommended: (b), because no dependency is added, and the values stay the text that the user would type.
19. **The tarball unpack.** How does the local installer unpack the MongoDB tarball? Options: (a) `tar` through a process, (b) a pure-Java library. Recommended: (a), because the download runs on Linux only, where `tar` exists, and no dependency is added.
20. **The variable option writes nothing.** Where does `OC_MASTER_KEY` go when the user selects the variable option and installs the service? Options: (a) into the env file, (b) nowhere: the wizard prints the instruction for the service environment. Recommended: (b), because the key and the database password are then not in 1 file (decision 14).

## Interfaces and contracts

### The command line
`java -jar oc-app.jar [setup] [--file <path>] [--template] [--batch] [--print-values] [install-service [--plan <file>]] [--<property>=<value>...]`. All arguments that the setup does not understand go to Spring Boot unchanged, in their order.

| Part | Meaning |
|---|---|
| no subcommand | The launch decision below. |
| `setup` | The wizard, also when a configuration exists. |
| `--file <path>`, `-f <path>`, `--file=<path>` | The setup file with the values; needs `setup`. |
| `--template` | Prints the template of the setup file and does nothing else; needs `setup`. |
| `--batch` | Never asks a question. With `setup`: the batch installation. Alone: the normal start. |
| `--print-values` | Prints the setup file of this installation; needs `setup`. |
| `install-service [--plan <file>]` | Runs the service step alone; with `--plan`, applies a serialized plan under sudo. |
| `--help`, `-h`, `help` | The usage text, exit code 0. |

The launch decision, first match wins:

| # | Condition | Decision |
|---|---|---|
| 1 | `--help` | The usage text, exit code 0. |
| 2 | A bare word that is not a subcommand, or `--file`, `--template` or `--print-values` without `setup` | A usage error, exit code 2. |
| 3 | `setup --template` | The template, also without a terminal. |
| 4 | `setup` | The wizard. Batch mode with `--batch` or without a terminal. |
| 5 | `--batch` | The normal start. |
| 6 | No interactive terminal | The normal start. |
| 7 | `spring.config.location`, `spring.config.additional-location` or `spring.config.import` in the arguments, the system properties or the environment | The normal start. |
| 8 | A bootstrap property (`opencelium.*`, `spring.mongodb.*`, `server.port`) in the arguments, the system properties or the environment | The normal start. |
| 9 | A configuration file at a search location | The normal start. A file in `/etc/opencelium/` becomes an additional location for Boot. |
| 10 | All other cases | The wizard. |

The search order: `./config/`, `./`, then `/etc/opencelium/`; in each directory `application.yml`, `application.yaml`, `application.properties`. The paths are relative to the working directory. The write location is `./config/`.

The exit codes:

- 0 after `q`, a declined summary or a complete run;
- 1 after an absent or bad value in batch mode, or after a write failure;
- 2 after a usage error;
- 130 after Ctrl+C.

Each failure that ends the setup goes to standard error. The dialogue goes to standard output.

### The files that the wizard writes
With the service installed on Linux:

```text
/etc/opencelium/application.yml          0640  root:opencelium
  server.port: 9090
  spring.mongodb.uri: mongodb://opencelium:${OC_MONGO_PASSWORD}@127.0.0.1:27017/opencelium?authSource=admin
  opencelium.deployment-mode: self-host
  opencelium.data-dir: /var/lib/opencelium

/etc/opencelium/opencelium.env           0600  opencelium:opencelium
  OC_MONGO_PASSWORD=<generated>

/var/lib/opencelium/master.key           0600  opencelium:opencelium

/etc/systemd/system/opencelium.service   0644  root:root
```

Without the service step, the wizard writes `./config/application.yml` and `./config/opencelium.env` under the working directory, and the key into the data directory. The yml header line is fixed text, and the file has no timestamp. The env file has 1 `KEY=value` line for each entry. The renderer double-quotes a value with whitespace, a quote, a backslash, a hash or a dollar sign, with backslash escapes. Spring resolves `${OC_MONGO_PASSWORD}` from the environment. When the variable is not set, the fail-fast rule applies, and the message names `OC_MONGO_PASSWORD` and the path of the env file.

The unit file:

```text
[Unit]
Description=OpenCelium
After=network-online.target mongod.service
Wants=network-online.target

[Service]
User=opencelium
EnvironmentFile=/etc/opencelium/opencelium.env
ExecStart=/usr/bin/java -jar /opt/opencelium/oc-app.jar
Restart=on-failure
ProtectSystem=strict
ReadWritePaths=/var/lib/opencelium

[Install]
WantedBy=multi-user.target
```

### The setup file
One `key: value` line for each question. A value is the text that the user would type: YAML does not guess its type. A blank value is the same as an absent key. These errors stop the setup with exit code 1 and name the key or the file:

- an unknown key or a duplicated key;
- a list or a map as a value;
- a file that does not exist, that is unreadable or that is broken.

Each step declares its question once: the key, the label, the help text and the default of this host. The prompt, the template and the messages read it.

| Key | Values |
|---|---|
| `data-dir` | A path. |
| `port` | 1 to 65535. |
| `mongo` | `local`, `download`, `docker` or `uri`. |
| `mongo-uri` | A connection URI; with `mongo: uri`. |
| `master-key` | `generate`, `env` or `file:<path>`. |
| `admin-username` | The username; the default is `admin`. |
| `service` | `systemd`, `print` or `skip`. |

### The endpoints
The contract style is an open decision; this plan lists the endpoints and writes no `api.yaml`.

| Method | Path | Purpose | Permission |
|---|---|---|---|
| `GET` | `/setup/status` | The deployment mode, the setup state (`REQUIRED` or `COMPLETE`), the open steps, and the bootstrap facts. The facts are the MongoDB host and database without credentials, the key source and the data directory. Never a credential or the key. | The admin role. |
| `POST` | `/setup/complete` | Sets the setup state to `COMPLETE` and writes the completion time. | The admin role. |

The open steps are `AUTH`, `BROKER` and `LICENSE`, as information for the browser wizard. The password change is not a step, because the admin password has no must-change flag. The setup-required filter answers `409` with the body `{ "code": "SETUP_REQUIRED", "openSteps": [...] }` for each route outside the allow-list when the state is `REQUIRED`. The allow-list: `/setup/**`, `/settings/**`, `/auth/**`, `/users/me/password` and the actuator health. The setting keys that the browser wizard writes (`auth.ldap.*`, `auth.oidc.*`, `auth.portal.*`, `execution.broker.*`) belong to the configuration story.

### The setup state
The collection `setup_state` holds 1 document for each tenant scope: the tenant ID, the state (`REQUIRED` or `COMPLETE`) and the completion time. The state is data that the application owns, like a user record, not a configuration value. The 3 placement questions of architecture section 6.4 do not apply.

### Properties and settings
The feature adds no bootstrap property and no runtime setting. The wizard writes the properties that exist: `server.port`, `spring.mongodb.uri`, `opencelium.deployment-mode`, `opencelium.data-dir`, and `opencelium.master-key-file` when the user names a key file. The file `mongodb-versions.properties` in the core resources pins the download URL and the SHA-256 for each platform key.

### The new public types, by responsibility
- The host services SPI: detect the host, install the service, print the service, install the `mongod` service. One implementation for systemd, one that only prints.
- The command runner seam: runs a host command and returns its exit code and output; the tests give a fake that records the commands.
- The pending actions: the handover from phase 1 to phase 2, in memory only. It holds no secret.
- The setup state repository and the 2 response types of the endpoints.

## Test strategy
The test kinds follow architecture section 6.8 and CONTRIBUTING section 9. The tests of the console paths drive the console prompter through `fake/ScriptedConsoleIo`. The tests that touch MongoDB are full-application tests with `@MongoIntegrationTest` and `LocalMongo`; a start of the real application uses `CoreStartup`. The code that runs before Spring is tested against the local MongoDB without a Spring context, as the start ping is.

| Criteria | Kind | Fakes and fixtures |
|---|---|---|
| SW-01 to SW-04 | Unit: the launcher with an injected terminal state, environment, system properties and working directory. | A temporary directory. |
| SW-05 to SW-10 | Unit: the console prompter and the wizard loop with scripted input. The script has bad input, `?`, `q` and the end of the input. | `ScriptedConsoleIo`. |
| SW-11, SW-12 | Unit: the detector with injected probe results; the menu with scripted input. | A fake detector. |
| SW-13 | A hand test on a VM only; a unit test of the generated `mongod.conf`. | The VM matrix. |
| SW-14, SW-15 | Unit: the downloader against a local HTTP server. The server serves a small file with a good and a bad checksum. The platform refusal with scripted input. | A local HTTP server in the test. |
| SW-16, SW-17 | A test against the local MongoDB without a Spring context: the step with correct credentials, wrong credentials and a closed port. The retry menu with scripted input. | `LocalMongo`. |
| SW-18 | Unit: the URI splitter and the rendered yml and env files. | None. |
| SW-19 to SW-22 | Unit: the master key step with scripted input, a temporary directory and an injected environment map. | `ScriptedConsoleIo`. |
| SW-23 | A test against the local MongoDB without a Spring context, with a wrapped DEK and no key. | `LocalMongo`. |
| SW-24 to SW-26, SW-32 | Full application: the completion runner makes the admin. The raw user document holds a hash and no plain text. The captured output holds the box. The captured logger output holds no generated secret. | `LocalMongo`, `CoreStartup`, a list appender on the root logger. |
| SW-27 to SW-30 | Unit: snapshot tests of the unit file, the plist and the `sc.exe` commands. The systemd implementation with a fake command runner that records the commands. | A fake command runner. |
| SW-31 | Unit: the launcher runs the service step alone; the real installation is in the VM matrix. | A fake command runner. |
| SW-33 to SW-36 | Full application with MockMvc against the local MongoDB: 409 before the completion, 200 after; the status never holds a credential; the upgrade path. A mock admin principal until the authentication story. | `LocalMongo`, a mock user. |
| SW-37 | Unit: the admin step with a fake admin query; full application for the skip. | `ScriptedConsoleIo`, `LocalMongo`. |
| SW-38 to SW-41 | Unit: the setup file, the value source, the template and a byte comparison of the setup-file run and the scripted run; SW-38 also in the end-to-end test. | A temporary directory. |

## Risks
| Risk | How the plan handles it |
|---|---|
| The code before Spring prints driver DEBUG logs over the dialogue. | A Logback configuration with the root level WARN. The scripted tests assert on the captured output. |
| The sudo re-execution behaves differently on each distribution. | Only systemd distributions in the first version, tested on Ubuntu and Debian. The wizard prints the exact command before it runs it. |
| The MongoDB download URL or the checksum changes. | Pinned in `mongodb-versions.properties`. A nightly job, not the normal build, has a test that gets the headers of each URL. |
| The local `mongod` installation is the largest unknown. | It is a cut line. Without it, the menu keeps Docker Compose and the URI path, which cover each environment with Docker or a DBA. |
| The service registration grows into 3 implementations. | The host services SPI with the print fallback. Native macOS and Windows are out of scope. |
| The database password or the key leaks to the logs through an exception message. | The wizard prints secrets through the console only. The full-application test searches the captured logger output and the raw documents. |
| A setup-file run and an interactive run give different files. | The written files have no timestamp. A test compares the 2 `config/` directories byte for byte. |

## Definition of done
- Each criterion of spec.md has a test that passes.
- `./gradlew build` is green.
- The hand tests of tasks.md are done.
- The architecture document and the writing guide are updated when the plan changes them.
- The VM matrix is run once, and the results are in `docs/setup-wizard-test-matrix.md`.
- On a fresh Ubuntu 24.04: `java -jar oc-app.jar`, Enter at each question, `systemctl status opencelium` is active, and `GET /setup/status` returns `REQUIRED` with the open steps.
- The sample `application.yml`, the quickstart `docker-compose.yml` and the README section "First start" exist.
