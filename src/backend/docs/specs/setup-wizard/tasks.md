# Setup wizard: the tasks

Each task is 1 pull request. The size rule of a task is in CONTRIBUTING.md, section 5.3.
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
- **Tests:** `MongoDetectorTest`: detectFindsLocalServerWhenPortListens, detectFindsNothingWhenPortIsClosed; `UriSplitterTest`: splitMovesPasswordToEnvFileAndLeavesPlaceholder, splitKeepsUriWithoutPasswordUnchanged; `MongoStepTest` (local MongoDB, no Spring context): runOffersLocalServerFirstWhenPortListens, runPingsBeforeItContinuesWhenUriIsTyped, runNamesAuthenticationFailureWhenCredentialsAreWrong, runOffersRetryMenuWhenPortIsClosed, runWarnsAndAsksAgainBeforePlainTextInYml, runPutsPasswordInEnvFileWithoutAQuestionInBatchMode; `YmlRendererTest`: renderWritesMongoUriWithPlaceholder
- **Hand test:** 1. With the local MongoDB, run `java -jar oc-app.jar setup`: the MongoDB step offers the local server first and as the default. 2. Select the URI option and type `mongodb://oc:secret@localhost:1/opencelium`: "connection refused" and the retry menu. 3. Type a correct URI with a password and confirm: the env file holds `OC_MONGO_PASSWORD`, the yml file the placeholder. 4. The application starts on the written files, with no driver DEBUG line over the dialogue.
- **Size:** approximately 300 lines
- **Depends on:** 11
- **Status:** done

## Task 13: feat(core): setup wizard starts MongoDB with Docker Compose
- **Criteria:** SW-11
- **Function:** The Docker option adds `quickstart/docker-compose.yml` and `.env` with a generated password to the plan. After the summary the plan runs `docker compose up -d` and waits for the ping. The menu now has its 3 options, and the detector hides the Docker option when Docker is absent.
- **Tests:** `DockerComposeInstallerTest` (a fake command runner): installWritesComposeFileAndEnvFile, installRunsComposeUpThenPings; `MongoStepTest`: runOffersThreeOptionsWhenNoServer, runHidesDockerOptionWhenDockerIsAbsent
- **Hand test:** 1. On a host with Docker and no local MongoDB, run the setup: the menu shows 3 options. 2. Select Docker Compose: `docker compose ps` shows the container, and the ping passes. 3. The application starts on the written files.
- **Size:** approximately 150 lines
- **Depends on:** 12
- **Status:** done

## Task 13a: feat(core): show the download progress of the MongoDB image
- **Criteria:** SW-47
- **Function:** Before `docker compose up -d`, the installer runs `docker compose --progress json pull --policy missing` and reads each JSON event while the command runs. The wizard shows 1 progress bar with the downloaded MB and the total MB: in 1 line on a terminal, and without a terminal as 1 line when the progress passes a quarter for the first time; the last line shows the end state. An error event stops the run with the cause from Docker. A pull without JSON events shows no bar, and `up -d` downloads the image.
- **Tests:** `PullProgressTest`: acceptAddsTheBytesOfEachLayerWhenLayersDownload, acceptCountsALayerAsCompleteWhenItsDownloadIsComplete, acceptKeepsTheDockerMessageWhenAnErrorEventArrives, acceptReplacesControlCharactersWhenTheErrorMessageHasThem, acceptIgnoresALineWhenItIsNoJson; `ConsolePrompterTest`: meterDrawsTheBarAgainInOneLineWhenConsoleIsATerminal, meterPrintsOneLineAtEachQuarterWhenConsoleIsNoTerminal, meterPrintsNothingWhenTheTotalStaysZero, meterEndsWithTheEndStateWhenTheTotalGrowsAfterTheLastLine, everyScreenUsesPlainCharactersOnly; `DockerComposeInstallerTest`: installShowsTheProgressBarWhenComposePullsTheImage, installShowsNoBarWhenTheHostHasTheImage, installStopsWithTheCauseFromDockerWhenThePullFails, installStartsWithoutABarWhenThePullGivesNoJson; `ProcessCommandRunnerTest`: runGivesEachLineWhileTheProgramRuns; `CommandRunnerTest`: runGivesTheOutputLinesAfterTheEndWhenTheRunnerOnlyAnswers
- **Hand test:** 1. Run `docker image rm mongo:8`, then the setup, and select Docker Compose. 2. The bar shows the MB and reaches 100 %; then the ping passes. 3. Run `docker compose -p opencelium down -v`, delete `config` and `quickstart`, and run the setup again: no bar. 4. Repeat step 1 with `setup -f setup-values.yml --batch > setup.log`: the log has at most 1 progress line for each quarter, and the last shows 100 %. A second 100 % line after a 100 % line with a small total shows that the large layer gave its size late.
- **Size:** approximately 220 lines
- **Depends on:** 13
- **Status:** done

## Task 13b: feat(core): read the env file at a later start
- **Criteria:** SW-48, SW-49, SW-50, SW-51, SW-52
- **Function:** After the setup, `java -jar oc-app.jar` and the service read the env file of the wizard, with no shell command before the start. A problem in the env file stops the start.
- **Tests:** `EnvFileReaderTest`: readGivesTheEntriesWhenALineIsKeyEqualsValue, readKeepsTheEscapedCharactersWhenAValueIsQuoted, readSkipsCommentsAndEmptyLines, readStopsWithTheLineNumberWhenALineHasExport, readStopsWithTheLineNumberWhenALineHasNoEqualsSign, readNeverShowsTheValueWhenALineIsBad, readStopsNamingTheFileWhenItHoldsTheMasterKey, readStopsWithTheLineNumberWhenALineEndsWithACarriageReturn, readStopsNamingTheFileWhenTheFileCannotBeRead; `EnvRendererTest`: renderGivesTheSameEntriesWhenTheReaderReadsTheFile; `EnvFileEnvironmentPostProcessorTest`: postProcessAddsTheEntriesWhenAnEnvFileIsNextToTheConfiguration, postProcessAddsNothingWhenNoEnvFileExists, postProcessKeepsTheEnvironmentValueWhenTheFileHasTheSameVariable, postProcessSetsServerPortWhenTheFileHasServerPort, postProcessReadsTheEnvFileOfTheWorkingDirectoryWhenNoLocationIsSet, postProcessPrefersTheAdditionalLocationWhenTheWorkingDirectoryAlsoHasAConfiguration, postProcessPrefersTheAdditionalLocationWhenSpringConfigLocationIsAlsoSet, postProcessReadsTheEnvFileNextToTheNamedFileWhenSpringConfigLocationIsSet, postProcessReadsTheEnvFileOfTheNamedDirectoryWhenSpringConfigLocationIsADirectory, postProcessReadsTheEnvFileNextToApplicationPropertiesWhenTheDirectoryHasNoYml, postProcessReadsNothingNextToAnImportedFileWhenNoLocationHasAConfiguration; `ConfigLocationsTest`: findIgnoresTheSystemDirectoryWhenTheHostIsWindows, findReturnsTheSystemFileWhenTheHostIsLinuxOrMacOs; `SetupLauncherTest`: decideGivesTheSystemDirectoryToBootWhenNoTerminalIsAttached, decideGivesTheSystemDirectoryToBootWhenBatchOrABootstrapVariableIsSet, decideGivesNoSystemDirectoryWhenTheWorkingDirectoryHasAConfiguration, decideGivesNoSystemDirectoryWhenASpringConfigLocationIsSet; `StaticMongoConnectionResolverTest`: fromNamesTheEnvFileWhenThePasswordHasNoValue, fromSaysNoEnvFileExistsWhenThereIsNone; `EnvFileStartupTest`: applicationStartsWhenThePlaceholderValueIsOnlyInTheEnvFile, applicationStartsWhenTheMongoUriIsOnlyInTheEnvFile, applicationStopsNamingTheLineWhenTheEnvFileHasABadLine
- **Hand test:** 1. After a setup with Docker Compose, open a new shell and run `java -jar oc-app.jar`: the application starts. 2. Run `OC_MONGO_PASSWORD=wrong java -jar oc-app.jar`: "authentication failed". 3. Add `export X=1` to the env file and start: the error names the file and the line, no value. 4. Replace that line with `OC_MASTER_KEY=x` and start: the error names the file. 5. Remove that line and rename the env file. 6. Start: the error names `OC_MONGO_PASSWORD` and says that no env file exists.
- **Size:** approximately 320 lines
- **Depends on:** 12
- **Status:** done

## Task 13c: feat(core): remove the Docker Compose option from the setup wizard
- **Criteria:** SW-06, SW-11, SW-12 (task 13e adds the values option and writes their final tests), SW-16
- **Function:** The MongoDB menu has no Docker Compose option, and the wizard starts no MongoDB. A setup file with `mongo: docker` stops the setup with a bad value. The help text of the URI shows an example with a database username, a database password and `authSource=admin`.
- **Tests:** `MongoStepTest`: runOffersUriAndExitWhenNoServerListens, runStopsNamingTheKeyWhenTheFileSaysDocker, runShowsAnExampleWithAuthSourceWhenTheUserTypesAQuestionMark; `MongoDetectorTest`: localServerListensReturnsTrueWhenPortAcceptsAConnection, localServerListensReturnsFalseWhenPortIsClosed. Removed with their code: `DockerComposeInstallerTest`, `PullProgressTest`, `CommandRunnerTest.runGivesTheOutputLinesAfterTheEndWhenTheRunnerOnlyAnswers`, the meter cases of `ConsolePrompterTest`, `ProcessCommandRunnerTest.runGivesEachLineWhileTheProgramRuns` and `runRemovesTheNamedVariablesWhenItStartsTheProgram`, `ConfigLocationsTest.quickstartDirectoryIsNextToTheConfigDirectoryUnderTheWorkingDirectory`, and the Docker cases of `MongoStepTest` and `MongoDetectorTest`
- **Hand test:** 1. Stop each MongoDB on `localhost:27017`, then run `java -jar oc-app.jar setup` in an empty folder. 2. The MongoDB menu shows "Server URI" and "Exit" only. 3. Start a MongoDB on `localhost:27017` and run the setup again: "Local server" is first and the default. 4. Run `java -jar oc-app.jar setup --template`: the help of `mongo` names `local` and `uri` only. 5. Run a setup file with `mongo: docker` and `--batch`: "Bad value: mongo", exit code 1. 6. After a complete run, the folder has no `quickstart` directory, and `docker ps` shows no new container. 7. At the URI question, type `?`: the example URI has `authSource=admin`.
- **Size:** 789 lines, 729 of them deleted: above 700 lines, the reviewer decides. The Docker option, its installer and its progress bar go in 1 PR, because the bar and the line output of the command runner have no other user. The command runner stays for tasks 19 and 20.
- **Depends on:** 13a
- **Status:** done

## Task 13d: feat(core): setup wizard keeps the whole MongoDB URI in the env file
- **Criteria:** SW-18, SW-26, SW-52
- **Function:** After the setup, the env file holds the whole MongoDB URI, and the yml file holds only its placeholder. The setup asks no question about the place of the database password. A bad `mongo` value of the setup file appears in the error message with the database password masked.
- **Tests:** `MongoStepTest`: runKeepsTheWholeUriAndAsksNothingWhenTheTypedUriHasADatabasePassword, runKeepsTheWholeUriWhenTheFileGivesItInBatchMode, runMasksTheDatabasePasswordWhenTheFileGivesAUriAsTheServer; `SummaryStepTest`: runPutsTheWholeUriIntoTheEnvFileAndItsPlaceholderIntoTheYmlFile; `YmlRendererTest`: renderWritesTheUriPlaceholder; `EnvRendererTest`: renderQuotesTheUriWhenItHasOptions; `StaticMongoConnectionResolverTest`: fromNamesTheVariableWhenTheWholeUriPlaceholderHasNoValue; `EnvFileStartupTest`: applicationStartsWhenTheYmlHoldsOnlyTheUriPlaceholder. Changed for the new form: `MongoStepTest`: runOffersRetryMenuWhenPortIsClosed, runPingsBeforeItContinuesWhenUriIsTyped; `YmlRendererTest`: renderWritesBlockStyleWithTwoSpaceIndent; `SetupLauncherTest`: launchPassesTheEntriesOfTheEnvFileToTheStart, launchRunsWizardThenBootsOnTheWrittenFilesWhenConfirmed, launchWritesTheFilesWithoutATerminalWhenSetupFileIsComplete; `WrittenConfigStartupTest`: applicationStartsOnTheWrittenFiles, with the local server. Removed with their code: `UriSplitterTest` and the cases of `MongoStepTest` for the move question and the plain text in the yml file
- **Hand test:** 1. Run `java -jar oc-app.jar setup`, select "Server URI" and type a URI with a database login. 2. Confirm the summary: `config/application.yml` has `uri: ${OC_MONGO_URI}`. 3. `config/opencelium.env` has `OC_MONGO_URI` with the whole URI in double quotes. 4. In the env file, change the database username to a second database user, then start the jar. 5. The application starts with the second database user. 6. Run `setup --batch` with a setup file whose `mongo` value is a URI with a database password. 7. The message "Bad value: mongo" shows `****` in place of the database password.
- **Size:** approximately 85 lines, most of them deleted
- **Depends on:** 13c
- **Status:** done

## Task 13e: feat(core): setup wizard asks the MongoDB values one by one
- **Criteria:** SW-05, SW-08, SW-10, SW-11, SW-12, SW-17, SW-53, SW-54
- **Function:** The MongoDB menu offers the values option. The wizard asks the parts of the URI one by one and examines each answer at its question. Then it builds the URI and pings it.
- **Tests:** `MongoStepTest`: runOffersUriValuesAndExitWhenNoServerListens, runOffersTheLocalServerFirstWhenAServerListens, runAsksTheSixValuesWhenTheValuesOptionIsChosen, runSkipsThePasswordAndTheAuthSourceWhenTheDatabaseUsernameIsEmpty, runAsksAgainWhenTheDatabasePasswordIsEmpty, runTakesQAndQuestionMarkAsTheDatabasePassword, runShowsTheHelpOfAValueWhenTheUserTypesAQuestionMark, runAsksTheHostAgainWhenTheAnswerIsNoHostNameOrIpAddress, runAsksThePortAgainWhenTheAnswerIsNoNumberFrom1To65535, runAsksADatabaseNameAgainWhenTheAnswerHasAnotherCharacter, runOffersTypeTheValuesAgainWithTheLastAnswersWhenThePingFails, runAsksTheValuesWithTheirDefaultsAgainWhenTheUserComesBackFromTheMenu; `UriBuilderTest`: buildEncodesEachSpecialCharacterAndTheSpace, buildKeepsThePlusSign, buildGivesAUriThatTheStartAcceptsWhenTheDatabasePasswordHasAPlaceholderForm, buildLeavesOutTheLoginAndTheAuthSourceWhenNoDatabaseUsernameIsGiven; `UriBuilderPingTest` (local MongoDB, no Spring context): pingSucceedsWhenTheDatabasePasswordHasEachSpecialCharacter; `ConsolePrompterTest`: secretAsksAgainWhenTheAnswerIsEmpty, secretTakesQAsTextWhenTheAnswerIsQ, secretKeepsTheSpacesAroundTheAnswer, secretThrowsSetupCancelledWhenInputEnds. Changed for the new form: `MongoStepTest`: runPingsBeforeItContinuesWhenUriIsTyped, runShowsTheMenuAgainWhenBackIsChosen. Renamed in `MongoStepTest`: runOffersLocalServerFirstWhenPortListens to runOffersTheLocalServerFirstWhenAServerListens, runOffersUriAndExitWhenNoServerListens to runOffersUriValuesAndExitWhenNoServerListens
- **Hand test:** 1. Start `mongod --auth --port 27018`, and make the database user `root` in `admin` with the password `p@ss+w rd`. 2. Run `java -jar oc-app.jar setup` and select the values option. 3. Type `localhost:27018` at the host question: the wizard names the problem and asks the host again. 4. Type `localhost`, `27018`, Enter, `root`, the database password and Enter. 5. The database password does not show, and the ping passes. 6. Confirm the summary: the env file has `root:p%40ss+w%20rd` and `authSource=admin` in the URI. 7. Start the jar again: the application starts.
- **Size:** approximately 280 lines
- **Depends on:** 13d
- **Status:** done

## Task 13f: fix(core): the MongoDB menu asks how OpenCelium connects to MongoDB
- **Criteria:** SW-11, SW-12, SW-17
- **Function:** The MongoDB menu asks how OpenCelium connects to MongoDB. Each option names a way to give the MongoDB connection, because the URI option and the values option can name the same server.
- **Tests:** Changed for the new texts: `MongoStepTest`: runOffersTheLocalServerFirstWhenAServerListens, runOffersUriValuesAndExitWhenNoServerListens, runPingsBeforeItContinuesWhenUriIsTyped, runShowsTheMenuAgainWhenBackIsChosen, runAsksTheSixValuesWhenTheValuesOptionIsChosen, runAsksTheValuesWithTheirDefaultsAgainWhenTheUserComesBackFromTheMenu
- **Hand test:** 1. Start a MongoDB on `localhost:27017`, then run `java -jar oc-app.jar setup`. 2. The MongoDB step asks "How do you want to connect OpenCelium to MongoDB?". 3. The options are "Local MongoDB", "MongoDB URI", "Step by step" and "Exit". 4. Select "MongoDB URI" and type `mongodb://localhost:1/opencelium`: the ping fails. 5. The retry menu shows "Back to the menu" with "choose another option". 6. Run `java -jar oc-app.jar setup --template`: the help of `mongo` starts with "How OpenCelium connects to MongoDB".
- **Size:** approximately 40 lines
- **Depends on:** 13e
- **Status:** done

## Task 14: feat(core): setup wizard asks the master key
- **Criteria:** SW-05, SW-06, SW-19, SW-20, SW-21, SW-22, SW-23, SW-55, SW-56
- **Function:** Before the menu, the master key step runs the guard (SW-23) and tells the purpose of the master key (SW-55). The menu offers generate or keep, the variable `OC_MASTER_KEY` and a key file, each with its help text (SW-19, SW-56). Generate adds an action to the file plan that writes the key file after the other files and then asks the backup question (SW-05, SW-06, SW-20). The variable and the key file follow SW-21 and SW-22.
- **Tests:** New: `MasterKeyStepTest`: runOffersThreeOptions, runTellsThePurposeOfTheMasterKeyBeforeTheOptions, runPrintsWhenToSelectEachOptionWhenUserTypesQuestionMark, runWritesAnOwnerOnlyKeyFileAfterTheWriteWhenGenerateIsChosen, runAsksBackupConfirmationAfterTheWrite, runPrintsPathAgainAndAsksAgainWhenAnswerIsNo, runBackupBoxTellsBackupPlaceAndLossOfCredentials, runStopsWithoutReplacingAKeyThatAppearsBeforeTheWrite, runRemovesTheNewKeyAndTheDirectoryItMadeWhenThePlanRollsBack, runCancelsTheSetupWhenTheBackupQuestionIsCancelled, runPrintsWarningToStandardErrorAndContinuesInBatchMode, runKeepsTheMasterKeyAndPlansNothingWhenDataDirHoldsOne, runKeepsTheMasterKeyWhenTheSetupFileSaysGenerateAndDataDirHoldsOne, runStopsNamingTheFileWhenTheDataDirKeyIsNotAMasterKey, runTakesTheVariableWhenTheDatabaseHoldsDataKeysAndItIsSet, runKeepsTheMasterKeyWhenTheDatabaseHoldsDataKeysAndDataDirHoldsOne, runStopsInBatchModeWhenTheFileSaysGenerateAndTheVariableIsSet, runKeepsTheMasterKeyInBatchModeWhenDataKeysAndDataDirKeyExist, runAsksAgainWhenVariableIsNotSet, runStopsWithoutQuotingTheValueWhenTheVariableIsNotAMasterKey, runTakesTheVariableWithoutTheMenuWhenItIsSet, runAsksAgainWhenFileIsMissing, runAsksAgainWhenFileIsNot32Bytes, runWritesMasterKeyFilePropertyWhenFileIsChosen, runWritesAbsoluteKeyFilePathWhenPathIsRelative, runExpandsTheHomeDirectoryWhenTheKeyFilePathStartsWithTilde, runTakesTheKeyFileFromTheSetupFile, runStopsInBatchModeWhenTheFileNamesAKeyFileAndTheVariableIsSet, runStopsInBatchModeWhenTheVariableIsNotSet, runStopsWithoutQuotingTheValueWhenTheSetupFileWordIsUnknown, runStopsWithoutTheMenuWhenTheGuardStops, questionsGiveTheTemplateThePurposeAndTheWords; `MasterKeyGuardTest` (local MongoDB, no Spring context): runStopsWithRestoreOrResetWhenDekExistsAndNoKeyResolves, runReportsDataKeysWhenDekExistsAndKeyResolves, runReportsDataKeysWhenDekExistsAndTheVariableHoldsTheKey, runReportsNoDataKeysWhenNoDekExists, runStopsWithTheProblemWhenTheVariableIsNotAMasterKey, runStopsNamingTheServerWhenNoDatabaseAnswers; `RootKeyResolverTest`: probeFindsTheDataDirFileAndChangesNothing, probePrefersTheEnvironmentVariableOverTheDataDirFile, probeIsEmptyAndGeneratesNoFileWhenNoSourceHasAKey, probeStopsWithoutQuotingTheValueWhenTheEnvironmentKeyIsNotBase64, textProblemIsEmptyForTheBase64Of32Bytes, textProblemNamesTheLengthWithoutQuotingTheValueWhenItIsNot32Bytes, fileProblemIsEmptyForAFileWithTheBase64Of32Bytes, fileProblemSaysThatTheFileDoesNotExist, fileProblemSaysThatAFileIsNotBase64WithoutQuotingIt; `FilePlanWriterTest`: writeUndoesTheActionsAndRollsBackTheFilesThenRethrowsWhenAnActionIsCancelled; `WizardTest`: runPrintsNothingWrittenAndRemovesTheFilesWhenAnActionIsCancelled, runCountsTheFilesAsWrittenWhileAnActionRuns; `SummaryStepTest`: runShowsWhereTheMasterKeyComesFrom, runPutsTheKeyFileIntoApplicationYml. Changed for the new step: `WizardTest`: standardStepsAskTheDataDirectoryThePortMongoDbAndTheMasterKeyThenShowTheSummary; `WrittenConfigStartupTest`: applicationStartsOnTheWrittenFiles; `SetupFileTest`: loadThrowsNamingKeyWhenKeyIsUnknown
- **Hand test:** 1. Run the setup: the purpose text of the master key shows before the options. 2. Type `?`: each option tells when to select it. 3. Select generate and type `q` at the summary: no `master.key`. 4. Run again, select generate and confirm the summary: `master.key` with `-rw-------`, the backup box, the question. 5. Press Enter: the path again and the question again; type `y`: the start. 6. Run `setup` again and select the variable with `OC_MASTER_KEY` unset: "not set", then the question again. 7. Run `setup` again with the same data directory: option 1 keeps the master key, and `master.key` does not change. 8. Select the key file and type a relative path to a good key file: `application.yml` holds the absolute path. 9. Insert a fake document into `opencelium.keys`, delete the key file, run `setup`: restore-or-reset, no new key. Delete the document again. 10. Run `setup` with a new data directory, select generate, confirm, and type `q` at the backup question: "Nothing was written", no `master.key`.
- **Size:** approximately 760 lines: above 700 lines, and the reviewer keeps it as 1 PR. Reason: the guard, the additions to the keys package and the action that writes the key file have no caller without the step, so plan.md names no seam that gives 2 hand-testable PRs.
- **Depends on:** 12
- **Status:** done

## Task 15: feat(core): setup wizard makes the first admin after the start
- **Criteria:** SW-24, SW-25, SW-26, SW-32, SW-37, SW-42, SW-43, SW-46
- **Function:** The admin step asks the username with the default `admin` and skips itself when an admin exists. After the file write, the plan writes the admin marker (the setup state `PENDING_ADMIN` with the username) into the database. After Spring starts, the completion runner finds the marker, makes the admin with the password `1234` and no must-change flag, and sets the state `REQUIRED`; a failed start keeps the marker. The wizard process prints the box with the URL, the username and the password when the port listens. A file at a target path stays as `<name>.bak`. A secret never reaches a logger.
- **Tests:** `AdminStepTest`: runStoresDefaultUsernameWhenInputIsEmpty, runSkipsWhenAdminExists; `AdminLookupTest` (local MongoDB, no Spring context): existsReturnsTrueWhenAdminIsStored, existsReturnsFalseWhenNoAdminIsStored; `AdminMarkerTest` (local MongoDB, no Spring context): writeStoresStatePendingAdminWithUsername; `SetupCompletionRunnerTest` (local MongoDB): runMakesAdminFromMarkerWithFixedPasswordAndNoMustChangeFlag, runSetsStateRequiredAfterTheAdmin, runOnlySetsRequiredWhenAdminExistsAndMarkerRemains, runDoesNothingWhenNoMarkerExists, runWritesNoSecretToLoggerOutput; `FailedFirstStartTest` (full application): markerStaysWhenStartFailsAfterTheMarker; `WizardTest`: runPrintsBoxWithUrlUsernameAndPasswordWhenPortListens; `FilePlanWriterTest`: writeKeepsOldFileAsBak; `UserServiceTest`: createAdminStoresNoLockAndNoMustChangeFlagWhenPasswordIsTyped
- **Hand test:** 1. Run the setup to the end: the box shows `http://localhost:9090/setup`, `admin` and `1234`. 2. In `mongosh`, the user document has `mustChangePassword: false` and no lock, and `setup_state` is `REQUIRED`. 3. Run `setup` again: the wizard skips the admin step, and `config/application.yml.bak` exists. 4. Search the log files for the env file password: nothing. 5. In `mongosh`, delete the user document and set the state to `PENDING_ADMIN`; start the jar: the admin exists again, and the state is `REQUIRED`.
- **Size:** approximately 350 lines
- **Depends on:** 14
- **Status:** open

## Task 16: feat(core): the setup state and the setup endpoints
- **Criteria:** SW-34, SW-35, SW-36
- **Function:** The setup state service reads the state that task 15 writes, and `GET /setup/status` returns the mode, the state, the open steps and the bootstrap facts without credentials. `POST /setup/complete` sets `COMPLETE`. An admin without a state document is an upgrade and counts as complete; a document with `PENDING_ADMIN` never counts as an upgrade. The open steps are a fixed list in this feature.
- **Tests:** `SetupStateServiceTest` (local MongoDB): stateIsRequiredWhenWizardWroteIt, stateIsCompleteWhenAdminExistsWithoutDocument, stateIsNotAnUpgradeWhenDocumentHoldsTheMarker, completeWritesCompletionTime; `SetupControllerTest` (full application, MockMvc): statusReturnsFourItemsForAdmin, statusNeverContainsCredentialsWhenUriHasPassword, statusReturns403WhenUserIsNotAdmin, completeSetsStateToComplete
- **Hand test:** 1. After the wizard, call `GET /setup/status` as the admin: `REQUIRED`, the open steps, the host without the password. 2. Call `POST /setup/complete`, then the status again: `COMPLETE`.
- **Size:** approximately 250 lines
- **Depends on:** 15
- **Status:** open

## Task 17: feat(core): block the API with 409 until the setup is complete
- **Criteria:** SW-33
- **Function:** A filter after the authentication answers 409 `SETUP_REQUIRED` with the open steps for each route outside the allow-list when the state is `REQUIRED`. The setup, settings, authentication, own-password and health routes stay open.
- **Tests:** `SetupRequiredFilterTest` (full application, MockMvc): blockedRouteReturns409WhenSetupIsRequired, blockedRouteReturns200AfterComplete, setupRoutesAreNotBlockedWhenSetupIsRequired, bodyListsOpenSteps
- **Hand test:** 1. After the wizard, call `GET /setup/status`: 200; call a route outside the allow-list: 409 with `SETUP_REQUIRED`. 2. Call `POST /setup/complete`, then the same route: no 409.
- **Size:** approximately 150 lines
- **Depends on:** 16
- **Status:** open

## Task 18: feat(core): the service step prints the unit file, the plist or the sc commands
- **Criteria:** SW-27, SW-29, SW-30
- **Function:** The service step runs first, before the data directory, asks "Start OpenCelium automatically on boot?" and detects the host. With the sudo option or the show option, the data directory default becomes `/var/lib/opencelium`. On macOS and Windows it prints the launchd plist or the `sc.exe` commands. The plist sets the working directory, so the start finds the env file. The plist holds no password. On Linux the show option prints the unit file and the commands, and the skip option prints the reminder for a start by hand. The sudo option comes with task 19.
- **Tests:** `UnitFileRendererTest`: renderMatchesTheSystemdUnitSnapshot, renderMatchesTheLaunchdPlistSnapshot, renderMatchesTheScCommandsSnapshot, renderUsesAbsoluteJvmPathPrivateTmpAndRestartSec; `HostDetectorTest`: detectReturnsSystemdWhenRunSystemdExists, detectReturnsLaunchdOnMacOs, detectReturnsNoneOtherwise; `ServiceStepTest`: runPrintsPlistWhenHostIsMacOs, runPrintsUnitFileAndCommandsWhenShowIsChosen, runPrintsReminderWhenSkipIsChosen, runSetsDataDirDefaultToVarLibWhenSudoOrShowIsChosen; `WizardTest`: runAsksServiceQuestionBeforeDataDir
- **Hand test:** 1. On a Mac, answer yes to the service question: the plist and the `launchctl` commands print, nothing is installed. 2. On Ubuntu, select "show": the unit file and the `systemctl` commands print. 3. Install the printed plist by hand: the application starts at the macOS user login. 4. On Ubuntu, answer yes and select "show": the data directory question shows `/var/lib/opencelium` as the default.
- **Size:** approximately 340 lines
- **Depends on:** 11
- **Status:** open

## Task 19: feat(core): the service step installs the systemd service under sudo
- **Criteria:** SW-28, SW-31
- **Function:** On Linux with systemd the sudo option serializes the whole plan to an owner-only file in `$XDG_RUNTIME_DIR` and runs `install-service --plan <file>` under sudo, with the absolute paths of the JVM and the jar. The child runs the plan as root in the order of SW-28. The parent and the child delete the plan file in a `finally` block, and `install-service` runs the step alone. The wait for the port comes with task 20.
- **Tests:** `SystemdHostServicesTest` (a fake command runner): installRunsCommandsInOrder, installWritesFilesWithOwnersAndPermissions, installGivesDataDirectoryToServiceUser, installWritesMarkerBeforeTheUnitFile; `SudoReexecTest`: reexecUsesAbsoluteJvmAndJarPaths, reexecSerializesPlanToOwnerOnlyFileInRuntimeDir, childAppliesPlanAndDeletesFile, parentDeletesFileWhenChildFails; `SetupLauncherTest`: decideRunsServiceStepAloneWhenInstallServiceIsGiven
- **Hand test:** 1. On Ubuntu 24.04 with Java from a tarball, select "run sudo now": the exact command prints, then the sudo password prompt, then "files written, service started". 2. `systemctl status opencelium` is active, `/var/lib/opencelium` belongs to `opencelium`, and the application answers after a reboot. 3. `ls $XDG_RUNTIME_DIR` shows no plan file. 4. On Debian 12, run `java -jar oc-app.jar install-service`: the service step alone.
- **Size:** approximately 380 lines
- **Depends on:** 18, 15
- **Status:** open

## Task 20: feat(core): the service step waits for the port and enables without a start for the variable key
- **Criteria:** SW-32, SW-44, SW-45, SW-57
- **Function:** With the key file option, the child stops before its first file write when the system user cannot read the key file (SW-57). After `enable --now` the wizard process waits 60 seconds for the port and then prints the admin login box. When the port does not listen, the wizard names the timeout and `journalctl -u opencelium`, leaves the unit in place and ends with exit code 1. With the variable key option the child runs `enable` without `--now`, and the wizard prints the instruction to set `OC_MASTER_KEY`, the start command and the admin login box without a wait.
- **Tests:** `ServiceStepTest` (a fake command runner, a fake port probe): installPrintsBoxWhenPortListens, installReportsAndLeavesUnitWhenPortDoesNotListen, installEnablesWithoutStartWhenKeyComesFromVariable; `SystemdHostServicesTest`: installRunsEnableWithoutNowWhenKeyComesFromVariable, installStopsBeforeTheFirstWriteWhenServiceUserCannotReadKeyFile, installReadsKeyFileAsServiceUserAfterItMakesTheUser
- **Hand test:** 1. On Ubuntu 24.04, run the setup with `master-key: env` and the sudo option: `systemctl is-enabled opencelium` says enabled, `is-active` says inactive, and the box prints with the start command. 2. Set `OC_MASTER_KEY` in a drop-in with `systemctl edit opencelium` and start the service: active, and `/var/lib/opencelium` has no `master.key`. 3. Stop MongoDB and run `install-service` again: after 60 seconds the timeout message with the `journalctl` command, exit code 1, and the unit still exists. 4. Delete `/etc/opencelium` and make a key file with `chmod 600` in your home directory. 5. Run the setup with this key file and the sudo option: the key file message, exit code 1. 6. Run `ls /etc/opencelium`: the directory does not exist.
- **Size:** approximately 230 lines
- **Depends on:** 19
- **Status:** open

## Task 21: feat(core): setup --print-values reproduces the last installation
- **Criteria:** SW-40, SW-38 (the env reference of a setup file; task 22 tests the batch run)
- **Function:** `setup --print-values` prints the setup file that reproduces the installation, and a setup file with an env reference takes the value from the environment.
- **Tests:** `PrintValuesTest`: printReproducesValuesOfWrittenFiles, printReplacesTheMongoUriWithEnvReference, printReadsEtcOpenceliumWhenConfigDirectoryHasNoFile, printNamesFileAndOwnerWhenFileIsNotReadable; `SetupFileTest`: readTakesTheValueOfAnEnvReferenceFromTheEnvironment, readStopsNamingTheKeyTheFileAndTheVariableWhenTheReferenceHasNoValue; `SetupLauncherTest`: decideReturnsPrintValuesWhenSetupPrintValuesIsGiven, decideThrowsUsageErrorWhenPrintValuesIsGivenWithoutSetup
- **Hand test:** 1. After an interactive run, run `java -jar oc-app.jar setup --print-values > again.yml`. 2. In a fresh directory, run `setup --file again.yml --batch`: the same files, without the password in the yml file. 3. After a service installation, run it as a normal user: the message names `/etc/opencelium/application.yml` and `root`. 4. Run it with `sudo`: the setup file.
- **Size:** approximately 180 lines
- **Depends on:** 15
- **Status:** open

## Task 22: docs(core): the first-start guide, the sample files and the end-to-end setup test
- **Criteria:** SW-38, SW-26
- **Function:** The README section "First start" and the sample `application.yml` exist, and the README shows the percent-encoding of the database password in `OC_MONGO_URI`. A full-application test runs a batch installation from a setup file and starts the application. It calls `GET /setup/status` and finds no secret in the log files, in the temporary directory or in a dump of the test database.
- **Tests:** `BatchInstallationTest` (full application, local MongoDB): batchRunWritesFilesAndStartsApplication, statusAgreesWithSetupFile, logFilesTemporaryDirectoryAndDatabaseDumpHoldNoSecret
- **Hand test:** 1. Run the VM matrix of the plan; on Ubuntu, `journalctl -u opencelium` holds no secret. 2. Record the results in `docs/setup-wizard-test-matrix.md`. 3. A new user follows the README section on a fresh host and reaches `/setup`.
- **Size:** approximately 150 lines
- **Depends on:** 21
- **Status:** open

## Task 23: docs: record the setup wizard decisions in the architecture document
- **Criteria:** none
- **Function:** Section 7 gets 3 records from the architect agent: the first admin instead of a setup token, the env file for the database password, and the admin marker as the handover to the application. Section 6.4 says that the env file is a source of the yml place for the database password. Section 4.1 starts with the launcher: the search and the hand-off of `/etc/opencelium/`. Then it names the wizard and the env file reader before the defaults post-processor. Section 3.4 gets rows for the setup blocks, and its Users row loses the generated password and the lock. Section 6.8 gets the exception for the tests of code that runs before Spring.
- **Tests:** none; a documentation change
- **Hand test:** 1. Read sections 3.4, 4.1, 6.4, 6.8 and 7: the 3 records exist, and the placement table names the env file. 2. Search the architecture document for a status marker, a date or a ticket number: nothing.
- **Size:** approximately 100 lines
- **Depends on:** 20
- **Status:** open
