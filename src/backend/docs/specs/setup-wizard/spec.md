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
- It takes a bootstrap value from the environment when the environment gives one, and asks only the other questions.

LDAP, OIDC, the Service Portal issuer, the broker connection and the license are browser settings after the admin login, not wizard questions. The admin logs in at the admin login page `/login`. A configuration is a configuration file at a search location, a Spring configuration location, or a bootstrap property in the arguments or the environment.

A later start reads the env file next to the yml file. Thus the user starts OpenCelium with `java -jar oc-app.jar` and loads no file into the shell before the start.

A start without the wizard in the self-host mode makes the default admin when the database has no OpenCelium user. Thus a start without a terminal, for example in a Docker container, also gives an admin for the first admin login.

## Acceptance criteria
Each criterion has an ID and the form "Given ..., when ..., then ...".

### Entry and exit

- **SW-01** Given a terminal and no configuration, when the user runs `java -jar oc-app.jar`, then the wizard must start.
- **SW-02** Given no terminal and no configuration, when the application starts, then it must start with the defaults and no wizard.
- **SW-03** Given any state, when the user runs `java -jar oc-app.jar setup`, then the wizard must start.
- **SW-04** Given the flag `--batch` without `setup`, when the application starts, then the wizard must not start.
- **SW-05** Given a question, when the user types `q` or presses Ctrl+C, then the wizard must write nothing and say so. The wizard makes and starts nothing before the summary. At the database password question of SW-53, the wizard takes `q` as the database password, and only Ctrl+C cancels. The backup question of SW-20 comes after the write, and SW-20 gives its rule.
- **SW-06** Given the summary, when the user confirms, then the wizard must do these steps in this order:
  1. It writes the files together: the yml file and the env file. With the generate option, it then writes the key file and asks the backup question of SW-20.
  2. It writes the admin marker into the database.
  3. It installs the service, with the service option.
  4. It starts the application: the wizard process without the service, systemd with the service. Only 1 process starts it.
  5. It prints the admin login box when the port listens.

  The question of the summary is "Write the files?". The summary shows the start as the last action after the write.
- **SW-46** Given a file at a target path, when the wizard writes the files, then it must keep the old file as `<name>.bak`.

### Input rules

- **SW-07** Given a question with a default in brackets, when the user presses Enter, then the wizard must use the default.
- **SW-08** Given a question on a terminal, when the user types a bad value, then the wizard must name the problem and ask again. On a terminal, a bad value that the user types never stops the wizard.
- **SW-09** Given a yes/no question, when the user types `y`, `YES`, `n` or `No`, then the wizard must accept the answer.
- **SW-10** Given any question, when the user types `?`, then the wizard must print a help text and ask again. At the database password question of SW-53, the wizard takes `?` as the database password.
- **SW-62** Given a data directory with a control character of SW-61, when the user types it or the setup file gives it, then the wizard must reject it. The problem text names the code of the character, for example U+000A, and does not quote the path. Thus a help text that quotes the data directory gets no extra line.

### Screens

- **SW-58** Given a step, when it starts, then the wizard must show its number, the step count and its name. The title line has the form "Step <number> of <count>: <name>", and a line of `-` characters is under it. A step that does not apply shows its title line with "(skipped)" after its name. Thus the numbers have no gap, and each title line shows the same step count.
- **SW-59** Given a terminal that shows colors, when the wizard prints a result line, then the line must be green. A problem line is red. A result line starts with `OK`, and a problem line starts with `!`. The marks stay, so each line has the same meaning without color. The lines under a status line keep the default color of the terminal.
- **SW-60** Given 1 of these conditions, when the wizard prints a line, then the line must have no escape code:
  1. Standard input or standard output is not a terminal, for example a file or a pipe.
  2. The environment variable `NO_COLOR` has a value that is not empty.
  3. On Windows, the environment variable `WT_SESSION` has no value. Only Windows Terminal sets it.
  4. On each other platform, for example Linux or macOS, the environment variable `TERM` has no value or the value `dumb`.

  In each other case, the terminal shows colors.
- **SW-61** Given a control character in a text, when the wizard prints the text, then it must show a `?` for the character. The rule applies to the screens, to standard error and to the cause of a failed ping in the start error. The control characters are:
  1. The characters from U+0000 to U+001F, the character U+007F and the characters from U+0080 to U+009F.
  2. The bidi controls from U+202A to U+202E and from U+2066 to U+2069.

  A help text and a message on standard error keep the line breaks of the wizard. A line feed in a value that the wizard quotes shows as `?`, so a value cannot add a line. The wizard adds the escape codes of SW-59 after this replacement.

### MongoDB

- **SW-11** Given no server on `localhost:27017`, when the MongoDB step starts, then it must ask how OpenCelium connects to MongoDB and offer 3 options:
  1. Type the URI of a server that exists.
  2. Type the values of the URI one by one.
  3. Exit.
- **SW-12** Given a server on `localhost:27017`, when the MongoDB step starts, then its first and default option must be that server. The options of SW-11 follow. The wizard pings the local server before it continues.
- **SW-16** Given the URI option, when the user types a URI, then the wizard must ping the server before it continues. The help text shows an example URI with a database username, a database password and `authSource=admin`.
- **SW-17** Given a failed ping, when the wizard reports it, then it must name the cause and offer 3 options:
  1. Type the URI again.
  2. Continue.
  3. Back to the menu.
  The causes are those of the start ping, for example connection refused or authentication failed. With the values option, option 1 is "Type the values again". The last answers are then the defaults, except the database password. A MongoDB connection from the environment gets no options (SW-68).
- **SW-18** Given a MongoDB URI, when the wizard writes the files, then the env file must hold the whole URI. The variable is `OC_MONGO_URI`, and the yml file gets the placeholder `${OC_MONGO_URI}`. This applies to each option of the MongoDB step. A MongoDB connection from the environment is not in the env file (SW-69). The URI keeps its percent-encoding. A value of `OC_MONGO_URI` from the shell or from systemd must have the same form.
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

- **SW-19** Given the master key step, when it starts, then it must offer 2 options:
  1. Generate a new master key into the data directory.
  2. Read a key file.

  When the data directory holds `master.key`, option 1 is "Keep the master key in the data directory". The wizard then generates no master key and asks no backup question. A master key in a bad form, in `OC_MASTER_KEY` or in `master.key`, stops the wizard with exit code 1. When the environment gives `OC_MASTER_KEY` or `OPENCELIUM_MASTERKEYFILE`, the step shows no menu (SW-66).
- **SW-20** Given the generate option, when the wizard writes the files, then it must write 32 random bytes with owner-only permissions. After the write it shows a backup warning box and asks "I have backed up the master key [y/N]". The answer `N` prints the master key path again and asks again. In batch mode the wizard prints the warning to standard error and continues. The box and the warning tell facts 3 and 4 of SW-55 again. At this question, `q` rolls back the written files, as SW-05 says. Ctrl+C keeps the written files and starts nothing.
- **SW-22** Given a bad key file, when the user names it, then the wizard must say so and ask again. A bad file does not exist or does not decode to 32 bytes.
- **SW-23** Given a wrapped DEK and no master key, when the master key step starts, then the wizard must show restore-or-reset. It stops and does not offer to generate a new master key. When a wrapped DEK exists and a master key is found, the menu has no generate option. The keep option of SW-19 stays.
- **SW-55** Given the master key step, when it shows the first menu, then it must tell the purpose of the master key. The text comes before the options and tells these 4 facts:
  1. OpenCelium encrypts the credentials that it keeps, and the master key is the root key of this encryption.
  2. The master key stays outside the database, thus a copy of the database without the master key shows no credential.
  3. The user must keep a backup of the master key, but not in the same place as the database backup.
  4. Without the master key, OpenCelium cannot decrypt the credentials, and a new master key does not decrypt them.
- **SW-56** Given the master key menu, when the user types `?`, then the wizard must tell when to select each option:
  1. Generate: the user installs OpenCelium on 1 host and has no master key.
  2. Key file: the master key is in a file, for example a mounted secret.

  The help text of the key file option also tells these 3 facts:
  1. OpenCelium reads the file at this path at each start.
  2. With the service option, the system user `opencelium` must have read permission.
  3. The file must not be under `/tmp`, because the service does not see it, and a reboot can delete it.

  The help text also tells how to use `OC_MASTER_KEY`: set the variable before the setup, then run `setup` again (SW-66). It gives the command `openssl rand -base64 32` for the variable. The key file option gives it with `umask 077`, so that only the owner can read the new file.

### First admin account

- **SW-24** Given the admin step, when the user confirms the admin username, then the admin must get the admin password `1234`. The default admin username is `admin`. The wizard asks no admin password.
- **SW-25** Given the new admin, when a tester reads its record, then it must have no must-change flag and no lock. The admin can change the admin password in the browser at any time.
- **SW-42** Given the admin marker, when the application starts, then it must make the admin and delete the marker. The marker holds the admin username of the admin step. Each process that starts the application does this: the wizard process or the service.
- **SW-43** Given a failed first start, when the application starts again, then it must find the marker and make the admin. When a start stops after it makes the admin, the marker stays. The next start deletes the marker and makes no second admin.
- **SW-63** Given no admin marker and no OpenCelium user, when the application starts, then it must make the default admin. The default admin has the admin username `admin` and the admin password `1234` of SW-24. The log names the admin username and the admin login page `/login`, but not the admin password. A database with an OpenCelium user and no admin gets no default admin: the user runs `setup`, and the admin step makes the admin. In the cloud mode the start makes no default admin.
- **SW-64** Given a start, when a tester reads the log, then it must show no Spring Security password. The application makes no Spring Security user, so only an OpenCelium user can log in.
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
  6. It writes the unit file, then runs `daemon-reload` and `enable --now`. With SW-74, it runs `enable` only, and the wizard does not wait.
  Then the wizard process waits 60 seconds for the port and prints the admin login box.
- **SW-74** Given a value from the environment, when the child installs the service, then the child must only enable the service. It does not start the service, because the service does not get the environment of the wizard. Thus the service generates no master key at the installation. The wizard prints the variables for the service environment, the start command and the admin login box. With the show option, the printed commands also name each variable.
- **SW-57** Given the key file option, when the system user cannot read the key file, then the sudo child must stop. The child does this check after it makes the system user `opencelium` and before it writes a file. The message names the key file and tells how to give read permission to the system user. The wizard ends with exit code 1.
- **SW-45** Given the service option, when the port does not listen after 60 seconds, then the wizard must say so. It names the `journalctl` command, leaves the unit in place and ends with exit code 1.
- **SW-29** Given the show option, when the user selects it, then the wizard must print the unit file and the commands.
- **SW-30** Given macOS or Windows, when the user wants the service, then the wizard must print the files and install nothing. The files are the launchd plist on macOS and the `sc.exe` commands on Windows.
- **SW-31** Given any state, when the user runs `java -jar oc-app.jar install-service`, then the service step must run alone.

### Handover to the browser

- **SW-32** Given a complete wizard, when the port listens, then the wizard process must print a terminal box. The box shows the URL `http://<host>:<port>/login` of the admin login page, the admin username and the admin password `1234`. With the service, the wizard prints it, not the service. When the wizard skips the admin step (SW-37), the box shows the URL and says that an admin exists in the database. It then shows no admin username and no admin password, because the admin password can be different from `1234`.
- **SW-37** Given an admin that exists, when the user runs `setup`, then the wizard must skip the admin step. It offers only the steps that still apply: the MongoDB URI and the service.

### Non-interactive install

- **SW-38** Given a complete setup file, when the user runs `setup --file setup-values.yml`, then the wizard must ask nothing. It makes the same files as an interactive run. An env reference of SW-40 in the file takes its value from the environment of the process. A reference without a value stops the setup with exit code 1. The error names the setup file key, the file and the variable.
- **SW-39** Given a setup file without 1 value, when the wizard runs, then it must ask only that question. With `--batch` it stops instead, with exit code 1, and names the setup file key and the file.
- **SW-40** Given a complete installation, when the user runs `setup --print-values`, then the wizard must print its setup file. The file reproduces the installation. The wizard replaces the MongoDB URI with an env reference, because the URI holds the database password. The wizard reads `./config/` first, then `/etc/opencelium/` on Linux and macOS. When the user cannot read a file that exists, the wizard names the file and its owner.
- **SW-41** Given any state, when the user runs `setup --template`, then the wizard must print a template of the setup file. The template has each setup file key with its help text and the default of this host.

### Values from the environment

In this section, "the environment" means an environment variable, a system property or an argument of the command line. These variables are a configuration, so the wizard does not start by itself (SW-01): `SERVER_PORT` and each variable that starts with `SPRING_MONGODB_` or `OPENCELIUM_`. With them, the user runs `setup` (SW-03).

- **SW-65** Given a bootstrap value in the environment, when the wizard starts, then the first screen must name its variable. The wizard looks for these values:
  1. The data directory: `OPENCELIUM_DATADIR`.
  2. The port: `SERVER_PORT`.
  3. The MongoDB connection: each variable that starts with `SPRING_MONGODB_`, and `OC_MONGO_URI`.
  4. The key file: `OPENCELIUM_MASTERKEYFILE`.
  5. The master key: `OC_MASTER_KEY`.
  6. The deployment mode: `OPENCELIUM_DEPLOYMENTMODE`.

  A system property or an argument with the property name has the same effect, for example `-Dserver.port=8080` or `--server.port=8080`. The wizard uses the name rules of Spring Boot. When the environment has a `SPRING_MONGODB_` variable and `OC_MONGO_URI`, the wizard takes the `SPRING_MONGODB_` value. The yml file then has no MongoDB line (SW-69), so `OC_MONGO_URI` has no effect. The wizard reads the environment 1 time, at its start. Thus a variable that the user sets during the run has no effect on the run.
- **SW-66** Given a value from the environment, when its step starts, then the wizard must ask nothing and show the value. The line names the source, for example "Port: 8080 (from the environment: SERVER_PORT)". The MongoDB URI shows no database password (SW-26). The master key step shows no menu when the environment gives `OC_MASTER_KEY` or `OPENCELIUM_MASTERKEYFILE`. In batch mode, a value from the environment does not stop the wizard (SW-39).
- **SW-67** Given a bad value from the environment, when its step starts, then the wizard must stop with exit code 1. A value is bad when the same typed answer is bad or when the start does not accept it. For example, the start does not accept `OC_MASTER_KEY` together with `OPENCELIUM_MASTERKEYFILE`. The message names the source and tells the user to repair the value or to remove the variable. The message does not quote a master key or a database password. The wizard does not ask again, because the environment applies at each start.
- **SW-68** Given a MongoDB connection from the environment, when the ping fails, then the wizard must stop with exit code 1. The message names the variable and the cause of SW-17. The wizard offers no options, because the variable applies at each start.
- **SW-69** Given a value from the environment, when the wizard writes the files, then the files must not hold the value. The yml file has no line for it, and the env file has no entry for it. Thus the environment stays the only source of the value. With `OC_MONGO_URI`, the yml file keeps the placeholder of SW-18. With a `SPRING_MONGODB_` variable, the yml file has no MongoDB line.
- **SW-70** Given a value from the environment, when the summary starts, then it must tell the user to keep the variable. The line names each variable. Each later start must have the same variable, for example in the shell or in the environment of the service. A later start without the variable uses the default, not an answer of the wizard.
- **SW-71** Given a setup file key and a variable for 1 value, when they are different, then the wizard must stop. The exit code is 1. The message names the setup file key, the file and the variable, but not the value. Equal values do not stop the wizard. For the MongoDB step and the master key step, these rules apply:
  1. The setup file keys `mongo` and `mongo-uri` agree with a MongoDB variable when they give the same URI.
  2. The value `env` of the setup file key `master-key` agrees with `OC_MASTER_KEY`. Without the variable, `env` stops the wizard.
  3. The value `file:<path>` agrees with `OPENCELIUM_MASTERKEYFILE` when both name the same file.
- **SW-72** Given a MongoDB connection from the environment, when the wizard uses the database, then it must use that connection. The master key step, the admin step and the admin marker use the database. Thus the first start makes the admin in the database that it uses.
- **SW-73** Given a deployment mode other than `self-host` in the environment, when the wizard starts, then it must stop. The exit code is 1. The message names the variable and says that the wizard installs the self-host mode only.

## Out of scope
- The cloud mode. The wizard installs the self-host mode only. A cloud installation comes through the consulting service, which writes the yml file by hand.
- A generated admin password, a forced change of the admin password at the first admin login, and a lock of the admin account.
- The admin login page `/login` and the admin login API: the authentication story.
- The guide in the frontend after the first admin login: LDAP, OIDC, the Service Portal, the broker connection, the license and the change of the admin password. It is the frontend story.
- A setup state after the first start, and a block of the API until the admin completes the browser settings. The admin uses OpenCelium right after the first admin login.
- Native service registration on macOS and Windows. The print fallback only.
- The download, the installation and the start of MongoDB by the wizard. The user selects a local server or a server that exists.
- The installation of RabbitMQ from the wizard.
- Encryption of the database password in the yml file under the master key. The env file only.
- Upgrades and migrations of installations that exist: the upgrade story.
- Changes to the settings API, the setting registry or the secret storage internals: the configuration and secrets story.
- A warning at a later start when the environment gives a value that the yml file also gives.
- An environment variable for the admin username. The default admin of SW-63 has the admin username `admin`.

## Decisions that apply
- Decision 13 of the architecture document: the wizard writes only the bootstrap values, into the yml file and the env file next to it. All other settings are browser settings in the database.
- Decision 14: the master key step applies the master key search order and the generation guard. It generates a master key only in the self-host mode, and only when no wrapped DEK exists.
- Decision 10: the admin logs in through the local strategy with the normal admin login form. The wizard issues no setup token. In the cloud mode the Service Portal gives the OpenCelium users, thus the start makes no default admin.
- Decision 11: the self-host mode is 1 static tenant. The admin and the admin marker carry its tenant ID.
- Decision 7: the first admin gets its rights from RBAC. The admin marker is not a resource with an ACL.
- A new decision is necessary for a bootstrap secret. The yml file holds the placeholder `${OC_MONGO_URI}`, and an env file next to it gives the whole MongoDB URI. The start reads the env file, and the environment of the process has priority over it. A bootstrap value from the environment also has priority over the yml file, thus the wizard writes no copy of it. This extends decision 13. The architect agent drafts it.
- A new decision is necessary for the first admin of a self-host installation. The admin marker gives the admin username from the wizard to the first start. A start without a marker makes the default admin when the database has no OpenCelium user. Each process that starts the application does this. The architect agent drafts it.

## Open questions
1. Is the admin username a question with the default `admin`, or is it fixed like the admin password? Assumption until the answer comes: a question (assumption).
2. Is the print flag of SW-40 still wanted, now that `setup --template` exists? Assumption until the answer comes: yes, it prints the values of the last run with the secrets replaced (assumption).
3. What is the reason for the fixed admin password `1234` with no forced change? The product management decided it. The application listens on all interfaces, and a start without the wizard also makes the default admin with this admin password. Such a start shows no box: only a log line names the default admin. Assumption until the answer comes: the admin logs in right after the first start, so the window is short (assumption).
4. What does a run with a setup file do when the MongoDB server of the file does not answer? Assumption until the answer comes: the setup stops with exit code 1 and names the setup file key, as for a bad value (assumption).
5. What does the option "Continue" of SW-17 do when a later step uses the database? The master key step reads the database before the summary, and the admin marker writes into it after the summary. Assumption until the answer comes: the master key step reports the server, and the setup stops with exit code 1 before the summary (assumption).
6. Must the values option of SW-53 ask if the MongoDB connection uses TLS (Transport Layer Security)? Assumption until the answer comes: no. The built URI has no TLS option, and a server that must have TLS gets the URI option (assumption).
7. Which form has the admin username? SW-24 gives only the default `admin`. Assumption until the answer comes: a text without a space and without a control character (assumption).
