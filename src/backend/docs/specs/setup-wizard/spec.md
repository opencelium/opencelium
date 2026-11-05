# Setup wizard

## User story
As a system administrator who installs OpenCelium for the first time, I want a terminal wizard that asks numbered questions, installs the software that is not installed yet and writes the start-up configuration, so that I get an OpenCelium that operates without the documentation and without edits to the yml files by hand.

## Context
Without the wizard, a new user must write `application.yml` by hand, install MongoDB and give a master key before the first start. Section 6.4 of the architecture document (decisions 13 and 14) keeps the values that the application needs before the database in the yml file. The terminal wizard makes these files, installs the software that a browser page cannot install, and makes the first admin. A start without a terminal never sees the wizard: it uses the defaults and the fail-fast rules of section 4.1.

## Scope
The wizard runs in the terminal and installs the self-host mode only. It does these things:

- It asks the service question, the data directory and the web port.
- It finds, downloads, installs or connects to MongoDB, and it pings the server.
- It resolves the master key: a new key in the data directory, the environment variable `OC_MASTER_KEY`, or a key file.
- It makes the first admin with the password `1234`.
- It installs OpenCelium as a system service on Linux with systemd, and it prints the service files for macOS and Windows.
- It makes everything after the summary: the files, the MongoDB installation, the key file and the service. Then the application starts.
- It takes its values from a setup file for a run without a terminal.

LDAP, OIDC, the Service Portal issuer, the broker connection and the license are browser settings after the login, not wizard questions. The browser gets the setup state and the read-only bootstrap facts through 2 endpoints. A configuration is a configuration file at a search location, a Spring configuration location, or a bootstrap property in the arguments or the environment.

## Acceptance criteria
Each criterion has an ID and the form "Given ..., when ..., then ...".

### Entry and exit

- **SW-01** Given a terminal and no configuration, when the user runs `java -jar oc-app.jar`, then the wizard must start.
- **SW-02** Given no terminal and no configuration, when the application starts, then it must start with the defaults and no wizard.
- **SW-03** Given any state, when the user runs `java -jar oc-app.jar setup`, then the wizard must start.
- **SW-04** Given the flag `--batch` without `setup`, when the application starts, then the wizard must not start.
- **SW-05** Given a question, when the user types `q` or presses Ctrl+C, then the wizard must write nothing and say so. The wizard makes, downloads and starts nothing before the summary.
- **SW-06** Given the summary, when the user confirms, then the wizard must do these steps in this order:
  1. It writes the files together: the yml file, the env file and, with the generate option, the key file.
  2. It installs and starts MongoDB, with the download option or the Docker option.
  3. It writes the admin marker into the database.
  4. It installs the service, with the service option.
  5. It starts the application: the wizard process without the service, systemd with the service. Only 1 process starts it.
  6. It prints the login box when the port listens.
- **SW-46** Given a file at a target path, when the wizard writes the files, then it must keep the old file as `<name>.bak`.

### Input rules

- **SW-07** Given a question with a default in brackets, when the user presses Enter, then the wizard must use the default.
- **SW-08** Given a question on a terminal, when the user types a bad value, then the wizard must name the problem and ask again. On a terminal a bad value never stops the wizard.
- **SW-09** Given a yes/no question, when the user types `y`, `YES`, `n` or `No`, then the wizard must accept the answer.
- **SW-10** Given any question, when the user types `?`, then the wizard must print a help text and ask again.

### MongoDB

- **SW-11** Given no server on `localhost:27017` and no `mongod`, when the MongoDB step starts, then it must offer 4 options:
  1. Download MongoDB and run it locally.
  2. Start it with Docker Compose.
  3. Type the URI of a server that exists.
  4. Exit.
- **SW-12** Given a server on `localhost:27017`, when the MongoDB step starts, then its first and default option must be that server.
- **SW-13** Given the download option on Linux x86_64 or arm64, when the user confirms the summary, then the wizard must do these steps:
  1. It downloads MongoDB Community 8.x.
  2. It compares the SHA-256 checksum with the pinned value.
  3. It unpacks the tarball under the data directory.
  4. It starts `mongod` on `127.0.0.1` with authentication.
  5. It makes the database user `opencelium` with rights on the database `opencelium` only.
  6. It pings the server.
- **SW-14** Given a platform without a download, when the user selects the download, then the wizard must refuse and ask again.
- **SW-15** Given the download option, when the download is complete, then the wizard must print the SSPL license notice.
- **SW-16** Given the URI option, when the user types a URI, then the wizard must ping the server before it continues.
- **SW-17** Given a failed ping, when the wizard reports it, then it must name the cause and offer 3 options:
  1. Type the URI again.
  2. Continue.
  3. Back to the menu.
  The causes are those of the start ping, for example connection refused or authentication failed.
- **SW-18** Given a password in the URI, when the wizard writes the files, then the env file alone must hold it. The yml file gets the placeholder `${OC_MONGO_PASSWORD}`. Plain text in the yml file needs an extra confirmation and prints a warning. In batch mode the env file alone holds the password.

### Master key

- **SW-19** Given the master key step, when it starts, then it must offer 3 options:
  1. Generate a new key into the data directory.
  2. Use the environment variable `OC_MASTER_KEY`.
  3. Read a key file.
- **SW-20** Given the generate option, when the wizard writes the files, then it must write 32 random bytes with owner-only permissions. After the write it shows a backup warning box and asks "I have backed up the key [y/N]". The answer `N` prints the key path again and asks again. In batch mode the wizard prints the warning to standard error and continues.
- **SW-21** Given `OC_MASTER_KEY` not set, when the user selects the variable option, then the wizard must say so and ask again. The wizard does not continue without a key.
- **SW-22** Given a bad key file, when the user names it, then the wizard must say so and ask again. A bad file does not exist or does not decode to 32 bytes.
- **SW-23** Given a wrapped DEK and no key, when the key step starts, then the wizard must show restore-or-reset and stop. It does not offer to generate a new key.

### First admin account

- **SW-24** Given the admin step, when the user confirms the username, then the admin must get the password `1234`. The default username is `admin`. The wizard asks no password.
- **SW-25** Given the new admin, when a tester reads its record, then it must have no must-change flag and no lock. The admin can change the password in the browser at any time.
- **SW-42** Given the admin marker, when the application starts, then it must make the admin and set the setup state `REQUIRED`. The marker is the setup state `PENDING_ADMIN` with the username. Each process that starts the application does this: the wizard process or the service.
- **SW-43** Given a failed first start, when the application starts again, then it must find the marker and make the admin. A crash after the admin and before the state `REQUIRED` leaves the marker, and the next start sets `REQUIRED`.
- **SW-26** Given a generated secret, when the wizard is complete, then no log, journal or leftover temporary file must hold the value. The generated secrets are the database password and the key.

### Service registration

- **SW-27** Given Linux with systemd, when the user answers yes to the service question, then the wizard must offer 3 options:
  1. Run sudo now.
  2. Show the files and the commands.
  3. Skip.
  The service question is "Start OpenCelium automatically on boot?". It comes before the data directory question. With the sudo option or the show option, the data directory default is `/var/lib/opencelium`.
- **SW-28** Given the sudo option, when sudo is successful, then the sudo child must do these steps as root:
  1. It makes the system user `opencelium` and the data directory `/var/lib/opencelium`.
  2. It copies the jar to `/opt/opencelium`.
  3. It writes the yml file and the env file to `/etc/opencelium`, and the key file to the data directory.
  4. It gives the data directory and its content to the user `opencelium`.
  5. It installs and starts MongoDB, with the download option or the Docker option.
  6. With the download option, the `mongod` gets its own unit, which starts before OpenCelium.
  7. It writes the admin marker into the database.
  8. It writes the unit file, then runs `daemon-reload` and `enable --now`.
  9. The wizard process waits 60 seconds for the port, then prints the login box.
- **SW-44** Given the variable key option, when the child installs the service, then it must enable the service and not start it. The wizard prints the instruction to set `OC_MASTER_KEY`, the start command and the login box. The service generates no key.
- **SW-45** Given the service option, when the port does not listen after 60 seconds, then the wizard must say so. It names the `journalctl` command, leaves the unit in place and ends with exit code 1.
- **SW-29** Given the show option, when the user selects it, then the wizard must print the unit file and the commands.
- **SW-30** Given macOS or Windows, when the user wants the service, then the wizard must print the files and install nothing. The files are the launchd plist on macOS and the `sc.exe` commands on Windows.
- **SW-31** Given any state, when the user runs `java -jar oc-app.jar install-service`, then the service step must run alone.

### Handover to the browser

- **SW-32** Given a complete wizard, when the port listens, then the wizard process must print a terminal box. The box shows the URL `http://<host>:<port>/setup`, the username and the password `1234`. With the service, the wizard prints it, not the service.
- **SW-33** Given an incomplete setup, when an authenticated request reaches a blocked route, then the API must answer 409 `SETUP_REQUIRED`. The body lists the open steps. The setup, settings, authentication and own-password routes are not blocked.
- **SW-34** Given `GET /setup/status`, when an admin calls it, then it must return 4 items:
  1. The deployment mode.
  2. The setup state: `REQUIRED` or `COMPLETE`.
  3. The open steps.
  4. The read-only bootstrap facts: the MongoDB host without credentials, the key source, the data directory.
  The open steps are a fixed list in this feature. The browser wizard story defines when a step closes.
- **SW-35** Given an incomplete setup, when an admin calls `POST /setup/complete`, then the state must be `COMPLETE` and the 409 stops.
- **SW-36** Given an admin and no setup state, when the application starts, then the state must be `COMPLETE`. This is the upgrade path for an installation from before the wizard. The admin marker is a setup state, so a new installation never counts as an upgrade.
- **SW-37** Given an admin that exists, when the user runs `setup`, then the wizard must skip the admin step. It offers only the steps that still apply: the database URI and the service.

### Non-interactive install

- **SW-38** Given a complete setup file, when the user runs `setup --file setup-values.yml`, then the wizard must ask nothing. It makes the same files as an interactive run.
- **SW-39** Given a setup file without 1 value, when the wizard runs, then it must ask only that question. With `--batch` it stops instead, with exit code 1, and names the key and the file.
- **SW-40** Given a complete installation, when the user runs `setup --print-values`, then the wizard must print its setup file. The file reproduces the installation. A password is replaced by `generate` or by an env reference. The wizard reads `./config/` first, then `/etc/opencelium/`. When the user cannot read a file that exists, the wizard names the file and its owner.
- **SW-41** Given any state, when the user runs `setup --template`, then the wizard must print a template with each key. Each key has its help text and the default of this host.

## Out of scope
- The cloud mode. The wizard installs the self-host mode only. A cloud installation comes through the consulting service, which writes the yml file by hand.
- A generated admin password, a forced password change at the first login, and a lock of the admin account.
- The browser wizard screens: LDAP, OIDC, the Service Portal, the broker, the license, the password change. They are the frontend story. This feature gives the 2 endpoints and the list of setting keys.
- Native service registration on macOS and Windows. The print fallback only.
- The MongoDB download for macOS, Windows, or a CPU other than x86_64 and arm64. Those users select Docker or a server that exists.
- The installation of RabbitMQ from the wizard.
- Encryption of the database password in the yml file under the master key. The env file only.
- Upgrades and migrations of installations that exist: the upgrade story.
- Changes to the settings API, the setting registry or the secret storage internals: the configuration and secrets story.

## Decisions that apply
- Decision 13 of the architecture document: the wizard writes only the bootstrap values, into the yml file. All other settings are browser settings in the database.
- Decision 14: the master key step applies the key search order and the generation guard. It generates a key only in the self-host mode, and only when no wrapped DEK exists.
- Decision 10: the admin logs in through the local strategy with the normal login form. The wizard issues no setup token.
- Decision 11: the self-host mode is 1 static tenant. The admin and the setup state carry its tenant ID.
- Decision 7: the 2 setup endpoints need the admin role. The setup state is not a resource with an ACL.
- A new decision is necessary for a bootstrap secret: the yml file holds the placeholder `${OC_MONGO_PASSWORD}`, and an env file gives the value. This extends decision 13. The architect agent drafts it.
- A new decision is necessary for the handover from the wizard to the application: the admin marker in the setup state. It makes the admin in each process that starts the application, and it tells a new installation from an upgrade. The architect agent drafts it.

## Open questions
1. What is the SSPL notice text for the MongoDB download? Assumption until the answer comes: the wizard prints a placeholder and a link to the MongoDB license page (assumption).
2. Which MongoDB version does the wizard pin, and who updates the checksum for each release? Assumption until the answer comes: 8.0.x, updated with each OpenCelium release (assumption).
3. Is the admin username a question with the default `admin`, or is it fixed like the password? Assumption until the answer comes: a question (assumption).
4. Is the print flag of SW-40 still wanted, now that `setup --template` exists? Assumption until the answer comes: yes, it prints the values of the last run with the secrets replaced (assumption).
5. When does the frontend story for the browser wizard screens start? Assumption until the answer comes: after this feature; the endpoints do not wait for it (assumption).
6. What is the reason for the fixed password `1234` with no forced change? The product management decided it. The application listens on all interfaces, and the settings and login routes are open before the setup is complete. Assumption until the answer comes: the admin logs in right after the wizard, so the window is short (assumption).
7. Do the browser page `/setup` and the API `/setup/status` share a path, or does the API get a prefix? Assumption until the answer comes: the paths stay as written, and the API contract decision gives the prefix before the endpoint task starts (assumption).
8. What does a run with a setup file do when the MongoDB server of the file does not answer? Assumption until the answer comes: the setup stops with exit code 1 and names the key, as for a bad value (assumption).
