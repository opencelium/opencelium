package com.becon.opencelium.backend.unit.resource.globalvariable;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableDTO;
import com.becon.opencelium.backend.resource.globalvariable.GlobalVariableValueDTO;
import com.fasterxml.jackson.databind.node.TextNode;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link GlobalVariableValueDTO#etagOf(List)}: the entity tag the values endpoint
 * answers with, which lets a polling screen skip an answer that would repeat the last one.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalVariableValueDTOTest"
 */
@DisplayName("GlobalVariableValueDTO — unit")
class GlobalVariableValueDTOTest {

    @Test
    @DisplayName("etagOf — only the ids, the versions and the revisions count, not what else a value carries")
    void etagOfReturnsSameTagWhenIdsAndVersionsAreEqual() {
        List<GlobalVariableValueDTO> first = List.of(
                aValue(7L, 4L, "https://cmdb.example", "2026-11-16T09:12:00Z"),
                aValue(12L, 1L, "acme", "2026-11-02T09:00:00Z"));
        List<GlobalVariableValueDTO> second = List.of(
                aValue(7L, 4L, "https://other.example", "2026-11-19T10:14:02Z"),
                aValue(12L, 1L, "globex", "2026-11-19T10:14:02Z"));

        String tag = GlobalVariableValueDTO.etagOf(second);

        assertThat(tag).isEqualTo(GlobalVariableValueDTO.etagOf(first));
    }

    @Test
    @DisplayName("etagOf — a run of the owner workflow that starts or ends changes the tag")
    void etagOfChangesWhenBeingUpdatedByChanges() {
        GlobalVariableValueDTO idle = aValue(7L, 4L, 2L);
        GlobalVariableValueDTO busy = aValueUpdatedBy(idle, aRun(42L, 511L));

        String before = GlobalVariableValueDTO.etagOf(List.of(idle));
        String after = GlobalVariableValueDTO.etagOf(List.of(busy));

        assertThat(after).isNotEqualTo(before);
    }

    @Test
    @DisplayName("etagOf — a second owner workflow that starts to run changes the tag")
    void etagOfChangesWhenAnotherOwnerWorkflowStartsToRun() {
        GlobalVariableValueDTO idle = aValue(7L, 4L, 2L);
        GlobalVariableValueDTO oneRun = aValueUpdatedBy(idle, aRun(42L, 511L));
        GlobalVariableValueDTO twoRuns = aValueUpdatedBy(idle, aRun(42L, 511L), aRun(43L, 512L));

        String before = GlobalVariableValueDTO.etagOf(List.of(oneRun));
        String after = GlobalVariableValueDTO.etagOf(List.of(twoRuns));

        assertThat(after).isNotEqualTo(before);
    }

    @Test
    void constructorReturnsEmptyBeingUpdatedByWhenNoneIsGiven() {
        assertThat(aValue(7L, 4L, 2L).beingUpdatedBy()).isEmpty();
    }

    @Test
    void etagOfChangesWhenVersionChanges() {
        String before = GlobalVariableValueDTO.etagOf(List.of(aValue(7L, 4L), aValue(12L, 1L)));

        String after = GlobalVariableValueDTO.etagOf(List.of(aValue(7L, 5L), aValue(12L, 1L)));

        assertThat(after).isNotEqualTo(before);
    }

    @Test
    @DisplayName("etagOf — a new current value of a mutable variable changes the tag, though the version stays")
    void etagOfChangesWhenRevisionChanges() {
        String before = GlobalVariableValueDTO.etagOf(List.of(aValue(7L, 4L, 2L)));

        String after = GlobalVariableValueDTO.etagOf(List.of(aValue(7L, 4L, 3L)));

        assertThat(after).isNotEqualTo(before);
    }

    @Test
    void etagOfChangesWhenVariableLeavesList() {
        String before = GlobalVariableValueDTO.etagOf(List.of(aValue(7L, 4L), aValue(12L, 1L)));

        String after = GlobalVariableValueDTO.etagOf(List.of(aValue(7L, 4L)));

        assertThat(after).isNotEqualTo(before);
    }

    private static GlobalVariableValueDTO aValue(long id, long version) {
        return aValue(id, version, "value", "2026-11-16T09:12:00Z");
    }

    private static GlobalVariableValueDTO aValue(long id, long version, long revision) {
        return new GlobalVariableValueDTO(id, version, revision, new TextNode("value"),
                Instant.parse("2026-11-16T09:12:00Z"), GlobalVariableDTO.Actor.user(1, "admin"), null);
    }

    private static GlobalVariableValueDTO aValueUpdatedBy(
            GlobalVariableValueDTO value, GlobalVariableDTO.BeingUpdatedBy... runs) {
        return new GlobalVariableValueDTO(value.id(), value.version(), value.revision(), value.value(),
                value.updatedAt(), value.updatedBy(), List.of(runs));
    }

    private static GlobalVariableDTO.BeingUpdatedBy aRun(long workflowId, long executionId) {
        return new GlobalVariableDTO.BeingUpdatedBy(workflowId, executionId, Instant.parse("2026-11-20T10:00:00Z"));
    }

    private static GlobalVariableValueDTO aValue(long id, long version, String value, String updatedAt) {
        return new GlobalVariableValueDTO(id, version, 0L, new TextNode(value), Instant.parse(updatedAt),
                GlobalVariableDTO.Actor.user(1, "admin"), null);
    }
}
