# Authentication: the tasks

Each task is 1 pull request. The size rule of a task is in CONTRIBUTING.md, section 5.3.
The status line is the only status in this folder.
A task that changes the behaviour of a criterion changes spec.md in the same PR.

## Task 1: feat(core): generate the signing key of the installation at the start
- **Criteria:** AU-07
- **Function:** A new installation gets its system DEK and its signing key at the first start, and each later start reads the same signing key. A signing key that does not decrypt stops the start with a message. AU-07 gets its test with a session JWT in task 2.
- **Tests:** `SigningKeyCipherTest` (unit): encryptUsesANewIvWhenItRunsTwice, decryptGivesTheKeyWhenTheSystemDekIsTheSame, decryptStopsWhenTheSystemDekIsDifferent, decryptStopsWhenTheVersionInTheAssociatedDataIsDifferent, decryptStopsWhenTheCiphertextIsChanged, decryptStopsWithTheProblemWhenTheDocumentIsDamaged; `SigningKeyTest` (unit): toStringShowsTheVersionOnly, closeZeroesTheKeyAndMakesItUnusable; `SigningKeyLoaderTest` (full application): loadGeneratesTheSystemDekAndTheSigningKeyWhenTheDatabaseIsEmpty, loadWrapsTheSystemDekWithTheTenantSystemWhenItGeneratesIt, loadReadsTheStoredSigningKeyWhenCoreStartsAgain, loadGivesOneSigningKeyWhenTwoThreadsStartOnAnEmptyDatabase, loadGeneratesNoSystemDekWhenTheKeyCanaryStopsTheStart, startStopsWithAMessageWhenTheStoredSigningKeyDoesNotDecrypt, startStopsWithAMessageWhenTheStoredSigningKeyIsDamaged, stopZeroesTheSigningKeyWhenCoreStops; `SigningKeyLoaderCloudTest` (full application): loadStoresTheSigningKeyInTheSystemDatabaseWhenTheModeIsCloud
- **Hand test:** 1. Build with `./gradlew :core:bootJar`. Drop the database `oc_hand` in `mongosh`. 2. Start `java -jar oc-app.jar` with `SPRING_MONGODB_URI=mongodb://localhost:27017/oc_hand`. Stop it after the start. 3. In `mongosh oc_hand`, `db.signing_keys.find()` shows 1 document. Note its `_id`. 4. `db.keys.find({tenantId: "system"})` shows 1 document. 5. Start and stop core again. 6. `db.signing_keys.find()` still shows 1 document with the same `_id`. 7. Run `db.signing_keys.updateOne({}, {$set: {iv: BinData(0, "AAAAAAAAAAAAAAAA")}})`. 8. Start core: it stops with `APPLICATION FAILED TO START`, and the report names the signing key.
- **Size:** approximately 300 lines. The JWT encoder and the JWT decoders go into task 2, their first user.
- **Depends on:** nothing
- **Status:** done

## Task 2: feat(core): log in with a username and read the current user
- **Criteria:** AU-01, AU-04, AU-05, AU-06, AU-07
- **Function:** An OpenCelium user of the self-host mode logs in with the username and the password and gets a session JWT. The session JWT opens the endpoint of the current OpenCelium user on each core instance. In the cloud mode no login starts a session. AU-01 gets its tests of the email in task 3 and of the refresh token in task 4. AU-04 gets its test of the error code in task 3. AU-05 gets its test of the email in task 3, because the email comes in task 3. AU-06 gets its test with a refresh token in task 4.
- **Tests:** `TokenSignatureTest` (unit): decodeAcceptsTheTokenWhenItsTypeIsTheExpectedType, decodeStopsWhenTheTokenIsOfTheOtherType, decodeStopsWhenTheIssuerIsWrong, decodeStopsWhenTheKidNamesNoSigningKey, decodeStopsWhenTheTokenIsExpired; `SessionTokensTest` (unit): issueSessionJwtNamesTheUserTheTenantAndTheSessionWhenAUserLogsIn, issueSessionJwtExpiresNoLaterThanTheEndOfTheSessionWhenTheEndIsNear; `LoginStrategiesTest` (unit): providersHaveTheLocalLoginStrategyWhenTheModeIsSelfHost, providersAreEmptyWhenTheModeIsCloud; `LoginEndpointTest` (full application): loginGivesASessionJwtWhenTheUsernameAndThePasswordAreCorrect, loginGivesStatus401WhenThePasswordIsWrong; `LoginCloudTest` (full application): loginGivesStatus401WhenTheModeIsCloud; `CurrentUserEndpointTest` (full application): meGivesTheDataOfTheUserWhenTheSessionJwtIsValid, meHasNoPasswordHashWhenItGivesTheData, meGivesStatus401WhenTheRequestHasNoToken, meGivesStatus401WhenTheSessionJwtIsExpired, meGivesStatus401WhenAnotherKeySignedTheSessionJwt; `SessionJwtInstancesTest` (full application): meAcceptsTheSessionJwtWhenAnotherSpringContextIssuedIt, meAcceptsTheSessionJwtWhenCoreStartsAgain
- **Hand test:** 1. Build the jar, drop `oc_hand`, and start core as in task 1. 2. Run `curl -s -X POST localhost:9090/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"1234"}'`. 3. Copy the value of `sessionJwt` into the shell variable `T`. 4. Run `curl -s localhost:9090/api/auth/me -H "Authorization: Bearer $T"`. 5. The response shows `admin`, `self-host-tenant` and the role `ADMIN`, and no password hash. 6. Run `curl -i localhost:9090/api/auth/me` without the header: the status code is 401. 7. Restart core and do step 4 again: the response of step 5 comes again.
- **Size:** approximately 380 lines. The task adds the dependency of plan decision 2.
- **Depends on:** 1
- **Status:** done

## Task 2a: fix(core): give session-ended when the current user is deleted
- **Criteria:** AU-10
- **Function:** A request for the current OpenCelium user with the session JWT of a deleted user gets the error response of an ended session and writes the log line of "The endpoints" in plan.md.
- **Tests:** `CurrentUserEndpointTest` (full application): meGivesSessionEndedWhenTheUserIsDeleted
- **Hand test:** 1. Start core as in task 2. Log in as `admin`, and copy `sessionJwt` into `T`. 2. Run `mongosh oc_hand --eval 'db.users.deleteOne({username: "admin"})'`. 3. Run `curl -i localhost:9090/api/auth/me -H "Authorization: Bearer $T"`: the status code is 401, with the code `session-ended`.
- **Size:** approximately 30 lines
- **Depends on:** 4
- **Status:** done

## Task 2b: feat(core): move the login endpoint to /api/auth
- **Criteria:** AU-01
- **Function:** An OpenCelium user logs in with `POST /api/auth`. `/api/auth/login` is not an open endpoint: a request to it without a valid session JWT gets the status code 401. The paths of the refresh, the logout and the current user stay the same.
- **Tests:** the login tests run on `/api/auth` through the shared login path of `testsupport`; `LoginEndpointTest` (full application): postGivesStatus401WhenThePathIsBelowTheLoginPath
- **Hand test:** 1. Start core as in task 2. 2. Run `curl -s -X POST localhost:9090/api/auth -H 'Content-Type: application/json' -d '{"username":"admin","password":"1234"}'`: the response holds a session JWT. 3. Send the same request to `/api/auth/login`: the status code is 401. 4. Ask for `/api/auth/me` with the session JWT of step 2: the status code is 200.
- **Size:** approximately 10 lines of code, plus `plan.md` and `docs/security/README.md`
- **Depends on:** 2
- **Status:** in work

## Task 3: feat(core): log in by email and give error codes for a failed login
- **Criteria:** AU-01, AU-02, AU-03, AU-04, AU-05
- **Function:** An OpenCelium user logs in with the email as well as with the username, and the data of the current OpenCelium user shows the email. A failed login gives an error response with a code, and a locked user gets no session. The application log of a failed login shows no name and no password.
- **Tests:** `UserDocumentTest` (unit): constructorTurnsTheEmailIntoLowerCaseWhenItHasUpperCaseLetters; `UserIndexesTest` (full application): insertStopsWhenTwoUsersOfOneTenantHaveTheSameEmail, insertStoresTwoUsersWithoutAnEmailWhenTheyAreOfOneTenant; `LoginLookupTest` (full application): loadFindsTheUserWhenTheEmailHasUpperCaseLetters, loadGivesTheUserOfTheUsernameWhenAnotherUserHasItAsEmail, loadFindsNoUserWhenTheCaseOfTheUsernameIsDifferent; `CurrentUserEndpointTest` (full application): meGivesTheEmailWhenTheUserHasOne; `LoginErrorsTest` (full application): loginGivesTheSameResponseWhenTheUsernameTheEmailOrThePasswordIsWrong, loginWritesNoNameAndNoPasswordToTheLogWhenItFails, loginGivesUserLockedWhenTheUserIsLockedAndThePasswordIsCorrect, loginGivesInvalidCredentialsWhenTheUserIsLockedAndThePasswordIsWrong, loginGivesASessionWhenTheUserMustChangeAGeneratedPassword, loginGivesBadRequestWhenTheBodyHasNoPassword; `LoginCloudTest` (full application): loginGivesInvalidCredentialsWhenTheModeIsCloud
- **Hand test:** 1. Start core as in task 2. 2. Run `mongosh oc_hand --eval 'db.users.updateOne({username: "admin"}, {$set: {email: "admin@example.com"}})'`. 3. Log in as in task 2 with the username `Admin@Example.com`: the response holds a session JWT. Ask for `/api/auth/me`: the response shows `admin@example.com`. 4. Log in with the password `wrong`: the status code is 401, with the code `invalid-credentials`. 5. Log in with the username `nobody`: the response is the same as in step 4. 6. In `mongosh`, set `locked: true` on the admin. 7. Log in with the password `1234`: the status code is 403, with the code `user-locked`. 8. Log in with the password `wrong`: the response is the same as in step 4. 9. Search the application log for `wrong` and for `nobody`: there is no match.
- **Size:** approximately 200 lines
- **Depends on:** 2
- **Status:** done

## Task 4: feat(core): refresh and end a session with a refresh token
- **Criteria:** AU-01, AU-06, AU-08, AU-09
- **Function:** A login also gives a refresh token. The HTTP client refreshes the session with it and ends the session with a logout. A second use of an old refresh token ends the session.
- **Tests:** `SessionServiceTest` (full application): startStoresASessionRecordWhenAUserLogsIn, refreshGivesNewTokensWhenTheRefreshTokenIsTheCurrentToken, refreshEndsTheSessionWhenAnOldRefreshTokenComesAgain, refreshEndsTheSessionWhenTwoRefreshesUseOneToken, refreshEndsTheSessionWhenTheUserIsLocked, refreshEndsTheSessionWhenTheUserIsDeleted, refreshStopsWhenTheEndOfTheSessionIsPast, refreshGivesNoTokenThatExpiresAfterTheEndOfTheSession, endDeletesTheSessionRecord; `SessionIndexesTest` (full application): indexesHaveATtlIndexOnTheEndOfTheSession; `RefreshEndpointTest` (full application): loginGivesARefreshTokenWhenTheUserLogsIn, refreshGivesTwoNewTokensWhenTheRefreshTokenIsValid, refreshGivesSessionEndedWhenTheOldRefreshTokenComesAgain, refreshGivesStatus401WhenTheTokenIsASessionJwt, meGivesStatus401WhenTheTokenIsARefreshToken, logoutGivesStatus204WhenTheRefreshTokenIsValid, refreshGivesSessionEndedWhenTheUserLoggedOut, meAcceptsTheSessionJwtAfterTheLogoutUntilItExpires
- **Hand test:** 1. Start core as in task 2. Log in as `admin`, and copy `refreshToken` into the shell variable `R`. 2. Run `curl -s -X POST localhost:9090/api/auth/refresh -H "Authorization: Bearer $R"`: the response holds 2 new tokens. 3. Do step 2 again with the old `R`: the status code is 401, with the code `session-ended`. 4. Refresh with the new refresh token of step 2: the response is the same as in step 3. 5. Log in again, and copy `sessionJwt` into `T` and `refreshToken` into `R`. 6. Run `curl -i -X POST localhost:9090/api/auth/logout -H "Authorization: Bearer $R"`: the status code is 204. 7. Refresh with `R`: the response is the same as in step 3. 8. Ask for `/api/auth/me` with `T`: the status code is 200. 9. `mongosh oc_hand --eval 'db.sessions.countDocuments()'` prints 0.
- **Size:** approximately 320 lines
- **Depends on:** 2
- **Status:** done

## Task 5: docs: record the authentication decisions in the architecture document
- **Criteria:** none
- **Function:** Section 7 of the architecture document gets the 3 decision records of the plan, from the architect agent. The sections, the paths and the open decision of the definition of done of plan.md change with them.
- **Tests:** none; a documentation change
- **Hand test:** 1. Read section 7 of `docs/architecture.md`: the records of the signing key, of the session and of the error form exist. 2. Read the list of the open decisions: the entry "REST API contract style" exists. 3. Read sections 3.4, 4.1, 6.5 and 6.7: each item of the definition of done is there. 4. Search `docs/security/README.md` and the architecture document for an endpoint path without `/api`: nothing. 5. Read section 8 of CONTRIBUTING.md: it points to the record of the error form. 6. Search the architecture document for a status marker, a date or a ticket number: nothing.
- **Size:** approximately 130 lines
- **Depends on:** 4
- **Status:** done
