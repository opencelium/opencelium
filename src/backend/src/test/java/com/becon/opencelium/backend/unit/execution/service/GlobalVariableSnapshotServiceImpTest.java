package com.becon.opencelium.backend.unit.execution.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.database.mysql.entity.Category;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableScopeTarget;
import com.becon.opencelium.backend.database.mysql.repository.CategoryRepository;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableScopeResolver;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.becon.opencelium.backend.exception.WrongDecryptException;
import com.becon.opencelium.backend.execution.globalvariable.GlobalScript;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot.Entry;
import com.becon.opencelium.backend.execution.globalvariable.TestRunOrigins;
import com.becon.opencelium.backend.execution.service.GlobalVariableSnapshotServiceImp;
import com.becon.opencelium.backend.testutil.fixture.CategoryFixture;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.becon.opencelium.backend.utility.crypto.GlobalVariableCipher;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.env.MockEnvironment;

/**
 * Unit tests for {@link GlobalVariableSnapshotServiceImp}: which variables a run of a workflow
 * gets in its snapshot, and which ones a connector gets where no workflow runs. The repositories
 * are mocked; JSON is parsed by a real {@link ObjectMapper}.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalVariableSnapshotServiceImpTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("GlobalVariableSnapshotServiceImp — unit")
class GlobalVariableSnapshotServiceImpTest {

    private static final long WORKFLOW = 11L;
    // the copy a test run saves of a workflow
    private static final long COPY = 20L;
    // built once each: deriving a key takes a while
    private static final GlobalVariableCipher CIPHER = cipherWithKey(GlobalVariableFixture.SECRET_KEY);
    private static final GlobalVariableCipher OTHER_KEY = cipherWithKey("another-key");

    @Mock
    GlobalVariableRepository globalVariableRepository;

    @Mock
    ConnectionRepository connectionRepository;

    @Mock
    CategoryRepository categoryRepository;

    private TestRunOrigins testRunOrigins;

    private GlobalVariableSnapshotServiceImp service;

    @BeforeEach
    void setUp() {
        testRunOrigins = new TestRunOrigins();
        service = new GlobalVariableSnapshotServiceImp(
                globalVariableRepository, connectionRepository,
                new GlobalVariableScopeResolver(categoryRepository), new ObjectMapper(),
                new GlobalVariableCipher(new MockEnvironment()), testRunOrigins);
    }

    @Test
    @DisplayName("takeFor — without variables nothing else is read")
    void takeForReturnsEmptyWhenNoVariableExists() {
        when(globalVariableRepository.findAllWithScopeTargets(any())).thenReturn(List.of());

        GlobalVariableSnapshot snapshot = service.takeFor(WORKFLOW);

        assertThat(snapshot.isEmpty()).isTrue();
        verifyNoInteractions(connectionRepository, categoryRepository);
    }

    @Test
    void takeForKeepsOnlyVariablesInScopeWhenScopesDiffer() {
        givenWorkflowInCategory(aCategory(3, null));
        givenVariables(
                aVariable("openToAll", GlobalVariableScopeType.ALL),
                aVariable("ownCategory", GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(3)),
                aVariable("otherCategory", GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(9)),
                aVariable("ownWorkflow", GlobalVariableScopeType.WORKFLOWS, GlobalVariableScopeTarget.workflow(WORKFLOW)),
                aVariable("otherWorkflow", GlobalVariableScopeType.WORKFLOWS, GlobalVariableScopeTarget.workflow(12)));

        GlobalVariableSnapshot snapshot = service.takeFor(WORKFLOW);

        assertThat(snapshot.entries()).extracting(Entry::name)
                .containsExactly("openToAll", "ownCategory", "ownWorkflow");
    }

    @Test
    @DisplayName("takeFor — a variable of a category reaches the workflows of its subcategories")
    void takeForIncludesParentCategoryVariableWhenWorkflowIsInSubcategory() {
        Category root = aCategory(1, null);
        Category middle = aCategory(3, root);
        givenWorkflowInCategory(aCategory(5, middle));
        givenVariables(
                aVariable("ofRoot", GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(1)),
                aVariable("ofMiddle", GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(3)),
                aVariable("ofSibling", GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(4)));

        GlobalVariableSnapshot snapshot = service.takeFor(WORKFLOW);

        assertThat(snapshot.entries()).extracting(Entry::name).containsExactly("ofMiddle", "ofRoot");
    }

    @Test
    void takeForSkipsCategoryVariablesWhenWorkflowHasNoCategory() {
        Connection workflow = new Connection();
        workflow.setId(WORKFLOW);
        when(connectionRepository.findById(WORKFLOW)).thenReturn(Optional.of(workflow));
        givenVariables(
                aVariable("openToAll", GlobalVariableScopeType.ALL),
                aVariable("ofCategory", GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(3)));

        GlobalVariableSnapshot snapshot = service.takeFor(WORKFLOW);

        assertThat(snapshot.entries()).extracting(Entry::name).containsExactly("openToAll");
        verifyNoInteractions(categoryRepository);
    }

    @Test
    @DisplayName("takeFor — categories that are each other's parent do not hang the run")
    void takeForStopsWhenCategoryParentsFormCycle() {
        Category first = aCategory(5, null);
        Category second = aCategory(3, first);
        first.setParentCategory(second);
        givenWorkflowInCategory(first);
        givenVariables(aVariable("ofSecond", GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(3)));

        GlobalVariableSnapshot snapshot =
                assertTimeoutPreemptively(Duration.ofSeconds(5), () -> service.takeFor(WORKFLOW));

        assertThat(snapshot.entries()).extracting(Entry::name).containsExactly("ofSecond");
    }

    @Test
    void takeForCarriesVersionAndValueWhenVariableIsInScope() {
        GlobalVariable variable = GlobalVariableFixture.aConstant(7L, "limits", "{\"maxPerPage\":50}");
        variable.setVersion(4);
        when(connectionRepository.findById(WORKFLOW)).thenReturn(Optional.empty());
        givenVariables(variable);

        Entry entry = service.takeFor(WORKFLOW).find("limits").orElseThrow();

        assertThat(entry.version()).isEqualTo(4L);
        assertThat(entry.value().get("maxPerPage").asInt()).isEqualTo(50);
    }

    @Test
    @DisplayName("takeFor — a variable in scope through its category is not open to all workflows")
    void takeForMarksEntryOpenToAllWhenScopeIsAll() {
        givenWorkflowInCategory(aCategory(3, null));
        givenVariables(
                aVariable("everyone", GlobalVariableScopeType.ALL),
                aVariable("ownCategory", GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(3)));

        GlobalVariableSnapshot snapshot = service.takeFor(WORKFLOW);

        assertThat(snapshot.entries()).extracting(Entry::name, Entry::openToAll)
                .containsExactly(tuple("everyone", true), tuple("ownCategory", false));
    }

    @Test
    void takeForThrowsIllegalStateExceptionWhenValueIsNotJson() {
        when(connectionRepository.findById(WORKFLOW)).thenReturn(Optional.empty());
        givenVariables(GlobalVariableFixture.aConstant(7L, "broken", "{not json"));

        assertThatThrownBy(() -> service.takeFor(WORKFLOW))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("'broken'")
                .hasMessageContaining("not valid JSON");
    }

    // ── test copies ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("takeFor — the copy of a test run reads the variables scoped to the workflow it was made from")
    void takeForIncludesOriginWorkflowVariableWhenConnectionIsTestCopy() {
        testRunOrigins.register(COPY, WORKFLOW);
        givenTestCopyWithoutCategory();
        givenVariables(
                aVariable("ofOrigin", GlobalVariableScopeType.WORKFLOWS, GlobalVariableScopeTarget.workflow(WORKFLOW)),
                aVariable("ofOther", GlobalVariableScopeType.WORKFLOWS, GlobalVariableScopeTarget.workflow(12)));

        GlobalVariableSnapshot snapshot = service.takeFor(COPY);

        assertThat(snapshot.entries()).extracting(Entry::name).containsExactly("ofOrigin");
    }

    @Test
    @DisplayName("takeFor — the copy of a workflow that was never saved has only its own scope")
    void takeForExcludesOriginWorkflowVariableWhenCopyHasNoOrigin() {
        givenTestCopyWithoutCategory();
        givenVariables(
                aVariable("openToAll", GlobalVariableScopeType.ALL),
                aVariable("ofOrigin", GlobalVariableScopeType.WORKFLOWS, GlobalVariableScopeTarget.workflow(WORKFLOW)));

        GlobalVariableSnapshot snapshot = service.takeFor(COPY);

        assertThat(snapshot.entries()).extracting(Entry::name).containsExactly("openToAll");
    }

    @Test
    @DisplayName("takeFor — the category of a test copy is the one the editor sent, read from the copy")
    void takeForReadsCategoryOfCopyWhenConnectionIsTestCopy() {
        testRunOrigins.register(COPY, WORKFLOW);
        givenTestCopyInCategory(aCategory(3, null));
        givenVariables(
                aVariable("ofCopyCategory", GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(3)));

        GlobalVariableSnapshot snapshot = service.takeFor(COPY);

        assertThat(snapshot.entries()).extracting(Entry::name).containsExactly("ofCopyCategory");
    }

    @Test
    @DisplayName("takeFor — the workflow a copy was made from replaces the copy's id in the scope check")
    void takeForUsesOnlyOriginScopeWhenConnectionIsTestCopy() {
        testRunOrigins.register(COPY, WORKFLOW);
        givenTestCopyWithoutCategory();
        givenVariables(
                aVariable("openToAll", GlobalVariableScopeType.ALL),
                aVariable("ofCopyItself", GlobalVariableScopeType.WORKFLOWS, GlobalVariableScopeTarget.workflow(COPY)));

        GlobalVariableSnapshot snapshot = service.takeFor(COPY);

        assertThat(snapshot.entries()).extracting(Entry::name).containsExactly("openToAll");
    }

    // ── takeOpenToAll ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("takeOpenToAll — a connector is shared by every workflow, so it gets no scoped variable")
    void takeOpenToAllReturnsOnlyOpenVariablesWhenSomeAreScoped() {
        givenVariables(
                aVariable("everyone", GlobalVariableScopeType.ALL),
                aVariable("ofCategory", GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(3)),
                aVariable("ofWorkflow", GlobalVariableScopeType.WORKFLOWS,
                        GlobalVariableScopeTarget.workflow(WORKFLOW)));

        GlobalVariableSnapshot snapshot = service.takeOpenToAll();

        assertThat(snapshot.entries()).extracting(Entry::name, Entry::openToAll)
                .containsExactly(tuple("everyone", true));
    }

    @Test
    void takeOpenToAllReturnsEmptySnapshotWhenNoVariableIsOpen() {
        givenVariables(
                aVariable("ofCategory", GlobalVariableScopeType.CATEGORIES, GlobalVariableScopeTarget.category(3)),
                aVariable("ofWorkflow", GlobalVariableScopeType.WORKFLOWS,
                        GlobalVariableScopeTarget.workflow(WORKFLOW)));

        GlobalVariableSnapshot snapshot = service.takeOpenToAll();

        assertThat(snapshot.isEmpty()).isTrue();
    }

    // ── takeOf ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("takeOf — a script variable is taken as its definition, marked as a script")
    void takeOfTakesDefinitionWhenVariableIsScript() {
        GlobalVariable constant = GlobalVariableFixture.aConstant(1L, "limits", "{\"maxPerPage\":50}");
        String definition = new GlobalScript("js", "return 1;", List.of()).toJson();
        GlobalVariable script = GlobalVariableFixture.aScriptVariable(3L, "nextId", definition);

        GlobalVariableSnapshot snapshot = service.takeOf(List.of(constant, script));

        assertThat(snapshot.entries())
                .extracting(Entry::name, Entry::script)
                .containsExactly(tuple("limits", false), tuple("nextId", true));
        assertThat(snapshot.find("nextId")).get()
                .extracting(entry -> GlobalScript.fromJson(entry.value().toString()).code())
                .isEqualTo("return 1;");
    }

    @Test
    @DisplayName("takeOf — a script is parsed once per id and version, and every later run gets that definition")
    void takeOfReusesDefinitionWhenSameVersionIsTakenAgain() {
        GlobalVariable first = aScript(3L, "nextId", 4L, "return 1;");
        GlobalVariable again = aScript(3L, "nextId", 4L, "return 1;");

        GlobalScript parsed = service.takeOf(List.of(first)).script("nextId").orElseThrow();

        assertThat(service.takeOf(List.of(again)).script("nextId")).containsSame(parsed);
    }

    @Test
    @DisplayName("takeOf — a saved change gives the script a new version, which is parsed anew")
    void takeOfParsesDefinitionAgainWhenVersionChanges() {
        service.takeOf(List.of(aScript(3L, "nextId", 4L, "return 1;")));

        GlobalVariableSnapshot snapshot = service.takeOf(List.of(aScript(3L, "nextId", 5L, "return 2;")));

        assertThat(snapshot.script("nextId")).get().extracting(GlobalScript::code).isEqualTo("return 2;");
        assertThat(snapshot.find("nextId")).get()
                .extracting(entry -> GlobalScript.fromJson(entry.value().toString()).code())
                .isEqualTo("return 2;");
    }

    @Test
    @DisplayName("takeOf — a script made again under an old name and version is another variable")
    void takeOfParsesDefinitionAgainWhenVariableIsMadeAgain() {
        service.takeOf(List.of(aScript(3L, "nextId", 0L, "return 1;")));

        GlobalVariableSnapshot snapshot = service.takeOf(List.of(aScript(9L, "nextId", 0L, "return 2;")));

        assertThat(snapshot.script("nextId")).get().extracting(GlobalScript::code).isEqualTo("return 2;");
    }

    @Test
    @DisplayName("takeOf — beyond 256 parsed scripts the one unused longest is dropped")
    void takeOfParsesDefinitionAgainWhenItWasDroppedFromCache() {
        GlobalScript parsed = service.takeOf(List.of(aScript(1L, "script1", 1L, "return 1;")))
                .script("script1").orElseThrow();
        for (long id = 2; id <= 257; id++) {
            service.takeOf(List.of(aScript(id, "script" + id, 1L, "return 1;")));
        }

        GlobalScript taken = service.takeOf(List.of(aScript(1L, "script1", 1L, "return 1;")))
                .script("script1").orElseThrow();

        assertThat(taken).isNotSameAs(parsed).isEqualTo(parsed);
    }

    @Test
    void takeOfThrowsIllegalStateExceptionWhenScriptDefinitionIsNotValid() {
        GlobalVariable broken = GlobalVariableFixture.aScriptVariable(3L, "nextId", "{\"code\": 1, \"parameters\": 2}");

        assertThatThrownBy(() -> service.takeOf(List.of(broken))).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void takeForAsksForEveryKindWhenWorkflowRuns() {
        when(globalVariableRepository.findAllWithScopeTargets(any())).thenReturn(List.of());

        service.takeFor(42L);

        verify(globalVariableRepository).findAllWithScopeTargets(EnumSet.allOf(GlobalVariableKind.class));
    }

    @Test
    @DisplayName("takeOf — a mutable variable gives its current value, not its initial one")
    void takeOfReadsCurrentValueWhenVariableIsMutable() {
        GlobalVariable mutable = GlobalVariableFixture.aMutable(2L, "counter", "0", "7", 12L);

        GlobalVariableSnapshot snapshot = service.takeOf(List.of(mutable));

        assertThat(snapshot.entries()).singleElement()
                .satisfies(entry -> assertThat(entry.value().asInt()).isEqualTo(7));
    }

    @Test
    @DisplayName("takeOf — only the entry of a mutable variable is marked mutable, so a run reads it live")
    void takeOfMarksEntryMutableWhenVariableIsMutable() {
        GlobalVariable mutable = GlobalVariableFixture.aMutable(2L, "counter", "0", "7", 12L);
        GlobalVariable constant = GlobalVariableFixture.aConstant(3L, "limit", "5");

        GlobalVariableSnapshot snapshot = service.takeOf(List.of(mutable, constant));

        assertThat(snapshot.entries())
                .extracting(GlobalVariableSnapshot.Entry::name, GlobalVariableSnapshot.Entry::mutable)
                .containsExactly(tuple("counter", true), tuple("limit", false));
    }

    @Test
    void takeOfReturnsEmptySnapshotWhenNoVariableIsGiven() {
        GlobalVariableSnapshot snapshot = service.takeOf(List.of());

        assertThat(snapshot.isEmpty()).isTrue();
    }

    @Test
    void takeOfThrowsIllegalStateExceptionWhenStoredValueIsNotJson() {
        List<GlobalVariable> variables = List.of(GlobalVariableFixture.aConstant(7L, "broken", "{not json"));

        assertThatThrownBy(() -> service.takeOf(variables))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("'broken'")
                .hasMessageContaining("not valid JSON");
    }

    // ── secrets ───────────────────────────────────────────────────────────────

    @Test
    void takeForDecryptsValueWhenVariableIsSecret() {
        when(connectionRepository.findById(WORKFLOW)).thenReturn(Optional.empty());
        givenVariables(aSecret("apiKey", CIPHER.encrypt("{\"token\":\"s3cr3t\"}")));

        Entry entry = serviceWith(CIPHER).takeFor(WORKFLOW).find("apiKey").orElseThrow();

        assertThat(entry.value().get("token").asText()).isEqualTo("s3cr3t");
    }

    @Test
    void takeForMarksEntryAsSecretWhenVariableIsSecret() {
        when(connectionRepository.findById(WORKFLOW)).thenReturn(Optional.empty());
        givenVariables(aSecret("apiKey", CIPHER.encrypt("\"s3cr3t\"")),
                GlobalVariableFixture.aConstant(2L, "limits", "50"));

        GlobalVariableSnapshot snapshot = serviceWith(CIPHER).takeFor(WORKFLOW);

        assertThat(snapshot.entries()).extracting(Entry::name, Entry::secret)
                .containsExactly(tuple("apiKey", true), tuple("limits", false));
    }

    @Test
    @DisplayName("takeFor — a secret without a value is not decrypted")
    void takeForReturnsNullValueWhenSecretHasNoValue() {
        when(connectionRepository.findById(WORKFLOW)).thenReturn(Optional.empty());
        givenVariables(aSecret("apiKey", null));

        Entry entry = service.takeFor(WORKFLOW).find("apiKey").orElseThrow();

        assertThat(entry.value().isNull()).isTrue();
    }

    @Test
    @DisplayName("takeFor — a secret saved under an own key, read with the built-in default, fails where it is"
            + " read, not when the run starts")
    void takeForReturnsUnreadableEntryWhenDefaultKeyIsInUse() {
        when(connectionRepository.findById(WORKFLOW)).thenReturn(Optional.empty());
        givenVariables(aSecret("apiKey", GlobalVariableFixture.S3CR3T_ENCRYPTED));

        Entry entry = service.takeFor(WORKFLOW).find("apiKey").orElseThrow();

        assertThat(entry.isReadable()).isFalse();
        assertThatThrownBy(entry::value)
                .isInstanceOf(WrongDecryptException.class)
                .hasMessageContaining("'apiKey'")
                .hasMessageContaining("built-in default key");
    }

    @Test
    void takeForReturnsUnreadableEntryWhenKeyDiffers() {
        when(connectionRepository.findById(WORKFLOW)).thenReturn(Optional.empty());
        givenVariables(aSecret("apiKey", GlobalVariableFixture.S3CR3T_ENCRYPTED));

        Entry entry = serviceWith(OTHER_KEY).takeFor(WORKFLOW).find("apiKey").orElseThrow();

        assertThatThrownBy(entry::value)
                .isInstanceOf(WrongDecryptException.class)
                .hasMessageContaining("'apiKey'")
                .hasMessageContaining("is not the one the value was saved with")
                .hasMessageNotContaining(GlobalVariableFixture.S3CR3T_ENCRYPTED);
    }

    @Test
    @DisplayName("takeFor — the parser quotes what it fails on, so its message stays out of the error")
    void takeForReturnsUnreadableEntryWhenDecryptedTextIsNotJson() {
        when(connectionRepository.findById(WORKFLOW)).thenReturn(Optional.empty());
        givenVariables(aSecret("apiKey", CIPHER.encrypt("{s3cr3t")));

        Entry entry = serviceWith(CIPHER).takeFor(WORKFLOW).find("apiKey").orElseThrow();

        assertThatThrownBy(entry::value)
                .isInstanceOf(WrongDecryptException.class)
                .hasMessageContaining("not valid JSON")
                .hasMessageNotContaining("s3cr3t");
    }

    @Test
    @DisplayName("takeFor — the decrypted value goes into the snapshot only, never onto the entity")
    void takeForLeavesEntityEncryptedWhenSecretIsDecrypted() {
        String stored = CIPHER.encrypt("\"s3cr3t\"");
        GlobalVariable secret = aSecret("apiKey", stored);
        when(connectionRepository.findById(WORKFLOW)).thenReturn(Optional.empty());
        givenVariables(secret);

        serviceWith(CIPHER).takeFor(WORKFLOW);

        assertThat(secret.getValue()).isEqualTo(stored);
    }

    @Test
    void takeOpenToAllDecryptsValueWhenVariableIsSecret() {
        givenVariables(aSecret("apiKey", CIPHER.encrypt("\"s3cr3t\"")));

        Entry entry = serviceWith(CIPHER).takeOpenToAll().find("apiKey").orElseThrow();

        assertThat(entry.value().asText()).isEqualTo("s3cr3t");
        assertThat(entry.secret()).isTrue();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private GlobalVariableSnapshotServiceImp serviceWith(GlobalVariableCipher cipher) {
        return new GlobalVariableSnapshotServiceImp(
                globalVariableRepository, connectionRepository,
                new GlobalVariableScopeResolver(categoryRepository), new ObjectMapper(), cipher,
                new TestRunOrigins());
    }

    private static GlobalVariableCipher cipherWithKey(String key) {
        return new GlobalVariableCipher(new MockEnvironment().withProperty(GlobalVariableCipher.KEY_PROPERTY, key));
    }

    /** A secret open to all workflows that stores {@code storedValue}: encrypted text, or {@code null}. */
    private static GlobalVariable aSecret(String name, String storedValue) {
        GlobalVariable variable = GlobalVariableFixture.aConstant(1L, name, storedValue);
        variable.setSecret(true);
        return variable;
    }

    private void givenVariables(GlobalVariable... variables) {
        when(globalVariableRepository.findAllWithScopeTargets(any())).thenReturn(List.of(variables));
    }

    private void givenWorkflowInCategory(Category category) {
        Connection workflow = new Connection();
        workflow.setId(WORKFLOW);
        workflow.setCategoryId(category.getId());
        when(connectionRepository.findById(WORKFLOW)).thenReturn(Optional.of(workflow));
        when(categoryRepository.findById(category.getId())).thenReturn(Optional.of(category));
    }

    private void givenTestCopyWithoutCategory() {
        Connection copy = new Connection();
        copy.setId(COPY);
        when(connectionRepository.findById(COPY)).thenReturn(Optional.of(copy));
    }

    private void givenTestCopyInCategory(Category category) {
        Connection copy = new Connection();
        copy.setId(COPY);
        copy.setCategoryId(category.getId());
        when(connectionRepository.findById(COPY)).thenReturn(Optional.of(copy));
        when(categoryRepository.findById(category.getId())).thenReturn(Optional.of(category));
    }

    private static Category aCategory(int id, Category parent) {
        Category category = CategoryFixture.aCategoryWithId(id, "category-" + id);
        category.setParentCategory(parent);
        return category;
    }

    private static GlobalVariable aVariable(
            String name, GlobalVariableScopeType scopeType, GlobalVariableScopeTarget... targets) {
        GlobalVariable variable = GlobalVariableFixture.aConstant(1L, name, "1");
        variable.setScopeType(scopeType);
        variable.getScopeTargets().addAll(List.of(targets));
        return variable;
    }

    /** A saved script variable at the given version whose code is {@code code}, without parameters. */
    private static GlobalVariable aScript(long id, String name, long version, String code) {
        GlobalVariable variable =
                GlobalVariableFixture.aScriptVariable(id, name, new GlobalScript("js", code, List.of()).toJson());
        variable.setVersion(version);
        return variable;
    }
}
