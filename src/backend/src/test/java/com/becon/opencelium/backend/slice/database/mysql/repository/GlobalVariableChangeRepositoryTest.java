package com.becon.opencelium.backend.slice.database.mysql.repository;

import static org.assertj.core.api.Assertions.assertThat;

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

/**
 * JPA slice test for {@link GlobalVariableChangeRepository}: the derived query that pages the
 * change log of one variable, newest entry first.
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

    private static GlobalVariableChange aChange(
            GlobalVariable variable, GlobalVariableChange.Type type, Long versionFrom, Long versionTo) {
        return GlobalVariableChange.savedByUser(variable, type, versionFrom, versionTo, "\"old\"", "\"new\"", 1);
    }
}
