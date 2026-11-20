package com.becon.opencelium.backend.unit.execution.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;
import static org.mockito.ArgumentMatchers.any;
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
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot.Entry;
import com.becon.opencelium.backend.execution.globalvariable.TestRunOrigins;
import com.becon.opencelium.backend.execution.service.GlobalVariableSnapshotServiceImp;
import com.becon.opencelium.backend.testutil.fixture.CategoryFixture;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.becon.opencelium.backend.utility.crypto.GlobalVariableCipher;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
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
    @DisplayName("takeOf — a script variable holds code, not a value, so it is left out")
    void takeOfLeavesOutScriptVariablesWhenKindsAreMixed() {
        GlobalVariable constant = GlobalVariableFixture.aConstant(1L, "limits", "{\"maxPerPage\":50}");
        GlobalVariable mutable = GlobalVariableFixture.aConstant(2L, "counter", "7");
        mutable.setKind(GlobalVariableKind.MUTABLE);
        GlobalVariable script = GlobalVariableFixture.aConstant(3L, "nextId", "return counter + 1;");
        script.setKind(GlobalVariableKind.SCRIPT);

        GlobalVariableSnapshot snapshot = service.takeOf(List.of(constant, mutable, script));

        assertThat(snapshot.entries()).extracting(Entry::name).containsExactly("counter", "limits");
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
}
