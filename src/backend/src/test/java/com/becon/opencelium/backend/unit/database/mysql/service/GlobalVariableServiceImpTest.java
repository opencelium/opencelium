package com.becon.opencelium.backend.unit.database.mysql.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableChange;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableGrant;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableScopeTarget;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.repository.CategoryRepository;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableChangeRepository;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.database.mysql.repository.SchedulerRepository;
import com.becon.opencelium.backend.database.mysql.repository.UserRepository;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableScopeResolver;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableServiceImp;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableUsageService;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableBusyPolicy;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.exception.GlobalVariableConflictException;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Code;
import com.becon.opencelium.backend.exception.GlobalVariableValidationException.Violation;
import com.becon.opencelium.backend.execution.globalvariable.GlobalScript;
import com.becon.opencelium.backend.execution.globalvariable.WorkflowRunGate;
import com.becon.opencelium.backend.mapper.mysql.GlobalVariableMapper;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableChangeDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableImpactDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariablePermissionsDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariablePermissionsDTO.GrantRequest;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariablePickerItemDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableRequestDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableRestoreRequestDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableUsageDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableValueDTO;
import com.becon.opencelium.backend.resource.subs.PaginatedDto;
import com.becon.opencelium.backend.security.GlobalVariableSecurity;
import com.becon.opencelium.backend.security.GlobalVariableSecurity.Caller;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.becon.opencelium.backend.utility.crypto.GlobalVariableCipher;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.TextNode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.LongStream;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

/**
 * Unit tests for {@link GlobalVariableServiceImp}.
 *
 * <p>Repositories, the access policy and the mapper are mocked; JSON is written and parsed by a
 * real {@link ObjectMapper}. The mocked {@code saveAndFlush} gives a new variable its id and
 * raises the version of an existing one, as the database does.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalVariableServiceImpTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("GlobalVariableServiceImp — unit")
class GlobalVariableServiceImpTest {

    private static final int OWNER_ID = 1;
    private static final int GRANTEE_ID = 8;
    private static final long VARIABLE_ID = 5L;
    private static final long VERSION = 3L;
    private static final long CHANGE_ID = 31L;
    private static final long CONNECTOR_ID = 7L;
    private static final long NOTIFICATION_ID = 21L;
    private static final long OWNER_WORKFLOW_ID = 12L;
    private static final int MAX_VALUE_BYTES = 32;
    private static final int MAX_SCRIPT_BYTES = 1024;
    private static final Caller OWNER = new Caller(OWNER_ID, false);
    // built once: deriving the key takes a while
    private static final GlobalVariableCipher CIPHER = new GlobalVariableCipher(
            new MockEnvironment().withProperty(GlobalVariableCipher.KEY_PROPERTY, GlobalVariableFixture.SECRET_KEY));

    @Mock
    GlobalVariableRepository repository;

    @Mock
    GlobalVariableChangeRepository changeRepository;

    @Mock
    GlobalVariableMapper mapper;

    @Mock
    GlobalVariableSecurity security;

    @Mock
    UserRepository userRepository;

    @Mock
    CategoryRepository categoryRepository;

    @Mock
    ConnectionRepository connectionRepository;

    @Mock
    SchedulerRepository schedulerRepository;

    @Mock
    GlobalVariableUsageService usageService;

    @Mock
    GlobalVariableScopeResolver scopeResolver;

    @Mock
    WorkflowRunGate runGate;

    @Captor
    ArgumentCaptor<Collection<Long>> askedIds;

    private final ObjectMapper json = new ObjectMapper();

    private GlobalVariableServiceImp service;

    @BeforeEach
    void setUp() {
        service = new GlobalVariableServiceImp(repository, changeRepository, mapper, security,
                userRepository, categoryRepository, connectionRepository, schedulerRepository, usageService,
                scopeResolver,
                json, CIPHER, runGate, MAX_VALUE_BYTES, MAX_SCRIPT_BYTES);

        // the caller is the owner and may do everything, unless a test says otherwise
        lenient().when(security.caller()).thenReturn(Optional.of(OWNER));
        lenient().when(security.permissionsOn(any(), any()))
                .thenReturn(EnumSet.allOf(GlobalVariablePermission.class));
        lenient().when(security.canManageGrants(any(), any())).thenReturn(true);
        lenient().when(repository.saveAndFlush(any())).thenAnswer(invocation -> {
            GlobalVariable variable = invocation.getArgument(0);
            if (variable.getId() == null) {
                variable.setId(42L);
            } else {
                variable.setVersion(variable.getVersion() + 1);
            }
            return variable;
        });
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Test
    void createSavesConstantOwnedByCallerWhenRequestIsValid() {
        service.create(GlobalVariableFixture.aRequest("idoitUrl", new TextNode("https://cmdb.example"), null));

        GlobalVariable saved = savedVariable();
        assertThat(saved.getName()).isEqualTo("idoitUrl");
        assertThat(saved.getKind()).isEqualTo(GlobalVariableKind.CONSTANT);
        assertThat(saved.getValue()).isEqualTo("\"https://cmdb.example\"");
        assertThat(saved.getScopeType()).isEqualTo(GlobalVariableScopeType.ALL);
        assertThat(saved.getScopeTargets()).isEmpty();
        assertThat(saved.getOwnerUserId()).isEqualTo(OWNER_ID);
        assertThat(saved.isSecret()).isFalse();
    }

    @Test
    void createWritesCreateChangeWhenVariableIsSaved() {
        service.create(GlobalVariableFixture.aRequest("idoitUrl", new TextNode("https://cmdb.example"), null));

        GlobalVariableChange change = savedChanges(1).get(0);
        assertThat(change.getChangeType()).isEqualTo(GlobalVariableChange.Type.CREATE);
        assertThat(change.getVariableId()).isEqualTo(42L);
        assertThat(change.getVariableName()).isEqualTo("idoitUrl");
        assertThat(change.getVersionFrom()).isNull();
        assertThat(change.getVersionTo()).isEqualTo(1L);
        assertThat(change.getOldValue()).isNull();
        assertThat(change.getNewValue()).isEqualTo("\"https://cmdb.example\"");
        assertThat(change.getActorType()).isEqualTo(GlobalVariableChange.ActorType.USER);
        assertThat(change.getUserId()).isEqualTo(OWNER_ID);
        assertThat(change.getResult()).isEqualTo(GlobalVariableChange.Result.SAVED);
    }

    @Test
    @DisplayName("create — a value that is left out is stored as JSON null")
    void createStoresJsonNullWhenValueIsLeftOut() {
        service.create(GlobalVariableFixture.aRequest("nothing", null, null));

        assertThat(savedVariable().getValue()).isEqualTo("null");
    }

    @ParameterizedTest(name = "[{index}] \"{0}\"")
    @MethodSource("invalidNames")
    void createThrowsValidationExceptionWhenNameIsInvalid(String name) {
        GlobalVariableRequestDTO request = GlobalVariableFixture.aRequest(name, new TextNode("x"), null);

        assertThat(violationsOf(() -> service.create(request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("name", Code.NAME_INVALID));
        verify(repository, never()).saveAndFlush(any());
    }

    static Stream<String> invalidNames() {
        return Stream.of(null, "", "1st", "_leading", "has-dash", "has space", "a".repeat(65));
    }

    @Test
    void createAcceptsNameWhenNameHas64Characters() {
        String name = "a".repeat(64);

        service.create(GlobalVariableFixture.aRequest(name, new TextNode("x"), null));

        assertThat(savedVariable().getName()).isEqualTo(name);
    }

    @Test
    void createThrowsValidationExceptionWhenNameIsTaken() {
        when(repository.existsByNameIgnoreCase("idoitUrl")).thenReturn(true);
        GlobalVariableRequestDTO request = GlobalVariableFixture.aRequest("idoitUrl", new TextNode("x"), null);

        List<Violation> violations = violationsOf(() -> service.create(request));

        assertThat(violations)
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("name", Code.NAME_TAKEN));
        assertThat(violations.get(0).message()).contains("idoitUrl");
        verify(repository, never()).saveAndFlush(any());
    }

    // ── script variables ──────────────────────────────────────────────────────

    @Test
    @DisplayName("create — a script variable stores its definition where the other kinds store their value")
    void createSavesDefinitionAsValueWhenScriptIsValid() {
        service.create(GlobalVariableFixture.aScriptRequest("formatDate", GlobalVariableFixture.aFormatDateScript(), null));

        GlobalVariable saved = savedVariable();
        assertThat(saved.getKind()).isEqualTo(GlobalVariableKind.SCRIPT);
        GlobalScript script = GlobalScript.fromJson(saved.getValue());
        assertThat(script.language()).isEqualTo("js");
        assertThat(script.code()).isEqualTo(GlobalVariableFixture.FORMAT_DATE_CODE);
        assertThat(script.parameters())
                .extracting(GlobalScript.Parameter::name, GlobalScript.Parameter::required,
                        GlobalScript.Parameter::defaultValue)
                .containsExactly(tuple("date", true, null), tuple("pattern", false, new TextNode("dd.MM.yyyy")));
        assertThat(savedChanges(1).get(0).getNewValue()).isEqualTo(saved.getValue());
    }

    @Test
    void createThrowsValidationExceptionWhenScriptIsLeftOut() {
        GlobalVariableRequestDTO request = GlobalVariableFixture.aScriptRequest("formatDate", null, null);

        assertThat(violationsOf(() -> service.create(request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("script", Code.SCRIPT_REQUIRED));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void createThrowsValidationExceptionWhenScriptVariableHasValueOrIsSecret() {
        GlobalVariableRequestDTO request = new GlobalVariableRequestDTO("formatDate", GlobalVariableKind.SCRIPT, null,
                new TextNode("x"), true, GlobalVariableFixture.aScopeOfAll(), null, null, null,
                GlobalVariableFixture.aFormatDateScript());

        assertThat(violationsOf(() -> service.create(request)))
                .extracting(Violation::field, Violation::code)
                .containsExactlyInAnyOrder(tuple("value", Code.SCRIPT_HAS_NO_VALUE),
                        tuple("secret", Code.SECRET_NOT_ALLOWED));
    }

    @Test
    void createThrowsValidationExceptionWhenConstantHasScript() {
        GlobalVariableRequestDTO request = new GlobalVariableRequestDTO("idoitUrl", GlobalVariableKind.CONSTANT, null,
                new TextNode("x"), false, GlobalVariableFixture.aScopeOfAll(), null, null, null,
                GlobalVariableFixture.aFormatDateScript());

        assertThat(violationsOf(() -> service.create(request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("script", Code.SCRIPT_ONLY));
    }

    @Test
    @DisplayName("create — the code is checked as the body of a function: here it returns nothing")
    void createThrowsValidationExceptionWhenScriptReturnsNothing() {
        GlobalVariableRequestDTO request =
                GlobalVariableFixture.aScriptRequest("noop", GlobalVariableFixture.aScript("var a = 1;"), null);

        assertThat(violationsOf(() -> service.create(request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("script.code", Code.NO_RETURN_VALUE));
    }

    @Test
    void createThrowsValidationExceptionWhenRequiredParameterHasDefault() {
        GlobalVariableRequestDTO request = GlobalVariableFixture.aScriptRequest("formatDate",
                GlobalVariableFixture.aScript("return date;",
                        new GlobalVariableRequestDTO.Parameter("date", null, true, new TextNode("today"))), null);

        assertThat(violationsOf(() -> service.create(request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("script.parameters[0].default", Code.PARAMETER_INVALID));
    }

    @Test
    void createThrowsValidationExceptionWhenScriptExceedsLimit() {
        String code = "return '" + "a".repeat(MAX_SCRIPT_BYTES) + "';";
        GlobalVariableRequestDTO request =
                GlobalVariableFixture.aScriptRequest("big", GlobalVariableFixture.aScript(code), null);

        assertThat(violationsOf(() -> service.create(request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("script.code", Code.VALUE_TOO_LARGE));
    }

    @Test
    @DisplayName("update — new code is a VALUE change, so the change log can restore the old script")
    void updateWritesValueChangeWhenScriptCodeChanges() {
        String oldDefinition = new GlobalScript("js", "return 1;", List.of()).toJson();
        GlobalVariable variable = GlobalVariableFixture.aScriptVariable(VARIABLE_ID, "answer", oldDefinition);
        variable.setVersion(VERSION);
        when(repository.findById(VARIABLE_ID)).thenReturn(Optional.of(variable));

        service.update(VARIABLE_ID,
                GlobalVariableFixture.aScriptRequest("answer", GlobalVariableFixture.aScript("return 42;"), VERSION));

        GlobalVariableChange change = savedChanges(1).get(0);
        assertThat(change.getChangeType()).isEqualTo(GlobalVariableChange.Type.VALUE);
        assertThat(change.getOldValue()).isEqualTo(oldDefinition);
        assertThat(GlobalScript.fromJson(change.getNewValue()).code()).isEqualTo("return 42;");
    }

    @Test
    void updateThrowsValidationExceptionWhenScriptLanguageChanges() {
        GlobalVariable variable = GlobalVariableFixture.aScriptVariable(VARIABLE_ID, "answer",
                new GlobalScript("js", "return 1;", List.of()).toJson());
        variable.setVersion(VERSION);
        when(repository.findById(VARIABLE_ID)).thenReturn(Optional.of(variable));
        GlobalVariableRequestDTO request = GlobalVariableFixture.aScriptRequest("answer",
                new GlobalVariableRequestDTO.Script("python3", "return 1", List.of()), VERSION);

        assertThat(violationsOf(() -> service.update(VARIABLE_ID, request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("script.language", Code.LANGUAGE_CHANGE_NOT_ALLOWED));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("create — a secret is stored encrypted, not as its JSON text")
    void createEncryptsValueWhenSecretIsRequested() {
        GlobalVariableRequestDTO request = new GlobalVariableRequestDTO("apiKey", GlobalVariableKind.CONSTANT,
                null, new TextNode("s3cr3t"), true, GlobalVariableFixture.aScopeOfAll(), null, null, null);

        service.create(request);

        GlobalVariable saved = savedVariable();
        assertThat(saved.isSecret()).isTrue();
        assertThat(CIPHER.decrypt(saved.getValue())).isEqualTo("\"s3cr3t\"");
    }

    @Test
    @DisplayName("create — the limit counts the bytes of the JSON text, quotes included")
    void createThrowsValidationExceptionWhenValueExceedsLimit() {
        TextNode value = new TextNode("a".repeat(MAX_VALUE_BYTES - 1));
        GlobalVariableRequestDTO request = GlobalVariableFixture.aRequest("big", value, null);

        assertThat(violationsOf(() -> service.create(request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("value", Code.VALUE_TOO_LARGE));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void createAcceptsValueWhenSizeEqualsLimit() {
        TextNode value = new TextNode("a".repeat(MAX_VALUE_BYTES - 2));

        service.create(GlobalVariableFixture.aRequest("fits", value, null));

        assertThat(savedVariable().getValue()).hasSize(MAX_VALUE_BYTES);
    }

    @Test
    void createThrowsValidationExceptionWhenScopeCategoryDoesNotExist() {
        when(categoryRepository.existsById(3)).thenReturn(true);
        when(categoryRepository.existsById(4)).thenReturn(false);
        GlobalVariableRequestDTO request = new GlobalVariableRequestDTO("tenants", GlobalVariableKind.CONSTANT,
                null, new TextNode("x"), false,
                new GlobalVariableRequestDTO.Scope(GlobalVariableScopeType.CATEGORIES, List.of(3L, 4L), null), null, null, null);

        List<Violation> violations = violationsOf(() -> service.create(request));

        assertThat(violations)
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("scope", Code.SCOPE_INVALID));
        assertThat(violations.get(0).message()).contains("4");
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void createStoresCategoryTargetsWhenScopeIsCategories() {
        when(categoryRepository.existsById(3)).thenReturn(true);
        GlobalVariableRequestDTO request = new GlobalVariableRequestDTO("tenants", GlobalVariableKind.CONSTANT,
                null, new TextNode("x"), false,
                new GlobalVariableRequestDTO.Scope(GlobalVariableScopeType.CATEGORIES, List.of(3L), List.of(9L)), null, null, null);

        service.create(request);

        GlobalVariable saved = savedVariable();
        assertThat(saved.getScopeType()).isEqualTo(GlobalVariableScopeType.CATEGORIES);
        assertThat(saved.getScopeTargets()).containsExactly(GlobalVariableScopeTarget.category(3));
    }

    @Test
    @DisplayName("create — every invalid field is reported in one answer")
    void createReportsEveryViolationWhenSeveralFieldsAreInvalid() {
        GlobalVariableRequestDTO request = new GlobalVariableRequestDTO(
                "1bad", GlobalVariableKind.CONSTANT, "d".repeat(513), new TextNode("x"), true, null, null, null, null);

        assertThat(violationsOf(() -> service.create(request)))
                .extracting(Violation::code)
                .containsExactlyInAnyOrder(Code.NAME_INVALID, Code.DESCRIPTION_TOO_LONG, Code.SCOPE_REQUIRED);
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void updateThrowsConflictExceptionWhenVersionIsStale() {
        givenExistingVariable();
        when(mapper.userName(any())).thenReturn(Optional.of("admin"));
        GlobalVariableRequestDTO request = GlobalVariableFixture.aRequest("idoitUrl", new TextNode("new"), VERSION - 1);

        GlobalVariableConflictException conflict =
                catchThrowableOfType(() -> service.update(VARIABLE_ID, request), GlobalVariableConflictException.class);

        assertThat(conflict.getCode()).isEqualTo(GlobalVariableConflictException.Code.VERSION_CONFLICT);
        assertThat(conflict.getCurrentVersion()).isEqualTo(VERSION);
        assertThat(conflict).hasMessageContaining("Changed by admin").hasMessageContaining("reload");
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void updateThrowsValidationExceptionWhenVersionIsMissing() {
        givenExistingVariable();
        GlobalVariableRequestDTO request = GlobalVariableFixture.aRequest("idoitUrl", new TextNode("new"), null);

        assertThat(violationsOf(() -> service.update(VARIABLE_ID, request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("version", Code.VERSION_REQUIRED));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void updateThrowsValidationExceptionWhenKindChanges() {
        givenExistingVariable();
        GlobalVariableRequestDTO request = new GlobalVariableRequestDTO("idoitUrl", GlobalVariableKind.SCRIPT,
                null, new TextNode("old"), false, GlobalVariableFixture.aScopeOfAll(), null, null, VERSION);

        assertThat(violationsOf(() -> service.update(VARIABLE_ID, request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("kind", Code.KIND_CHANGE_NOT_ALLOWED));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void updateWritesValueChangeWhenOnlyValueChanges() {
        GlobalVariable variable = givenExistingVariable();

        service.update(VARIABLE_ID, GlobalVariableFixture.aRequest("idoitUrl", new TextNode("new"), VERSION));

        assertThat(variable.getValue()).isEqualTo("\"new\"");
        GlobalVariableChange change = savedChanges(1).get(0);
        assertThat(change.getChangeType()).isEqualTo(GlobalVariableChange.Type.VALUE);
        assertThat(change.getOldValue()).isEqualTo("\"old\"");
        assertThat(change.getNewValue()).isEqualTo("\"new\"");
        assertThat(change.getVersionFrom()).isEqualTo(VERSION);
        assertThat(change.getVersionTo()).isEqualTo(VERSION + 1);
    }

    @Test
    void updateWritesConfigChangeWhenScopeChanges() throws Exception {
        GlobalVariable variable = givenExistingVariable();
        when(connectionRepository.existsById(9L)).thenReturn(true);
        GlobalVariableRequestDTO request = new GlobalVariableRequestDTO("idoitUrl", GlobalVariableKind.CONSTANT,
                null, new TextNode("old"), false,
                new GlobalVariableRequestDTO.Scope(GlobalVariableScopeType.WORKFLOWS, null, List.of(9L)), null, null, VERSION);

        service.update(VARIABLE_ID, request);

        assertThat(variable.getScopeType()).isEqualTo(GlobalVariableScopeType.WORKFLOWS);
        assertThat(variable.getScopeTargets()).containsExactly(GlobalVariableScopeTarget.workflow(9));
        GlobalVariableChange change = savedChanges(1).get(0);
        assertThat(change.getChangeType()).isEqualTo(GlobalVariableChange.Type.CONFIG);
        JsonNode before = json.readTree(change.getOldValue());
        JsonNode after = json.readTree(change.getNewValue());
        assertThat(before.at("/scope/type").asText()).isEqualTo("ALL");
        assertThat(after.at("/scope/type").asText()).isEqualTo("WORKFLOWS");
        assertThat(after.at("/scope/workflowIds/0").asLong()).isEqualTo(9L);
    }

    @Test
    @DisplayName("update — one save, one version step, a VALUE entry and a CONFIG entry")
    void updateWritesTwoChangesWhenValueAndDescriptionChange() {
        givenExistingVariable();
        GlobalVariableRequestDTO request = new GlobalVariableRequestDTO("idoitUrl", GlobalVariableKind.CONSTANT,
                "i-doit endpoint", new TextNode("new"), false, GlobalVariableFixture.aScopeOfAll(), null, null, VERSION);

        service.update(VARIABLE_ID, request);

        assertThat(savedChanges(2))
                .extracting(GlobalVariableChange::getChangeType,
                        GlobalVariableChange::getVersionFrom, GlobalVariableChange::getVersionTo)
                .containsExactly(
                        tuple(GlobalVariableChange.Type.VALUE, VERSION, VERSION + 1),
                        tuple(GlobalVariableChange.Type.CONFIG, VERSION, VERSION + 1));
        verify(repository, times(1)).saveAndFlush(any());
    }

    @Test
    void updateSavesNothingWhenRequestChangesNothing() {
        GlobalVariable variable = givenExistingVariable();

        service.update(VARIABLE_ID, GlobalVariableFixture.aRequest("idoitUrl", new TextNode("old"), VERSION));

        assertThat(variable.getVersion()).isEqualTo(VERSION);
        verify(repository, never()).saveAndFlush(any());
        verifyNoInteractions(changeRepository);
    }

    @Test
    @DisplayName("update — a new spelling of its own name is a rename, not a taken name")
    void updateAcceptsRenameWhenOnlyCaseChanges() {
        GlobalVariable variable = givenExistingVariable();

        service.update(VARIABLE_ID, GlobalVariableFixture.aRequest("IdoitURL", new TextNode("old"), VERSION));

        assertThat(variable.getName()).isEqualTo("IdoitURL");
        assertThat(savedChanges(1).get(0).getChangeType()).isEqualTo(GlobalVariableChange.Type.CONFIG);
        verify(repository, never()).existsByNameIgnoreCase(anyString());
    }

    @Test
    void updateThrowsValidationExceptionWhenNewNameIsTaken() {
        givenExistingVariable();
        when(repository.existsByNameIgnoreCase("lastSync")).thenReturn(true);
        GlobalVariableRequestDTO request = GlobalVariableFixture.aRequest("lastSync", new TextNode("old"), VERSION);

        assertThat(violationsOf(() -> service.update(VARIABLE_ID, request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("name", Code.NAME_TAKEN));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("update — a change another transaction committed first is a version conflict")
    void updateThrowsConflictExceptionWhenConcurrentChangeWins() {
        givenExistingVariable();
        doThrow(new ObjectOptimisticLockingFailureException(GlobalVariable.class, VARIABLE_ID))
                .when(repository).saveAndFlush(any());
        GlobalVariableRequestDTO request = GlobalVariableFixture.aRequest("idoitUrl", new TextNode("new"), VERSION);

        GlobalVariableConflictException conflict =
                catchThrowableOfType(() -> service.update(VARIABLE_ID, request), GlobalVariableConflictException.class);

        assertThat(conflict.getCode()).isEqualTo(GlobalVariableConflictException.Code.VERSION_CONFLICT);
        assertThat(conflict.getCurrentVersion()).isEqualTo(VERSION);
        assertThat(conflict).hasMessageContaining("idoitUrl").hasMessageContaining("changed meanwhile");
        verifyNoInteractions(changeRepository);
    }

    @Test
    void updateThrowsGeneralServiceExceptionWhenCallerLacksEdit() {
        givenExistingVariable();
        when(security.permissionsOn(any(), any())).thenReturn(EnumSet.of(GlobalVariablePermission.VIEW_USE));
        GlobalVariableRequestDTO request = GlobalVariableFixture.aRequest("idoitUrl", new TextNode("new"), VERSION);

        GeneralServiceException forbidden =
                catchThrowableOfType(() -> service.update(VARIABLE_ID, request), GeneralServiceException.class);

        assertThat(forbidden.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(forbidden).hasMessageContaining("EDIT").hasMessageContaining("idoitUrl");
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void updateThrowsGeneralServiceExceptionWhenVariableDoesNotExist() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        GlobalVariableRequestDTO request = GlobalVariableFixture.aRequest("idoitUrl", new TextNode("new"), VERSION);

        GeneralServiceException notFound =
                catchThrowableOfType(() -> service.update(99L, request), GeneralServiceException.class);

        assertThat(notFound.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(notFound).hasMessageContaining("99");
    }

    // ── delete and read ───────────────────────────────────────────────────────

    @Test
    void deleteWritesDeleteChangeWhenVariableIsDeleted() {
        GlobalVariable variable = givenExistingVariable();

        service.delete(VARIABLE_ID);

        GlobalVariableChange change = savedChanges(1).get(0);
        assertThat(change.getChangeType()).isEqualTo(GlobalVariableChange.Type.DELETE);
        assertThat(change.getVariableName()).isEqualTo("idoitUrl");
        assertThat(change.getVersionFrom()).isEqualTo(VERSION);
        assertThat(change.getVersionTo()).isNull();
        assertThat(change.getOldValue()).isEqualTo("\"old\"");
        assertThat(change.getNewValue()).isNull();
        verify(repository).delete(variable);
    }

    @Test
    void deleteThrowsGeneralServiceExceptionWhenCallerLacksDelete() {
        givenExistingVariable();
        when(security.permissionsOn(any(), any()))
                .thenReturn(EnumSet.of(GlobalVariablePermission.VIEW_USE, GlobalVariablePermission.EDIT));

        GeneralServiceException forbidden =
                catchThrowableOfType(() -> service.delete(VARIABLE_ID), GeneralServiceException.class);

        assertThat(forbidden.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(forbidden).hasMessageContaining("DELETE");
        verify(repository, never()).delete(any());
        verifyNoInteractions(changeRepository);
    }

    @Test
    void getByIdThrowsGeneralServiceExceptionWhenCallerLacksViewUse() {
        givenExistingVariable();
        when(security.permissionsOn(any(), any())).thenReturn(EnumSet.noneOf(GlobalVariablePermission.class));

        GeneralServiceException forbidden =
                catchThrowableOfType(() -> service.getById(VARIABLE_ID), GeneralServiceException.class);

        assertThat(forbidden.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(forbidden).hasMessageContaining("VIEW_USE");
        verifyNoInteractions(mapper);
    }

    @Test
    @DisplayName("findAll — an admin searches the variables of every user")
    void findAllSearchesEveryOwnerWhenCallerIsAdmin() {
        when(security.caller()).thenReturn(Optional.of(new Caller(OWNER_ID, true)));
        when(repository.search(any(), any(), any(), any())).thenReturn(Page.empty());

        service.findAll(null, GlobalVariableKind.CONSTANT, 0, 20, "name,asc");

        verify(repository).search(eq(GlobalVariableKind.CONSTANT), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void findAllRestrictsToCallerWhenCallerIsNotAdmin() {
        when(repository.search(any(), any(), any(), any())).thenReturn(Page.empty());

        service.findAll(null, null, 0, 20, "name,asc");

        verify(repository).search(isNull(), isNull(), eq(OWNER_ID), any(Pageable.class));
    }

    @Test
    @DisplayName("findAll — '%', '_' and '!' of the search text are matched as typed")
    void findAllEscapesWildcardsWhenSearchHoldsThem() {
        when(repository.search(any(), any(), any(), any())).thenReturn(Page.empty());

        service.findAll(" 50%_Off! ", null, 0, 20, "name,asc");

        verify(repository).search(isNull(), eq("%50!%!_off!!%"), eq(OWNER_ID), any(Pageable.class));
    }

    @Test
    @DisplayName("findAll — an unknown sort property falls back to the name and keeps the direction")
    void findAllSortsByNameWhenSortPropertyIsUnknown() {
        when(repository.search(any(), any(), any(), any())).thenReturn(Page.empty());

        service.findAll(null, null, 0, 20, "value,desc");

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).search(any(), any(), any(), pageable.capture());
        assertThat(pageable.getValue().getSort())
                .isEqualTo(Sort.by(Sort.Direction.DESC, "name").and(Sort.by("id")));
    }

    @Test
    void findAllCapsPageSizeWhenSizeExceedsMaximum() {
        when(repository.search(any(), any(), any(), any())).thenReturn(Page.empty());

        service.findAll(null, null, 0, 5000, "name,asc");

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).search(any(), any(), any(), pageable.capture());
        assertThat(pageable.getValue().getPageSize()).isEqualTo(100);
    }

    // ── usages ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("delete — a used variable stays, and the answer lists what uses it")
    void deleteThrowsConflictExceptionWhenVariableIsUsed() {
        givenExistingVariable();
        givenUsageBy(42L);

        GlobalVariableConflictException conflict =
                catchThrowableOfType(() -> service.delete(VARIABLE_ID), GlobalVariableConflictException.class);

        assertThat(conflict.getCode()).isEqualTo(GlobalVariableConflictException.Code.IN_USE);
        assertThat(conflict.getCurrentVersion()).isEqualTo(VERSION);
        assertThat(conflict).hasMessageContaining("'idoitUrl'").hasMessageContaining("cannot be deleted");
        assertThat(conflict.getBlocking())
                .extracting(GlobalVariableConflictException.Blocking::sourceType,
                        GlobalVariableConflictException.Blocking::sourceId,
                        GlobalVariableConflictException.Blocking::sourceTitle,
                        GlobalVariableConflictException.Blocking::index,
                        GlobalVariableConflictException.Blocking::reason)
                .containsExactly(tuple("WORKFLOW", 42L, "workflow-42", "0_1", "IN_USE"));
        verify(repository, never()).delete(any());
        verifyNoInteractions(changeRepository);
    }

    @Test
    @DisplayName("update — references hold the name, so a used variable keeps it")
    void updateThrowsConflictExceptionWhenUsedVariableIsRenamed() {
        givenExistingVariable();
        givenUsageBy(42L);
        GlobalVariableRequestDTO request = GlobalVariableFixture.aRequest("cmdbUrl", new TextNode("old"), VERSION);

        GlobalVariableConflictException conflict =
                catchThrowableOfType(() -> service.update(VARIABLE_ID, request), GlobalVariableConflictException.class);

        assertThat(conflict.getCode()).isEqualTo(GlobalVariableConflictException.Code.IN_USE);
        assertThat(conflict).hasMessageContaining("cannot be renamed");
        assertThat(conflict.getBlocking()).hasSize(1);
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("update — a new scope may not leave out a workflow that uses the variable")
    void updateThrowsConflictExceptionWhenNewScopeLeavesOutUsingWorkflow() {
        givenExistingVariable();
        givenUsageBy(42L, 43L);
        when(connectionRepository.existsById(42L)).thenReturn(true);

        GlobalVariableConflictException conflict = catchThrowableOfType(
                () -> service.update(VARIABLE_ID, aRequestScopedToWorkflow(42L)), GlobalVariableConflictException.class);

        assertThat(conflict.getCode()).isEqualTo(GlobalVariableConflictException.Code.SCOPE_NARROWING);
        assertThat(conflict.getBlocking())
                .extracting(GlobalVariableConflictException.Blocking::sourceId,
                        GlobalVariableConflictException.Blocking::reason)
                .containsExactly(tuple(43L, "OUT_OF_SCOPE"));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void updateAcceptsNewScopeWhenUsingWorkflowsStayInScope() {
        GlobalVariable variable = givenExistingVariable();
        when(usageService.findByVariable(VARIABLE_ID)).thenReturn(List.of(aUsageBy(42L)));
        when(connectionRepository.existsById(42L)).thenReturn(true);

        service.update(VARIABLE_ID, aRequestScopedToWorkflow(42L));

        assertThat(variable.getScopeType()).isEqualTo(GlobalVariableScopeType.WORKFLOWS);
        assertThat(savedChanges(1).get(0).getChangeType()).isEqualTo(GlobalVariableChange.Type.CONFIG);
    }

    @Test
    @DisplayName("delete — a variable a connector reads stays, and the answer names the request data field")
    void deleteThrowsConflictExceptionWhenConnectorUsesVariable() {
        givenExistingVariable();
        givenUsages(aUsageByConnector(CONNECTOR_ID));

        GlobalVariableConflictException conflict =
                catchThrowableOfType(() -> service.delete(VARIABLE_ID), GlobalVariableConflictException.class);

        assertThat(conflict.getCode()).isEqualTo(GlobalVariableConflictException.Code.IN_USE);
        assertThat(conflict).hasMessageContaining("'idoitUrl'").hasMessageContaining("cannot be deleted");
        assertThat(conflict.getBlocking())
                .extracting(GlobalVariableConflictException.Blocking::sourceType,
                        GlobalVariableConflictException.Blocking::sourceId,
                        GlobalVariableConflictException.Blocking::sourceTitle,
                        GlobalVariableConflictException.Blocking::elementType,
                        GlobalVariableConflictException.Blocking::field,
                        GlobalVariableConflictException.Blocking::reason)
                .containsExactly(tuple("CONNECTOR", CONNECTOR_ID, "connector-7", null, "url", "IN_USE"));
        verify(repository, never()).delete(any());
        verifyNoInteractions(changeRepository);
    }

    @Test
    @DisplayName("update — a connector is shared by every workflow, so only the scope ALL keeps it")
    void updateThrowsConflictExceptionWhenScopeNarrowsUnderConnector() {
        givenExistingVariable();
        givenUsages(aUsageByConnector(CONNECTOR_ID));
        when(connectionRepository.existsById(42L)).thenReturn(true);
        GlobalVariableRequestDTO request = aRequestScopedToWorkflow(42L);

        GlobalVariableConflictException conflict =
                catchThrowableOfType(() -> service.update(VARIABLE_ID, request), GlobalVariableConflictException.class);

        assertThat(conflict.getCode()).isEqualTo(GlobalVariableConflictException.Code.SCOPE_NARROWING);
        assertThat(conflict).hasMessageContaining("'idoitUrl'").hasMessageContaining("leaves out");
        assertThat(conflict.getBlocking())
                .extracting(GlobalVariableConflictException.Blocking::sourceType,
                        GlobalVariableConflictException.Blocking::sourceId,
                        GlobalVariableConflictException.Blocking::reason)
                .containsExactly(tuple("CONNECTOR", CONNECTOR_ID, "OUT_OF_SCOPE"));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("update — a change of the value alone does not look at the usages")
    void updateSkipsUsageLookupWhenNameAndScopeAreKept() {
        givenExistingVariable();

        service.update(VARIABLE_ID, GlobalVariableFixture.aRequest("idoitUrl", new TextNode("new"), VERSION));

        verify(usageService, never()).findByVariable(anyLong());
    }

    @Test
    void findAllAddsUsageCountsWhenVariablesAreUsed() {
        GlobalVariable used = GlobalVariableFixture.aConstant(5L, "idoitUrl", "1");
        GlobalVariable unused = GlobalVariableFixture.aConstant(6L, "tenant", "1");
        when(repository.search(any(), any(), any(), any())).thenReturn(new PageImpl<>(List.of(used, unused)));
        when(usageService.countByVariables(List.of(5L, 6L))).thenReturn(Map.of(5L, 3L));

        service.findAll(null, null, 0, 20, "name,asc");

        verify(mapper).toListItem(eq(used), any(), eq(3L), any());
        verify(mapper).toListItem(eq(unused), any(), eq(0L), any());
    }

    @Test
    void getUsagesReturnsMappedUsagesWhenCallerMayView() {
        givenExistingVariable();
        List<GlobalVariableUsageDTO> mapped = givenUsageBy(42L);

        List<GlobalVariableUsageDTO> usages = service.getUsages(VARIABLE_ID);

        assertThat(usages).isEqualTo(mapped);
    }

    @Test
    void getUsagesThrowsGeneralServiceExceptionWhenCallerLacksViewUse() {
        givenExistingVariable();
        when(security.permissionsOn(any(), any())).thenReturn(EnumSet.noneOf(GlobalVariablePermission.class));

        GeneralServiceException forbidden =
                catchThrowableOfType(() -> service.getUsages(VARIABLE_ID), GeneralServiceException.class);

        assertThat(forbidden.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(forbidden).hasMessageContaining("VIEW_USE");
        verifyNoInteractions(usageService);
    }

    // ── permissions ───────────────────────────────────────────────────────────

    @Test
    void updatePermissionsReplacesGrantsWhenRequestIsValid() {
        GlobalVariable variable = givenExistingVariable();
        variable.getGrants().add(new GlobalVariableGrant(7, GlobalVariablePermission.VIEW_USE));
        when(userRepository.existsById(GRANTEE_ID)).thenReturn(true);

        service.updatePermissions(VARIABLE_ID, aGrantRequest(
                new GrantRequest(GRANTEE_ID, Set.of(GlobalVariablePermission.VIEW_USE, GlobalVariablePermission.EDIT))));

        assertThat(variable.getGrants()).containsExactlyInAnyOrder(
                new GlobalVariableGrant(GRANTEE_ID, GlobalVariablePermission.VIEW_USE),
                new GlobalVariableGrant(GRANTEE_ID, GlobalVariablePermission.EDIT));
    }

    @Test
    void updatePermissionsWritesPermissionsChangeWhenGrantsChange() throws Exception {
        givenExistingVariable();
        when(userRepository.existsById(GRANTEE_ID)).thenReturn(true);

        service.updatePermissions(VARIABLE_ID,
                aGrantRequest(new GrantRequest(GRANTEE_ID, Set.of(GlobalVariablePermission.DELETE))));

        GlobalVariableChange change = savedChanges(1).get(0);
        assertThat(change.getChangeType()).isEqualTo(GlobalVariableChange.Type.PERMISSIONS);
        assertThat(change.getVersionFrom()).isEqualTo(VERSION);
        assertThat(change.getVersionTo()).isEqualTo(VERSION + 1);
        assertThat(json.readTree(change.getOldValue()).at("/grants")).isEmpty();
        JsonNode granted = json.readTree(change.getNewValue()).at("/grants/0");
        assertThat(granted.at("/userId").asInt()).isEqualTo(GRANTEE_ID);
        assertThat(granted.at("/permissions/0").asText()).isEqualTo("DELETE");
    }

    @Test
    void updatePermissionsSavesNothingWhenGrantsAreUnchanged() {
        GlobalVariable variable = givenExistingVariable();
        variable.getGrants().add(new GlobalVariableGrant(GRANTEE_ID, GlobalVariablePermission.VIEW_USE));
        when(userRepository.existsById(GRANTEE_ID)).thenReturn(true);

        service.updatePermissions(VARIABLE_ID,
                aGrantRequest(new GrantRequest(GRANTEE_ID, Set.of(GlobalVariablePermission.VIEW_USE))));

        verify(repository, never()).saveAndFlush(any());
        verifyNoInteractions(changeRepository);
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("invalidGrants")
    void updatePermissionsThrowsValidationExceptionWhenGrantIsInvalid(String reason, List<GrantRequest> grants) {
        givenExistingVariable();
        lenient().when(userRepository.existsById(GRANTEE_ID)).thenReturn(true);
        lenient().when(userRepository.existsById(404)).thenReturn(false);
        GlobalVariablePermissionsDTO.Request request = new GlobalVariablePermissionsDTO.Request(grants, VERSION);

        assertThat(violationsOf(() -> service.updatePermissions(VARIABLE_ID, request)))
                .extracting(Violation::code)
                .containsExactly(Code.GRANT_INVALID);
        verify(repository, never()).saveAndFlush(any());
    }

    static Stream<Arguments> invalidGrants() {
        Set<GlobalVariablePermission> viewUse = Set.of(GlobalVariablePermission.VIEW_USE);

        return Stream.of(
                Arguments.of("the owner", List.of(new GrantRequest(OWNER_ID, viewUse))),
                Arguments.of("a user listed twice",
                        List.of(new GrantRequest(GRANTEE_ID, viewUse), new GrantRequest(GRANTEE_ID, viewUse))),
                Arguments.of("an unknown user", List.of(new GrantRequest(404, viewUse))),
                Arguments.of("no permissions", List.of(new GrantRequest(GRANTEE_ID, Set.of()))),
                Arguments.of("no user", List.of(new GrantRequest(null, viewUse))));
    }

    @Test
    void updatePermissionsThrowsGeneralServiceExceptionWhenCallerIsNotOwnerOrAdmin() {
        givenExistingVariable();
        when(security.canManageGrants(any(), any())).thenReturn(false);

        GeneralServiceException forbidden = catchThrowableOfType(
                () -> service.updatePermissions(VARIABLE_ID, aGrantRequest()), GeneralServiceException.class);

        assertThat(forbidden.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(forbidden).hasMessageContaining("owner");
        verify(repository, never()).saveAndFlush(any());
    }

    // ── picker ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("pick — a workflow gets what is open to all, scoped to it or to a category above it")
    void pickListsVariablesInScopeWhenWorkflowIsGiven() {
        givenWorkflow(42L, 3);
        when(scopeResolver.categoryChainOf(3)).thenReturn(Set.of(3L, 1L));
        givenUsableVariables(
                GlobalVariableFixture.aConstant(1L, "forAll", "1"),
                aConstantScopedTo("forOtherCategory", GlobalVariableScopeTarget.category(9)),
                aConstantScopedTo("forOtherWorkflow", GlobalVariableScopeTarget.workflow(43)),
                aConstantScopedTo("forParentCategory", GlobalVariableScopeTarget.category(1)),
                aConstantScopedTo("forThisWorkflow", GlobalVariableScopeTarget.workflow(42)));

        List<GlobalVariablePickerItemDTO> items = service.pick(42L, null, null, null);

        assertThat(items)
                .extracting(GlobalVariablePickerItemDTO::name)
                .containsExactly("forAll", "forParentCategory", "forThisWorkflow");
    }

    @Test
    @DisplayName("pick — a workflow that is not saved yet has no id a variable could be scoped to")
    void pickMatchesCategoryAloneWhenWorkflowIsNotSavedYet() {
        when(scopeResolver.categoryChainOf(3)).thenReturn(Set.of(3L));
        givenUsableVariables(
                GlobalVariableFixture.aConstant(1L, "forAll", "1"),
                aConstantScopedTo("forCategory", GlobalVariableScopeTarget.category(3)),
                aConstantScopedTo("forOtherCategory", GlobalVariableScopeTarget.category(9)),
                aConstantScopedTo("forWorkflow", GlobalVariableScopeTarget.workflow(42)));

        List<GlobalVariablePickerItemDTO> items = service.pick(null, 3, null, null);

        assertThat(items).extracting(GlobalVariablePickerItemDTO::name).containsExactly("forAll", "forCategory");
    }

    @Test
    @DisplayName("pick — a connector is shared by workflows of any category, so no scoped variable fits it")
    void pickListsOnlyOpenVariablesWhenConnectorIsGiven() {
        // were the id of the connector taken for a category, the variable of category 7 would be listed
        lenient().when(scopeResolver.categoryChainOf(7)).thenReturn(Set.of(7L));
        givenUsableVariables(
                GlobalVariableFixture.aConstant(1L, "forAll", "1"),
                aConstantScopedTo("forCategory", GlobalVariableScopeTarget.category(7)),
                aConstantScopedTo("forWorkflow", GlobalVariableScopeTarget.workflow(7)));

        List<GlobalVariablePickerItemDTO> items = service.pick(null, null, 7, null);

        assertThat(items).extracting(GlobalVariablePickerItemDTO::name).containsExactly("forAll");
    }

    @Test
    void pickListsOnlyOpenVariablesWhenNothingIsGiven() {
        givenUsableVariables(
                GlobalVariableFixture.aConstant(1L, "forAll", "1"),
                aConstantScopedTo("forCategory", GlobalVariableScopeTarget.category(3)),
                aConstantScopedTo("forWorkflow", GlobalVariableScopeTarget.workflow(42)));

        List<GlobalVariablePickerItemDTO> items = service.pick(null, null, null, null);

        assertThat(items).extracting(GlobalVariablePickerItemDTO::name).containsExactly("forAll");
    }

    @Test
    @DisplayName("pick — a notification reads the variables of the workflow its schedule runs")
    void pickUsesWorkflowOfScheduleWhenSchedulerIsGiven() {
        Scheduler schedule = new Scheduler();
        schedule.setConnection(givenWorkflow(42L, null));
        when(schedulerRepository.findById(11)).thenReturn(Optional.of(schedule));
        givenUsableVariables(
                aConstantScopedTo("forOtherWorkflow", GlobalVariableScopeTarget.workflow(43)),
                aConstantScopedTo("forThisWorkflow", GlobalVariableScopeTarget.workflow(42)));

        List<GlobalVariablePickerItemDTO> items = service.pick(null, null, null, 11);

        assertThat(items).extracting(GlobalVariablePickerItemDTO::name).containsExactly("forThisWorkflow");
    }

    @Test
    void pickReturnsVariablesByNameWhenSeveralMatch() {
        givenUsableVariables(
                GlobalVariableFixture.aConstant(1L, "tenant", "1"),
                GlobalVariableFixture.aConstant(2L, "idoitUrl", "1"),
                GlobalVariableFixture.aConstant(3L, "lastSync", "1"));

        List<GlobalVariablePickerItemDTO> items = service.pick(null, null, null, null);

        assertThat(items)
                .extracting(GlobalVariablePickerItemDTO::name)
                .containsExactly("idoitUrl", "lastSync", "tenant");
    }

    @Test
    @DisplayName("pick — the repository is asked for what the caller owns or was granted")
    void pickRestrictsToCallerWhenCallerIsNotAdmin() {
        givenUsableVariables(GlobalVariableFixture.aConstant(1L, "idoitUrl", "1"));

        List<GlobalVariablePickerItemDTO> items = service.pick(null, null, null, null);

        assertThat(items).extracting(GlobalVariablePickerItemDTO::name).containsExactly("idoitUrl");
        verify(repository).findUsableWithScopeTargets(OWNER_ID);
    }

    @Test
    void pickThrowsValidationExceptionWhenSeveralTargetsAreGiven() {
        List<Violation> violations = violationsOf(() -> service.pick(42L, 3, null, null));

        assertThat(violations)
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("connectionId", Code.PICKER_TARGET_AMBIGUOUS));
        verify(repository, never()).findUsableWithScopeTargets(any());
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("missingPickerTargets")
    void pickThrowsGeneralServiceExceptionWhenTargetDoesNotExist(
            String target, Long connectionId, Integer schedulerId, String error) {
        lenient().when(connectionRepository.findById(99L)).thenReturn(Optional.empty());
        lenient().when(schedulerRepository.findById(99)).thenReturn(Optional.empty());

        GeneralServiceException notFound = catchThrowableOfType(
                () -> service.pick(connectionId, null, null, schedulerId), GeneralServiceException.class);

        assertThat(notFound.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(notFound.getError()).isEqualTo(error);
        assertThat(notFound).hasMessageContaining(target + " 99");
        verify(repository, never()).findUsableWithScopeTargets(any());
    }

    static Stream<Arguments> missingPickerTargets() {
        return Stream.of(
                Arguments.of("Workflow", 99L, null, "CONNECTION_NOT_FOUND"),
                Arguments.of("Schedule", null, 99, "SCHEDULER_NOT_FOUND"));
    }

    // ── usable variables ──────────────────────────────────────────────────────

    @Test
    @DisplayName("findUsable — a saved workflow gets what is open to all, scoped to it or to a category above it")
    void findUsableReturnsVariablesInScopeWhenWorkflowIsSaved() {
        givenRoleMayReadVariables();
        givenWorkflow(42L, 3);
        when(scopeResolver.categoryChainOf(3)).thenReturn(Set.of(3L, 1L));
        givenUsableVariables(
                GlobalVariableFixture.aConstant(1L, "forAll", "1"),
                aConstantScopedTo("forOtherCategory", GlobalVariableScopeTarget.category(9)),
                aConstantScopedTo("forOtherWorkflow", GlobalVariableScopeTarget.workflow(43)),
                aConstantScopedTo("forParentCategory", GlobalVariableScopeTarget.category(1)),
                aConstantScopedTo("forThisWorkflow", GlobalVariableScopeTarget.workflow(42)));

        List<GlobalVariable> variables = service.findUsable(42L, null);

        assertThat(variables)
                .extracting(GlobalVariable::getName)
                .containsExactlyInAnyOrder("forAll", "forParentCategory", "forThisWorkflow");
    }

    @Test
    @DisplayName("findUsable — a workflow that is not saved yet is matched by its category chain alone")
    void findUsableMatchesCategoryChainWhenWorkflowIsNotSaved() {
        givenRoleMayReadVariables();
        when(scopeResolver.categoryChainOf(3)).thenReturn(Set.of(3L, 1L));
        givenUsableVariables(
                GlobalVariableFixture.aConstant(1L, "forAll", "1"),
                aConstantScopedTo("forParentCategory", GlobalVariableScopeTarget.category(1)),
                aConstantScopedTo("forOtherCategory", GlobalVariableScopeTarget.category(9)),
                aConstantScopedTo("forWorkflow", GlobalVariableScopeTarget.workflow(42)));

        List<GlobalVariable> variables = service.findUsable(null, 3);

        assertThat(variables)
                .extracting(GlobalVariable::getName)
                .containsExactlyInAnyOrder("forAll", "forParentCategory");
    }

    @Test
    void findUsableReturnsOnlyOpenVariablesWhenNothingIsGiven() {
        givenRoleMayReadVariables();
        givenUsableVariables(
                GlobalVariableFixture.aConstant(1L, "forAll", "1"),
                aConstantScopedTo("forCategory", GlobalVariableScopeTarget.category(3)),
                aConstantScopedTo("forWorkflow", GlobalVariableScopeTarget.workflow(42)));

        List<GlobalVariable> variables = service.findUsable(null, null);

        assertThat(variables).extracting(GlobalVariable::getName).containsExactly("forAll");
    }

    @Test
    @DisplayName("findUsable — an admin may use the variables of every user")
    void findUsableQueriesEveryUserWhenCallerIsAdmin() {
        when(security.caller()).thenReturn(Optional.of(new Caller(OWNER_ID, true)));
        givenRoleMayReadVariables();
        GlobalVariable ofAnotherUser = GlobalVariableFixture.aConstant(1L, "ofAnotherUser", "1");
        ofAnotherUser.setOwnerUserId(GRANTEE_ID);
        when(repository.findUsableWithScopeTargets(null)).thenReturn(List.of(ofAnotherUser));

        List<GlobalVariable> variables = service.findUsable(null, null);

        assertThat(variables).extracting(GlobalVariable::getName).containsExactly("ofAnotherUser");
    }

    @Test
    @DisplayName("findUsable — whose role does not open the picker uses no variable; the store is not read")
    void findUsableReturnsEmptyListWhenRoleLacksReadPermission() {
        when(security.can("READ")).thenReturn(false);

        List<GlobalVariable> variables = service.findUsable(null, null);

        assertThat(variables).isEmpty();
        verify(repository, never()).findUsableWithScopeTargets(any());
    }

    @Test
    void findUsableThrowsValidationExceptionWhenBothParametersAreGiven() {
        List<Violation> violations = violationsOf(() -> service.findUsable(42L, 3));

        assertThat(violations)
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("connectionId", Code.PICKER_TARGET_AMBIGUOUS));
        verify(repository, never()).findUsableWithScopeTargets(any());
    }

    @Test
    void findUsableThrowsGeneralServiceExceptionWhenWorkflowDoesNotExist() {
        when(connectionRepository.findById(99L)).thenReturn(Optional.empty());

        GeneralServiceException notFound = catchThrowableOfType(
                () -> service.findUsable(99L, null), GeneralServiceException.class);

        assertThat(notFound.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(notFound.getError()).isEqualTo("CONNECTION_NOT_FOUND");
        assertThat(notFound).hasMessageContaining("Workflow 99");
    }

    @Test
    void findUsableThrowsGeneralServiceExceptionWhenNoUserIsAuthenticated() {
        when(security.caller()).thenReturn(Optional.empty());

        GeneralServiceException unauthorized = catchThrowableOfType(
                () -> service.findUsable(null, null), GeneralServiceException.class);

        assertThat(unauthorized.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(unauthorized).hasMessageContaining("No authenticated user");
        verify(repository, never()).findUsableWithScopeTargets(any());
    }

    // ── values ────────────────────────────────────────────────────────────────

    @Test
    void getValuesReturnsValuesByIdWhenVariablesAreViewable() {
        givenViewableVariables(
                GlobalVariableFixture.aConstant(12L, "tenant", "1"),
                GlobalVariableFixture.aConstant(7L, "idoitUrl", "1"));

        List<GlobalVariableValueDTO> values = service.getValues(List.of(12L, 7L));

        assertThat(values).extracting(GlobalVariableValueDTO::id).containsExactly(7L, 12L);
    }

    @Test
    void getValuesSaysWhichRunUpdatesMutableWhenOwnerWorkflowRuns() {
        Instant started = Instant.parse("2026-11-20T10:00:00Z");
        when(runGate.holdOf(42L)).thenReturn(Optional.of(new WorkflowRunGate.Hold(42L, 511L, started)));
        givenViewableVariables(
                GlobalVariableFixture.aMutable(12L, "lastSync", "0", "1", 42L),
                GlobalVariableFixture.aConstant(7L, "idoitUrl", "1"));

        List<GlobalVariableValueDTO> values = service.getValues(List.of(12L, 7L));

        assertThat(values).extracting(GlobalVariableValueDTO::beingUpdatedBy).containsExactly(
                null, new GlobalVariableDTO.BeingUpdatedBy(42L, 511L, started));
    }

    @Test
    void getValuesLeavesBeingUpdatedByOutWhenOwnerWorkflowIsIdle() {
        when(runGate.holdOf(42L)).thenReturn(Optional.empty());
        givenViewableVariables(GlobalVariableFixture.aMutable(12L, "lastSync", "0", "1", 42L));

        List<GlobalVariableValueDTO> values = service.getValues(List.of(12L));

        assertThat(values).extracting(GlobalVariableValueDTO::beingUpdatedBy).containsOnlyNulls();
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("noIds")
    void getValuesThrowsValidationExceptionWhenNoIdIsGiven(String given, List<Long> ids) {
        assertThat(violationsOf(() -> service.getValues(ids)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("ids", Code.IDS_REQUIRED));
        verify(repository, never()).findViewableByIds(any(), any());
    }

    static Stream<Arguments> noIds() {
        return Stream.of(
                Arguments.of("no list", null),
                Arguments.of("an empty list", List.of()),
                Arguments.of("a list of nulls", Arrays.asList(null, null)));
    }

    @Test
    void getValuesThrowsValidationExceptionWhenMoreThan100IdsAreGiven() {
        List<Long> ids = LongStream.rangeClosed(1, 101).boxed().toList();

        List<Violation> violations = violationsOf(() -> service.getValues(ids));

        assertThat(violations)
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("ids", Code.TOO_MANY_IDS));
        assertThat(violations.get(0).message()).contains("100");
        verify(repository, never()).findViewableByIds(any(), any());
    }

    @Test
    void getValuesAcceptsRequestWhen100IdsAreGiven() {
        givenViewableVariables(GlobalVariableFixture.aConstant(100L, "idoitUrl", "1"));
        List<Long> ids = LongStream.rangeClosed(1, 100).boxed().toList();

        List<GlobalVariableValueDTO> values = service.getValues(ids);

        assertThat(values).extracting(GlobalVariableValueDTO::id).containsExactly(100L);
        verify(repository).findViewableByIds(askedIds.capture(), any());
        assertThat(askedIds.getValue()).hasSize(100);
    }

    @Test
    void getValuesThrowsValidationExceptionWhenVariableIsScript() {
        GlobalVariable script = GlobalVariableFixture.aConstant(7L, "buildTitle", null);
        script.setKind(GlobalVariableKind.SCRIPT);
        givenViewableVariables(GlobalVariableFixture.aConstant(5L, "idoitUrl", "1"), script);

        List<Violation> violations = violationsOf(() -> service.getValues(List.of(5L, 7L)));

        assertThat(violations)
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("ids", Code.SCRIPT_HAS_NO_VALUE));
        assertThat(violations.get(0).message()).contains("buildTitle");
        verify(mapper, never()).toValue(any(), any());
    }

    @Test
    @DisplayName("getValues — an id that is given several times is looked up once")
    void getValuesAsksOnceWhenIdIsGivenTwice() {
        service.getValues(List.of(7L, 12L, 7L));

        verify(repository).findViewableByIds(askedIds.capture(), any());
        assertThat(askedIds.getValue()).containsExactlyInAnyOrder(7L, 12L);
    }

    @Test
    @DisplayName("getValues — the repository is asked for what the caller owns or was granted")
    void getValuesRestrictsToCallerWhenCallerIsNotAdmin() {
        givenViewableVariables(GlobalVariableFixture.aConstant(7L, "idoitUrl", "1"));

        List<GlobalVariableValueDTO> values = service.getValues(List.of(7L));

        assertThat(values).extracting(GlobalVariableValueDTO::id).containsExactly(7L);
        verify(repository).findViewableByIds(any(), eq(OWNER_ID));
    }

    // ── impact ────────────────────────────────────────────────────────────────

    @Test
    void impactReturnsUsagesAsInUseWhenDeleteIsAsked() {
        givenExistingVariable();
        givenUsageBy(42L);

        GlobalVariableImpactDTO impact =
                service.impact(VARIABLE_ID, new GlobalVariableImpactDTO.Request(true, null, null));

        assertThat(impact.blocking())
                .extracting(GlobalVariableConflictException.Blocking::sourceType,
                        GlobalVariableConflictException.Blocking::sourceId,
                        GlobalVariableConflictException.Blocking::sourceTitle,
                        GlobalVariableConflictException.Blocking::index,
                        GlobalVariableConflictException.Blocking::reason)
                .containsExactly(tuple("WORKFLOW", 42L, "workflow-42", "0_1", "IN_USE"));
        assertThat(impact.warnings()).isEmpty();
    }

    @Test
    void impactReturnsUsagesAsInUseWhenNameChanges() {
        givenExistingVariable();
        givenUsageBy(42L);

        GlobalVariableImpactDTO impact =
                service.impact(VARIABLE_ID, new GlobalVariableImpactDTO.Request(null, "cmdbUrl", null));

        assertThat(impact.blocking())
                .extracting(GlobalVariableConflictException.Blocking::sourceId,
                        GlobalVariableConflictException.Blocking::reason)
                .containsExactly(tuple(42L, "IN_USE"));
    }

    @Test
    void impactReturnsLeftOutWorkflowsAsOutOfScopeWhenScopeNarrows() {
        givenExistingVariable();
        givenUsageBy(42L, 43L);
        when(connectionRepository.existsById(42L)).thenReturn(true);

        GlobalVariableImpactDTO impact = service.impact(VARIABLE_ID,
                new GlobalVariableImpactDTO.Request(null, "idoitUrl", aScopeOfWorkflow(42L)));

        assertThat(impact.blocking())
                .extracting(GlobalVariableConflictException.Blocking::sourceId,
                        GlobalVariableConflictException.Blocking::reason)
                .containsExactly(tuple(43L, "OUT_OF_SCOPE"));
    }

    @Test
    @DisplayName("impact — a rename blocks on every usage, the new scope on the workflow it leaves out")
    void impactReturnsBothReasonsWhenNameAndScopeChange() {
        givenExistingVariable();
        givenUsageBy(42L, 43L);
        when(connectionRepository.existsById(42L)).thenReturn(true);

        GlobalVariableImpactDTO impact = service.impact(VARIABLE_ID,
                new GlobalVariableImpactDTO.Request(null, "cmdbUrl", aScopeOfWorkflow(42L)));

        assertThat(impact.blocking())
                .extracting(GlobalVariableConflictException.Blocking::sourceId,
                        GlobalVariableConflictException.Blocking::reason)
                .containsExactly(tuple(42L, "IN_USE"), tuple(43L, "IN_USE"), tuple(43L, "OUT_OF_SCOPE"));
    }

    @Test
    @DisplayName("impact — a scope of categories leaves a connector out as much as one of workflows does")
    void impactReturnsConnectorAsOutOfScopeWhenScopeIsNotAll() {
        givenExistingVariable();
        givenUsages(aUsageByConnector(CONNECTOR_ID));
        when(categoryRepository.existsById(3)).thenReturn(true);
        GlobalVariableRequestDTO.Scope categories =
                new GlobalVariableRequestDTO.Scope(GlobalVariableScopeType.CATEGORIES, List.of(3L), null);

        GlobalVariableImpactDTO impact =
                service.impact(VARIABLE_ID, new GlobalVariableImpactDTO.Request(null, "idoitUrl", categories));

        assertThat(impact.blocking())
                .extracting(GlobalVariableConflictException.Blocking::sourceType,
                        GlobalVariableConflictException.Blocking::sourceId,
                        GlobalVariableConflictException.Blocking::field,
                        GlobalVariableConflictException.Blocking::reason)
                .containsExactly(tuple("CONNECTOR", CONNECTOR_ID, "url", "OUT_OF_SCOPE"));
    }

    @Test
    @DisplayName("impact — a notification follows the workflow its schedule runs")
    void impactReturnsNotificationAsOutOfScopeWhenScopeLeavesOutItsWorkflow() {
        givenExistingVariable();
        givenUsages(aUsageByNotification(NOTIFICATION_ID));
        when(usageService.workflowOfNotification(NOTIFICATION_ID)).thenReturn(Optional.of(43L));
        when(connectionRepository.existsById(42L)).thenReturn(true);

        GlobalVariableImpactDTO impact = service.impact(VARIABLE_ID,
                new GlobalVariableImpactDTO.Request(null, "idoitUrl", aScopeOfWorkflow(42L)));

        assertThat(impact.blocking())
                .extracting(GlobalVariableConflictException.Blocking::sourceType,
                        GlobalVariableConflictException.Blocking::sourceId,
                        GlobalVariableConflictException.Blocking::elementLabel,
                        GlobalVariableConflictException.Blocking::field,
                        GlobalVariableConflictException.Blocking::reason)
                .containsExactly(tuple("NOTIFICATION", NOTIFICATION_ID, "Failure template", "en.body", "OUT_OF_SCOPE"));
    }

    @Test
    void impactKeepsNotificationWhenScopeCoversItsWorkflow() {
        givenExistingVariable();
        givenUsages(aUsageByNotification(NOTIFICATION_ID));
        when(usageService.workflowOfNotification(NOTIFICATION_ID)).thenReturn(Optional.of(42L));
        when(connectionRepository.existsById(42L)).thenReturn(true);

        GlobalVariableImpactDTO impact = service.impact(VARIABLE_ID,
                new GlobalVariableImpactDTO.Request(null, "idoitUrl", aScopeOfWorkflow(42L)));

        assertThat(impact.blocking()).isEmpty();
    }

    @Test
    @DisplayName("impact — a notification that is gone uses nothing, so it blocks no scope")
    void impactKeepsNotificationWhenNotificationIsGone() {
        givenExistingVariable();
        givenUsages(aUsageByNotification(NOTIFICATION_ID));
        when(usageService.workflowOfNotification(NOTIFICATION_ID)).thenReturn(Optional.empty());
        when(connectionRepository.existsById(42L)).thenReturn(true);

        GlobalVariableImpactDTO impact = service.impact(VARIABLE_ID,
                new GlobalVariableImpactDTO.Request(null, "idoitUrl", aScopeOfWorkflow(42L)));

        assertThat(impact.blocking()).isEmpty();
    }

    @Test
    void impactReadsNoUsagesWhenRequestKeepsNameAndScope() {
        givenExistingVariable();

        GlobalVariableImpactDTO impact = service.impact(VARIABLE_ID,
                new GlobalVariableImpactDTO.Request(false, "idoitUrl", GlobalVariableFixture.aScopeOfAll()));

        assertThat(impact.blocking()).isEmpty();
        verify(usageService, never()).findByVariable(anyLong());
    }

    @Test
    @DisplayName("impact — a rename the update would refuse is only told, the variable stays as it is")
    void impactSavesNothingWhenChangeWouldBlock() {
        GlobalVariable variable = givenExistingVariable();
        givenUsageBy(42L);

        service.impact(VARIABLE_ID, new GlobalVariableImpactDTO.Request(null, "cmdbUrl", null));

        assertThat(variable.getName()).isEqualTo("idoitUrl");
        assertThat(variable.getVersion()).isEqualTo(VERSION);
        verify(repository, never()).saveAndFlush(any());
        verify(repository, never()).delete(any());
        verifyNoInteractions(changeRepository);
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("impactsWithoutPermission")
    void impactThrowsGeneralServiceExceptionWhenCallerLacksPermission(String asked,
            GlobalVariableImpactDTO.Request request, Set<GlobalVariablePermission> held,
            GlobalVariablePermission needed) {
        givenExistingVariable();
        when(security.permissionsOn(any(), any())).thenReturn(held);

        GeneralServiceException forbidden =
                catchThrowableOfType(() -> service.impact(VARIABLE_ID, request), GeneralServiceException.class);

        assertThat(forbidden.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(forbidden).hasMessageContaining("no " + needed + " permission");
        verifyNoInteractions(usageService);
    }

    static Stream<Arguments> impactsWithoutPermission() {
        return Stream.of(
                Arguments.of("a delete without DELETE", new GlobalVariableImpactDTO.Request(true, null, null),
                        EnumSet.of(GlobalVariablePermission.VIEW_USE, GlobalVariablePermission.EDIT),
                        GlobalVariablePermission.DELETE),
                Arguments.of("a change without EDIT", new GlobalVariableImpactDTO.Request(null, "cmdbUrl", null),
                        EnumSet.of(GlobalVariablePermission.VIEW_USE, GlobalVariablePermission.DELETE),
                        GlobalVariablePermission.EDIT));
    }

    // ── restore ───────────────────────────────────────────────────────────────

    @Test
    void restoreSetsValueOfEntryWhenEntryIsRestorable() {
        GlobalVariable variable = givenExistingVariable();
        givenChange(variable, GlobalVariableChange.Type.VALUE, "\"earlier\"");

        service.restore(VARIABLE_ID, CHANGE_ID, new GlobalVariableRestoreRequestDTO(VERSION));

        assertThat(savedVariable().getValue()).isEqualTo("\"earlier\"");
    }

    @Test
    void restoreWritesRestoreChangeWhenValueIsRestored() {
        GlobalVariable variable = givenExistingVariable();
        givenChange(variable, GlobalVariableChange.Type.VALUE, "\"earlier\"");

        service.restore(VARIABLE_ID, CHANGE_ID, new GlobalVariableRestoreRequestDTO(VERSION));

        GlobalVariableChange change = savedChanges(1).get(0);
        assertThat(change.getChangeType()).isEqualTo(GlobalVariableChange.Type.RESTORE);
        assertThat(change.getVariableId()).isEqualTo(VARIABLE_ID);
        assertThat(change.getOldValue()).isEqualTo("\"old\"");
        assertThat(change.getNewValue()).isEqualTo("\"earlier\"");
        assertThat(change.getVersionFrom()).isEqualTo(VERSION);
        assertThat(change.getVersionTo()).isEqualTo(VERSION + 1);
        assertThat(change.getUserId()).isEqualTo(OWNER_ID);
    }

    @Test
    void restoreSavesNothingWhenVariableAlreadyHasThatValue() {
        GlobalVariable variable = givenExistingVariable();
        givenChange(variable, GlobalVariableChange.Type.VALUE, "\"old\"");

        service.restore(VARIABLE_ID, CHANGE_ID, new GlobalVariableRestoreRequestDTO(VERSION));

        assertThat(variable.getVersion()).isEqualTo(VERSION);
        verify(repository, never()).saveAndFlush(any());
        verify(changeRepository, never()).save(any());
    }

    @Test
    void restoreThrowsConflictExceptionWhenVersionIsStale() {
        givenExistingVariable();
        when(mapper.userName(any())).thenReturn(Optional.of("admin"));
        GlobalVariableRestoreRequestDTO request = new GlobalVariableRestoreRequestDTO(VERSION - 1);

        GlobalVariableConflictException conflict = catchThrowableOfType(
                () -> service.restore(VARIABLE_ID, CHANGE_ID, request), GlobalVariableConflictException.class);

        assertThat(conflict.getCode()).isEqualTo(GlobalVariableConflictException.Code.VERSION_CONFLICT);
        assertThat(conflict.getCurrentVersion()).isEqualTo(VERSION);
        assertThat(conflict).hasMessageContaining("Changed by admin").hasMessageContaining("reload");
        verify(repository, never()).saveAndFlush(any());
        verifyNoInteractions(changeRepository);
    }

    @Test
    void restoreThrowsValidationExceptionWhenVersionIsMissing() {
        givenExistingVariable();
        GlobalVariableRestoreRequestDTO request = new GlobalVariableRestoreRequestDTO(null);

        assertThat(violationsOf(() -> service.restore(VARIABLE_ID, CHANGE_ID, request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("version", Code.VERSION_REQUIRED));
        verify(repository, never()).saveAndFlush(any());
    }

    @ParameterizedTest
    @EnumSource(value = GlobalVariableChange.Type.class, names = {"CONFIG", "PERMISSIONS", "DELETE"})
    @DisplayName("restore — the type of the entry decides, whatever its new value holds")
    void restoreThrowsValidationExceptionWhenEntryIsNotRestorable(GlobalVariableChange.Type type) {
        GlobalVariable variable = givenExistingVariable();
        givenChange(variable, type, "\"earlier\"");
        GlobalVariableRestoreRequestDTO request = new GlobalVariableRestoreRequestDTO(VERSION);

        assertThat(violationsOf(() -> service.restore(VARIABLE_ID, CHANGE_ID, request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("changeId", Code.NOT_RESTORABLE));
        assertThat(variable.getValue()).isEqualTo("\"old\"");
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("restore — an entry of another variable is as good as none")
    void restoreThrowsGeneralServiceExceptionWhenEntryBelongsToAnotherVariable() {
        GlobalVariable variable = givenExistingVariable();
        givenChange(GlobalVariableFixture.aConstant(6L, "lastSync", "1"), GlobalVariableChange.Type.VALUE,
                "\"earlier\"");
        GlobalVariableRestoreRequestDTO request = new GlobalVariableRestoreRequestDTO(VERSION);

        GeneralServiceException notFound = catchThrowableOfType(
                () -> service.restore(VARIABLE_ID, CHANGE_ID, request), GeneralServiceException.class);

        assertThat(notFound.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(notFound.getError()).isEqualTo("GLOBAL_VARIABLE_CHANGE_NOT_FOUND");
        assertThat(notFound).hasMessageContaining("Change 31").hasMessageContaining("global variable 5");
        assertThat(variable.getValue()).isEqualTo("\"old\"");
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void restoreThrowsGeneralServiceExceptionWhenCallerLacksEdit() {
        givenExistingVariable();
        when(security.permissionsOn(any(), any())).thenReturn(EnumSet.of(GlobalVariablePermission.VIEW_USE));
        GlobalVariableRestoreRequestDTO request = new GlobalVariableRestoreRequestDTO(VERSION);

        GeneralServiceException forbidden = catchThrowableOfType(
                () -> service.restore(VARIABLE_ID, CHANGE_ID, request), GeneralServiceException.class);

        assertThat(forbidden.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(forbidden).hasMessageContaining("EDIT").hasMessageContaining("idoitUrl");
        verify(repository, never()).saveAndFlush(any());
        verifyNoInteractions(changeRepository);
    }

    // ── secrets ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("create — a secret without a value stores no text, so hasValue can tell")
    void createStoresNoValueWhenSecretHasNoValue() {
        service.create(aSecretCreate(null));

        GlobalVariable saved = savedVariable();
        assertThat(saved.isSecret()).isTrue();
        assertThat(saved.getValue()).isNull();
    }

    @Test
    @DisplayName("create — without an own key a secret is still stored encrypted, with the built-in default")
    void createStoresEncryptedSecretWhenNoKeyIsConfigured() {
        GlobalVariableCipher defaultKey = new GlobalVariableCipher(new MockEnvironment());
        GlobalVariableServiceImp withDefaultKey = serviceWith(defaultKey);

        withDefaultKey.create(aSecretCreate(new TextNode("s3cr3t")));

        assertThat(defaultKey.decrypt(savedVariable().getValue())).isEqualTo("\"s3cr3t\"");
    }

    @Test
    void createWritesMaskedCreateChangeWhenSecretIsRequested() {
        service.create(aSecretCreate(new TextNode("s3cr3t")));

        GlobalVariableChange change = savedChanges(1).get(0);
        assertThat(change.getChangeType()).isEqualTo(GlobalVariableChange.Type.CREATE);
        assertThat(change.getOldValue()).isNull();
        assertThat(change.getNewValue()).isEqualTo(GlobalVariableChange.SECRET_MASK);
    }

    @Test
    @DisplayName("create — the limit counts the plain JSON text of a secret, not its longer encrypted form")
    void createAcceptsSecretWhenPlainValueEqualsLimit() {
        TextNode value = new TextNode("a".repeat(MAX_VALUE_BYTES - 2));

        service.create(aSecretCreate(value));

        assertThat(CIPHER.decrypt(savedVariable().getValue())).hasSize(MAX_VALUE_BYTES);
    }

    @Test
    void updateKeepsSecretWhenValueIsLeftOut() {
        GlobalVariable variable = givenExistingSecret();
        String stored = variable.getValue();

        service.update(VARIABLE_ID, anUpdate("apiKey", null, true));

        assertThat(variable.getValue()).isEqualTo(stored);
        assertThat(variable.getVersion()).isEqualTo(VERSION);
        verify(repository, never()).saveAndFlush(any());
        verifyNoInteractions(changeRepository);
    }

    @Test
    void updateKeepsSecretWhenValueIsJsonNull() {
        GlobalVariable variable = givenExistingSecret();
        String stored = variable.getValue();

        service.update(VARIABLE_ID, anUpdate("apiKey", NullNode.getInstance(), true));

        assertThat(variable.getValue()).isEqualTo(stored);
        verify(repository, never()).saveAndFlush(any());
        verifyNoInteractions(changeRepository);
    }

    @Test
    void updateReplacesSecretWhenValueIsGiven() {
        GlobalVariable variable = givenExistingSecret();

        service.update(VARIABLE_ID, anUpdate("apiKey", new TextNode("new"), true));

        assertThat(variable.isSecret()).isTrue();
        assertThat(CIPHER.decrypt(variable.getValue())).isEqualTo("\"new\"");
    }

    @Test
    @DisplayName("update — a secret is never compared, or the version would tell a guessed value")
    void updateWritesValueChangeWhenSecretIsReplacedByEqualValue() {
        givenExistingSecret();

        service.update(VARIABLE_ID, anUpdate("apiKey", new TextNode("hidden"), true));

        GlobalVariableChange change = savedChanges(1).get(0);
        assertThat(change.getChangeType()).isEqualTo(GlobalVariableChange.Type.VALUE);
        assertThat(change.getOldValue()).isEqualTo(GlobalVariableChange.SECRET_MASK);
        assertThat(change.getNewValue()).isEqualTo(GlobalVariableChange.SECRET_MASK);
        assertThat(change.getVersionTo()).isEqualTo(VERSION + 1);
    }

    @Test
    @DisplayName("update — a form that leaves the flag out keeps a secret secret")
    void updateKeepsFlagWhenSecretIsLeftOut() {
        GlobalVariable variable = givenExistingSecret();

        service.update(VARIABLE_ID, anUpdate("apiKey", null, null));

        assertThat(variable.isSecret()).isTrue();
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void updateEncryptsCurrentValueWhenFlagIsTurnedOn() {
        GlobalVariable variable = givenExistingVariable();

        service.update(VARIABLE_ID, anUpdate("idoitUrl", null, true));

        assertThat(variable.isSecret()).isTrue();
        assertThat(CIPHER.decrypt(variable.getValue())).isEqualTo("\"old\"");
    }

    @Test
    @DisplayName("update — setting the flag is a CONFIG change; the kept value writes no VALUE entry")
    void updateWritesConfigChangeWhenFlagIsTurnedOn() throws Exception {
        givenExistingVariable();

        service.update(VARIABLE_ID, anUpdate("idoitUrl", null, true));

        GlobalVariableChange change = savedChanges(1).get(0);
        assertThat(change.getChangeType()).isEqualTo(GlobalVariableChange.Type.CONFIG);
        assertThat(json.readTree(change.getOldValue())).isEqualTo(json.readTree("{\"secret\":false}"));
        assertThat(json.readTree(change.getNewValue())).isEqualTo(json.readTree("{\"secret\":true}"));
    }

    @Test
    @DisplayName("update — a value hidden from now on is masked on both sides of its VALUE entry")
    void updateWritesMaskedValueChangeWhenFlagIsTurnedOnWithValue() {
        givenExistingVariable();

        service.update(VARIABLE_ID, anUpdate("idoitUrl", new TextNode("new"), true));

        GlobalVariableChange change = savedChanges(2).get(0);
        assertThat(change.getChangeType()).isEqualTo(GlobalVariableChange.Type.VALUE);
        assertThat(change.getOldValue()).isEqualTo(GlobalVariableChange.SECRET_MASK);
        assertThat(change.getNewValue()).isEqualTo(GlobalVariableChange.SECRET_MASK);
    }

    @Test
    @DisplayName("update — the plain values the log kept are masked once the variable becomes a secret")
    void updateMasksChangeLogWhenFlagIsTurnedOn() {
        givenExistingVariable();

        service.update(VARIABLE_ID, anUpdate("idoitUrl", null, true));

        verify(changeRepository).maskValues(VARIABLE_ID, GlobalVariableChange.SECRET_MASK);
    }

    @Test
    void updateLeavesChangeLogWhenSecretStaysSecret() {
        givenExistingSecret();

        service.update(VARIABLE_ID, anUpdate("apiKey", new TextNode("new"), true));

        verify(changeRepository, never()).maskValues(anyLong(), anyString());
    }

    @Test
    @DisplayName("update — a secret is made visible again only with a new value")
    void updateThrowsValidationExceptionWhenFlagIsTurnedOffWithoutValue() {
        GlobalVariable variable = givenExistingSecret();
        GlobalVariableRequestDTO request = anUpdate("apiKey", null, false);

        assertThat(violationsOf(() -> service.update(VARIABLE_ID, request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("value", Code.SECRET_REMOVAL_NEEDS_VALUE));
        assertThat(variable.isSecret()).isTrue();
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void updateStoresPlainValueWhenFlagIsTurnedOffWithValue() {
        GlobalVariable variable = givenExistingSecret();

        service.update(VARIABLE_ID, anUpdate("apiKey", new TextNode("visible"), false));

        assertThat(variable.isSecret()).isFalse();
        assertThat(variable.getValue()).isEqualTo("\"visible\"");
    }

    @Test
    @DisplayName("update — the hidden value stays masked in the entry that makes the variable plain again")
    void updateMasksOldValueInValueChangeWhenFlagIsTurnedOff() {
        givenExistingSecret();

        service.update(VARIABLE_ID, anUpdate("apiKey", new TextNode("visible"), false));

        GlobalVariableChange change = savedChanges(2).get(0);
        assertThat(change.getChangeType()).isEqualTo(GlobalVariableChange.Type.VALUE);
        assertThat(change.getOldValue()).isEqualTo(GlobalVariableChange.SECRET_MASK);
        assertThat(change.getNewValue()).isEqualTo("\"visible\"");
    }

    @Test
    void deleteWritesMaskedDeleteChangeWhenVariableIsSecret() {
        givenExistingSecret();

        service.delete(VARIABLE_ID);

        GlobalVariableChange change = savedChanges(1).get(0);
        assertThat(change.getChangeType()).isEqualTo(GlobalVariableChange.Type.DELETE);
        assertThat(change.getOldValue()).isEqualTo(GlobalVariableChange.SECRET_MASK);
    }

    @Test
    @DisplayName("getChanges — the entries of a secret are built masked, whatever they hold")
    void getChangesMasksValuesWhenVariableIsSecret() {
        GlobalVariable variable = givenExistingSecret();
        GlobalVariableChange change = GlobalVariableChange.savedByUser(
                variable, GlobalVariableChange.Type.VALUE, 1L, 2L, "\"before\"", "\"after\"", OWNER_ID);
        when(changeRepository.findByVariableIdOrderByChangedAtDescIdDesc(eq(VARIABLE_ID), any()))
                .thenReturn(new PageImpl<>(List.of(change)));
        GlobalVariableChangeDTO masked = aMaskedChangeDto();
        when(mapper.toChange(change, true)).thenReturn(masked);

        PaginatedDto<GlobalVariableChange, GlobalVariableChangeDTO> changes = service.getChanges(VARIABLE_ID, 0, 20);

        assertThat(changes.getContent()).containsExactly(masked);
    }

    @Test
    void restoreThrowsValidationExceptionWhenVariableIsSecret() {
        GlobalVariable variable = givenExistingSecret();
        givenChange(variable, GlobalVariableChange.Type.VALUE, "\"earlier\"");
        GlobalVariableRestoreRequestDTO request = new GlobalVariableRestoreRequestDTO(VERSION);

        List<Violation> violations = violationsOf(() -> service.restore(VARIABLE_ID, CHANGE_ID, request));

        assertThat(violations)
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("changeId", Code.NOT_RESTORABLE));
        assertThat(violations.get(0).message()).contains("secret");
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("restore — an entry that holds the mask has no value to give back, even to a plain variable")
    void restoreThrowsValidationExceptionWhenEntryHoldsMask() {
        GlobalVariable variable = givenExistingVariable();
        givenChange(variable, GlobalVariableChange.Type.VALUE, GlobalVariableChange.SECRET_MASK);
        GlobalVariableRestoreRequestDTO request = new GlobalVariableRestoreRequestDTO(VERSION);

        assertThat(violationsOf(() -> service.restore(VARIABLE_ID, CHANGE_ID, request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("changeId", Code.NOT_RESTORABLE));
        verify(repository, never()).saveAndFlush(any());
    }

    // ── mutable variables ─────────────────────────────────────────────────────

    @Test
    @DisplayName("create — the current value starts as the initial value, set by the creator")
    void createSavesMutableWithCurrentValueEqualToInitialValueWhenRequestIsValid() {
        when(connectionRepository.existsById(OWNER_WORKFLOW_ID)).thenReturn(true);

        service.create(GlobalVariableFixture.aMutableRequest(
                "lastSync", new TextNode("2026-01-01"), OWNER_WORKFLOW_ID, null));

        GlobalVariable saved = savedVariable();
        assertThat(saved.getKind()).isEqualTo(GlobalVariableKind.MUTABLE);
        assertThat(saved.getValue()).isEqualTo("\"2026-01-01\"");
        assertThat(saved.getCurrentValue()).isEqualTo("\"2026-01-01\"");
        assertThat(saved.getCurrentRevision()).isZero();
        assertThat(saved.getCurrentSetAt()).isNotNull();
        assertThat(saved.getCurrentSetByUser()).isEqualTo(OWNER_ID);
        assertThat(saved.getCurrentSetByExecution()).isNull();
        assertThat(saved.getBusyPolicy()).isEqualTo(GlobalVariableBusyPolicy.QUEUE);
        assertThat(saved.getOwnerWorkflowId()).isEqualTo(OWNER_WORKFLOW_ID);
    }

    @Test
    void createKeepsGivenBusyPolicyWhenRequestNamesRefuse() {
        when(connectionRepository.existsById(OWNER_WORKFLOW_ID)).thenReturn(true);

        service.create(aMutableRequest(GlobalVariableBusyPolicy.REFUSE, OWNER_WORKFLOW_ID,
                GlobalVariableFixture.aScopeOfAll(), null));

        assertThat(savedVariable().getBusyPolicy()).isEqualTo(GlobalVariableBusyPolicy.REFUSE);
    }

    @Test
    void createLeavesMutableFieldsEmptyWhenVariableIsConstant() {
        service.create(GlobalVariableFixture.aRequest("idoitUrl", new TextNode("https://cmdb.example"), null));

        GlobalVariable saved = savedVariable();
        assertThat(saved.getCurrentValue()).isNull();
        assertThat(saved.getCurrentSetAt()).isNull();
        assertThat(saved.getBusyPolicy()).isNull();
        assertThat(saved.getOwnerWorkflowId()).isNull();
    }

    @Test
    void createThrowsValidationExceptionWhenMutableNamesNoOwnerWorkflow() {
        GlobalVariableRequestDTO request =
                GlobalVariableFixture.aMutableRequest("lastSync", new TextNode("x"), null, null);

        assertThat(violationsOf(() -> service.create(request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("ownerWorkflowId", Code.OWNER_WORKFLOW_REQUIRED));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void createThrowsValidationExceptionWhenOwnerWorkflowDoesNotExist() {
        GlobalVariableRequestDTO request =
                GlobalVariableFixture.aMutableRequest("lastSync", new TextNode("x"), OWNER_WORKFLOW_ID, null);

        assertThat(violationsOf(() -> service.create(request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("ownerWorkflowId", Code.OWNER_WORKFLOW_INVALID));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void createThrowsValidationExceptionWhenOwnerWorkflowIsOutsideScope() {
        when(connectionRepository.existsById(9L)).thenReturn(true);
        when(connectionRepository.existsById(OWNER_WORKFLOW_ID)).thenReturn(true);
        GlobalVariableRequestDTO request = aMutableRequest(null, OWNER_WORKFLOW_ID, aScopeOfWorkflow(9L), null);

        assertThat(violationsOf(() -> service.create(request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("ownerWorkflowId", Code.OWNER_WORKFLOW_INVALID));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("create — whether an invalid scope holds the owner workflow is not judged")
    void createReportsOnlyScopeWhenScopeIsInvalid() {
        when(connectionRepository.existsById(OWNER_WORKFLOW_ID)).thenReturn(true);
        GlobalVariableRequestDTO request = aMutableRequest(null, OWNER_WORKFLOW_ID,
                new GlobalVariableRequestDTO.Scope(GlobalVariableScopeType.WORKFLOWS, null, List.of()), null);

        assertThat(violationsOf(() -> service.create(request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("scope", Code.SCOPE_INVALID));
    }

    @Test
    void createThrowsValidationExceptionWhenMutableIsSecret() {
        when(connectionRepository.existsById(OWNER_WORKFLOW_ID)).thenReturn(true);
        GlobalVariableRequestDTO request = new GlobalVariableRequestDTO("lastSync", GlobalVariableKind.MUTABLE,
                null, new TextNode("x"), true, GlobalVariableFixture.aScopeOfAll(), null, OWNER_WORKFLOW_ID, null);

        assertThat(violationsOf(() -> service.create(request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("secret", Code.SECRET_NOT_ALLOWED));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void createThrowsValidationExceptionWhenConstantHasBusyPolicyOrOwnerWorkflow() {
        GlobalVariableRequestDTO request = new GlobalVariableRequestDTO("idoitUrl", GlobalVariableKind.CONSTANT,
                null, new TextNode("x"), false, GlobalVariableFixture.aScopeOfAll(),
                GlobalVariableBusyPolicy.QUEUE, OWNER_WORKFLOW_ID, null);

        assertThat(violationsOf(() -> service.create(request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("busyPolicy", Code.MUTABLE_ONLY), tuple("ownerWorkflowId", Code.MUTABLE_ONLY));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("update — a new value is the initial value; the current one stays until a reset")
    void updateKeepsCurrentValueWhenInitialValueChanges() {
        GlobalVariable variable = givenExistingMutable();
        when(connectionRepository.existsById(OWNER_WORKFLOW_ID)).thenReturn(true);

        service.update(VARIABLE_ID,
                GlobalVariableFixture.aMutableRequest("lastSync", new TextNode("next"), null, VERSION));

        assertThat(variable.getValue()).isEqualTo("\"next\"");
        assertThat(variable.getCurrentValue()).isEqualTo("\"live\"");
        assertThat(variable.getCurrentRevision()).isEqualTo(1L);
        assertThat(savedChanges(1).get(0).getChangeType()).isEqualTo(GlobalVariableChange.Type.VALUE);
    }

    @Test
    void updateKeepsBusyPolicyAndOwnerWorkflowWhenRequestLeavesThemOut() {
        GlobalVariable variable = givenExistingMutable();
        variable.setBusyPolicy(GlobalVariableBusyPolicy.REFUSE);
        when(connectionRepository.existsById(OWNER_WORKFLOW_ID)).thenReturn(true);

        service.update(VARIABLE_ID, aMutableRequest(null, null, GlobalVariableFixture.aScopeOfAll(), VERSION));

        assertThat(variable.getBusyPolicy()).isEqualTo(GlobalVariableBusyPolicy.REFUSE);
        assertThat(variable.getOwnerWorkflowId()).isEqualTo(OWNER_WORKFLOW_ID);
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void updateWritesConfigChangeWhenBusyPolicyAndOwnerWorkflowChange() throws Exception {
        GlobalVariable variable = givenExistingMutable();
        when(connectionRepository.existsById(9L)).thenReturn(true);

        service.update(VARIABLE_ID,
                aMutableRequest(GlobalVariableBusyPolicy.REFUSE, 9L, GlobalVariableFixture.aScopeOfAll(), VERSION));

        assertThat(variable.getBusyPolicy()).isEqualTo(GlobalVariableBusyPolicy.REFUSE);
        assertThat(variable.getOwnerWorkflowId()).isEqualTo(9L);
        GlobalVariableChange change = savedChanges(1).get(0);
        assertThat(change.getChangeType()).isEqualTo(GlobalVariableChange.Type.CONFIG);
        assertThat(json.readTree(change.getOldValue()))
                .isEqualTo(json.readTree("{\"busyPolicy\":\"QUEUE\",\"ownerWorkflowId\":12}"));
        assertThat(json.readTree(change.getNewValue()))
                .isEqualTo(json.readTree("{\"busyPolicy\":\"REFUSE\",\"ownerWorkflowId\":9}"));
    }

    @Test
    void updateThrowsValidationExceptionWhenNewScopeLeavesOutOwnerWorkflow() {
        givenExistingMutable();
        when(connectionRepository.existsById(9L)).thenReturn(true);
        when(connectionRepository.existsById(OWNER_WORKFLOW_ID)).thenReturn(true);
        GlobalVariableRequestDTO request = aMutableRequest(null, null, aScopeOfWorkflow(9L), VERSION);

        assertThat(violationsOf(() -> service.update(VARIABLE_ID, request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("ownerWorkflowId", Code.OWNER_WORKFLOW_INVALID));
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("update — once the owner workflow is deleted, a save needs a new one")
    void updateThrowsValidationExceptionWhenOwnerWorkflowWasDeletedAndRequestNamesNone() {
        GlobalVariable variable = givenExistingMutable();
        variable.setOwnerWorkflowId(null);
        GlobalVariableRequestDTO request =
                aMutableRequest(null, null, GlobalVariableFixture.aScopeOfAll(), VERSION);

        assertThat(violationsOf(() -> service.update(VARIABLE_ID, request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("ownerWorkflowId", Code.OWNER_WORKFLOW_REQUIRED));
    }

    @Test
    void updateThrowsValidationExceptionWhenMutableIsMadeSecret() {
        givenExistingMutable();
        when(connectionRepository.existsById(OWNER_WORKFLOW_ID)).thenReturn(true);
        GlobalVariableRequestDTO request = new GlobalVariableRequestDTO("lastSync", GlobalVariableKind.MUTABLE,
                null, new TextNode("start"), true, GlobalVariableFixture.aScopeOfAll(), null, null, VERSION);

        assertThat(violationsOf(() -> service.update(VARIABLE_ID, request)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("secret", Code.SECRET_NOT_ALLOWED));
    }

    @Test
    void resetSetsCurrentValueBackAndWritesResetChangeWhenVariableIsMutable() {
        GlobalVariable variable = GlobalVariableFixture.aMutable(
                VARIABLE_ID, "lastSync", "\"start\"", "\"live\"", OWNER_WORKFLOW_ID);
        variable.setVersion(VERSION);
        GlobalVariable reset = GlobalVariableFixture.aMutable(
                VARIABLE_ID, "lastSync", "\"start\"", "\"start\"", OWNER_WORKFLOW_ID);
        reset.setVersion(VERSION);
        when(repository.findById(VARIABLE_ID)).thenReturn(Optional.of(variable), Optional.of(reset));

        service.reset(VARIABLE_ID);

        verify(repository).resetCurrentValue(eq(VARIABLE_ID), any(Date.class), eq(OWNER_ID));
        GlobalVariableChange change = savedChanges(1).get(0);
        assertThat(change.getChangeType()).isEqualTo(GlobalVariableChange.Type.RESET);
        assertThat(change.getOldValue()).isEqualTo("\"live\"");
        assertThat(change.getNewValue()).isEqualTo("\"start\"");
        assertThat(change.getVersionFrom()).isEqualTo(VERSION);
        assertThat(change.getVersionTo()).isEqualTo(VERSION);
        assertThat(change.getUserId()).isEqualTo(OWNER_ID);
        verify(mapper).toDetail(eq(reset), any());
        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void resetThrowsValidationExceptionWhenVariableIsConstant() {
        givenExistingVariable();

        assertThat(violationsOf(() -> service.reset(VARIABLE_ID)))
                .extracting(Violation::field, Violation::code)
                .containsExactly(tuple("id", Code.NOT_MUTABLE));
        verify(repository, never()).resetCurrentValue(anyLong(), any(), any());
        verifyNoInteractions(changeRepository);
    }

    @Test
    void resetThrowsGeneralServiceExceptionWhenCallerLacksEdit() {
        givenExistingMutable();
        when(security.permissionsOn(any(), any())).thenReturn(EnumSet.of(GlobalVariablePermission.VIEW_USE));

        GeneralServiceException forbidden =
                catchThrowableOfType(() -> service.reset(VARIABLE_ID), GeneralServiceException.class);

        assertThat(forbidden.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(repository, never()).resetCurrentValue(anyLong(), any(), any());
        verifyNoInteractions(changeRepository);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /**
     * A saved mutable variable "lastSync" with the initial value "start", the current value
     * "live" and busy policy QUEUE at {@link #VERSION}, written by {@link #OWNER_WORKFLOW_ID}.
     */
    private GlobalVariable givenExistingMutable() {
        GlobalVariable variable = GlobalVariableFixture.aMutable(
                VARIABLE_ID, "lastSync", "\"start\"", "\"live\"", OWNER_WORKFLOW_ID);
        variable.setVersion(VERSION);
        when(repository.findById(VARIABLE_ID)).thenReturn(Optional.of(variable));
        return variable;
    }

    /**
     * Request for the mutable variable "lastSync" with the value "start".
     *
     * @param busyPolicy      {@code null} to leave it out
     * @param ownerWorkflowId {@code null} to leave it out
     * @param version         {@code null} for a create
     */
    private static GlobalVariableRequestDTO aMutableRequest(GlobalVariableBusyPolicy busyPolicy,
            Long ownerWorkflowId, GlobalVariableRequestDTO.Scope scope, Long version) {
        return new GlobalVariableRequestDTO("lastSync", GlobalVariableKind.MUTABLE, null, new TextNode("start"),
                null, scope, busyPolicy, ownerWorkflowId, version);
    }

    /** A saved secret "apiKey" whose hidden value is "hidden", at {@link #VERSION}, owned by the caller. */
    private GlobalVariable givenExistingSecret() {
        GlobalVariable variable =
                GlobalVariableFixture.aConstant(VARIABLE_ID, "apiKey", CIPHER.encrypt("\"hidden\""));
        variable.setSecret(true);
        variable.setVersion(VERSION);
        when(repository.findById(VARIABLE_ID)).thenReturn(Optional.of(variable));
        return variable;
    }

    /** Request to create the secret "apiKey" with scope ALL; {@code value} may be {@code null}. */
    private static GlobalVariableRequestDTO aSecretCreate(JsonNode value) {
        return new GlobalVariableRequestDTO("apiKey", GlobalVariableKind.CONSTANT, null, value, true,
                GlobalVariableFixture.aScopeOfAll(), null, null, null);
    }

    /**
     * Request to update a variable at {@link #VERSION}, keeping scope ALL and no description.
     *
     * @param secret the flag to ask for, {@code null} to leave it out
     */
    private static GlobalVariableRequestDTO anUpdate(String name, JsonNode value, Boolean secret) {
        return new GlobalVariableRequestDTO(name, GlobalVariableKind.CONSTANT, null, value, secret,
                GlobalVariableFixture.aScopeOfAll(), null, null, VERSION);
    }

    /** The service with the same collaborators as {@link #service}, but the given cipher. */
    private GlobalVariableServiceImp serviceWith(GlobalVariableCipher cipher) {
        return new GlobalVariableServiceImp(repository, changeRepository, mapper, security,
                userRepository, categoryRepository, connectionRepository, schedulerRepository, usageService,
                scopeResolver, json, cipher, runGate, MAX_VALUE_BYTES, MAX_SCRIPT_BYTES);
    }

    private static GlobalVariableChangeDTO aMaskedChangeDto() {
        TextNode mask = new TextNode(GlobalVariableChange.SECRET_MASK);
        return new GlobalVariableChangeDTO(CHANGE_ID, GlobalVariableChange.Type.VALUE, 1L, 2L, mask, mask, null,
                null, GlobalVariableChange.Result.SAVED, null, null, false);
    }

    /** A saved constant "idoitUrl" with the value "old" at {@link #VERSION}, owned by the caller. */
    private GlobalVariable givenExistingVariable() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(VARIABLE_ID, "idoitUrl", "\"old\"");
        variable.setVersion(VERSION);
        when(repository.findById(VARIABLE_ID)).thenReturn(Optional.of(variable));
        return variable;
    }

    /** The variable is used by a method of each given workflow; returns what the mapper makes of the usages. */
    private List<GlobalVariableUsageDTO> givenUsageBy(Long... workflowIds) {
        List<GlobalVariableUsage> usages = new ArrayList<>();
        List<GlobalVariableUsageDTO> mapped = new ArrayList<>();
        for (Long workflowId : workflowIds) {
            GlobalVariableUsage usage = aUsageBy(workflowId);
            GlobalVariableUsageDTO dto = new GlobalVariableUsageDTO(
                    GlobalVariableUsage.SourceType.WORKFLOW, workflowId, "workflow-" + workflowId,
                    GlobalVariableUsage.ElementType.METHOD, "List objects", "#ababab", "0_1", "endpoint",
                    GlobalVariableUsage.Access.READ);
            lenient().when(mapper.toUsage(usage)).thenReturn(dto);
            usages.add(usage);
            mapped.add(dto);
        }
        when(usageService.findByVariable(VARIABLE_ID)).thenReturn(usages);
        return mapped;
    }

    private static GlobalVariableUsage aUsageBy(long workflowId) {
        return GlobalVariableUsage.readByWorkflow(VARIABLE_ID, workflowId,
                GlobalVariableUsage.ElementType.METHOD, "0_1", "#ababab", "List objects", "endpoint");
    }

    /**
     * The variable has exactly these usages; the mapper describes each as it is, with a title made
     * of its source, e.g. "connector-7".
     */
    private void givenUsages(GlobalVariableUsage... usages) {
        for (GlobalVariableUsage usage : usages) {
            String title = usage.getSourceType().name().toLowerCase(Locale.ROOT) + "-" + usage.getSourceId();
            lenient().when(mapper.toUsage(usage)).thenReturn(new GlobalVariableUsageDTO(
                    usage.getSourceType(), usage.getSourceId(), title, usage.getElementType(),
                    usage.getElementLabel(), usage.getElementColor(), usage.getElementRef(), usage.getField(),
                    usage.getAccess()));
        }
        when(usageService.findByVariable(VARIABLE_ID)).thenReturn(List.of(usages));
    }

    /** The request data field "url" of a connector reads the variable. */
    private static GlobalVariableUsage aUsageByConnector(long connectorId) {
        return GlobalVariableUsage.readByConnector(VARIABLE_ID, connectorId, "url");
    }

    /** A notification reads the variable in the English body of the template it sends. */
    private static GlobalVariableUsage aUsageByNotification(long notificationId) {
        return GlobalVariableUsage.readByNotification(VARIABLE_ID, notificationId, "Failure template", "en.body");
    }

    private static GlobalVariableRequestDTO aRequestScopedToWorkflow(long workflowId) {
        return new GlobalVariableRequestDTO("idoitUrl", GlobalVariableKind.CONSTANT, null, new TextNode("old"),
                false, aScopeOfWorkflow(workflowId), null, null, VERSION);
    }

    private static GlobalVariableRequestDTO.Scope aScopeOfWorkflow(long workflowId) {
        return new GlobalVariableRequestDTO.Scope(GlobalVariableScopeType.WORKFLOWS, null, List.of(workflowId));
    }

    /** A saved workflow in the given category; {@code null} for a workflow without one. */
    private Connection givenWorkflow(long id, Integer categoryId) {
        Connection workflow = new Connection();
        workflow.setId(id);
        workflow.setCategoryId(categoryId);
        when(connectionRepository.findById(id)).thenReturn(Optional.of(workflow));
        return workflow;
    }

    /** The role of the caller holds the READ permission on global variables, which opens the picker. */
    private void givenRoleMayReadVariables() {
        when(security.can("READ")).thenReturn(true);
    }

    /** The caller may use these variables; the mapper makes a picker item with the name of each. */
    private void givenUsableVariables(GlobalVariable... variables) {
        when(repository.findUsableWithScopeTargets(OWNER_ID)).thenReturn(List.of(variables));
        lenient().when(mapper.toPickerItem(any())).thenAnswer(invocation -> {
            GlobalVariable variable = invocation.getArgument(0);
            return new GlobalVariablePickerItemDTO(variable.getName(), variable.getKind(), null, false, null);
        });
    }

    /** A saved constant that only the given category or workflow may use. */
    private static GlobalVariable aConstantScopedTo(String name, GlobalVariableScopeTarget target) {
        GlobalVariable variable = GlobalVariableFixture.aConstant(VARIABLE_ID, name, "1");
        variable.setScopeType(target.getTargetType() == GlobalVariableScopeTarget.Type.CATEGORY
                ? GlobalVariableScopeType.CATEGORIES
                : GlobalVariableScopeType.WORKFLOWS);
        variable.getScopeTargets().add(target);
        return variable;
    }

    /** The caller may view these variables; the mapper makes a value with the id and version of each. */
    private void givenViewableVariables(GlobalVariable... variables) {
        when(repository.findViewableByIds(any(), eq(OWNER_ID))).thenReturn(List.of(variables));
        lenient().when(mapper.toValue(any(), any())).thenAnswer(invocation -> {
            GlobalVariable variable = invocation.getArgument(0);
            return new GlobalVariableValueDTO(variable.getId(), variable.getVersion(), 0L, null, null, null,
                    invocation.getArgument(1));
        });
    }

    /** Entry {@link #CHANGE_ID} of the change log of {@code variable}, which saved {@code newValue}. */
    private void givenChange(GlobalVariable variable, GlobalVariableChange.Type type, String newValue) {
        GlobalVariableChange change =
                GlobalVariableChange.savedByUser(variable, type, 1L, 2L, "\"before\"", newValue, OWNER_ID);
        when(changeRepository.findById(CHANGE_ID)).thenReturn(Optional.of(change));
    }

    private static GlobalVariablePermissionsDTO.Request aGrantRequest(GrantRequest... grants) {
        return new GlobalVariablePermissionsDTO.Request(List.of(grants), VERSION);
    }

    private GlobalVariable savedVariable() {
        ArgumentCaptor<GlobalVariable> saved = ArgumentCaptor.forClass(GlobalVariable.class);
        verify(repository).saveAndFlush(saved.capture());
        return saved.getValue();
    }

    private List<GlobalVariableChange> savedChanges(int count) {
        ArgumentCaptor<GlobalVariableChange> saved = ArgumentCaptor.forClass(GlobalVariableChange.class);
        verify(changeRepository, times(count)).save(saved.capture());
        return saved.getAllValues();
    }

    private static List<Violation> violationsOf(Runnable call) {
        GlobalVariableValidationException exception =
                catchThrowableOfType(call::run, GlobalVariableValidationException.class);
        assertThat(exception).as("a GlobalVariableValidationException").isNotNull();
        return exception.getViolations();
    }
}
