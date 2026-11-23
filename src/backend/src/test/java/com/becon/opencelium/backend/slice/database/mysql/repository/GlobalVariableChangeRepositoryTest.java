package com.becon.opencelium.backend.slice.database.mysql.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableChange;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableChangeRepository;
import com.becon.opencelium.backend.testutil.annotation.SliceTest;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.Date;
import java.util.List;

/**
 * JPA slice test for {@link GlobalVariableChangeRepository}: the derived query that pages the
 * change log of one variable, newest entry first, the native update that masks the values
 * of a variable that became a secret, and the two queries that let the oldest entries of run
 * writes leave the log.
 *
 * Run with: ./gradlew test --tests "*.GlobalVariableChangeRepositoryTest"
 */
@SliceTest
@DisplayName("GlobalVariableChangeRepository — JPA slice")
class GlobalVariableChangeRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private GlobalVariableChangeRepository repository;

    @Test
    @DisplayName("find — entries saved in the same instant come back by id, newest first")
    void findByVariableIdReturnsNewestChangeFirstWhenSeveralExist() {
        GlobalVariable variable = em.persistAndFlush(GlobalVariableFixture.aTransientConstant("idoitUrl", 1));
        em.persist(aChange(variable, GlobalVariableChange.Type.CREATE, null, 1L));
        em.persist(aChange(variable, GlobalVariableChange.Type.VALUE, 1L, 2L));
        em.persist(aChange(variable, GlobalVariableChange.Type.CONFIG, 2L, 3L));
        em.flush();
        em.clear();

        Page<GlobalVariableChange> page = repository.findByVariableIdOrderByChangedAtDescIdDesc(
                variable.getId(), PageRequest.of(0, 2));

        assertThat(page.getContent())
                .extracting(GlobalVariableChange::getChangeType)
                .containsExactly(GlobalVariableChange.Type.CONFIG, GlobalVariableChange.Type.VALUE);
        assertThat(page.getTotalElements()).isEqualTo(3);
    }

    @Test
    void findByVariableIdSkipsOtherVariablesWhenSeveralHaveChanges() {
        GlobalVariable first = em.persistAndFlush(GlobalVariableFixture.aTransientConstant("idoitUrl", 1));
        GlobalVariable second = em.persistAndFlush(GlobalVariableFixture.aTransientConstant("lastSync", 1));
        em.persist(aChange(first, GlobalVariableChange.Type.CREATE, null, 1L));
        em.persist(aChange(second, GlobalVariableChange.Type.CREATE, null, 1L));
        em.flush();
        em.clear();

        Page<GlobalVariableChange> page = repository.findByVariableIdOrderByChangedAtDescIdDesc(
                second.getId(), PageRequest.of(0, 10));

        assertThat(page.getContent())
                .extracting(GlobalVariableChange::getVariableName)
                .containsExactly("lastSync");
    }

    @Test
    @DisplayName("maskValues — every value of a creation, a value change, a restore and a deletion becomes the mask")
    void maskValuesOverwritesValuesWhenEntriesHoldValues() {
        GlobalVariable variable = em.persistAndFlush(GlobalVariableFixture.aTransientConstant("apiKey", 1));
        em.persist(aValueChange(variable, GlobalVariableChange.Type.CREATE, "\"old\"", "\"new\""));
        em.persist(aValueChange(variable, GlobalVariableChange.Type.VALUE, "\"old\"", "\"new\""));
        em.persist(aValueChange(variable, GlobalVariableChange.Type.RESTORE, "\"old\"", "\"new\""));
        em.persist(aValueChange(variable, GlobalVariableChange.Type.DELETE, "\"old\"", "\"new\""));
        em.flush();
        em.clear();

        int masked = repository.maskValues(variable.getId(), GlobalVariableChange.SECRET_MASK);
        em.clear();

        assertThat(masked).isEqualTo(4);
        assertThat(changesOf(variable))
                .extracting(GlobalVariableChange::getOldValue, GlobalVariableChange::getNewValue)
                .containsOnly(tuple(GlobalVariableChange.SECRET_MASK, GlobalVariableChange.SECRET_MASK));
    }

    @Test
    @DisplayName("maskValues — a side that holds no value stays empty rather than showing a mask")
    void maskValuesKeepsNullSideWhenEntryHasNoValue() {
        GlobalVariable variable = em.persistAndFlush(GlobalVariableFixture.aTransientConstant("apiKey", 1));
        em.persist(aValueChange(variable, GlobalVariableChange.Type.CREATE, null, "\"new\""));
        em.persist(aValueChange(variable, GlobalVariableChange.Type.DELETE, "\"old\"", null));
        em.flush();
        em.clear();

        repository.maskValues(variable.getId(), GlobalVariableChange.SECRET_MASK);
        em.clear();

        assertThat(changesOf(variable))
                .extracting(GlobalVariableChange::getOldValue, GlobalVariableChange::getNewValue)
                .containsExactlyInAnyOrder(
                        tuple(null, GlobalVariableChange.SECRET_MASK),
                        tuple(GlobalVariableChange.SECRET_MASK, null));
    }

    @Test
    @DisplayName("maskValues — the changed fields of CONFIG and PERMISSIONS entries hold no value and stay")
    void maskValuesLeavesConfigEntriesUnchanged() {
        GlobalVariable variable = em.persistAndFlush(GlobalVariableFixture.aTransientConstant("apiKey", 1));
        em.persist(aValueChange(variable, GlobalVariableChange.Type.CONFIG,
                "{\"description\":\"a\"}", "{\"description\":\"b\"}"));
        em.persist(aValueChange(variable, GlobalVariableChange.Type.PERMISSIONS,
                "{\"grants\":[]}", "{\"grants\":[{\"userId\":8}]}"));
        em.flush();
        em.clear();

        repository.maskValues(variable.getId(), GlobalVariableChange.SECRET_MASK);
        em.clear();

        assertThat(changesOf(variable))
                .extracting(GlobalVariableChange::getOldValue, GlobalVariableChange::getNewValue)
                .containsExactlyInAnyOrder(
                        tuple("{\"description\":\"a\"}", "{\"description\":\"b\"}"),
                        tuple("{\"grants\":[]}", "{\"grants\":[{\"userId\":8}]}"));
    }

    @Test
    void maskValuesLeavesOtherVariablesUnchanged() {
        GlobalVariable secret = em.persistAndFlush(GlobalVariableFixture.aTransientConstant("apiKey", 1));
        GlobalVariable other = em.persistAndFlush(GlobalVariableFixture.aTransientConstant("idoitUrl", 1));
        em.persist(aValueChange(secret, GlobalVariableChange.Type.VALUE, "\"old\"", "\"new\""));
        em.persist(aValueChange(other, GlobalVariableChange.Type.VALUE, "\"old\"", "\"new\""));
        em.flush();
        em.clear();

        repository.maskValues(secret.getId(), GlobalVariableChange.SECRET_MASK);
        em.clear();

        assertThat(changesOf(other))
                .extracting(GlobalVariableChange::getOldValue, GlobalVariableChange::getNewValue)
                .containsExactly(tuple("\"old\"", "\"new\""));
    }

    // ── run writes ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("find by type — a page of one entry at index n is the newest entry past the first n")
    void findByVariableIdAndChangeTypeOrderByIdDescReturnsEntryPastLimitWhenMoreAreStored() {
        GlobalVariable variable = em.persistAndFlush(GlobalVariableFixture.aTransientConstant("lastSync", 1));
        em.persist(aRunWrite(variable, 901L));
        em.persist(aValueChange(variable, GlobalVariableChange.Type.VALUE, "\"old\"", "\"new\""));
        em.persist(aRunWrite(variable, 902L));
        em.persist(aRunWrite(variable, 903L));
        em.flush();
        em.clear();

        List<GlobalVariableChange> pastLimit = repository.findByVariableIdAndChangeTypeOrderByIdDesc(
                variable.getId(), GlobalVariableChange.Type.RUN_WRITE, PageRequest.of(2, 1));

        assertThat(pastLimit).extracting(GlobalVariableChange::getExecutionId).containsExactly(901L);
    }

    @Test
    void findByVariableIdAndChangeTypeOrderByIdDescReturnsNothingWhenLimitIsNotReached() {
        GlobalVariable variable = em.persistAndFlush(GlobalVariableFixture.aTransientConstant("lastSync", 1));
        em.persist(aValueChange(variable, GlobalVariableChange.Type.VALUE, "\"old\"", "\"new\""));
        em.persist(aRunWrite(variable, 901L));
        em.persist(aRunWrite(variable, 902L));
        em.flush();
        em.clear();

        List<GlobalVariableChange> pastLimit = repository.findByVariableIdAndChangeTypeOrderByIdDesc(
                variable.getId(), GlobalVariableChange.Type.RUN_WRITE, PageRequest.of(2, 1));

        assertThat(pastLimit).isEmpty();
    }

    @Test
    @DisplayName("deleteByTypeUpTo — newer run writes, entries of other types and other variables stay")
    void deleteByTypeUpToDeletesOnlyOlderRunWritesOfVariable() {
        GlobalVariable variable = em.persistAndFlush(GlobalVariableFixture.aTransientConstant("lastSync", 1));
        GlobalVariable other = em.persistAndFlush(GlobalVariableFixture.aTransientConstant("cursor", 1));
        em.persist(aValueChange(variable, GlobalVariableChange.Type.VALUE, "\"old\"", "\"new\""));
        em.persist(aRunWrite(other, 900L));
        em.persist(aRunWrite(variable, 901L));
        GlobalVariableChange lastToGo = em.persist(aRunWrite(variable, 902L));
        em.persist(aRunWrite(variable, 903L));
        em.flush();
        em.clear();

        int deleted = repository.deleteByTypeUpTo(
                variable.getId(), GlobalVariableChange.Type.RUN_WRITE, lastToGo.getId());
        em.clear();

        assertThat(deleted).isEqualTo(2);
        assertThat(changesOf(variable))
                .extracting(GlobalVariableChange::getChangeType, GlobalVariableChange::getExecutionId)
                .containsExactlyInAnyOrder(
                        tuple(GlobalVariableChange.Type.VALUE, null),
                        tuple(GlobalVariableChange.Type.RUN_WRITE, 903L));
        assertThat(changesOf(other)).extracting(GlobalVariableChange::getExecutionId).containsExactly(900L);
    }

    private List<GlobalVariableChange> changesOf(GlobalVariable variable) {
        return repository.findByVariableIdOrderByChangedAtDescIdDesc(variable.getId(), PageRequest.of(0, 20))
                .getContent();
    }

    private static GlobalVariableChange aChange(
            GlobalVariable variable, GlobalVariableChange.Type type, Long versionFrom, Long versionTo) {
        return GlobalVariableChange.savedByUser(variable, type, versionFrom, versionTo, "\"old\"", "\"new\"", 1);
    }

    private static GlobalVariableChange aValueChange(
            GlobalVariable variable, GlobalVariableChange.Type type, String oldValue, String newValue) {
        return GlobalVariableChange.savedByUser(variable, type, 1L, 2L, oldValue, newValue, 1);
    }

    /** What an execution of workflow 42 wrote to the variable in one write. */
    private static GlobalVariableChange aRunWrite(GlobalVariable variable, long executionId) {
        return GlobalVariableChange.writtenByRun(variable, "\"old\"", "\"new\"", 42L, executionId, 1, new Date());
    }
}
