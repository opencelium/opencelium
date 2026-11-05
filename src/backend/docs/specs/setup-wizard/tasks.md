# Setup wizard: the tasks

Each task is 1 pull request with 400 lines or less, without the tests.
The status line is the only status in this folder.
A task that changes the behaviour of a criterion changes spec.md in the same PR.

## Task 1: feat(core): bootstrap properties with defaults and fail-fast
- **Criteria:** SW-02
- **Function:** `opencelium.deployment-mode`, `opencelium.data-dir` and `opencelium.master-key-file` bind by hand, with the documented defaults and 1 `(default)` log line for each applied default. A bad value stops the start, and the error ends with `Property: <name>`.
- **Tests:** `OpenCeliumPropertiesTest`: absentModeIsSelfHosted, cloudModeIsParsed; `DefaultsEnvironmentPostProcessorTest`: emptyConfigurationGetsAllDocumentedDefaults, logsOneDefaultLinePerAppliedDefault; `BootstrapFailureAnalyzerTest`: descriptionEndsWithThePropertyName; `DataDirectoryTest`: directoryThatIsNotWritableStopsNamingTheProperty; `DataDirDefaultsTest`: macOsUsesDataNextToWorkingDirectory; `ZeroConfigStartupTest`; `CoreApplicationTest`
- **Hand test:** 1. Start the jar with an empty yml file and a local MongoDB. 2. The log shows `deployment-mode = self-host (default)` and the URI default line. 3. Set `opencelium.deployment-mode: saas` in the yml file and start again. 4. The last lines end with `Property: opencelium.deployment-mode`.
- **Size:** approximately 480 lines
- **Depends on:** nothing
- **Status:** done

## Task 2: feat(core): the MongoDB connection with the eager start ping
- **Criteria:** SW-02
- **Function:** The connection resolver reads `spring.mongodb.uri`, rejects the settings that Boot ignores, and the start pings the server with a 5 s timeout. A server that is not reachable stops the start with the help text with 3 options and `Property: spring.mongodb.uri`.
- **Tests:** `MongoConnectionTest`: redactedHidesThePassword; `StaticMongoConnectionResolverTest`: selfModeResolvesSelfAndSystemToTheConfiguredDatabase; `MongoClientFactoryTest`: databasesOnTheSameClusterShareOneClient; `MongoStartupPingTest`: reachableServerPassesAndLogsTheRoundTrip, refusedConnectionStopsWithinTheShortTimeout; `MongoConfigTest`: templateWritesAndReadsInTheConfiguredDatabase; `MongoStartupFailureTest`: unreachableMongoStopsStartupWithinTenSeconds; `TenantIdTest` (common)
- **Hand test:** 1. Stop the local MongoDB and start the jar. 2. The app stops in less than 10 seconds with the help text with 3 options. 3. Start MongoDB again: the log shows `ping ok`.
- **Size:** approximately 570 lines
- **Depends on:** 1
- **Status:** done

## Task 3: feat(core): the master key ladder, the generation guard and the canary
- **Criteria:** none; the foundation of SW-19 to SW-23
- **Function:** The start finds the root key in the order `OC_MASTER_KEY`, the key file, `<data-dir>/master.key`. It generates a key only when the `keys` collection is empty. A wrapped DEK without a key, or a wrong key, stops the start with the restore-or-reset text. In the cloud mode a start without a key stops and names `opencelium.master-key-file`.
- **Tests:** `RootKeyResolverTest`: resolveUsesTheEnvironmentVariableWhenOnlyItIsSet, resolveUsesTheDataDirFileWhenNothingElseIsSet; `RootKeyGeneratorTest`: generateCreatesTheFileReadableByItsOwnerOnly; `DekWrapperTest`: unwrapWithAnotherRootKeyThrowsWrongKeyException; `KeyStartupCanaryTest`: startPassesTheCanaryWhenTheDataKeyWasWrappedWithTheConfiguredKey; `RootKeyLoggingTest`: startupOutputShowsTheBackupWarningButNeverTheGeneratedKey; `RootKeyStartupFailureTest`: cloudModeWithoutAKeyStopsStartupAndGeneratesNothing; `RootKeyTest`: closeZeroesTheKeyAndMakesItUnusable
- **Hand test:** 1. Start the jar with a fresh data directory: the log shows the backup box, and `./data/master.key` has `-rw-------`. 2. Insert a fake document into `opencelium.keys`, delete the key file and start again. 3. The app shows the restore-or-reset text and makes no new key file.
- **Size:** approximately 730 lines
- **Depends on:** 2
- **Status:** done

## Task 4: feat(core): users, the password hash and the first-admin command
- **Criteria:** none; the foundation of SW-24 and SW-25
- **Function:** The user service makes the first admin with a BCrypt hash and never plain text. It refuses a second admin for the tenant and zeroes the password after the hash. A unique index on the tenant and the username exists at the start.
- **Tests:** `UserServiceTest`: createAdminStoresABcryptHashThatMatchesThePassword, createAdminNeverStoresThePasswordInPlainText; `CreateAdminCommandTest`: toStringMasksThePassword; `UserIndexesTest`: startupCreatesAUniqueIndexOnTenantAndUsername; `GeneratedPasswordsTest`: nextReturns20Characters; `GeneratedPasswordLockJobTest`: jobLocksAGeneratedPasswordAfter25HoursAndLogsTheUsername
- **Hand test:** 1. Run `./gradlew :core:test --tests "io.opencelium.core.user.*"` with a local MongoDB. 2. All tests pass, and the `users` collection of the test database holds a `{bcrypt}` hash.
- **Size:** approximately 350 lines
- **Depends on:** 2
- **Status:** done

## Task 5: feat(core): decide between setup wizard and normal start
- **Criteria:** SW-01, SW-02, SW-03, SW-04
- **Function:** `main()` decides first between the wizard and the normal start, with the rules of the plan. `setup` runs the wizard on demand, `--help` prints the usage, and an unknown command is a usage error with exit code 2.
- **Tests:** `SetupLauncherTest`: decideReturnsWizardWhenNothingIsConfigured, decideReturnsBootWhenNoTerminalIsPresent, decideReturnsBootWhenBootstrapPropertyIsInEnvironment, decideReturnsBootWhenConfigFileExists, launchReturnsExitCodeTwoAndPrintsUsageWhenCommandIsUnknown; `LaunchArgumentsTest`: parseThrowsUsageErrorWhenCommandIsUnknown, parseKeepsSpringArgumentsInOrderAndStripsTheWizardOnes; `ConfigLocationsTest`: findPrefersConfigDirectoryOverWorkingDirectory, findAcceptsAllThreeFileNames
- **Hand test:** 1. In an empty directory, run `java -jar oc-app.jar < /dev/null`: the normal start, no wizard. 2. Run `OPENCELIUM_DEPLOYMENTMODE=self-host java -jar oc-app.jar`: the normal start. 3. Run `java -jar oc-app.jar nonsense`: "Unknown command", the usage text, exit code 2.
- **Size:** approximately 490 lines
- **Depends on:** 1
- **Status:** done

## Task 6: feat(core): setup wizard asks the deployment mode
- **Criteria:** SW-05, SW-07, SW-08, SW-09, SW-10
- **Function:** The prompter turns keystrokes into answers: Enter takes the default, a bad value is explained and asked again, and `?` prints the help. `q`, the end of the input or Ctrl+C cancel with "Setup cancelled. Nothing was written." The mode question of this PR was removed again by task 7, because the wizard installs the self-host mode only.
- **Tests:** `ConsolePrompterTest`: choiceReturnsDefaultWhenInputIsEmpty, choiceAsksAgainWhenNumberIsOutOfRange, choicePrintsHelpWhenInputIsQuestionMark, choiceThrowsSetupCancelledWhenInputIsQ, yesNoAcceptsYesAndNoInAnyCaseAndLength; `WizardTest`: runAsksStepsInDeclaredOrder, runPrintsNothingWrittenAndStopsWhenStepCancels, runPrintsBannerBeforeFirstQuestion
- **Hand test:** 1. Run `java -jar oc-app.jar setup`: the banner and the first question. 2. Type `?`: the help text, then the question again. 3. Start again and type `q`: "Setup cancelled. Nothing was written.", exit code 0. 4. Start again and press Ctrl+C: the same message, exit code 130.
- **Size:** approximately 420 lines
- **Depends on:** 5
- **Status:** done

## Task 7: feat(core): wizard asks data dir and port, shows summary
- **Criteria:** SW-07, SW-08
- **Function:** After the banner the wizard asks the data directory and the web port. Then it prints the summary with the mode, the data directory and the port. The mode question is removed: the mode is the fixed value `self-host`.
- **Tests:** `DataDirStepTest`: runStoresDefaultWhenInputIsEmpty, runAsksAgainWhenPathIsAFile, runMakesNoDirectory; `PortStepTest`: runAsksAgainWhenPortIsInUse, runAsksAgainWhenPortIsOutOfRange; `SummaryStepTest`: runPrintsModeDataDirectoryAndPortInABox
- **Hand test:** 1. Run `java -jar oc-app.jar setup`, Enter twice: the summary shows `self-host`, the default data directory and 9090. 2. `ls` shows no `config` and no `data`. 3. Type `/etc/hosts` at the data directory: the error says that it is a file. 4. Start `python3 -m http.server 9090`, run the setup, Enter at the port: "Port 9090 is in use."
- **Size:** approximately 300 lines
- **Depends on:** 6
- **Status:** done

## Task 8: feat(core): wizard writes config files and starts the app
- **Criteria:** SW-06
- **Function:** The summary names the 2 files and asks "Write the files and start OpenCelium? [Y/n]". Yes writes `./config/application.yml` (0640) and `./config/opencelium.env` (0600) atomically, with a rollback on each failure. Then Spring starts on them, and each later start reads them and asks nothing.
- **Tests:** `FilePlanWriterTest`: writeMakesAllFilesWhenPlanIsValid, writeSetsGroupReadableYmlAndOwnerOnlyEnvFile, writeRollsBackEarlierFilesWhenLaterFileFails, writeThrowsSetupWriteExceptionNamingFailedPath; `YmlRendererTest`: renderBindsToOpenCeliumPropertiesWhenLoadedByBoot, renderWritesNoMongoUri; `EnvRendererTest`: renderWritesKeyEqualsValueForEachLine; `SummaryStepTest`: runAddsYmlAndEnvToPlanWhenConfirmed, runThrowsSetupCancelledWhenDeclined; `WizardTest`: runWritesPlanThenStartsWhenSummaryIsConfirmed; `WrittenConfigStartupTest`: applicationStartsOnTheWrittenFiles
- **Hand test:** 1. In a fresh directory with a local MongoDB, run the jar, Enter at each question, `Y`. 2. `ls -l config` shows the 2 files with their permissions, and the application starts. 3. Start again: no questions. 4. `rm -r config && mkdir config && chmod 500 config`, start, confirm: the error names `config/application.yml`, exit code 1. 5. Run `chmod 700 config` afterwards.
- **Size:** approximately 550 lines
- **Depends on:** 7
- **Status:** done

## Task 9: feat(core): draw the setup screens with plain characters
- **Criteria:** none
- **Function:** A question is its label padded to 1 column with the default in brackets. The status lines carry `!`, `OK` or `->`, and the summary is a box drawn with `-`, `|` and `+`. Every screen is ASCII only, so it looks the same on each terminal and font.
- **Tests:** `ConsolePrompterTest`: textPadsAShortLabelToTheLabelColumn, statusLinesStartWithTheirMarkAndIndentTheContinuation, everyScreenUsesPlainCharactersOnly; `ScreenTest`: boxGrowsWithTheLongestRow, listIndentsTheItemsUnderTheTitleWithBullets
- **Hand test:** 1. Run the jar, then Enter, Enter, `?`, `n`. 2. The banner, 2 aligned questions, the Summary box, the Files list and the help text appear. 3. The last line is "Setup cancelled. Nothing was written." 4. Run `LC_ALL=C java -jar oc-app.jar` and type `q`: the same screens, character for character.
- **Size:** approximately 210 lines
- **Depends on:** 8
- **Status:** done

## Task 10: feat(core): wizard takes its answers from a file
- **Criteria:** SW-38, SW-39
- **Function:** `setup --file <path>` reads `data-dir` and `port` from `key: value` lines. It checks each value like a typed answer, prints it with "(from the setup file)" and does not ask it. An absent value is asked on a terminal. In batch mode, or without a terminal, it stops the setup with exit code 1 and names the key and the file.
- **Tests:** `SetupFileTest`: loadReadsBothKeys, loadKeepsValuesAsWrittenWithoutYamlTypes, loadThrowsNamingKeyWhenKeyIsUnknown, loadThrowsNamingKeyWhenKeyIsDuplicated; `ValueSourceTest`: textTakesFileValueAndPrintsItWithoutAsking, textThrowsMissingValueWhenBatchAndAbsent; `WizardSetupFileTest`: runMakesIdenticalFilesForSetupFileAndScriptedRun, runAsksOnlyTheAbsentQuestion, runStopsNamingTheKeyWhenBatchValueIsAbsent
- **Hand test:** 1. Write `setup-values.yml` with `data-dir: ./data` and `port: 9090`. 2. Run `java -jar oc-app.jar setup --file setup-values.yml`: 2 "(from the setup file)" lines, the summary, the files, the start. 3. Remove `port` and run again: only the port question. 4. Run the complete file with `< /dev/null`: no question, the files, the start.
- **Size:** approximately 360 lines
- **Depends on:** 9
- **Status:** done

## Task 11: feat(core): setup file template, --batch, one error stream
- **Criteria:** SW-04, SW-39, SW-41
- **Function:** `setup --template` prints a setup file with each key, its help text and the defaults of this machine. The template loads back to the same values. The flag `--batch` replaces `--non-interactive`, and the help text describes each flag. Each failure that ends the setup goes to standard error with exit code 1 or 2.
- **Tests:** `SetupFileTemplateTest`: renderWritesOneBlockPerQuestionWithTheHelpAsCommentsAndTheDefault, renderedTemplateLoadsBackToItsDefaults; `SetupLauncherTest`: decideReturnsTemplateWhenSetupTemplateIsGiven, launchPrintsTheTemplateWithThisHostsDefaultsAndExitsZero, launchPrintsAMissingValueOnStandardErrorLikeEveryOtherFailure, decideReturnsBootWhenBatchFlagIsGivenWithoutSetup; `LaunchArgumentsTest`: parseReadsTemplateFlag, parseReadsBatchFlag
- **Hand test:** 1. Run `java -jar oc-app.jar setup --template > setup-values.yml`, then `java -jar oc-app.jar setup -f setup-values.yml --batch`: no question, the files, the start. 2. Remove the `port` line and run `java -jar oc-app.jar setup -f setup-values.yml --batch 2>errors.log; echo $?`: exit code 1, and `errors.log` holds the message about the absent value.
- **Size:** approximately 370 lines
- **Depends on:** 10
- **Status:** done

## Task 12: feat(core): setup wizard asks the MongoDB URI and pings the server
- **Criteria:** SW-12, SW-16, SW-17, SW-18
- **Function:** The MongoDB step detects a server on `localhost:27017` and offers it first. Else it asks the URI, pings with the start ping of core, and offers the retry menu with the causes of the start. The password goes to the env file, the yml file gets the URI with the placeholder, and the driver prints nothing over the dialogue.
- **Tests:** `MongoDetectorTest`: detectFindsLocalServerWhenPortListens, detectFindsNothingWhenPortIsClosed; `UriSplitterTest`: splitMovesPasswordToEnvFileAndLeavesPlaceholder, splitKeepsUriWithoutPasswordUnchanged; `MongoStepTest` (local MongoDB, no Spring context): runOffersLocalServerFirstWhenPortListens, runPingsBeforeItContinuesWhenUriIsTyped, runNamesAuthenticationFailureWhenCredentialsAreWrong, runOffersRetryMenuWhenPortIsClosed, runWarnsAndAsksAgainBeforePlainTextInYml; `YmlRendererTest`: renderWritesMongoUriWithPlaceholder
- **Hand test:** 1. With the local MongoDB, run `java -jar oc-app.jar setup`: the MongoDB step offers the local server first and as the default. 2. Select the URI option and type `mongodb://oc:secret@localhost:1/opencelium`: "connection refused" and the retry menu. 3. Type a correct URI with a password and confirm: the env file holds `OC_MONGO_PASSWORD`, the yml file the placeholder. 4. The application starts on the written files, with no driver DEBUG line over the dialogue.
- **Size:** approximately 300 lines
- **Depends on:** 11
- **Status:** open

## Task 13: feat(core): setup wizard downloads MongoDB and checks the checksum
- **Criteria:** SW-14, SW-15
- **Function:** The download option gets the pinned MongoDB Community tarball for Linux x86_64 or arm64 with a progress bar. It compares the SHA-256, unpacks the tarball under the data directory and prints the SSPL notice placeholder. On another platform the option says "not available" and shows the menu again; the local run comes with task 14.
- **Tests:** `MongoDownloaderTest` (a local HTTP server): downloadStoresFileWhenChecksumMatches, downloadThrowsNamingChecksumWhenChecksumDiffers, downloadResumesWithRangeWhenRetried; `MongoStepTest`: runRefusesDownloadWhenPlatformHasNone, runPrintsLicenseNoticeWhenDownloadIsComplete; `MongoVersionsTest`: versionsHaveUrlAndChecksumForEachPlatformKey
- **Hand test:** 1. On a Mac, select the download option: "not available", then the menu again. 2. On Ubuntu 24.04, select it: the progress bar, "checksum verified", the tarball under `<data-dir>/mongodb`, the SSPL notice.
- **Size:** approximately 250 lines
- **Depends on:** 12
- **Status:** open

## Task 14: feat(core): setup wizard runs the downloaded mongod with authentication
- **Criteria:** SW-13
- **Function:** After the unpack, the wizard writes `mongod.conf` and starts `mongod` on `127.0.0.1` with authentication. It makes the user `opencelium` with rights on the database `opencelium` only, and it pings with that user. The generated password goes to the env file.
- **Tests:** `MongodConfigRendererTest`: renderBindsLoopbackOnly, renderEnablesAuthorization, renderUsesDataAndLogDirectoriesUnderDataDir; `LocalMongodInstallerTest` (a fake command runner): installStartsWithoutAuthThenMakesScopedUserThenRestartsWithAuth, installPutsGeneratedPasswordIntoEnvFile
- **Hand test:** 1. On Ubuntu 24.04, select the download option and confirm. 2. `mongod` listens on `127.0.0.1:27017` only, and `mongosh -u opencelium` logs in with the env file password. 3. The application starts on the written files.
- **Size:** approximately 250 lines
- **Depends on:** 13
- **Status:** open

## Task 15: feat(core): setup wizard starts MongoDB with Docker Compose
- **Criteria:** SW-11
- **Function:** The Docker option writes `quickstart/docker-compose.yml` and `.env` with a generated password, runs `docker compose up -d` and waits for the ping. The menu now has its 4 options, and the detector hides the Docker option when Docker is absent.
- **Tests:** `DockerComposeInstallerTest` (a fake command runner): installWritesComposeFileAndEnvFile, installRunsComposeUpThenPings; `MongoStepTest`: runOffersFourOptionsWhenNoServerAndNoMongod, runHidesDockerOptionWhenDockerIsAbsent
- **Hand test:** 1. On a host with Docker and no local MongoDB, run the setup: the menu shows 4 options. 2. Select Docker Compose: `docker compose ps` shows the container, and the ping passes. 3. The application starts on the written files.
- **Size:** approximately 150 lines
- **Depends on:** 12
- **Status:** open

## Task 16: feat(core): setup wizard asks the master key
- **Criteria:** SW-19, SW-20, SW-21, SW-22, SW-23
- **Function:** The master key step runs the guard first and stops with the restore-or-reset text when a wrapped DEK exists without a key. Then it offers generate, the variable `OC_MASTER_KEY` and a key file. Generate writes the key with owner-only permissions and asks for the backup confirmation. A bad source is explained and asked again. With the variable option the step writes nothing and prints the instruction for the service environment.
- **Tests:** `MasterKeyStepTest`: runOffersThreeOptions, runWritesOwnerOnlyKeyAndAsksBackupConfirmationWhenGenerateIsChosen, runAsksAgainWhenVariableIsNotSet, runPrintsInstructionAndWritesNothingWhenVariableIsSet, runAsksAgainWhenFileIsMissing, runAsksAgainWhenFileIsNot32Bytes, runWritesMasterKeyFilePropertyWhenFileIsChosen; `MasterKeyGuardTest` (local MongoDB, no Spring context): runStopsWithRestoreOrResetWhenDekExistsAndNoKeyResolves, runContinuesWhenDekExistsAndKeyResolves
- **Hand test:** 1. Run the setup and select generate: the backup box, "I have backed up the key [y/N]", `master.key` with `-rw-------`. 2. Run `setup` again and select the variable with `OC_MASTER_KEY` unset: "not set", then the question again. 3. Insert a fake document into `opencelium.keys`, delete the key file, run `setup`: restore-or-reset, no new key.
- **Size:** approximately 250 lines
- **Depends on:** 12
- **Status:** open

## Task 17: feat(core): setup wizard makes the first admin after the start
- **Criteria:** SW-24, SW-25, SW-26, SW-32, SW-37
- **Function:** The admin step asks the username with the default `admin` and skips itself when an admin exists. After Spring starts, the completion runner makes the admin with the password `1234` and no must-change flag. It prints the box with the URL, the username and the password. A generated secret never reaches a logger.
- **Tests:** `AdminStepTest`: runStoresDefaultUsernameWhenInputIsEmpty, runSkipsWhenAdminExists; `AdminLookupTest` (local MongoDB, no Spring context): existsReturnsTrueWhenAdminIsStored, existsReturnsFalseWhenNoAdminIsStored; `SetupCompletionRunnerTest` (local MongoDB): runMakesAdminWithFixedPasswordAndNoMustChangeFlag, runPrintsBoxWithUrlUsernameAndPassword, runWritesNoSecretToLoggerOutput, runMakesNoSecondAdminWhenOneExists; `UserServiceTest`: createAdminStoresNoLockAndNoMustChangeFlagWhenPasswordIsTyped
- **Hand test:** 1. Run the setup to the end: the box shows `http://localhost:9090/setup`, `admin` and `1234`. 2. In `mongosh`, the user document has `mustChangePassword: false` and no lock. 3. Run `setup` again: the wizard skips the admin step. 4. Search the log files for the env file password: nothing.
- **Size:** approximately 250 lines
- **Depends on:** 16
- **Status:** open

## Task 18: feat(core): the setup state and the setup endpoints
- **Criteria:** SW-34, SW-35, SW-36
- **Function:** The wizard writes the setup state as `REQUIRED`, and `GET /setup/status` returns the mode, the state, the open steps and the bootstrap facts without credentials. `POST /setup/complete` sets `COMPLETE`; an admin without a state document is an upgrade and counts as complete.
- **Tests:** `SetupStateServiceTest` (local MongoDB): stateIsRequiredWhenWizardWroteIt, stateIsCompleteWhenAdminExistsWithoutDocument, completeWritesCompletionTime; `SetupControllerTest` (full application, MockMvc): statusReturnsFourItemsForAdmin, statusNeverContainsCredentialsWhenUriHasPassword, statusReturns403WhenUserIsNotAdmin, completeSetsStateToComplete
- **Hand test:** 1. After the wizard, call `GET /setup/status` as the admin: `REQUIRED`, the open steps, the host without the password. 2. Call `POST /setup/complete`, then the status again: `COMPLETE`.
- **Size:** approximately 250 lines
- **Depends on:** 17
- **Status:** open

## Task 19: feat(core): block the API with 409 until the setup is complete
- **Criteria:** SW-33
- **Function:** A filter after the authentication answers 409 `SETUP_REQUIRED` with the open steps for each route outside the allow-list when the state is `REQUIRED`. The setup, settings, authentication, own-password and health routes stay open.
- **Tests:** `SetupRequiredFilterTest` (full application, MockMvc): blockedRouteReturns409WhenSetupIsRequired, blockedRouteReturns200AfterComplete, setupRoutesAreNotBlockedWhenSetupIsRequired, bodyListsOpenSteps
- **Hand test:** 1. After the wizard, call `GET /setup/status`: 200; call a route outside the allow-list: 409 with `SETUP_REQUIRED`. 2. Call `POST /setup/complete`, then the same route: no 409.
- **Size:** approximately 150 lines
- **Depends on:** 18
- **Status:** open

## Task 20: feat(core): the service step prints the unit file, the plist or the sc commands
- **Criteria:** SW-29, SW-30
- **Function:** The service step asks "Start OpenCelium automatically on boot?" and detects the host. On macOS and Windows it prints the launchd plist or the `sc.exe` commands. On Linux the show option prints the unit file and the commands, and the skip option prints the reminder for a start by hand. The sudo option comes with task 21.
- **Tests:** `UnitFileRendererTest`: renderMatchesTheSystemdUnitSnapshot, renderMatchesTheLaunchdPlistSnapshot, renderMatchesTheScCommandsSnapshot; `HostDetectorTest`: detectReturnsSystemdWhenRunSystemdExists, detectReturnsLaunchdOnMacOs, detectReturnsNoneOtherwise; `ServiceStepTest`: runPrintsPlistWhenHostIsMacOs, runPrintsUnitFileAndCommandsWhenShowIsChosen, runPrintsReminderWhenSkipIsChosen
- **Hand test:** 1. On a Mac, answer yes to the service question: the plist and the `launchctl` commands print, nothing is installed. 2. On Ubuntu, select "show": the unit file and the `systemctl` commands print. 3. Install the printed plist by hand: the application starts at the login.
- **Size:** approximately 300 lines
- **Depends on:** 11
- **Status:** open

## Task 21: feat(core): the service step installs the systemd service under sudo
- **Criteria:** SW-27, SW-28, SW-31
- **Function:** On Linux with systemd the sudo option serializes the plan and runs `install-service --plan <file>` under sudo. The child makes the user `opencelium`, copies the jar and writes the files with their owners. Then it writes the unit file, runs `daemon-reload` and `enable --now`, and waits for the port. The `mongod` of the local installation gets its own unit before `opencelium.service`, and `install-service` runs the step alone.
- **Tests:** `SystemdHostServicesTest` (a fake command runner): installRunsCommandsInOrder, installWritesFilesWithOwnersAndPermissions, installMongoServiceOrdersItBeforeOpencelium; `SudoReexecTest`: reexecSerializesPlanToOwnerOnlyFileAndRunsSudoCommand, childAppliesPlanAndDeletesFile; `SetupLauncherTest`: decideRunsServiceStepAloneWhenInstallServiceIsGiven
- **Hand test:** 1. On Ubuntu 24.04, select "run sudo now": the sudo password prompt, then "files written, service started". 2. `systemctl status opencelium` is active, and the application answers after a reboot. 3. On Debian 12, run `java -jar oc-app.jar install-service`: the service step alone.
- **Size:** approximately 350 lines
- **Depends on:** 20, 14
- **Status:** open

## Task 22: feat(core): setup --print-values reproduces the last installation
- **Criteria:** SW-40
- **Function:** `setup --print-values` reads the written yml file and env file and prints the setup file that reproduces the installation. A password is printed as `generate` or as an env reference.
- **Tests:** `PrintValuesTest`: printReproducesValuesOfWrittenFiles, printReplacesPasswordWithGenerateOrEnvReference; `SetupLauncherTest`: decideReturnsPrintValuesWhenSetupPrintValuesIsGiven, decideThrowsUsageErrorWhenPrintValuesIsGivenWithoutSetup
- **Hand test:** 1. After an interactive run, run `java -jar oc-app.jar setup --print-values > again.yml`. 2. In a fresh directory, run `setup --file again.yml --batch`: the same files, without the password in the yml file.
- **Size:** approximately 120 lines
- **Depends on:** 17
- **Status:** open

## Task 23: docs(core): the first-start guide, the sample files and the end-to-end setup test
- **Criteria:** SW-38, SW-26
- **Function:** The README section "First start", the sample `application.yml` and the quickstart `docker-compose.yml` exist. A full-application test runs a batch installation from a setup file and starts the application. It calls `GET /setup/status` and finds no secret in the log files or in a dump of the test database.
- **Tests:** `BatchInstallationTest` (full application, local MongoDB): batchRunWritesFilesAndStartsApplication, statusAgreesWithSetupFile, logFilesAndDatabaseDumpHoldNoGeneratedSecret
- **Hand test:** 1. Run the VM matrix of the plan: Ubuntu 24.04, Debian 12, Docker Compose and macOS. 2. Record the results in `docs/setup-wizard-test-matrix.md`. 3. A new user follows the README section on a fresh host and reaches `/setup`.
- **Size:** approximately 150 lines
- **Depends on:** 22
- **Status:** open

## Task 24: docs: record the setup wizard decisions in the architecture document
- **Criteria:** none
- **Function:** Section 7 gets 2 records from the architect agent: the first admin instead of a setup token, and the env file for the database password. Section 6.4 gets the exception for the 2 secrets outside the database, and section 4.1 names the wizard before the start. Section 3.4 gets rows for the setup blocks, and its Users row loses the generated password and the lock. Section 6.8 gets the exception for the tests of code that runs before Spring.
- **Tests:** none; a documentation change
- **Hand test:** 1. Read sections 3.4, 4.1, 6.4, 6.8 and 7: the 2 records exist, and the placement table names the env file. 2. Search the architecture document for a status marker, a date or a ticket number: nothing.
- **Size:** approximately 80 lines
- **Depends on:** 21
- **Status:** open
