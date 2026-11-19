package com.becon.opencelium.backend.unit.execution.globalvariable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot.Entry;
import com.fasterxml.jackson.databind.node.IntNode;
import com.fasterxml.jackson.databind.node.TextNode;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link GlobalVariableSnapshot}.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalVariableSnapshotTest"
 */
@DisplayName("GlobalVariableSnapshot — unit")
class GlobalVariableSnapshotTest {

    @Test
    void findReturnsEntryWhenNameMatchesExactly() {
        Entry idoitUrl = new Entry("idoitUrl", 4, new TextNode("https://cmdb.example.test"));
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.of(List.of(idoitUrl, new Entry("limit", 2, new IntNode(50))));

        assertThat(snapshot.find("idoitUrl")).contains(idoitUrl);
    }

    @Test
    void findReturnsEmptyWhenCaseDiffers() {
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.of(List.of(new Entry("idoitUrl", 4, new TextNode("x"))));

        assertThat(snapshot.find("IDOITURL")).isEmpty();
    }

    @Test
    void entriesReturnsVariablesByNameWhenSeveralExist() {
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.of(List.of(
                new Entry("tenants", 1, new TextNode("x")),
                new Entry("idoitUrl", 4, new TextNode("x")),
                new Entry("limit", 2, new IntNode(50))));

        assertThat(snapshot.entries()).extracting(Entry::name).containsExactly("idoitUrl", "limit", "tenants");
    }

    @Test
    void ofThrowsIllegalArgumentExceptionWhenNameRepeats() {
        List<Entry> entries = List.of(
                new Entry("idoitUrl", 4, new TextNode("a")),
                new Entry("idoitUrl", 5, new TextNode("b")));

        assertThatThrownBy(() -> GlobalVariableSnapshot.of(entries))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("'idoitUrl'")
                .hasMessageContaining("twice");
    }

    @Test
    void ofReturnsEmptySnapshotWhenNoEntryIsGiven() {
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.of(List.of());

        assertThat(snapshot.isEmpty()).isTrue();
        assertThat(snapshot.entries()).isEmpty();
        assertThat(snapshot.find("idoitUrl")).isEmpty();
    }

    @Test
    void isEmptyReturnsFalseWhenSnapshotHoldsVariable() {
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.of(List.of(new Entry("idoitUrl", 4, new TextNode("x"))));

        assertThat(snapshot.isEmpty()).isFalse();
    }
}
