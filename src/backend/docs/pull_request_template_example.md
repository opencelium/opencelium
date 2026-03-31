## What
Fix NPE in `UserRoleServiceImpl.getOne()` by replacing `repository.getOne()`
with `findById().orElseThrow()` throwing `RoleNotFoundException`.

## Why
`repository.getOne()` throws a JPA internal `EntityNotFoundException` when the
role does not exist. The REST layer has no handler for it so the client receives
a 500 instead of a 404. `RoleNotFoundException` is already handled by the global
exception handler and maps correctly to 404.
Closes OC-1389.

## How to test
```bash
# Unit test — no Docker needed
./gradlew test --tests "*.UserRoleServiceImplTest.getOneThrowsRoleNotFoundExceptionWhenIdDoesNotExist"

# End-to-end 404 verification — Docker required
./gradlew integrationTest --tests "*.UserRoleControllerFlowIT.getByIdReturns404WhenRoleNotFound"
```

## Checklist
- [x] Self-reviewed the diff
- [x] `./gradlew test` passes locally
- [x] Tests added or updated — `UserRoleServiceImplTest.getOneThrowsRoleNotFoundExceptionWhenIdDoesNotExist`, `UserRoleControllerFlowIT.getByIdReturns404WhenRoleNotFound`
- [x] No secrets, debug logs, or commented-out code
- [x] WIP commits squashed