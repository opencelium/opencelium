package com.becon.opencelium.backend.unit.validation.connection;

import static org.mockito.Mockito.lenient;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.EnhancementMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.entity.LinkedFieldMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableScopeTarget;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableScopeResolver;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException.Code;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException.Violation;
import com.becon.opencelium.backend.security.GlobalVariableSecurity;
import com.becon.opencelium.backend.security.GlobalVariableSecurity.Caller;
import com.becon.opencelium.backend.testutil.fixture.ConnectionMngFixture;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.becon.opencelium.backend.validation.connection.GlobalReferenceValidator;
import com.becon.opencelium.backend.validation.connection.GlobalReferenceValidator.NotificationTarget;
import org.junit.jupiter.params.provider.ValueSource;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
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

        assertThatCode(() -> validator.validateConnector(REQUEST_DATA)).doesNotThrowAnyException();
    }

    @ParameterizedTest
    @EnumSource(value = GlobalVariableScopeType.class, names = {"CATEGORIES", "WORKFLOWS"})
    @DisplayName("validateConnector — a connector is shared by every workflow, so a scoped variable is refused")
    void validateConnectorThrowsScopeNotAllWhenVariableIsScoped(GlobalVariableScopeType scopeType) {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        variable.setScopeType(scopeType);
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));

        GlobalReferenceValidationException rejection = rejectionOf(() -> validator.validateConnector(REQUEST_DATA));

        assertThat(rejection).hasMessageContaining("open to all workflows").hasMessageContaining("'idoitUrl'");
        assertThat(rejection.getViolations()).extracting(Violation::code).containsExactly(Code.SCOPE_NOT_ALL);
    }

    @Test
    void validateConnectorThrowsUnknownVariableWhenVariableDoesNotExist() {
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of());

        GlobalReferenceValidationException rejection = rejectionOf(() -> validator.validateConnector(REQUEST_DATA));

        assertThat(rejection).hasMessage("Global variable 'idoitUrl' does not exist");
        assertThat(rejection.getViolations()).extracting(Violation::code).containsExactly(Code.UNKNOWN_VARIABLE);
    }

    @Test
    void validateConnectorThrowsNoUsePermissionWhenCallerLacksGrant() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));
        when(security.caller()).thenReturn(Optional.of(CALLER));
        when(security.permissionsOn(variable, CALLER)).thenReturn(EnumSet.noneOf(GlobalVariablePermission.class));

        GlobalReferenceValidationException rejection = rejectionOf(() -> validator.validateConnector(REQUEST_DATA));

        assertThat(rejection).hasMessage("You have no permission to use global variable 'idoitUrl'");
        assertThat(rejection.getViolations()).extracting(Violation::code).containsExactly(Code.NO_USE_PERMISSION);
    }

    @Test
    @DisplayName("validateConnector — a violation names the request data field and no element of a workflow")
    void validateConnectorReportsFieldWithoutColorWhenReferenceIsRejected() {
        GlobalVariable variable =
                aVariableScopedTo(GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(3));
        when(globalVariableRepository.findByNameIn(Set.of("idoitUrl"))).thenReturn(List.of(variable));

        List<Violation> violations = rejectionOf(() -> validator.validateConnector(REQUEST_DATA)).getViolations();

        assertThat(violations).containsExactly(new Violation(
                Code.SCOPE_NOT_ALL,
                "A connector may only use global variables that are open to all workflows, and 'idoitUrl' is not",
                "idoitUrl", "{{global.idoitUrl}}", null, null, "url"));
    }

    @Test
    @DisplayName("validateConnector — request data without global references costs no read at all")
    void validateConnectorReadsNothingWhenRequestDataHoldsNoReference() {
        validator.validateConnector(Map.of("url", "https://cmdb.example/api", "token", "{token}"));

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

        assertThat(violations).extracting(Violation::code).containsExactly(Code.INVALID_WRITE_TARGET);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

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
