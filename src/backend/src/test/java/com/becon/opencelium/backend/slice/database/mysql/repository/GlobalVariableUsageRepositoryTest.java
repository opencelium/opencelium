package com.becon.opencelium.backend.slice.database.mysql.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.EventNotification;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage.ElementType;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage.SourceType;
import com.becon.opencelium.backend.database.mysql.repository.GlobalVariableUsageRepository;
import com.becon.opencelium.backend.testutil.annotation.SliceTest;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

/**
 * JPA slice test for {@link GlobalVariableUsageRepository}: the bulk statements that keep the
 * usage index in step with the workflows, the connectors and the notifications, and the grouped
 * count of the list page.
 *
 * A unit test cannot catch:
 *   · a delete that is scoped to the wrong source and wipes the usages of other workflows;
 *   · an orphan cleanup that also removes the usages of workflows that still exist, which would
 *     let a used variable be deleted;
 *   · an orphan cleanup that compares the long id of a source with the int id of a connector or a
 *     notification in a way the database rejects;
 *   · a count that is not grouped per variable.
 *
 * Run with: ./gradlew test --tests "*.GlobalVariableUsageRepositoryTest"
 */
@SliceTest
@DisplayName("GlobalVariableUsageRepository — JPA slice")
class GlobalVariableUsageRepositoryTest {

    // no connector and no notification is ever given this id
    private static final long MISSING_SOURCE = 9_999_999L;

    @Autowired
    private TestEntityManager em;

    @Autowired
    private GlobalVariableUsageRepository repository;

    @Test
    void deleteBySourceRemovesOnlyThatSourceWhenSeveralExist() {
        Long variableId = persistedVariable("idoitUrl");
        em.persist(aUsage(variableId, 11L, "0_1"));
        em.persist(aUsage(variableId, 11L, "0_2"));
        em.persist(aUsage(variableId, 12L, "0_1"));
        em.flush();
        em.clear();

        repository.deleteBySource(SourceType.WORKFLOW, 11L);
        em.flush();
        em.clear();

        assertThat(repository.findAll()).extracting(GlobalVariableUsage::getSourceId).containsExactly(12L);
    }

    @Test
    @DisplayName("orphans — a usage goes when its workflow is gone and stays while it exists")
    void deleteUsagesOfMissingWorkflowsKeepsRowsWhenWorkflowExists() {
        Long variableId = persistedVariable("idoitUrl");
        Connection workflow = new Connection();
        workflow.setTitle("VMware to i-doit");
        Long existingWorkflowId = em.persistAndFlush(workflow).getId();
        long missingWorkflowId = existingWorkflowId + 1000;
        em.persist(aUsage(variableId, existingWorkflowId, "0_1"));
        em.persist(aUsage(variableId, missingWorkflowId, "0_1"));
        em.flush();
        em.clear();

        int removed = repository.deleteUsagesOfMissingWorkflows();
        em.flush();
        em.clear();

        assertThat(removed).isEqualTo(1);
        assertThat(repository.findAll()).extracting(GlobalVariableUsage::getSourceId)
                .containsExactly(existingWorkflowId);
    }

    @Test
    @DisplayName("deleteBySourceAndFields — the other fields, the other connectors and a workflow of that id stay")
    void deleteBySourceAndFieldsRemovesOnlyGivenFieldsWhenSourceHoldsSeveral() {
        Long variableId = persistedVariable("idoitUrl");
        em.persist(GlobalVariableUsage.readByConnector(variableId, 7L, "url"));
        em.persist(GlobalVariableUsage.readByConnector(variableId, 7L, "token"));
        em.persist(GlobalVariableUsage.readByConnector(variableId, 7L, "tenant"));
        em.persist(GlobalVariableUsage.readByConnector(variableId, 8L, "url"));
        em.persist(GlobalVariableUsage.readByWorkflow(
                variableId, 7L, ElementType.METHOD, "0_1", "#ababab", "List objects", "url"));
        em.flush();
        em.clear();

        repository.deleteBySourceAndFields(SourceType.CONNECTOR, 7L, List.of("url", "token"));
        em.flush();
        em.clear();

        assertThat(repository.findAll())
                .extracting(GlobalVariableUsage::getSourceType, GlobalVariableUsage::getSourceId,
                        GlobalVariableUsage::getField)
                .containsExactlyInAnyOrder(
                        tuple(SourceType.CONNECTOR, 7L, "tenant"),
                        tuple(SourceType.CONNECTOR, 8L, "url"),
                        tuple(SourceType.WORKFLOW, 7L, "url"));
    }

    @ParameterizedTest
    @EnumSource(value = SourceType.class, names = {"CONNECTOR", "NOTIFICATION"})
    @DisplayName("orphans — a usage goes when the connector or the notification that held it is gone")
    void deleteUsagesOfMissingSourcesRemovesRowsWhenSourceIsGone(SourceType sourceType) {
        Long variableId = persistedVariable("idoitUrl");
        em.persist(aUsageOutsideWorkflow(variableId, sourceType, MISSING_SOURCE));
        em.flush();
        em.clear();

        int removed = repository.deleteUsagesOfMissingSources();
        em.flush();
        em.clear();

        assertThat(removed).isEqualTo(1);
        assertThat(repository.findAll()).isEmpty();
    }

    @Test
    @DisplayName("orphans — the usages of a workflow, a connector and a notification that exist all stay")
    void deleteUsagesOfMissingSourcesKeepsRowsWhenSourcesExist() {
        Long variableId = persistedVariable("idoitUrl");
        Connection workflow = new Connection();
        workflow.setTitle("VMware to i-doit");
        Long workflowId = em.persistAndFlush(workflow).getId();
        Connector connector = new Connector();
        connector.setTitle("i-doit");
        connector.setInvoker("idoit");
        long connectorId = em.persistAndFlush(connector).getId();
        EventNotification notification = new EventNotification();
        notification.setName("Failure mail");
        long notificationId = em.persistAndFlush(notification).getId();
        em.persist(aUsage(variableId, workflowId, "0_1"));
        em.persist(aUsageOutsideWorkflow(variableId, SourceType.CONNECTOR, connectorId));
        em.persist(aUsageOutsideWorkflow(variableId, SourceType.NOTIFICATION, notificationId));
        em.flush();
        em.clear();

        int removed = repository.deleteUsagesOfMissingSources();
        em.flush();
        em.clear();

        assertThat(removed).isZero();
        assertThat(repository.findAll())
                .extracting(GlobalVariableUsage::getSourceType, GlobalVariableUsage::getSourceId)
                .containsExactlyInAnyOrder(
                        tuple(SourceType.WORKFLOW, workflowId),
                        tuple(SourceType.CONNECTOR, connectorId),
                        tuple(SourceType.NOTIFICATION, notificationId));
    }

    @Test
    void countByVariableIdsGroupsCountsWhenVariablesAreUsed() {
        Long first = persistedVariable("idoitUrl");
        Long second = persistedVariable("tenant");
        Long unused = persistedVariable("unused");
        em.persist(aUsage(first, 11L, "0_1"));
        em.persist(aUsage(first, 12L, "0_1"));
        em.persist(aUsage(second, 11L, "0_3"));
        em.flush();
        em.clear();

        List<Object[]> rows = repository.countByVariableIds(List.of(first, second, unused));

        assertThat(rows).extracting(row -> row[0], row -> row[1])
                .containsExactlyInAnyOrder(tuple(first, 2L), tuple(second, 1L));
    }

    @Test
    void findByVariableIdReturnsUsagesBySourceAndElementWhenSeveralExist() {
        Long variableId = persistedVariable("idoitUrl");
        Long other = persistedVariable("tenant");
        em.persist(aUsage(variableId, 12L, "0_1"));
        em.persist(aUsage(variableId, 11L, "0_2"));
        em.persist(aUsage(variableId, 11L, "0_1"));
        em.persist(aUsage(other, 11L, "0_1"));
        em.flush();
        em.clear();

        List<GlobalVariableUsage> usages =
                repository.findByVariableIdOrderBySourceTypeAscSourceIdAscElementRefAscIdAsc(variableId);

        assertThat(usages).extracting(GlobalVariableUsage::getSourceId, GlobalVariableUsage::getElementRef)
                .containsExactly(tuple(11L, "0_1"), tuple(11L, "0_2"), tuple(12L, "0_1"));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Long persistedVariable(String name) {
        GlobalVariable variable = em.persistAndFlush(GlobalVariableFixture.aTransientConstant(name, 1));
        return variable.getId();
    }

    private static GlobalVariableUsage aUsage(long variableId, long workflowId, String index) {
        return GlobalVariableUsage.readByWorkflow(
                variableId, workflowId, ElementType.METHOD, index, "#ababab", "List objects", "endpoint");
    }

    /** The usage of a connector or of a notification, which have no elements. */
    private static GlobalVariableUsage aUsageOutsideWorkflow(long variableId, SourceType sourceType, long sourceId) {
        return switch (sourceType) {
            case CONNECTOR -> GlobalVariableUsage.readByConnector(variableId, sourceId, "url");
            case NOTIFICATION ->
                    GlobalVariableUsage.readByNotification(variableId, sourceId, "Failure template", "en.body");
            default -> throw new IllegalArgumentException(sourceType + " is not held outside a workflow");
        };
    }
}
