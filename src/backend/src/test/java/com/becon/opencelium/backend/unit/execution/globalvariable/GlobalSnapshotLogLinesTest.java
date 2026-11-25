package com.becon.opencelium.backend.unit.execution.globalvariable;

import static com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture.aSnapshotOf;
import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.execution.globalvariable.GlobalSnapshotLogLines;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot.Entry;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.TextNode;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link GlobalSnapshotLogLines}: the mask of secrets and the size rule of the
 * values a run logs.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalSnapshotLogLinesTest" -x generateProto
 */
@DisplayName("GlobalSnapshotLogLines — unit")
class GlobalSnapshotLogLinesTest {

    private static final String MASKED_LINE = "segment=GLOBAL_SNAPSHOT name=idoitApiKey version=2 data=\"••••\"";

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void ofReturnsNoLinesWhenSnapshotIsEmpty() {
        List<String> lines = GlobalSnapshotLogLines.of(GlobalVariableSnapshot.empty());

        assertThat(lines).isEmpty();
    }

    @Test
    void ofWritesCompactJsonWhenVariableIsPlain() throws Exception {
        JsonNode limits = mapper.readTree("{ \"max\": 50, \"tags\": [ \"a\", \"b\" ] }");

        List<String> lines = GlobalSnapshotLogLines.of(aSnapshotOf(new Entry("limits", 3, limits)));

        assertThat(lines).containsExactly(
                "segment=GLOBAL_SNAPSHOT name=limits version=3 data={\"max\":50,\"tags\":[\"a\",\"b\"]}");
    }

    @Test
    void ofWritesMaskWhenVariableIsSecret() {
        Entry apiKey = Entry.ofSecret("idoitApiKey", 2, TextNode.valueOf("s3cr3t-api-key"), true);

        List<String> lines = GlobalSnapshotLogLines.of(aSnapshotOf(apiKey));

        assertThat(lines).containsExactly(MASKED_LINE);
    }

    @Test
    @DisplayName("of — a secret that cannot be decrypted is masked, and reading it does not fail")
    void ofWritesMaskWhenSecretIsUnreadable() {
        Entry apiKey = Entry.ofUnreadableSecret("idoitApiKey", 2, true, "the key does not match");

        List<String> lines = GlobalSnapshotLogLines.of(aSnapshotOf(apiKey));

        assertThat(lines).containsExactly(MASKED_LINE);
    }

    @Test
    @DisplayName("of — a secret over the value limit is masked and its size is not logged")
    void ofLeavesSizeOutWhenLargeVariableIsSecret() {
        Entry apiKey = Entry.ofSecret("idoitApiKey", 2, textOfBytes(GlobalSnapshotLogLines.MAX_VALUE_BYTES + 1), true);

        List<String> lines = GlobalSnapshotLogLines.of(aSnapshotOf(apiKey));

        assertThat(lines).containsExactly(MASKED_LINE);
    }

    @Test
    void ofWritesSizeWhenValueExceedsLimit() {
        Entry big = new Entry("big", 1, textOfBytes(4097));

        List<String> lines = GlobalSnapshotLogLines.of(aSnapshotOf(big));

        assertThat(lines).containsExactly("segment=GLOBAL_SNAPSHOT name=big version=1 size=4097");
    }

    @Test
    void ofWritesValueWhenValueIsAtLimit() {
        JsonNode value = textOfBytes(4096);

        List<String> lines = GlobalSnapshotLogLines.of(aSnapshotOf(new Entry("big", 1, value)));

        assertThat(lines).containsExactly("segment=GLOBAL_SNAPSHOT name=big version=1 data=" + value);
    }

    @Test
    @DisplayName("of — the limit counts UTF-8 bytes, not characters")
    void ofCountsBytesWhenValueHasMultiByteText() {
        // 2,100 characters, 4,202 bytes as a JSON string
        Entry umlauts = new Entry("umlauts", 1, TextNode.valueOf("ä".repeat(2100)));

        List<String> lines = GlobalSnapshotLogLines.of(aSnapshotOf(umlauts));

        assertThat(lines).containsExactly("segment=GLOBAL_SNAPSHOT name=umlauts version=1 size=4202");
    }

    @Test
    @DisplayName("of — once a run has logged 32 KB of values, later values are left out")
    void ofWritesSizeWhenRunBudgetIsUsedUp() {
        List<Entry> entries = new ArrayList<>(fullSizeEntries("v", 8));
        entries.add(new Entry("w", 1, mapper.getNodeFactory().numberNode(1)));

        List<String> lines = GlobalSnapshotLogLines.of(GlobalVariableSnapshot.of(entries));

        assertThat(lines.subList(0, 8)).allSatisfy(line -> assertThat(line).contains(" data="));
        assertThat(lines.get(8)).isEqualTo("segment=GLOBAL_SNAPSHOT name=w version=1 size=1");
    }

    @Test
    @DisplayName("of — a value left out for its size takes nothing from the run's budget")
    void ofKeepsBudgetWhenValueIsTooLarge() {
        List<Entry> entries = new ArrayList<>(fullSizeEntries("b", 8));
        entries.add(new Entry("a", 1, textOfBytes(5000)));

        List<String> lines = GlobalSnapshotLogLines.of(GlobalVariableSnapshot.of(entries));

        assertThat(lines.get(0)).isEqualTo("segment=GLOBAL_SNAPSHOT name=a version=1 size=5000");
        assertThat(lines.subList(1, 9)).allSatisfy(line -> assertThat(line).contains(" data="));
    }

    @Test
    void ofWritesJsonNullWhenValueIsNull() {
        Entry optional = new Entry("optional", 1, NullNode.getInstance());

        List<String> lines = GlobalSnapshotLogLines.of(aSnapshotOf(optional));

        assertThat(lines).containsExactly("segment=GLOBAL_SNAPSHOT name=optional version=1 data=null");
    }

    /** Returns a text whose compact JSON, quotes included, has exactly {@code bytes} bytes. */
    private static TextNode textOfBytes(int bytes) {
        return TextNode.valueOf("x".repeat(bytes - 2));
    }

    /** Returns {@code count} variables named {@code prefix1, prefix2, …}, each of the most bytes a value may log. */
    private static List<Entry> fullSizeEntries(String prefix, int count) {
        List<Entry> entries = new ArrayList<>(count);
        for (int i = 1; i <= count; i++) {
            entries.add(new Entry(prefix + i, 1, textOfBytes(GlobalSnapshotLogLines.MAX_VALUE_BYTES)));
        }

        return entries;
    }
}
