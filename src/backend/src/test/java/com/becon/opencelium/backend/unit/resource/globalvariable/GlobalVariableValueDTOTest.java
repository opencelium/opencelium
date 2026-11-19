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
    @DisplayName("etagOf — only the ids and the versions count, not what else a value carries")
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
    void etagOfChangesWhenVersionChanges() {
        String before = GlobalVariableValueDTO.etagOf(List.of(aValue(7L, 4L), aValue(12L, 1L)));

        String after = GlobalVariableValueDTO.etagOf(List.of(aValue(7L, 5L), aValue(12L, 1L)));

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

    private static GlobalVariableValueDTO aValue(long id, long version, String value, String updatedAt) {
        return new GlobalVariableValueDTO(id, version, new TextNode(value), Instant.parse(updatedAt),
                GlobalVariableDTO.Actor.user(1, "admin"));
    }
}
