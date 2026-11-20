package com.becon.opencelium.backend.slice.database.mysql.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableGrant;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableScopeTarget;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableRepository;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableBusyPolicy;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableKind;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariablePermission;
import com.becon.opencelium.backend.enums.globalvariable.GlobalVariableScopeType;
import com.becon.opencelium.backend.testutil.annotation.SliceTest;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import java.util.Date;
import java.util.EnumSet;
import java.util.List;
import org.hibernate.Hibernate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * JPA slice test for {@link GlobalVariableRepository} and the mapping of {@link GlobalVariable}
 * against the H2 schema.
 *
 * A unit test cannot catch:
 *   · a version that starts at 0 or stays put when only the grants or the scope targets change,
 *     which would break the edit form's conflict check and the change log's version range;
 *   · a mistake in the visibility clause of {@code search}, {@code findUsableWithScopeTargets}
 *     or {@code findViewableByIds}, which would show a user the variables of others or list a
 *     variable once per grant or scope target;
 *   · the escape character of the LIKE pattern, which only a SQL engine applies;
 *   · a save of the definition that writes the current value of a mutable variable back, which
 *     would undo what a run wrote meanwhile, or a reset that moves the version.
 *
 * Run with: ./gradlew test --tests "*.GlobalVariableRepositoryTest"
 */
@SliceTest
@DisplayName("GlobalVariableRepository — JPA slice")
class GlobalVariableRepositoryTest {

    private static final int ALICE = 1;
    private static final int BOB = 2;
    private static final int CAROL = 3;
    private static final Pageable BY_NAME = PageRequest.of(0, 10, Sort.by("name"));

    @Autowired
    private TestEntityManager em;

    @Autowired
    private GlobalVariableRepository repository;

    // ── version ───────────────────────────────────────────────────────────────

    @Test
    void saveStartsVersionAtOneWhenVariableIsNew() {
        GlobalVariable saved = repository.saveAndFlush(GlobalVariableFixture.aTransientConstant("idoitUrl", ALICE));
        em.clear();

        GlobalVariable found = repository.findById(saved.getId()).orElseThrow();

        assertThat(found.getVersion()).isEqualTo(1L);
    }

    @Test
    void saveRaisesVersionWhenValueChanges() {
        Long id = em.persistAndFlush(GlobalVariableFixture.aTransientConstant("idoitUrl", ALICE)).getId();
        em.clear();

        GlobalVariable variable = repository.findById(id).orElseThrow();
        variable.setValue("\"changed\"");
        repository.saveAndFlush(variable);
        em.clear();

        assertThat(repository.findById(id).orElseThrow().getVersion()).isEqualTo(2L);
    }

    @Test
    @DisplayName("save — a change of the grants alone is a new version of the variable")
    void saveRaisesVersionWhenOnlyGrantsChange() {
        Long id = em.persistAndFlush(GlobalVariableFixture.aTransientConstant("idoitUrl", ALICE)).getId();
        em.clear();

        GlobalVariable variable = repository.findById(id).orElseThrow();
        variable.getGrants().add(new GlobalVariableGrant(BOB, GlobalVariablePermission.EDIT));
        repository.saveAndFlush(variable);
        em.clear();

        GlobalVariable found = repository.findById(id).orElseThrow();
        assertThat(found.getVersion()).isEqualTo(2L);
        assertThat(found.getGrants()).containsExactly(new GlobalVariableGrant(BOB, GlobalVariablePermission.EDIT));
    }

    @Test
    void saveKeepsScopeTargetsWhenScopeIsCategories() {
        GlobalVariable variable = GlobalVariableFixture.aTransientConstant("tenants", ALICE);
        variable.setScopeType(GlobalVariableScopeType.CATEGORIES);
        variable.getScopeTargets().add(GlobalVariableScopeTarget.category(3));
        variable.getScopeTargets().add(GlobalVariableScopeTarget.category(4));
        Long id = em.persistAndFlush(variable).getId();
        em.clear();

        GlobalVariable found = repository.findById(id).orElseThrow();

        assertThat(found.getScopeType()).isEqualTo(GlobalVariableScopeType.CATEGORIES);
        assertThat(found.getScopeTargets()).containsExactlyInAnyOrder(
                GlobalVariableScopeTarget.category(3), GlobalVariableScopeTarget.category(4));
    }

    // ── findAllWithScopeTargets ───────────────────────────────────────────────

    @Test
    @DisplayName("findAll — scope targets come loaded with the variables, each variable once")
    void findAllWithScopeTargetsLoadsTargetsWhenVariableHasSeveral() {
        GlobalVariable scoped = GlobalVariableFixture.aTransientConstant("tenants", ALICE);
        scoped.setScopeType(GlobalVariableScopeType.CATEGORIES);
        scoped.getScopeTargets().add(GlobalVariableScopeTarget.category(3));
        scoped.getScopeTargets().add(GlobalVariableScopeTarget.category(4));
        em.persist(scoped);
        em.persist(GlobalVariableFixture.aTransientConstant("idoitUrl", ALICE));
        em.flush();
        em.clear();

        List<GlobalVariable> variables = repository.findAllWithScopeTargets(EnumSet.of(GlobalVariableKind.CONSTANT));
        // detached: whatever is read from here on must have come with the query
        em.clear();

        assertThat(variables).extracting(GlobalVariable::getName).containsExactlyInAnyOrder("idoitUrl", "tenants");
        GlobalVariable tenants = variables.stream()
                .filter(variable -> variable.getName().equals("tenants"))
                .findFirst()
                .orElseThrow();
        assertThat(Hibernate.isInitialized(tenants.getScopeTargets())).isTrue();
        assertThat(tenants.getScopeTargets()).containsExactlyInAnyOrder(
                GlobalVariableScopeTarget.category(3), GlobalVariableScopeTarget.category(4));
    }

    @Test
    void findAllWithScopeTargetsSkipsOtherKindsWhenKindsAreGiven() {
        em.persist(GlobalVariableFixture.aTransientConstant("idoitUrl", ALICE));
        GlobalVariable mutable = GlobalVariableFixture.aTransientConstant("lastSync", ALICE);
        mutable.setKind(GlobalVariableKind.MUTABLE);
        em.persist(mutable);
        GlobalVariable script = GlobalVariableFixture.aTransientConstant("buildTitle", ALICE);
        script.setKind(GlobalVariableKind.SCRIPT);
        em.persist(script);
        em.flush();
        em.clear();

        List<GlobalVariable> variables = repository.findAllWithScopeTargets(
                EnumSet.of(GlobalVariableKind.CONSTANT, GlobalVariableKind.MUTABLE));

        assertThat(variables).extracting(GlobalVariable::getName).containsExactlyInAnyOrder("idoitUrl", "lastSync");
    }

    // ── findUsableWithScopeTargets ────────────────────────────────────────────

    @Test
    @DisplayName("findUsable — what a user owns or was granted, each variable once, scope targets loaded")
    void findUsableWithScopeTargetsReturnsOwnedAndGrantedWhenUserIsGiven() {
        em.persist(GlobalVariableFixture.aTransientConstant("aliceOwn", ALICE));
        GlobalVariable shared = GlobalVariableFixture.aTransientConstant("bobShared", BOB);
        shared.setScopeType(GlobalVariableScopeType.CATEGORIES);
        shared.getScopeTargets().add(GlobalVariableScopeTarget.category(3));
        shared.getScopeTargets().add(GlobalVariableScopeTarget.category(4));
        shared.getGrants().add(new GlobalVariableGrant(ALICE, GlobalVariablePermission.VIEW_USE));
        shared.getGrants().add(new GlobalVariableGrant(ALICE, GlobalVariablePermission.EDIT));
        shared.getGrants().add(new GlobalVariableGrant(CAROL, GlobalVariablePermission.VIEW_USE));
        em.persist(shared);
        GlobalVariable forCarol = GlobalVariableFixture.aTransientConstant("bobForCarol", BOB);
        forCarol.getGrants().add(new GlobalVariableGrant(CAROL, GlobalVariablePermission.VIEW_USE));
        em.persist(forCarol);
        em.persist(GlobalVariableFixture.aTransientConstant("bobPrivate", BOB));
        em.flush();
        em.clear();

        List<GlobalVariable> variables = repository.findUsableWithScopeTargets(ALICE);
        // detached: whatever is read from here on must have come with the query
        em.clear();

        assertThat(variables).extracting(GlobalVariable::getName).containsExactlyInAnyOrder("aliceOwn", "bobShared");
        GlobalVariable bobShared = variables.stream()
                .filter(variable -> variable.getName().equals("bobShared"))
                .findFirst()
                .orElseThrow();
        assertThat(Hibernate.isInitialized(bobShared.getScopeTargets())).isTrue();
        assertThat(bobShared.getScopeTargets()).containsExactlyInAnyOrder(
                GlobalVariableScopeTarget.category(3), GlobalVariableScopeTarget.category(4));
    }

    @Test
    void findUsableWithScopeTargetsReturnsEveryVariableWhenUserIsNull() {
        em.persist(GlobalVariableFixture.aTransientConstant("aliceOwn", ALICE));
        GlobalVariable shared = GlobalVariableFixture.aTransientConstant("bobShared", BOB);
        shared.getGrants().add(new GlobalVariableGrant(ALICE, GlobalVariablePermission.VIEW_USE));
        shared.getGrants().add(new GlobalVariableGrant(CAROL, GlobalVariablePermission.VIEW_USE));
        em.persist(shared);
        em.persist(GlobalVariableFixture.aTransientConstant("bobPrivate", BOB));
        em.flush();
        em.clear();

        List<GlobalVariable> variables = repository.findUsableWithScopeTargets(null);

        assertThat(variables)
                .extracting(GlobalVariable::getName)
                .containsExactlyInAnyOrder("aliceOwn", "bobPrivate", "bobShared");
    }

    // ── findViewableByIds ─────────────────────────────────────────────────────

    @Test
    @DisplayName("findViewable — of the asked ids, what the user owns or was granted, each variable once")
    void findViewableByIdsLeavesOutOthersVariablesWhenUserIsGiven() {
        Long ownId = em.persist(GlobalVariableFixture.aTransientConstant("aliceOwn", ALICE)).getId();
        GlobalVariable shared = GlobalVariableFixture.aTransientConstant("bobShared", BOB);
        shared.getGrants().add(new GlobalVariableGrant(ALICE, GlobalVariablePermission.VIEW_USE));
        shared.getGrants().add(new GlobalVariableGrant(ALICE, GlobalVariablePermission.EDIT));
        Long sharedId = em.persist(shared).getId();
        GlobalVariable forCarol = GlobalVariableFixture.aTransientConstant("bobForCarol", BOB);
        forCarol.getGrants().add(new GlobalVariableGrant(CAROL, GlobalVariablePermission.VIEW_USE));
        Long forCarolId = em.persist(forCarol).getId();
        Long privateId = em.persist(GlobalVariableFixture.aTransientConstant("bobPrivate", BOB)).getId();
        em.flush();
        em.clear();

        List<GlobalVariable> variables =
                repository.findViewableByIds(List.of(ownId, sharedId, forCarolId, privateId), ALICE);

        assertThat(variables).extracting(GlobalVariable::getName).containsExactlyInAnyOrder("aliceOwn", "bobShared");
    }

    @Test
    @DisplayName("findViewable — an id no variable has is skipped, and so is a variable that was not asked for")
    void findViewableByIdsLeavesOutUnknownIdsWhenIdIsMissing() {
        Long askedId = em.persist(GlobalVariableFixture.aTransientConstant("idoitUrl", ALICE)).getId();
        Long notAskedId = em.persist(GlobalVariableFixture.aTransientConstant("tenant", ALICE)).getId();
        em.flush();
        em.clear();
        long unknownId = Math.max(askedId, notAskedId) + 1000;

        List<GlobalVariable> variables = repository.findViewableByIds(List.of(askedId, unknownId), null);

        assertThat(variables).extracting(GlobalVariable::getName).containsExactly("idoitUrl");
    }

    // ── findByNameIn ──────────────────────────────────────────────────────────

    @Test
    void findByNameInReturnsVariablesWhenNamesMatch() {
        em.persist(GlobalVariableFixture.aTransientConstant("idoitUrl", ALICE));
        em.persist(GlobalVariableFixture.aTransientConstant("tenant", ALICE));
        em.persist(GlobalVariableFixture.aTransientConstant("lastSync", ALICE));
        em.flush();
        em.clear();

        List<GlobalVariable> variables = repository.findByNameIn(List.of("idoitUrl", "lastSync", "missing"));

        assertThat(variables).extracting(GlobalVariable::getName).containsExactlyInAnyOrder("idoitUrl", "lastSync");
    }

    // ── existsByNameIgnoreCase ────────────────────────────────────────────────

    @Test
    void existsByNameIgnoreCaseReturnsTrueWhenCaseDiffers() {
        em.persistAndFlush(GlobalVariableFixture.aTransientConstant("lastSync", ALICE));
        em.clear();

        boolean result = repository.existsByNameIgnoreCase("LASTSYNC");

        assertThat(result).isTrue();
    }

    @Test
    void existsByNameIgnoreCaseReturnsFalseWhenNameIsUnknown() {
        em.persistAndFlush(GlobalVariableFixture.aTransientConstant("lastSync", ALICE));
        em.clear();

        boolean result = repository.existsByNameIgnoreCase("lastSyncs");

        assertThat(result).isFalse();
    }

    // ── search ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("search — a user sees what they own or were granted, each variable once")
    void searchReturnsOwnedAndGrantedVariablesWhenUserIsGiven() {
        em.persist(GlobalVariableFixture.aTransientConstant("aliceOwn", ALICE));
        GlobalVariable shared = GlobalVariableFixture.aTransientConstant("bobShared", BOB);
        shared.getGrants().add(new GlobalVariableGrant(ALICE, GlobalVariablePermission.VIEW_USE));
        shared.getGrants().add(new GlobalVariableGrant(ALICE, GlobalVariablePermission.EDIT));
        em.persist(shared);
        em.persist(GlobalVariableFixture.aTransientConstant("bobPrivate", BOB));
        em.flush();
        em.clear();

        Page<GlobalVariable> page = repository.search(null, null, ALICE, BY_NAME);

        assertThat(page.getContent()).extracting(GlobalVariable::getName).containsExactly("aliceOwn", "bobShared");
        assertThat(page.getTotalElements()).isEqualTo(2);
    }

    @Test
    void searchReturnsEveryVariableWhenUserIsNull() {
        em.persist(GlobalVariableFixture.aTransientConstant("aliceOwn", ALICE));
        em.persist(GlobalVariableFixture.aTransientConstant("bobPrivate", BOB));
        em.flush();
        em.clear();

        Page<GlobalVariable> page = repository.search(null, null, null, BY_NAME);

        assertThat(page.getContent()).extracting(GlobalVariable::getName).containsExactly("aliceOwn", "bobPrivate");
    }

    @Test
    void searchKeepsGivenKindWhenKindIsGiven() {
        em.persist(GlobalVariableFixture.aTransientConstant("idoitUrl", ALICE));
        GlobalVariable mutable = GlobalVariableFixture.aTransientConstant("lastSync", ALICE);
        mutable.setKind(GlobalVariableKind.MUTABLE);
        em.persist(mutable);
        em.flush();
        em.clear();

        Page<GlobalVariable> page = repository.search(GlobalVariableKind.MUTABLE, null, null, BY_NAME);

        assertThat(page.getContent()).extracting(GlobalVariable::getName).containsExactly("lastSync");
    }

    @Test
    @DisplayName("search — the text is looked for in the name and in the description")
    void searchMatchesNameOrDescriptionWhenPatternIsGiven() {
        em.persist(GlobalVariableFixture.aTransientConstant("idoitUrl", ALICE));
        GlobalVariable described = GlobalVariableFixture.aTransientConstant("endpoint", ALICE);
        described.setDescription("Base URL of i-doit");
        em.persist(described);
        em.persist(GlobalVariableFixture.aTransientConstant("lastSync", ALICE));
        em.flush();
        em.clear();

        Page<GlobalVariable> page = repository.search(null, "%url%", null, BY_NAME);

        assertThat(page.getContent()).extracting(GlobalVariable::getName).containsExactly("endpoint", "idoitUrl");
    }

    @Test
    @DisplayName("search — an escaped '_' matches an underscore only, not any character")
    void searchMatchesUnderscoreLiterallyWhenPatternEscapesIt() {
        em.persist(GlobalVariableFixture.aTransientConstant("last_sync", ALICE));
        em.persist(GlobalVariableFixture.aTransientConstant("lastXsync", ALICE));
        em.flush();
        em.clear();

        Page<GlobalVariable> page = repository.search(null, "%last!_sync%", null, BY_NAME);

        assertThat(page.getContent()).extracting(GlobalVariable::getName).containsExactly("last_sync");
    }

    // ── current value of a mutable variable ───────────────────────────────────

    @Test
    @DisplayName("resetCurrentValue — the initial value comes back, the revision goes up, the version stays")
    void resetCurrentValueSetsInitialValueWhenVariableIsMutable() {
        Long id = em.persistAndFlush(aTransientMutable("lastSync", "\"live\"")).getId();
        em.clear();
        Date resetAt = new Date();

        int updated = repository.resetCurrentValue(id, resetAt, BOB);

        GlobalVariable found = repository.findById(id).orElseThrow();
        assertThat(updated).isEqualTo(1);
        assertThat(found.getCurrentValue()).isEqualTo("\"value\"");
        assertThat(found.getCurrentRevision()).isEqualTo(1L);
        assertThat(found.getCurrentSetByUser()).isEqualTo(BOB);
        assertThat(found.getCurrentSetByExecution()).isNull();
        assertThat(found.getCurrentSetAt()).isNotNull();
        assertThat(found.getVersion()).isEqualTo(1L);
    }

    @Test
    void resetCurrentValueChangesNothingWhenVariableIsConstant() {
        Long id = em.persistAndFlush(GlobalVariableFixture.aTransientConstant("idoitUrl", ALICE)).getId();
        em.clear();

        int updated = repository.resetCurrentValue(id, new Date(), BOB);

        GlobalVariable found = repository.findById(id).orElseThrow();
        assertThat(updated).isZero();
        assertThat(found.getCurrentValue()).isNull();
        assertThat(found.getCurrentRevision()).isZero();
    }

    @Test
    @DisplayName("save — an edit of the definition leaves the current value as the database has it")
    void saveLeavesCurrentValueAloneWhenDefinitionChanges() {
        Long id = em.persistAndFlush(aTransientMutable("lastSync", "\"live\"")).getId();
        em.clear();

        GlobalVariable variable = repository.findById(id).orElseThrow();
        variable.setDescription("Time of the last sync");
        variable.setCurrentValue("\"stale\"");
        variable.setCurrentRevision(9);
        repository.saveAndFlush(variable);
        em.clear();

        GlobalVariable found = repository.findById(id).orElseThrow();
        assertThat(found.getDescription()).isEqualTo("Time of the last sync");
        assertThat(found.getCurrentValue()).isEqualTo("\"live\"");
        assertThat(found.getCurrentRevision()).isZero();
    }

    @Test
    @DisplayName("writeCurrentValue — a run's value lands with its execution, the version stays")
    void writeCurrentValueStoresValueWhenVariableIsMutable() {
        Long id = em.persistAndFlush(aTransientMutable("lastSync", "\"live\"")).getId();
        em.clear();

        int updated = repository.writeCurrentValue(id, "\"2026-11-20\"", new Date(), 900L);

        GlobalVariable found = repository.findById(id).orElseThrow();
        assertThat(updated).isEqualTo(1);
        assertThat(found.getCurrentValue()).isEqualTo("\"2026-11-20\"");
        assertThat(found.getCurrentRevision()).isEqualTo(1L);
        assertThat(found.getCurrentSetByExecution()).isEqualTo(900L);
        assertThat(found.getCurrentSetByUser()).isNull();
        assertThat(found.getVersion()).isEqualTo(1L);
    }

    @Test
    void writeCurrentValueChangesNothingWhenVariableIsConstant() {
        Long id = em.persistAndFlush(GlobalVariableFixture.aTransientConstant("idoitUrl", ALICE)).getId();
        em.clear();

        assertThat(repository.writeCurrentValue(id, "1", new Date(), 900L)).isZero();
    }

    /** Unsaved mutable variable with the initial value "value", owned by Alice. */
    private static GlobalVariable aTransientMutable(String name, String currentJson) {
        GlobalVariable variable = GlobalVariableFixture.aTransientConstant(name, ALICE);
        variable.setKind(GlobalVariableKind.MUTABLE);
        variable.setCurrentValue(currentJson);
        variable.setBusyPolicy(GlobalVariableBusyPolicy.QUEUE);
        variable.setOwnerWorkflowId(12L);
        return variable;
    }
}
