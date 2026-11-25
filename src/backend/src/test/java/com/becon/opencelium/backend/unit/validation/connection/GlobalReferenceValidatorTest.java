package com.becon.opencelium.backend.unit.validation.connection;

import static org.mockito.Mockito.lenient;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.database.mongodb.entity.BodyMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConditionMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.EnhancementMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.entity.LinkedFieldMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.database.mongodb.entity.StatementMng;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableGrant;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableScopeTarget;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage.SourceType;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableUsageRepository;
import com.becon.opencelium.backend.database.mysql.repository.RoleHasPermissionRepository;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableScopeResolver;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException.Code;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException.Violation;
import com.becon.opencelium.backend.execution.globalvariable.GlobalScript;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.security.GlobalVariableSecurity;
import com.becon.opencelium.backend.security.GlobalVariableSecurity.Caller;
import com.becon.opencelium.backend.testutil.fixture.ConnectionMngFixture;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.becon.opencelium.backend.validation.connection.GlobalReferenceValidator;
import com.becon.opencelium.backend.validation.connection.GlobalReferenceValidator.NotificationTarget;
import com.fasterxml.jackson.databind.node.TextNode;
import org.junit.jupiter.params.provider.ValueSource;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link GlobalReferenceValidator}: what the save of a workflow, a connector or a
 * notification template is refused for.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalReferenceValidatorTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("GlobalReferenceValidator — unit")
class GlobalReferenceValidatorTest {

    private static final long WORKFLOW = 11L;
    private static final long CONNECTOR = 4L;
    private static final Caller CALLER = new Caller(7, false);
    private static final Map<String, String> REQUEST_DATA = Map.of("url", "{{global.idoitUrl}}/api");
    private static final Map<String, String> TEMPLATE_TEXTS =
            Map.of("en.body", "The sync with {{global.idoitUrl}} failed");

    @Mock
    GlobalVariableRepository globalVariableRepository;

    @Mock
    GlobalVariableSecurity security;

    @Mock
    GlobalVariableScopeResolver scopeResolver;

    @Mock
    GlobalVariableUsageRepository usageRepository;

    @InjectMocks
    GlobalReferenceValidator validator;

    @Test
    @DisplayName("validate — a workflow without global references costs no read at all")
    void validateReadsNothingWhenWorkflowHasNoGlobalReference() {
        ConnectionMng workflow = ConnectionMngFixture.aWorkflowWith(
                ConnectionMngFixture.aMethod("#ababab", "0_1", "listObjects", "{url}/api"));

        validator.validate(workflow, WORKFLOW, 3);

        verifyNoInteractions(globalVariableRepository, security, scopeResolver);
    }

    @Test
    void validateAcceptsReferenceWhenVariableIsInScopeAndUsable() {
        GlobalVariable variable = aVariableScopedTo(GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(3));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(scopeResolver.categoryChainOf(3)).thenReturn(Set.of(3L));
        when(security.caller()).thenReturn(Optional.of(CALLER));
        when(security.permissionsOn(variable, CALLER)).thenReturn(EnumSet.of(GlobalVariablePermission.VIEW_USE));

        assertThatCode(() -> validator.validate(aWorkflowUsingIdoitUrl(), WORKFLOW, 3)).doesNotThrowAnyException();
    }

    @Test
    void validateReportsUnknownVariableWhenNameDoesNotExist() {
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of());

        List<Violation> violations = violationsOf(aWorkflowUsingIdoitUrl(), WORKFLOW, 3);

        assertThat(violations).containsExactly(new Violation(
                Code.UNKNOWN_VARIABLE, "Global variable 'idoitUrl' does not exist",
                "idoitUrl", "{{global.idoitUrl}}", "#ababab", "0_1", "endpoint"));
    }

    @Test
    @DisplayName("validate — names are matched exactly, even if the database finds another case")
    void validateReportsUnknownVariableWhenOnlyCaseDiffers() {
        GlobalVariable otherCase = GlobalVariableFixture.aConstant(5L, "IdoitURL", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(otherCase));

        List<Violation> violations = violationsOf(aWorkflowUsingIdoitUrl(), WORKFLOW, 3);

        assertThat(violations).extracting(Violation::code).containsExactly(Code.UNKNOWN_VARIABLE);
    }

    @Test
    void validateReportsOutOfScopeWhenWorkflowIsOutsideScope() {
        GlobalVariable variable = aVariableScopedTo(GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(9));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(scopeResolver.categoryChainOf(3)).thenReturn(Set.of(3L, 1L));

        List<Violation> violations = violationsOf(aWorkflowUsingIdoitUrl(), WORKFLOW, 3);

        assertThat(violations).extracting(Violation::code, Violation::variable, Violation::index)
                .containsExactly(tuple(Code.OUT_OF_SCOPE, "idoitUrl", "0_1"));
        assertThat(violations.get(0).message()).contains("outside the scope").contains("'idoitUrl'");
    }

    @Test
    @DisplayName("validate — a workflow that is not saved yet is on no list of chosen workflows")
    void validateReportsOutOfScopeWhenNewWorkflowUsesWorkflowScopedVariable() {
        GlobalVariable variable = aVariableScopedTo(GlobalVariableScopeType.WORKFLOWS, GlobalVariableScopeTarget.workflow(WORKFLOW));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));

        List<Violation> violations = violationsOf(aWorkflowUsingIdoitUrl(), null, null);

        assertThat(violations).extracting(Violation::code).containsExactly(Code.OUT_OF_SCOPE);
    }

    @Test
    void validateAcceptsWorkflowScopedVariableWhenWorkflowIsListed() {
        GlobalVariable variable = aVariableScopedTo(GlobalVariableScopeType.WORKFLOWS, GlobalVariableScopeTarget.workflow(WORKFLOW));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));

        assertThatCode(() -> validator.validate(aWorkflowUsingIdoitUrl(), WORKFLOW, null)).doesNotThrowAnyException();
    }

    @Test
    void validateReportsNoUsePermissionWhenCallerLacksViewUse() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(security.caller()).thenReturn(Optional.of(CALLER));
        when(security.permissionsOn(variable, CALLER)).thenReturn(EnumSet.noneOf(GlobalVariablePermission.class));

        List<Violation> violations = violationsOf(aWorkflowUsingIdoitUrl(), WORKFLOW, null);

        assertThat(violations).extracting(Violation::code, Violation::ref)
                .containsExactly(tuple(Code.NO_USE_PERMISSION, "{{global.idoitUrl}}"));
    }

    @Test
    @DisplayName("validate — the system saves without a user and is not held to grants")
    void validateSkipsPermissionCheckWhenNoUserIsAuthenticated() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(security.caller()).thenReturn(Optional.empty());

        assertThatCode(() -> validator.validate(aWorkflowUsingIdoitUrl(), WORKFLOW, null)).doesNotThrowAnyException();
        verify(security, never()).permissionsOn(any(), any());
    }

    // ── references the workflow already had ───────────────────────────────────

    @Test
    @DisplayName("validate — a user without Use keeps a variable the stored workflow already uses")
    void validateAcceptsReferenceWhenCallerLacksUseButWorkflowAlreadyUsesVariable() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(security.caller()).thenReturn(Optional.of(CALLER));
        when(security.permissionsOn(variable, CALLER)).thenReturn(EnumSet.noneOf(GlobalVariablePermission.class));
        when(usageRepository.findVariableIdsBySources(SourceType.WORKFLOW, List.of(WORKFLOW))).thenReturn(Set.of(5L));

        assertThatCode(() -> validator.validate(aWorkflowUsingIdoitUrl(), WORKFLOW, null)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("validate — a variable the stored workflow does not use yet is a new reference and needs Use")
    void validateReportsNoUsePermissionWhenCallerAddsVariableWorkflowDidNotUse() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(security.caller()).thenReturn(Optional.of(CALLER));
        when(security.permissionsOn(variable, CALLER)).thenReturn(EnumSet.noneOf(GlobalVariablePermission.class));
        when(usageRepository.findVariableIdsBySources(SourceType.WORKFLOW, List.of(WORKFLOW))).thenReturn(Set.of(6L));

        List<Violation> violations = violationsOf(aWorkflowUsingIdoitUrl(), WORKFLOW, null);

        assertThat(violations).extracting(Violation::code).containsExactly(Code.NO_USE_PERMISSION);
    }

    @Test
    @DisplayName("validate — a workflow saved for the first time keeps nothing, so no usage is read")
    void validateReportsNoUsePermissionWhenNewWorkflowUsesVariableCallerMayNotUse() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(security.caller()).thenReturn(Optional.of(CALLER));
        when(security.permissionsOn(variable, CALLER)).thenReturn(EnumSet.noneOf(GlobalVariablePermission.class));

        List<Violation> violations = violationsOf(aWorkflowUsingIdoitUrl(), null, null);

        assertThat(violations).extracting(Violation::code).containsExactly(Code.NO_USE_PERMISSION);
        verifyNoInteractions(usageRepository);
    }

    @Test
    @DisplayName("validate — keeping a reference does not lift the scope: a kept variable that left the scope is refused")
    void validateReportsOutOfScopeWhenKeptVariableNoLongerCoversWorkflow() {
        GlobalVariable variable = aVariableScopedTo(GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(9));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(scopeResolver.categoryChainOf(3)).thenReturn(Set.of(3L));
        when(security.caller()).thenReturn(Optional.of(CALLER));

        List<Violation> violations = violationsOf(aWorkflowUsingIdoitUrl(), WORKFLOW, 3);

        assertThat(violations).extracting(Violation::code).containsExactly(Code.OUT_OF_SCOPE);
        verifyNoInteractions(usageRepository);
    }

    @Test
    @DisplayName("validate — the stored usages are read only when the caller may not use a referenced variable")
    void validateReadsNoUsagesWhenCallerMayUseEveryVariable() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(security.caller()).thenReturn(Optional.of(CALLER));
        when(security.permissionsOn(variable, CALLER)).thenReturn(EnumSet.of(GlobalVariablePermission.VIEW_USE));

        validator.validate(aWorkflowUsingIdoitUrl(), WORKFLOW, null);

        verifyNoInteractions(usageRepository);
    }

    @Test
    @DisplayName("validate — the stored usages are read once, however many references lack permission")
    void validateReadsUsagesOnceWhenSeveralReferencesLackPermission() {
        MethodMng method = ConnectionMngFixture.aMethod("#ababab", "0_1", "listObjects", "{{global.idoitUrl}}/api");
        method.getRequest().setHeader(Map.of("X-Tenant", "{{global.tenant}}"));
        GlobalVariable idoitUrl = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        GlobalVariable tenant = GlobalVariableFixture.aConstant(6L, "tenant", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl", "tenant"))).thenReturn(List.of(idoitUrl, tenant));
        when(security.caller()).thenReturn(Optional.of(CALLER));
        when(security.permissionsOn(any(), any())).thenReturn(EnumSet.noneOf(GlobalVariablePermission.class));
        when(usageRepository.findVariableIdsBySources(SourceType.WORKFLOW, List.of(WORKFLOW))).thenReturn(Set.of(5L));

        List<Violation> violations = violationsOf(ConnectionMngFixture.aWorkflowWith(method), WORKFLOW, null);

        assertThat(violations).extracting(Violation::code, Violation::variable)
                .containsExactly(tuple(Code.NO_USE_PERMISSION, "tenant"));
        verify(usageRepository, times(1)).findVariableIdsBySources(SourceType.WORKFLOW, List.of(WORKFLOW));
    }

    @Test
    @DisplayName("validateConnector — a user without Use keeps a variable the stored connector already uses")
    void validateConnectorAcceptsReferenceWhenCallerLacksUseButConnectorAlreadyUsesVariable() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(security.caller()).thenReturn(Optional.of(CALLER));
        when(security.permissionsOn(variable, CALLER)).thenReturn(EnumSet.noneOf(GlobalVariablePermission.class));
        when(usageRepository.findVariableIdsBySources(SourceType.CONNECTOR, List.of(CONNECTOR))).thenReturn(Set.of(5L));

        assertThatCode(() -> validator.validateConnector(CONNECTOR, REQUEST_DATA)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("validateConnector — a connector saved for the first time keeps nothing, so no usage is read")
    void validateConnectorReportsNoUsePermissionWhenNewConnectorUsesVariableCallerMayNotUse() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(security.caller()).thenReturn(Optional.of(CALLER));
        when(security.permissionsOn(variable, CALLER)).thenReturn(EnumSet.noneOf(GlobalVariablePermission.class));

        GlobalReferenceValidationException rejection =
                rejectionOf(() -> validator.validateConnector(null, REQUEST_DATA));

        assertThat(rejection.getViolations()).extracting(Violation::code).containsExactly(Code.NO_USE_PERMISSION);
        verifyNoInteractions(usageRepository);
    }

    @Test
    @DisplayName("validateNotifications — a user without Use keeps a variable the saved notifications already send")
    void validateNotificationsAcceptsReferenceWhenCallerLacksUseButNotificationsAlreadyUseVariable() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(scopeResolver.categoryChainOf(3)).thenReturn(Set.of(3L));
        when(security.caller()).thenReturn(Optional.of(CALLER));
        when(security.permissionsOn(variable, CALLER)).thenReturn(EnumSet.noneOf(GlobalVariablePermission.class));
        when(usageRepository.findVariableIdsBySources(SourceType.NOTIFICATION, List.of(21L, 22L)))
                .thenReturn(Set.of(5L));
        List<NotificationTarget> notifications = List.of(
                new NotificationTarget("Failure mail", null, WORKFLOW, 3, 21L),
                new NotificationTarget("New mail", null, WORKFLOW, 3, null),
                new NotificationTarget("Daily mail", null, WORKFLOW, 3, 22L));

        assertThatCode(() -> validator.validateNotifications(TEMPLATE_TEXTS, notifications))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("validateNotifications — a template no saved notification sends keeps nothing, so no usage is read")
    void validateNotificationsReportsNoUsePermissionWhenNoSavedNotificationSendsTemplate() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(security.caller()).thenReturn(Optional.of(CALLER));
        when(security.permissionsOn(variable, CALLER)).thenReturn(EnumSet.noneOf(GlobalVariablePermission.class));

        GlobalReferenceValidationException rejection =
                rejectionOf(() -> validator.validateNotifications(TEMPLATE_TEXTS, List.of()));

        assertThat(rejection.getViolations()).extracting(Violation::code).containsExactly(Code.NO_USE_PERMISSION);
        verifyNoInteractions(usageRepository);
    }

    @Test
    @DisplayName("validate — every bad reference is reported in one answer, each with its own place")
    void validateReportsEveryViolationWhenSeveralReferencesAreInvalid() {
        MethodMng method = ConnectionMngFixture.aMethod("#ababab", "0_1", "listObjects", "{{global.missing}}/api");
        method.getRequest().setHeader(Map.of("X-Tenant", "{{global.scoped}}"));
        GlobalVariable scoped = GlobalVariableFixture.aConstant(6L, "scoped", "1");
        scoped.setScopeType(GlobalVariableScopeType.WORKFLOWS);
        when(globalVariableRepository.findByNameIn(Set.of("missing", "scoped"))).thenReturn(List.of(scoped));

        List<Violation> violations = violationsOf(ConnectionMngFixture.aWorkflowWith(method), WORKFLOW, null);

        assertThat(violations).extracting(Violation::code, Violation::variable, Violation::field).containsExactly(
                tuple(Code.UNKNOWN_VARIABLE, "missing", "endpoint"),
                tuple(Code.OUT_OF_SCOPE, "scoped", "header.X-Tenant"));
    }

    @Test
    @DisplayName("validate — the scope is checked against the category the workflow is moved to")
    void validateUsesGivenCategoryWhenWorkflowChangesCategory() {
        GlobalVariable variable = aVariableScopedTo(GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(4));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(scopeResolver.categoryChainOf(4)).thenReturn(Set.of(4L));

        assertThatCode(() -> validator.validate(aWorkflowUsingIdoitUrl(), WORKFLOW, 4)).doesNotThrowAnyException();
        verify(scopeResolver).categoryChainOf(4);
    }

    // ── validateConnector ─────────────────────────────────────────────────────

    @Test
    void validateConnectorAcceptsReferenceWhenVariableIsOpenToAll() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(security.caller()).thenReturn(Optional.of(CALLER));
        when(security.permissionsOn(variable, CALLER)).thenReturn(EnumSet.of(GlobalVariablePermission.VIEW_USE));

        assertThatCode(() -> validator.validateConnector(CONNECTOR, REQUEST_DATA)).doesNotThrowAnyException();
    }

    @ParameterizedTest
    @EnumSource(value = GlobalVariableScopeType.class, names = {"CATEGORIES", "WORKFLOWS"})
    @DisplayName("validateConnector — a connector is shared by every workflow, so a scoped variable is refused")
    void validateConnectorThrowsScopeNotAllWhenVariableIsScoped(GlobalVariableScopeType scopeType) {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        variable.setScopeType(scopeType);
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));

        GlobalReferenceValidationException rejection = rejectionOf(() -> validator.validateConnector(CONNECTOR, REQUEST_DATA));

        assertThat(rejection).hasMessageContaining("open to all workflows").hasMessageContaining("'idoitUrl'");
        assertThat(rejection.getViolations()).extracting(Violation::code).containsExactly(Code.SCOPE_NOT_ALL);
    }

    @Test
    void validateConnectorThrowsUnknownVariableWhenVariableDoesNotExist() {
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of());

        GlobalReferenceValidationException rejection = rejectionOf(() -> validator.validateConnector(CONNECTOR, REQUEST_DATA));

        assertThat(rejection).hasMessage("Global variable 'idoitUrl' does not exist");
        assertThat(rejection.getViolations()).extracting(Violation::code).containsExactly(Code.UNKNOWN_VARIABLE);
    }

    @Test
    void validateConnectorThrowsNoUsePermissionWhenCallerLacksGrant() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(security.caller()).thenReturn(Optional.of(CALLER));
        when(security.permissionsOn(variable, CALLER)).thenReturn(EnumSet.noneOf(GlobalVariablePermission.class));

        GlobalReferenceValidationException rejection = rejectionOf(() -> validator.validateConnector(CONNECTOR, REQUEST_DATA));

        assertThat(rejection).hasMessage("You have no permission to use global variable 'idoitUrl'");
        assertThat(rejection.getViolations()).extracting(Violation::code).containsExactly(Code.NO_USE_PERMISSION);
    }

    @Test
    @DisplayName("validateConnector — a violation names the request data field and no element of a workflow")
    void validateConnectorReportsFieldWithoutColorWhenReferenceIsRejected() {
        GlobalVariable variable =
                aVariableScopedTo(GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(3));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));

        List<Violation> violations = rejectionOf(() -> validator.validateConnector(CONNECTOR, REQUEST_DATA)).getViolations();

        assertThat(violations).containsExactly(new Violation(
                Code.SCOPE_NOT_ALL,
                "A connector may only use global variables that are open to all workflows, and 'idoitUrl' is not",
                "idoitUrl", "{{global.idoitUrl}}", null, null, "url"));
    }

    @Test
    @DisplayName("validateConnector — request data without global references costs no read at all")
    void validateConnectorReadsNothingWhenRequestDataHoldsNoReference() {
        validator.validateConnector(CONNECTOR, Map.of("url", "https://cmdb.example/api", "token", "{token}"));

        verifyNoInteractions(globalVariableRepository, security, scopeResolver);
    }

    // ── validateNotifications ─────────────────────────────────────────────────

    @Test
    void validateNotificationsAcceptsReferenceWhenWorkflowIsInScope() {
        GlobalVariable variable =
                aVariableScopedTo(GlobalVariableScopeType.WORKFLOWS, GlobalVariableScopeTarget.workflow(WORKFLOW));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(security.caller()).thenReturn(Optional.of(CALLER));
        when(security.permissionsOn(variable, CALLER)).thenReturn(EnumSet.of(GlobalVariablePermission.VIEW_USE));
        List<NotificationTarget> notifications = List.of(new NotificationTarget("Failure mail", WORKFLOW, null));

        assertThatCode(() -> validator.validateNotifications(TEMPLATE_TEXTS, notifications))
                .doesNotThrowAnyException();
    }

    @Test
    void validateNotificationsThrowsOutOfScopeWhenWorkflowIsOutside() {
        GlobalVariable variable =
                aVariableScopedTo(GlobalVariableScopeType.WORKFLOWS, GlobalVariableScopeTarget.workflow(99));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        List<NotificationTarget> notifications = List.of(new NotificationTarget("Failure mail", WORKFLOW, null));

        GlobalReferenceValidationException rejection =
                rejectionOf(() -> validator.validateNotifications(TEMPLATE_TEXTS, notifications));

        assertThat(rejection).hasMessage(
                "The workflow of notification 'Failure mail' is outside the scope of global variable 'idoitUrl'");
        assertThat(rejection.getViolations()).extracting(Violation::code, Violation::field, Violation::index)
                .containsExactly(tuple(Code.OUT_OF_SCOPE, "en.body", null));
    }

    @Test
    @DisplayName("validateNotifications — one violation per reference names every notification the scope leaves out")
    void validateNotificationsNamesEveryLeftOutNotificationWhenSeveralSendTemplate() {
        GlobalVariable variable =
                aVariableScopedTo(GlobalVariableScopeType.WORKFLOWS, GlobalVariableScopeTarget.workflow(WORKFLOW));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        List<NotificationTarget> notifications = List.of(
                new NotificationTarget("Covered", WORKFLOW, null),
                new NotificationTarget("Nightly", 12L, null),
                new NotificationTarget("Weekly", 13L, null));

        List<Violation> violations =
                rejectionOf(() -> validator.validateNotifications(TEMPLATE_TEXTS, notifications)).getViolations();

        assertThat(violations).hasSize(1);
        assertThat(violations.get(0).message()).contains("'Nightly', 'Weekly'").doesNotContain("'Covered'");
    }

    @Test
    @DisplayName("validateNotifications — a template no notification sends has no workflow to be out of scope of")
    void validateNotificationsAcceptsScopedVariableWhenNoNotificationSendsTemplate() {
        GlobalVariable variable =
                aVariableScopedTo(GlobalVariableScopeType.WORKFLOWS, GlobalVariableScopeTarget.workflow(99));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));

        assertThatCode(() -> validator.validateNotifications(TEMPLATE_TEXTS, List.of())).doesNotThrowAnyException();
    }

    @Test
    void validateNotificationsThrowsUnknownVariableWhenNoNotificationSendsTemplate() {
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of());

        GlobalReferenceValidationException rejection =
                rejectionOf(() -> validator.validateNotifications(TEMPLATE_TEXTS, List.of()));

        assertThat(rejection).hasMessage("Global variable 'idoitUrl' does not exist");
        assertThat(rejection.getViolations()).extracting(Violation::code, Violation::field)
                .containsExactly(tuple(Code.UNKNOWN_VARIABLE, "en.body"));
    }

    @Test
    void validateNotificationsThrowsNoUsePermissionWhenCallerLacksGrant() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(security.caller()).thenReturn(Optional.of(CALLER));
        when(security.permissionsOn(variable, CALLER)).thenReturn(EnumSet.noneOf(GlobalVariablePermission.class));
        List<NotificationTarget> notifications = List.of(new NotificationTarget("Failure mail", WORKFLOW, null));

        GlobalReferenceValidationException rejection =
                rejectionOf(() -> validator.validateNotifications(TEMPLATE_TEXTS, notifications));

        assertThat(rejection).hasMessage("You have no permission to use global variable 'idoitUrl'");
        assertThat(rejection.getViolations()).extracting(Violation::code).containsExactly(Code.NO_USE_PERMISSION);
    }

    @Test
    @DisplayName("validateNotifications — a variable of a category reaches the workflows of its subcategories")
    void validateNotificationsAcceptsReferenceWhenVariableIsScopedToParentCategory() {
        GlobalVariable variable =
                aVariableScopedTo(GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(1));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(scopeResolver.categoryChainOf(3)).thenReturn(Set.of(3L, 1L));
        List<NotificationTarget> notifications = List.of(new NotificationTarget("Failure mail", WORKFLOW, 3));

        assertThatCode(() -> validator.validateNotifications(TEMPLATE_TEXTS, notifications))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("validateNotifications — a notification that comes with its schedule is named with it")
    void validateNotificationsNamesScheduleWhenTargetCarriesIt() {
        GlobalVariable variable =
                aVariableScopedTo(GlobalVariableScopeType.WORKFLOWS, GlobalVariableScopeTarget.workflow(99));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        List<NotificationTarget> notifications =
                List.of(new NotificationTarget("Failure mail", "'Nightly'", WORKFLOW, null));

        GlobalReferenceValidationException rejection =
                rejectionOf(() -> validator.validateNotifications(TEMPLATE_TEXTS, notifications));

        assertThat(rejection).hasMessage("The workflow of notification 'Failure mail' (schedule 'Nightly') is"
                + " outside the scope of global variable 'idoitUrl'");
    }

    @Test
    @DisplayName("validateNotifications — the notifications of one category share one read of its chain")
    void validateNotificationsReadsCategoryChainOnceWhenNotificationsShareCategory() {
        GlobalVariable variable =
                aVariableScopedTo(GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(1));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(scopeResolver.categoryChainOf(3)).thenReturn(Set.of(3L, 1L));
        List<NotificationTarget> notifications = List.of(
                new NotificationTarget("Failure mail", "'Nightly'", WORKFLOW, 3),
                new NotificationTarget("Failure chat", "'Nightly'", WORKFLOW, 3),
                new NotificationTarget("Weekly mail", "'Weekly'", WORKFLOW, 3));

        validator.validateNotifications(TEMPLATE_TEXTS, notifications);

        verify(scopeResolver, times(1)).categoryChainOf(3);
    }

    // ── writes ────────────────────────────────────────────────────────────────

    @Test
    void validateAcceptsWriteWhenWorkflowOwnsMutableVariable() {
        GlobalVariable variable = GlobalVariableFixture.aMutable(5L, "lastSync", "0", "0", WORKFLOW);
        when(globalVariableRepository.findByNameIn(Set.of("lastSync"))).thenReturn(List.of(variable));

        assertThatCode(() -> validator.validate(aWorkflowWriting("global.lastSync"), WORKFLOW, null))
                .doesNotThrowAnyException();
    }

    @Test
    void validateAcceptsWriteWhenWorkflowIsOneOfSeveralOwners() {
        GlobalVariable variable = GlobalVariableFixture.aMutable(5L, "lastSync", "0", "0", 99L);
        variable.getOwnerWorkflowIds().add(WORKFLOW);
        when(globalVariableRepository.findByNameIn(Set.of("lastSync"))).thenReturn(List.of(variable));

        assertThatCode(() -> validator.validate(aWorkflowWriting("global.lastSync"), WORKFLOW, null))
                .doesNotThrowAnyException();
    }

    @Test
    void validateReportsNotMutableWhenMethodWritesConstant() {
        when(globalVariableRepository.findByNameIn(Set.of("lastSync")))
                .thenReturn(List.of(GlobalVariableFixture.aConstant(5L, "lastSync", "0")));

        List<Violation> violations = violationsOf(aWorkflowWriting("global.lastSync"), WORKFLOW, null);

        assertThat(violations).extracting(Violation::code, Violation::field)
                .containsExactly(tuple(Code.NOT_MUTABLE, "globalWrites"));
    }

    @Test
    void validateReportsNotOwnerWhenAnotherWorkflowOwnsVariable() {
        when(globalVariableRepository.findByNameIn(Set.of("lastSync")))
                .thenReturn(List.of(GlobalVariableFixture.aMutable(5L, "lastSync", "0", "0", 99L)));

        List<Violation> violations = violationsOf(aWorkflowWriting("global.lastSync"), WORKFLOW, null);

        assertThat(violations).extracting(Violation::code).containsExactly(Code.NOT_OWNER);
    }

    @Test
    @DisplayName("validate — a workflow saved for the first time owns no variable yet")
    void validateReportsNotOwnerWhenWorkflowIsNew() {
        when(globalVariableRepository.findByNameIn(Set.of("lastSync")))
                .thenReturn(List.of(GlobalVariableFixture.aMutable(5L, "lastSync", "0", "0", WORKFLOW)));

        List<Violation> violations = violationsOf(aWorkflowWriting("global.lastSync"), null, null);

        assertThat(violations).extracting(Violation::code).containsExactly(Code.NOT_OWNER);
    }

    @Test
    void validateReportsNotOwnerWhenEnhancementSetsVariableOfAnotherWorkflow() {
        when(globalVariableRepository.findByNameIn(Set.of("lastSync")))
                .thenReturn(List.of(GlobalVariableFixture.aMutable(5L, "lastSync", "0", "0", 99L)));
        ConnectionMng workflow = ConnectionMngFixture.aWorkflowWith(
                ConnectionMngFixture.aMethod("#ababab", "0_1", "createVm", "https://api.example.test"));
        workflow.setFieldBindings(List.of(aBindingWithScript("set('{{global.lastSync}}', VAR_0);")));

        List<Violation> violations = violationsOf(workflow, WORKFLOW, null);

        assertThat(violations).extracting(Violation::code, Violation::field)
                .containsExactly(tuple(Code.NOT_OWNER, "enhancement.script"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"{{global.lastSync}}", "global.lastSync.at", "lastSync", "x global.lastSync"})
    void validateReportsInvalidWriteTargetWhenTargetIsNoBareToken(String target) {
        lenient().when(globalVariableRepository.findByNameIn(any())).thenReturn(List.of());

        List<Violation> violations = violationsOf(aWorkflowWriting(target), WORKFLOW, null);

        assertThat(violations).extracting(Violation::code, Violation::message).containsExactly(tuple(
                Code.INVALID_WRITE_TARGET,
                "'" + target + "' names no global variable to write: write global.name in globalWrites and "
                        + "{{global.name}} in set(), without a path"));
    }

    // ── script variables ──────────────────────────────────────────────────────

    @Test
    @DisplayName("validate — a script imported by the whole value of an arg of a js enhancement is accepted")
    void validateAcceptsScriptWhenImportedIntoJsEnhancement() {
        givenFormatDateScript();
        ConnectionMng workflow = aWorkflowWithBinding(
                aBinding("//var VAR_1 = {{global.formatDate}};", "RESULT_VAR = VAR_1(VAR_0, 'dd.MM');", "js"));

        assertThatCode(() -> validator.validate(workflow, WORKFLOW, null)).doesNotThrowAnyException();
    }

    @Test
    void validateReportsScriptNotCallableWhenEndpointReferencesScript() {
        givenFormatDateScript();
        ConnectionMng workflow = ConnectionMngFixture.aWorkflowWith(
                ConnectionMngFixture.aMethod("#ababab", "0_1", "listObjects", "https://api.example.test/{{global.formatDate}}"));

        List<Violation> violations = violationsOf(workflow, WORKFLOW, null);

        assertThat(violations).containsExactly(new Violation(Code.SCRIPT_NOT_CALLABLE,
                "Global variable 'formatDate' is a script and has no value to read; import it in the args of an "
                        + "enhancement in its language as //var VAR_n = {{global.formatDate}}; without a path",
                "formatDate", "{{global.formatDate}}", "#ababab", "0_1", "endpoint"));
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("workflowsReadingScript")
    @DisplayName("validate — a script anywhere but the whole value of an arg is refused")
    void validateReportsScriptNotCallableWhenScriptIsReadOutsideImport(String place, ConnectionMng workflow,
            String field) {
        when(globalVariableRepository.findByNameIn(any())).thenReturn(List.of(
                GlobalVariableFixture.aScriptVariable(8L, "formatDate", "{}"),
                GlobalVariableFixture.aMutable(5L, "lastSync", "0", "0", WORKFLOW)));

        List<Violation> violations = violationsOf(workflow, WORKFLOW, null);

        assertThat(violations).extracting(Violation::code, Violation::field)
                .containsExactly(tuple(Code.SCRIPT_NOT_CALLABLE, field));
    }

    static Stream<Arguments> workflowsReadingScript() {
        MethodMng withHeader = ConnectionMngFixture.aMethod("#ababab", "0_1", "listObjects", "https://api.example.test");
        withHeader.getRequest().setHeader(Map.of("X-Date", "{{global.formatDate}}"));

        MethodMng withBody = ConnectionMngFixture.aMethod("#ababab", "0_1", "createObject", "https://api.example.test");
        BodyMng body = new BodyMng();
        body.setFields(Map.of("title", "{{global.formatDate}}"));
        withBody.getRequest().setBody(body);

        MethodMng withWriteValue = ConnectionMngFixture.aMethod("#ababab", "0_1", "createVm", "https://api.example.test");
        withWriteValue.setGlobalWrites(Map.of("global.lastSync", "{{global.formatDate}}"));

        ConnectionMng withLoopSource = ConnectionMngFixture.aWorkflowWith();
        withLoopSource.getFromConnector().getOperators()
                .add(ConnectionMngFixture.anOperator("0_2", "forin", "{{global.formatDate}}"));

        StatementMng left = new StatementMng();
        left.setField("{{global.formatDate}}");
        ConditionMng condition = new ConditionMng();
        condition.setLeftStatement(left);
        OperatorMng ifOperator = ConnectionMngFixture.anOperator("0_2", "if", null);
        ifOperator.setCondition(condition);
        ConnectionMng withCondition = ConnectionMngFixture.aWorkflowWith();
        withCondition.getFromConnector().getOperators().add(ifOperator);

        return Stream.of(
                Arguments.of("a header", ConnectionMngFixture.aWorkflowWith(withHeader), "header.X-Date"),
                Arguments.of("a body", ConnectionMngFixture.aWorkflowWith(withBody), "body.title"),
                Arguments.of("a value written to a variable", ConnectionMngFixture.aWorkflowWith(withWriteValue),
                        "globalWrites.global.lastSync"),
                Arguments.of("a loop source", withLoopSource, "expression"),
                Arguments.of("an operator condition", withCondition, "condition.left.field"),
                Arguments.of("ref() in enhancement code",
                        aWorkflowWithBinding(aBinding(null, "RESULT_VAR = ref('{{global.formatDate}}');", "js")),
                        "enhancement.script"),
                Arguments.of("an arg with a path",
                        aWorkflowWithBinding(aBinding("var VAR_0 = {{global.formatDate.code}};", "", "js")),
                        "enhancement.args"),
                Arguments.of("a part of an arg",
                        aWorkflowWithBinding(aBinding("var VAR_0 = 'on {{global.formatDate}}';", "", "js")),
                        "enhancement.args"));
    }

    @Test
    @DisplayName("validate — a write to a script is refused as not mutable, not as not callable")
    void validateReportsNotMutableWhenMethodWritesScript() {
        when(globalVariableRepository.findByNameIn(Set.of("formatDate"))).thenReturn(
                List.of(GlobalVariableFixture.aScriptVariable(8L, "formatDate", "{}")));

        List<Violation> violations = violationsOf(aWorkflowWriting("global.formatDate"), WORKFLOW, null);

        assertThat(violations).extracting(Violation::code).containsExactly(Code.NOT_MUTABLE);
    }

    @Test
    void validateReportsImportLanguageMismatchWhenEnhancementIsNotJs() {
        givenFormatDateScript();
        ConnectionMng workflow = aWorkflowWithBinding(
                aBinding("//var VAR_1 = {{global.formatDate}};", "RESULT_VAR = VAR_1(VAR_0)", "python3"));

        List<Violation> violations = violationsOf(workflow, WORKFLOW, null);

        assertThat(violations).containsExactly(new Violation(Code.IMPORT_LANGUAGE_MISMATCH,
                "Script variable 'formatDate' is written in JavaScript and cannot be imported into a 'python3' "
                        + "enhancement",
                "formatDate", "{{global.formatDate}}", "#ababab", "0_1", "enhancement.args"));
    }

    @Test
    void validateReportsImportLanguageMismatchWhenEnhancementHasNoLanguage() {
        givenFormatDateScript();
        ConnectionMng workflow = aWorkflowWithBinding(aBinding("var VAR_1 = {{global.formatDate}};", "", null));

        List<Violation> violations = violationsOf(workflow, WORKFLOW, null);

        assertThat(violations).extracting(Violation::code, Violation::message).containsExactly(tuple(
                Code.IMPORT_LANGUAGE_MISMATCH,
                "Script variable 'formatDate' is written in JavaScript and cannot be imported into an enhancement "
                        + "without a language"));
    }

    @Test
    @DisplayName("validate — a Python script imported by the whole value of a python3 enhancement's arg is accepted")
    void validateAcceptsScriptWhenPythonScriptIsImportedIntoPythonEnhancement() {
        givenScript("python3");
        ConnectionMng workflow = aWorkflowWithBinding(
                aBinding("//var VAR_1 = {{global.formatDate}};", "RESULT_VAR = VAR_1(VAR_0)", "python3"));

        assertThatCode(() -> validator.validate(workflow, WORKFLOW, null)).doesNotThrowAnyException();
    }

    @Test
    void validateAcceptsScriptWhenRubyScriptIsImportedIntoRubyEnhancement() {
        givenScript("ruby");
        ConnectionMng workflow = aWorkflowWithBinding(
                aBinding("//var VAR_1 = {{global.formatDate}};", "RESULT_VAR = VAR_1(VAR_0)", "ruby"));

        assertThatCode(() -> validator.validate(workflow, WORKFLOW, null)).doesNotThrowAnyException();
    }

    @Test
    void validateReportsImportLanguageMismatchWhenPythonScriptIsImportedIntoJsEnhancement() {
        givenScript("python3");
        ConnectionMng workflow = aWorkflowWithBinding(
                aBinding("//var VAR_1 = {{global.formatDate}};", "RESULT_VAR = VAR_1(VAR_0);", "js"));

        List<Violation> violations = violationsOf(workflow, WORKFLOW, null);

        assertThat(violations).extracting(Violation::code, Violation::message).containsExactly(tuple(
                Code.IMPORT_LANGUAGE_MISMATCH,
                "Script variable 'formatDate' is written in Python 3 and cannot be imported into a 'js' enhancement"));
    }

    @Test
    @DisplayName("validate — a constant passed as the whole value of an arg of any language is a plain read")
    void validateAcceptsConstantWhenWholeArgOfNonJsEnhancement() {
        when(globalVariableRepository.findByNameIn(Set.of("formatDate")))
                .thenReturn(List.of(GlobalVariableFixture.aConstant(8L, "formatDate", "\"dd.MM\"")));
        ConnectionMng workflow = aWorkflowWithBinding(aBinding("var VAR_1 = {{global.formatDate}};", "", "python3"));

        assertThatCode(() -> validator.validate(workflow, WORKFLOW, null)).doesNotThrowAnyException();
    }

    @Test
    void validateConnectorThrowsScriptNotCallableWhenRequestDataReferencesScript() {
        givenFormatDateScript();

        GlobalReferenceValidationException rejection =
                rejectionOf(() -> validator.validateConnector(CONNECTOR, Map.of("since", "{{global.formatDate}}")));

        assertThat(rejection.getViolations()).extracting(Violation::code, Violation::field, Violation::color)
                .containsExactly(tuple(Code.SCRIPT_NOT_CALLABLE, "since", null));
    }

    @Test
    void validateNotificationsThrowsScriptNotCallableWhenTemplateReferencesScript() {
        givenFormatDateScript();
        List<NotificationTarget> notifications = List.of(new NotificationTarget("Failure mail", WORKFLOW, null));

        GlobalReferenceValidationException rejection = rejectionOf(() -> validator.validateNotifications(
                Map.of("en.subject", "Failed on {{global.formatDate}}"), notifications));

        assertThat(rejection.getViolations()).extracting(Violation::code, Violation::field)
                .containsExactly(tuple(Code.SCRIPT_NOT_CALLABLE, "en.subject"));
    }

    @Test
    @DisplayName("validateRun — a run whose references are all in its snapshot costs no read")
    void validateRunReadsNothingWhenEveryReferenceIsInSnapshot() {
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.of(List.of(
                new GlobalVariableSnapshot.Entry("idoitUrl", 4, new TextNode("https://cmdb.example.test"))));

        assertThatCode(() -> validator.validateRun(aWorkflowUsingIdoitUrl(), snapshot)).doesNotThrowAnyException();
        verifyNoInteractions(globalVariableRepository, security, scopeResolver);
    }

    @Test
    @DisplayName("validateRun — a variable deleted since the save stops the run, and no user is asked about")
    void validateRunReportsUnknownVariableWhenVariableNoLongerExists() {
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of());

        GlobalReferenceValidationException rejection = rejectionOf(
                () -> validator.validateRun(aWorkflowUsingIdoitUrl(), GlobalVariableSnapshot.empty()));

        assertThat(rejection.getViolations()).containsExactly(new Violation(
                Code.UNKNOWN_VARIABLE, "Global variable 'idoitUrl' does not exist",
                "idoitUrl", "{{global.idoitUrl}}", "#ababab", "0_1", "endpoint"));
        verifyNoInteractions(security);
    }

    @Test
    @DisplayName("validateRun — a variable that still exists but is missing from the snapshot left the workflow "
            + "out of its scope")
    void validateRunReportsOutOfScopeWhenVariableExistsButIsNotInSnapshot() {
        GlobalVariable variable = aVariableScopedTo(GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(9));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));

        GlobalReferenceValidationException rejection = rejectionOf(
                () -> validator.validateRun(aWorkflowUsingIdoitUrl(), GlobalVariableSnapshot.empty()));

        assertThat(rejection.getViolations()).extracting(Violation::code, Violation::variable, Violation::index)
                .containsExactly(tuple(Code.OUT_OF_SCOPE, "idoitUrl", "0_1"));
        assertThat(rejection.getMessage()).contains("outside the scope").contains("'idoitUrl'");
    }

    @Test
    @DisplayName("validateRun — names are matched exactly, as the snapshot matches them")
    void validateRunReportsUnknownVariableWhenOnlyCaseDiffers() {
        GlobalVariable otherCase = GlobalVariableFixture.aConstant(5L, "IdoitURL", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(otherCase));

        GlobalReferenceValidationException rejection = rejectionOf(
                () -> validator.validateRun(aWorkflowUsingIdoitUrl(), GlobalVariableSnapshot.empty()));

        assertThat(rejection.getViolations()).extracting(Violation::code).containsExactly(Code.UNKNOWN_VARIABLE);
    }

    @Test
    @DisplayName("validateRun — a write target that names no variable was refused on save and is not looked up")
    void validateRunIgnoresWriteTargetWhenItNamesNoVariable() {
        assertThatCode(() -> validator.validateRun(aWorkflowWriting("{{global.counter}}"), GlobalVariableSnapshot.empty()))
                .doesNotThrowAnyException();
        verifyNoInteractions(globalVariableRepository);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private void givenFormatDateScript() {
        givenScript("js");
    }

    /** Script variable formatDate, written in {@code language}. */
    private void givenScript(String language) {
        when(globalVariableRepository.findByNameIn(Set.of("formatDate"))).thenReturn(List.of(GlobalVariableFixture
                .aScriptVariable(8L, "formatDate", new GlobalScript(language, "return 1", List.of()).toJson())));
    }

    private static ConnectionMng aWorkflowWithBinding(FieldBindingMng binding) {
        ConnectionMng workflow = ConnectionMngFixture.aWorkflowWith(
                ConnectionMngFixture.aMethod("#ababab", "0_1", "createVm", "https://api.example.test"));
        workflow.setFieldBindings(List.of(binding));
        return workflow;
    }

    private static FieldBindingMng aBinding(String args, String script, String language) {
        FieldBindingMng binding = aBindingWithScript(script);
        binding.getEnhancement().setArgs(args);
        binding.getEnhancement().setLanguage(language);
        return binding;
    }

    // ── scope × permission matrix ─────────────────────────────────────────────

    /**
     * Every scope against every kind of caller, for a workflow {@code WORKFLOW} in category 3,
     * whose parent is category 1. The permissions come from the real {@link
     * GlobalVariableSecurity}, the variable belongs to user 1 and the caller is user 7.
     */
    @ParameterizedTest(name = "[{index}] {0} × {1}")
    @MethodSource("scopeAndCallerMatrix")
    @DisplayName("validate — scope is checked first, then whether the caller may use the variable")
    void validateDecidesByScopeThenPermissionWhenWorkflowIsSaved(ScopeCase scope, CallerCase caller) {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        variable.setScopeType(scope.type());
        scope.target().ifPresent(variable.getScopeTargets()::add);
        caller.grant().ifPresent(permission ->
                variable.getGrants().add(new GlobalVariableGrant(caller.granteeId(), permission)));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(scopeResolver.categoryChainOf(3)).thenReturn(Set.of(3L, 1L));
        GlobalVariableSecurity realSecurity = spy(new GlobalVariableSecurity(mock(RoleHasPermissionRepository.class)));
        doReturn(caller.caller()).when(realSecurity).caller();
        GlobalReferenceValidator matrixValidator =
                new GlobalReferenceValidator(globalVariableRepository, realSecurity, scopeResolver, usageRepository);

        Throwable thrown = catchThrowable(() -> matrixValidator.validate(aWorkflowUsingIdoitUrl(), WORKFLOW, 3));

        if (!scope.covers()) {
            assertThat(thrown).isInstanceOfSatisfying(GlobalReferenceValidationException.class, e ->
                    assertThat(e.getViolations()).extracting(Violation::code).containsExactly(Code.OUT_OF_SCOPE));
        } else if (!caller.mayUse()) {
            assertThat(thrown).isInstanceOfSatisfying(GlobalReferenceValidationException.class, e ->
                    assertThat(e.getViolations()).extracting(Violation::code).containsExactly(Code.NO_USE_PERMISSION));
        } else {
            assertThat(thrown).isNull();
        }
    }

    static Stream<Arguments> scopeAndCallerMatrix() {
        List<ScopeCase> scopes = List.of(
                new ScopeCase("all workflows", GlobalVariableScopeType.ALL, Optional.empty(), true),
                new ScopeCase("own category", GlobalVariableScopeType.CATEGORIES,
                        Optional.of(GlobalVariableScopeTarget.category(3)), true),
                new ScopeCase("parent category", GlobalVariableScopeType.CATEGORIES,
                        Optional.of(GlobalVariableScopeTarget.category(1)), true),
                new ScopeCase("other category", GlobalVariableScopeType.CATEGORIES,
                        Optional.of(GlobalVariableScopeTarget.category(9)), false),
                new ScopeCase("this workflow listed", GlobalVariableScopeType.WORKFLOWS,
                        Optional.of(GlobalVariableScopeTarget.workflow(WORKFLOW)), true),
                new ScopeCase("other workflow listed", GlobalVariableScopeType.WORKFLOWS,
                        Optional.of(GlobalVariableScopeTarget.workflow(12)), false));
        List<CallerCase> callers = List.of(
                new CallerCase("owner", Optional.of(new Caller(1, false)), 1, Optional.empty(), true),
                new CallerCase("admin", Optional.of(new Caller(7, true)), 7, Optional.empty(), true),
                new CallerCase("Use grant", Optional.of(CALLER), 7, Optional.of(GlobalVariablePermission.VIEW_USE), true),
                new CallerCase("Edit grant", Optional.of(CALLER), 7, Optional.of(GlobalVariablePermission.EDIT), true),
                new CallerCase("Delete grant", Optional.of(CALLER), 7, Optional.of(GlobalVariablePermission.DELETE), true),
                new CallerCase("grant of another user", Optional.of(CALLER), 99,
                        Optional.of(GlobalVariablePermission.EDIT), false),
                new CallerCase("no grant", Optional.of(CALLER), 7, Optional.empty(), false),
                new CallerCase("system save", Optional.empty(), 7, Optional.empty(), true));

        return scopes.stream().flatMap(scope -> callers.stream().map(caller -> Arguments.of(scope, caller)));
    }

    /** A scope of the variable, and whether it covers workflow {@code WORKFLOW} in category 3 under 1. */
    record ScopeCase(String label, GlobalVariableScopeType type, Optional<GlobalVariableScopeTarget> target,
            boolean covers) {

        @Override
        public String toString() {
            return label;
        }
    }

    /** Who saves, what user {@code granteeId} was granted, and whether the caller may use the variable. */
    record CallerCase(String label, Optional<Caller> caller, int granteeId,
            Optional<GlobalVariablePermission> grant, boolean mayUse) {

        @Override
        public String toString() {
            return label;
        }
    }

    private static ConnectionMng aWorkflowUsingIdoitUrl() {
        return ConnectionMngFixture.aWorkflowWith(
                ConnectionMngFixture.aMethod("#ababab", "0_1", "listObjects", "{{global.idoitUrl}}/api"));
    }

    private static ConnectionMng aWorkflowWriting(String target) {
        MethodMng method = ConnectionMngFixture.aMethod("#ababab", "0_1", "createVm", "https://api.example.test");
        method.setGlobalWrites(Map.of(target, "#ababab.(response).body.$.at"));
        return ConnectionMngFixture.aWorkflowWith(method);
    }

    private static FieldBindingMng aBindingWithScript(String script) {
        LinkedFieldMng target = new LinkedFieldMng();
        target.setColor("#ababab");
        EnhancementMng enhancement = new EnhancementMng();
        enhancement.setScript(script);
        enhancement.setLanguage("js");
        FieldBindingMng binding = new FieldBindingMng();
        binding.setTo(List.of(target));
        binding.setEnhancement(enhancement);
        return binding;
    }

    private static GlobalVariable aVariableScopedTo(GlobalVariableScopeType type, GlobalVariableScopeTarget target) {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        variable.setScopeType(type);
        variable.getScopeTargets().add(target);
        return variable;
    }

    private List<Violation> violationsOf(ConnectionMng workflow, Long connectionId, Integer categoryId) {
        return rejectionOf(() -> validator.validate(workflow, connectionId, categoryId)).getViolations();
    }

    private static GlobalReferenceValidationException rejectionOf(ThrowingCallable save) {
        GlobalReferenceValidationException exception =
                catchThrowableOfType(save, GlobalReferenceValidationException.class);
        assertThat(exception).as("a GlobalReferenceValidationException").isNotNull();
        return exception;
    }
}
