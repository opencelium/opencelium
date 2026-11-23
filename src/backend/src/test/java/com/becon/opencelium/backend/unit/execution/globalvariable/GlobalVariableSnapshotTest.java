package com.becon.opencelium.backend.unit.execution.globalvariable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.becon.opencelium.backend.exception.WrongDecryptException;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot.Entry;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.BooleanNode;
import com.fasterxml.jackson.databind.node.IntNode;
import com.fasterxml.jackson.databind.node.TextNode;
import java.util.List;
import java.util.Map;
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

    // ── secrets ───────────────────────────────────────────────────────────────

    @Test
    void valueThrowsWrongDecryptExceptionWhenSecretIsUnreadable() {
        Entry entry = Entry.ofUnreadableSecret("apiKey", 2, true, "no key is configured");

        assertThatThrownBy(entry::value)
                .isInstanceOf(WrongDecryptException.class)
                .hasMessageContaining("'apiKey'")
                .hasMessageContaining("no key is configured");
    }

    @Test
    void toStringHidesValueWhenEntryIsSecret() {
        Entry entry = Entry.ofSecret("apiKey", 2, new TextNode("s3cr3t"), true);

        assertThat(entry.toString()).doesNotContain("s3cr3t").contains("name=apiKey").contains("secret=true");
    }

    @Test
    void secretTextsReturnsEmptyWhenNoEntryIsSecret() {
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.of(List.of(new Entry("idoitUrl", 4, new TextNode("visible"))));

        assertThat(snapshot.secretTexts()).isEmpty();
    }

    @Test
    @DisplayName("secretTexts — a string as written, in a JSON string, in a URL path or query and in a form")
    void secretTextsReturnsEncodedFormsWhenSecretIsString() {
        GlobalVariableSnapshot snapshot = aSnapshotOfSecret(new TextNode("p@ss w\"rd/1+x"));

        assertThat(snapshot.secretTexts()).containsExactlyInAnyOrder(
                "p@ss w\"rd/1+x",
                "p@ss w\\\"rd/1+x",
                "p@ss%20w%22rd/1+x",
                "p@ss%20w%22rd/1%2Bx",
                "p%40ss+w%22rd%2F1%2Bx");
    }

    @Test
    @DisplayName("secretTexts — a map is hidden whole and value by value, for a reference with a path")
    void secretTextsReturnsJsonAndLeavesWhenSecretIsMap() {
        GlobalVariableSnapshot snapshot = aSnapshotOfSecret(
                new ObjectMapper().valueToTree(Map.of("user", "admin1", "password", "s3cr3t")));

        assertThat(snapshot.secretTexts()).contains("admin1", "s3cr3t")
                .anyMatch(text -> text.startsWith("{") && text.contains("\"password\":\"s3cr3t\""));
    }

    @Test
    @DisplayName("secretTexts — a text of 3 characters is not hidden, one of 4 is")
    void secretTextsLeavesOutTextWhenShorterThanMinimum() {
        GlobalVariableSnapshot shortSecret = aSnapshotOfSecret(new TextNode("abc"));
        GlobalVariableSnapshot minimalSecret = aSnapshotOfSecret(new TextNode("abcd"));

        assertThat(shortSecret.secretTexts()).isEmpty();
        assertThat(minimalSecret.secretTexts()).containsExactly("abcd");
    }

    @Test
    @DisplayName("secretTexts — hiding a boolean would hide every 'true' of a log")
    void secretTextsLeavesOutBooleanWhenSecretIsBoolean() {
        GlobalVariableSnapshot snapshot = aSnapshotOfSecret(BooleanNode.TRUE);

        assertThat(snapshot.secretTexts()).isEmpty();
    }

    @Test
    void secretTextsLeavesOutUnreadableSecret() {
        GlobalVariableSnapshot snapshot =
                GlobalVariableSnapshot.of(List.of(Entry.ofUnreadableSecret("apiKey", 2, true, "no key is configured")));

        assertThat(snapshot.secretTexts()).isEmpty();
    }

    private static GlobalVariableSnapshot aSnapshotOfSecret(JsonNode value) {
        return GlobalVariableSnapshot.of(List.of(Entry.ofSecret("apiKey", 1, value, true)));
    }

    @Test
    @DisplayName("withValue — a new snapshot holds the written value; this one and the other entries stay")
    void withValueReplacesOneValueWhenVariableIsInSnapshot() {
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.of(List.of(
                new Entry("lastSync", 3, new TextNode("old"), false), new Entry("limit", 1, IntNode.valueOf(5))));

        GlobalVariableSnapshot written = snapshot.withValue("lastSync", new TextNode("new"));

        assertThat(written.find("lastSync")).get()
                .extracting(Entry::value, Entry::version, Entry::openToAll)
                .containsExactly(new TextNode("new"), 3L, false);
        assertThat(written.find("limit")).get().extracting(Entry::value).isEqualTo(IntNode.valueOf(5));
        assertThat(snapshot.find("lastSync")).get().extracting(Entry::value).isEqualTo(new TextNode("old"));
    }

    @Test
    @DisplayName("withValue — a mutable variable stays mutable, so the run keeps reading it live")
    void withValueKeepsMutableFlagWhenVariableIsMutable() {
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.of(
                List.of(Entry.ofMutable("lastSync", 3, new TextNode("old"), true)));

        GlobalVariableSnapshot written = snapshot.withValue("lastSync", new TextNode("new"));

        assertThat(written.find("lastSync")).get()
                .extracting(Entry::value, Entry::mutable, Entry::secret)
                .containsExactly(new TextNode("new"), true, false);
    }

    @Test
    void entryIsNotMutableWhenCreatedAsConstant() {
        assertThat(new Entry("limit", 1, IntNode.valueOf(5)).mutable()).isFalse();
    }

    @Test
    void entryIsScriptAndNotMutableWhenCreatedAsScript() {
        Entry entry = Entry.ofScript("formatDate", 2, new TextNode("definition"), true);

        assertThat(entry.script()).isTrue();
        assertThat(entry.mutable()).isFalse();
        assertThat(entry.secret()).isFalse();
    }

    @Test
    void withValueThrowsWhenVariableIsNotInSnapshot() {
        GlobalVariableSnapshot snapshot = GlobalVariableSnapshot.of(List.of(new Entry("limit", 1, IntNode.valueOf(5))));

        assertThatThrownBy(() -> snapshot.withValue("lastSync", new TextNode("new")))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
