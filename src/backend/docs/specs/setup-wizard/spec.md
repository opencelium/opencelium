# Setup wizard

## User story
As a system administrator who installs OpenCelium for the first time, I want a terminal wizard that asks numbered questions, connects OpenCelium to MongoDB and writes the start-up configuration, so that I get an OpenCelium that operates without the documentation and without edits to the yml files by hand.

## Context
Without the wizard, a new user must write `application.yml` by hand, install MongoDB and give a master key before the first start. Section 6.4 of the architecture document (decisions 13 and 14) keeps the values that the application needs before the database in the yml file. The terminal wizard makes these files, does the host task that a browser page cannot do, and makes the first admin. The host task is the system service. A start without a terminal never sees the wizard: it uses the defaults and the fail-fast rules of section 4.1. In this document, the user is the person who runs the wizard.

## Scope
The wizard runs in the terminal and installs the self-host mode only. It does these things:

- It asks the service question, the data directory and the web port.
- It uses a local MongoDB server or connects to a server that exists. The user types the whole URI, or the values of the URI one by one. Then the wizard pings the server.
- It resolves the master key: a new master key in the data directory, the environment variable `OC_MASTER_KEY`, or a key file.
- It makes the first admin with the admin password `1234`.
- It installs OpenCelium as a system service on Linux with systemd, and it prints the service files for macOS and Windows.
- It makes everything after the summary: the files, the key file and the service. Then the application starts.
- It takes its values from a setup file for a run without a terminal.

LDAP, OIDC, the Service Portal issuer, the broker connection and the license are browser settings after the admin login, not wizard questions. The browser gets the setup state and the read-only bootstrap facts through 2 endpoints. A configuration is a configuration file at a search location, a Spring configuration location, or a bootstrap property in the arguments or the environment.

A later start reads the env file next to the yml file. Thus the user starts OpenCelium with `java -jar oc-app.jar` and loads no file into the shell before the start.

## Acceptance criteria
Each criterion has an ID and the form "Given ..., when ..., then ...".

### Entry and exit

- **SW-01** Given a terminal and no configuration, when the user runs `java -jar oc-app.jar`, then the wizard must start.
- **SW-02** Given no terminal and no configuration, when the application starts, then it must start with the defaults and no wizard.
- **SW-03** Given any state, when the user runs `java -jar oc-app.jar setup`, then the wizard must start.
- **SW-04** Given the flag `--batch` without `setup`, when the application starts, then the wizard must not start.
- **SW-05** Given a question, when the user types `q` or presses Ctrl+C, then the wizard must write nothing and say so. The wizard makes and starts nothing before the summary. At the database password question of SW-53, the wizard takes `q` as the database password, and only Ctrl+C cancels.
- **SW-06** Given the summary, when the user confirms, then the wizard must do these steps in this order:
  1. It writes the files together: the yml file, the env file and, with the generate option, the key file.
  2. It writes the admin marker into the database.
  3. It installs the service, with the service option.
  4. It starts the application: the wizard process without the service, systemd with the service. Only 1 process starts it.
  5. It prints the admin login box when the port listens.
- **SW-46** Given a file at a target path, when the wizard writes the files, then it must keep the old file as `<name>.bak`.

### Input rules

- **SW-07** Given a question with a default in brackets, when the user presses Enter, then the wizard must use the default.
- **SW-08** Given a question on a terminal, when the user types a bad value, then the wizard must name the problem and ask again. On a terminal a bad value never stops the wizard.
- **SW-09** Given a yes/no question, when the user types `y`, `YES`, `n` or `No`, then the wizard must accept the answer.
- **SW-10** Given any question, when the user types `?`, then the wizard must print a help text and ask again. At the database password question of SW-53, the wizard takes `?` as the database password.

### MongoDB

- **SW-11** Given no server on `localhost:27017`, when the MongoDB step starts, then it must offer 3 options:
  1. Type the URI of a server that exists.
  2. Type the values of the URI one by one.
  3. Exit.
- **SW-12** Given a server on `localhost:27017`, when the MongoDB step starts, then its first and default option must be that server. The options of SW-11 follow. The wizard pings the local server before it continues.
- **SW-16** Given the URI option, when the user types a URI, then the wizard must ping the server before it continues. The help text shows an example URI with a database username, a database password and `authSource=admin`.
- **SW-17** Given a failed ping, when the wizard reports it, then it must name the cause and offer 3 options:
  1. Type the URI again.
  2. Continue.
  3. Back to the menu.
  The causes are those of the start ping, for example connection refused or authentication failed. With the values option, option 1 is "Type the values again". The last answers are then the defaults, except the database password.
- **SW-18** Given a MongoDB URI, when the wizard writes the files, then the env file must hold the whole URI. The variable is `OC_MONGO_URI`, and the yml file gets the placeholder `${OC_MONGO_URI}`. This applies to each option of the MongoDB step. The URI keeps its percent-encoding. A value of `OC_MONGO_URI` from the shell or from systemd must have the same form.
- **SW-53** Given the values option, when the user selects it, then the wizard must ask 6 questions:
  1. The host: a host name or an IP address, without a port. An IPv6 address is in square brackets. The default is `localhost`.
  2. The port: a number from 1 to 65535. The default is `27017`.
  3. The database. Its name has only these characters: `A` to `Z`, `a` to `z`, `0` to `9`, `-` and `_`. The default is `opencelium`.
  4. The database username. An empty answer means no database login, and the wizard skips questions 5 and 6.
  5. The database password. The terminal does not show the typed characters. Each text that is not empty is the database password, also `q` and `?`. An empty answer asks again.
  6. The authentication database. Its name has the form of question 3. The default is `admin`.
  An answer that is not in the form of its question is a bad value (SW-08). The wizard builds the URI from the answers and pings it, as for the URI option. A setup file has no setup file key for these values: it gives the whole URI.
- **SW-54** Given special characters in the database login, when the wizard builds the URI, then the database login must succeed. The special characters are `@ : / ? # [ ] % $` and the space. The wizard writes them in percent-encoding.

### The env file at a later start

- **SW-48** Given an env file next to the yml file, when the application starts, then the env file values must apply. The user does not load the file into the shell before the start.
- **SW-49** Given a variable in the environment and the env file, when the application starts, then the environment value must apply. Thus a variable of the shell and the systemd `EnvironmentFile` keep their effect.
- **SW-50** Given a bad line in the env file, when the application starts, then it must stop with the line number. The message names the file and never shows a value. A good line has the form that the wizard writes. An env file that the application cannot read also stops the start.
- **SW-51** Given `OC_MASTER_KEY` in the env file, when the application starts, then it must stop and name the file. The master key and the database password are never in 1 file.
- **SW-52** Given a MongoDB URI placeholder without a value, when the application starts, then the error must name the variable. It also names the env file. When no env file is next to the yml file, the error says so.

### Master key

- **SW-19** Given the master key step, when it starts, then it must offer 3 options:
  1. Generate a new master key into the data directory.
  2. Use the environment variable `OC_MASTER_KEY`.
  3. Read a key file.
- **SW-20** Given the generate option, when the wizard writes the files, then it must write 32 random bytes with owner-only permissions. After the write it shows a backup warning box and asks "I have backed up the master key [y/N]". The answer `N` prints the master key path again and asks again. In batch mode the wizard prints the warning to standard error and continues.
- **SW-21** Given `OC_MASTER_KEY` not set, when the user selects the variable option, then the wizard must say so and ask again. The wizard does not continue without a master key.
- **SW-22** Given a bad key file, when the user names it, then the wizard must say so and ask again. A bad file does not exist or does not decode to 32 bytes.
- **SW-23** Given a wrapped DEK and no master key, when the master key step starts, then the wizard must show restore-or-reset. It stops and does not offer to generate a new master key.

### First admin account

- **SW-24** Given the admin step, when the user confirms the admin username, then the admin must get the admin password `1234`. The default admin username is `admin`. The wizard asks no admin password.
- **SW-25** Given the new admin, when a tester reads its record, then it must have no must-change flag and no lock. The admin can change the admin password in the browser at any time.
- **SW-42** Given the admin marker, when the application starts, then it must make the admin and set the setup state `REQUIRED`. The marker is the setup state `PENDING_ADMIN` with the admin username. Each process that starts the application does this: the wizard process or the service.
- **SW-43** Given a failed first start, when the application starts again, then it must find the marker and make the admin. A crash after the admin and before the state `REQUIRED` leaves the marker, and the next start sets `REQUIRED`.
- **SW-26** Given a secret, when the wizard is complete, then no log, journal or leftover temporary file must hold it. The secrets are the master key and the database password. The summary and each message mask the database password.

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
  4. It gives the data directory and its content to the system user `opencelium`.
  5. It writes the admin marker into the database.
  6. It writes the unit file, then runs `daemon-reload` and `enable --now`.
  Then the wizard process waits 60 seconds for the port and prints the admin login box.
- **SW-44** Given the master key variable option, when the child installs the service, then the child must only enable the service. It does not start the service. The wizard prints the instruction to set `OC_MASTER_KEY`, the start command and the admin login box. The service generates no master key.
- **SW-57** Given the key file option, when the system user cannot read the key file, then the sudo child must stop. The child does this check after it makes the system user `opencelium` and before it writes a file. The message names the key file and tells how to give read permission to the system user. The wizard ends with exit code 1.
- **SW-45** Given the service option, when the port does not listen after 60 seconds, then the wizard must say so. It names the `journalctl` command, leaves the unit in place and ends with exit code 1.
- **SW-29** Given the show option, when the user selects it, then the wizard must print the unit file and the commands.
- **SW-30** Given macOS or Windows, when the user wants the service, then the wizard must print the files and install nothing. The files are the launchd plist on macOS and the `sc.exe` commands on Windows.
- **SW-31** Given any state, when the user runs `java -jar oc-app.jar install-service`, then the service step must run alone.

### Handover to the browser

- **SW-32** Given a complete wizard, when the port listens, then the wizard process must print a terminal box. The box shows the URL `http://<host>:<port>/setup`, the admin username and the admin password `1234`. With the service, the wizard prints it, not the service.
- **SW-33** Given an incomplete setup, when an authenticated request reaches a blocked route, then the API must answer 409 `SETUP_REQUIRED`. The body lists the open steps. The setup, settings, authentication, own-password and health routes are not blocked.
- **SW-34** Given `GET /setup/status`, when an admin calls it, then it must return 4 items:
  1. The deployment mode.
  2. The setup state: `REQUIRED` or `COMPLETE`.
  3. The open steps.
  4. The read-only bootstrap facts: the MongoDB host and database without credentials, the master key source, the data directory.
  The open steps are a fixed list in this feature. The browser wizard story defines when a step closes.
- **SW-35** Given an incomplete setup, when an admin calls `POST /setup/complete`, then the state must be `COMPLETE` and the 409 stops.
- **SW-36** Given an admin and no setup state, when the application starts, then the state must be `COMPLETE`. This is the upgrade path for an installation from before the wizard. The admin marker is a setup state, so a new installation never counts as an upgrade.
- **SW-37** Given an admin that exists, when the user runs `setup`, then the wizard must skip the admin step. It offers only the steps that still apply: the MongoDB URI and the service.

### Non-interactive install

- **SW-38** Given a complete setup file, when the user runs `setup --file setup-values.yml`, then the wizard must ask nothing. It makes the same files as an interactive run. An env reference of SW-40 in the file takes its value from the environment of the process. A reference without a value stops the setup with exit code 1. The error names the setup file key, the file and the variable.
- **SW-39** Given a setup file without 1 value, when the wizard runs, then it must ask only that question. With `--batch` it stops instead, with exit code 1, and names the setup file key and the file.
- **SW-40** Given a complete installation, when the user runs `setup --print-values`, then the wizard must print its setup file. The file reproduces the installation. The wizard replaces the MongoDB URI with an env reference, because the URI holds the database password. The wizard reads `./config/` first, then `/etc/opencelium/` on Linux and macOS. When the user cannot read a file that exists, the wizard names the file and its owner.
- **SW-41** Given any state, when the user runs `setup --template`, then the wizard must print a template of the setup file. The template has each setup file key with its help text and the default of this host.

## Out of scope
- The cloud mode. The wizard installs the self-host mode only. A cloud installation comes through the consulting service, which writes the yml file by hand.
- A generated admin password, a forced change of the admin password at the first admin login, and a lock of the admin account.
- The browser wizard screens: LDAP, OIDC, the Service Portal, the broker, the license, the change of the admin password. They are the frontend story. This feature gives the 2 endpoints and the list of setting keys.
- Native service registration on macOS and Windows. The print fallback only.
- The download, the installation and the start of MongoDB by the wizard. The user selects a local server or a server that exists.
- The installation of RabbitMQ from the wizard.
- Encryption of the database password in the yml file under the master key. The env file only.
- Upgrades and migrations of installations that exist: the upgrade story.
- Changes to the settings API, the setting registry or the secret storage internals: the configuration and secrets story.

## Decisions that apply
- Decision 13 of the architecture document: the wizard writes only the bootstrap values, into the yml file and the env file next to it. All other settings are browser settings in the database.
- Decision 14: the master key step applies the master key search order and the generation guard. It generates a master key only in the self-host mode, and only when no wrapped DEK exists.
- Decision 10: the admin logs in through the local strategy with the normal admin login form. The wizard issues no setup token.
- Decision 11: the self-host mode is 1 static tenant. The admin and the setup state carry its tenant ID.
- Decision 7: the 2 setup endpoints need the admin role. The setup state is not a resource with an ACL.
- A new decision is necessary for a bootstrap secret. The yml file holds the placeholder `${OC_MONGO_URI}`, and an env file next to it gives the whole MongoDB URI. The start reads the env file, and the environment of the process has priority over it. This extends decision 13. The architect agent drafts it.
- A new decision is necessary for the handover from the wizard to the application: the admin marker in the setup state. It makes the admin in each process that starts the application, and it tells a new installation from an upgrade. The architect agent drafts it.

## Open questions
1. Is the admin username a question with the default `admin`, or is it fixed like the admin password? Assumption until the answer comes: a question (assumption).
2. Is the print flag of SW-40 still wanted, now that `setup --template` exists? Assumption until the answer comes: yes, it prints the values of the last run with the secrets replaced (assumption).
3. When does the frontend story for the browser wizard screens start? Assumption until the answer comes: after this feature; the endpoints do not wait for it (assumption).
4. What is the reason for the fixed admin password `1234` with no forced change? The product management decided it. The application listens on all interfaces, and the settings routes and the admin login routes are open before the setup is complete. Assumption until the answer comes: the admin logs in right after the wizard, so the window is short (assumption).
5. Do the browser page `/setup` and the API `/setup/status` share a path, or does the API get a prefix? Assumption until the answer comes: the paths stay as written, and the API contract decision gives the prefix before the endpoint task starts (assumption).
6. What does a run with a setup file do when the MongoDB server of the file does not answer? Assumption until the answer comes: the setup stops with exit code 1 and names the setup file key, as for a bad value (assumption).
7. What does the option "Continue" of SW-17 do when a later step uses the database? The master key step reads the database before the summary, and the admin marker writes into it after the summary. Assumption until the answer comes: the master key step reports the server, and the setup stops with exit code 1 before the summary (assumption).
8. Must the values option of SW-53 ask if the MongoDB connection uses TLS (Transport Layer Security)? Assumption until the answer comes: no. The built URI has no TLS option, and a server that must have TLS gets the URI option (assumption).
