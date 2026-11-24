package com.becon.opencelium.backend.unit.execution.globalvariable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.becon.opencelium.backend.execution.globalvariable.GlobalLoopSource;
import com.becon.opencelium.backend.execution.oc721.Loop;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * Unit tests for {@link GlobalLoopSource}: what a loop over a global variable iterates, and how a
 * reference inside the loop reaches the current element.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalLoopSourceTest"
 */
@DisplayName("GlobalLoopSource — unit")
class GlobalLoopSourceTest {

    @Test
    void valuesOfReturnsIndexesWhenForWalksArray() {
        Loop loop = aLoop("for", "i", "for {{global.tenants}}");

        List<String> values = GlobalLoopSource.valuesOf(loop, List.of(Map.of("id", "acme"), Map.of("id", "globex")));

        assertThat(values).containsExactly("0", "1");
    }

    @Test
    void valuesOfReturnsKeysWhenForInWalksMap() {
        Map<String, Object> regions = new LinkedHashMap<>();
        regions.put("eu-west", Map.of("url", "https://eu.example.test"));
        regions.put("us-east", Map.of("url", "https://us.example.test"));
        Loop loop = aLoop("forin", "j", "forin {{global.regions}}");

        List<String> values = GlobalLoopSource.valuesOf(loop, regions);

        assertThat(values).containsExactly("eu-west", "us-east");
    }

    @Test
    void valuesOfReturnsIndexesWhenForInWalksArray() {
        Loop loop = aLoop("forin", "j", "forin {{global.tenants}}");

        List<String> values = GlobalLoopSource.valuesOf(loop, List.of("acme", "globex", "initech"));

        assertThat(values).containsExactly("0", "1", "2");
    }

    @Test
    void valuesOfReturnsPartsWhenSplitStringWalksString() {
        Loop loop = aLoop("SplitString", "k", "{{global.csv}} SplitString ','");

        List<String> values = GlobalLoopSource.valuesOf(loop, "acme,globex,initech");

        assertThat(values).containsExactly("acme", "globex", "initech");
    }

    @ParameterizedTest(name = "[{index}] {0} over {3}")
    @MethodSource("valuesAnOperatorCannotWalk")
    void valuesOfThrowsIllegalArgumentExceptionWhenTypeDoesNotFitOperator(
            String operator, String expression, Object value, String actualType) {
        Loop loop = aLoop(operator, "i", expression);

        assertThatThrownBy(() -> GlobalLoopSource.valuesOf(loop, value))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageStartingWith(operator + " needs ")
                .hasMessageContaining("{{global.source}}")
                .hasMessageEndingWith(" is " + actualType);
    }

    static Stream<Arguments> valuesAnOperatorCannotWalk() {
        return Stream.of(
                Arguments.of("for", "for {{global.source}}", Map.of("a", 1), "a map"),
                Arguments.of("for", "for {{global.source}}", "acme,globex", "a string"),
                Arguments.of("forin", "forin {{global.source}}", 42, "a number"),
                Arguments.of("SplitString", "{{global.source}} SplitString ','", List.of("acme", "globex"), "an array"));
    }

    @Test
    void withLoopValuesPutsIndexWhenIteratorIsBare() {
        List<Loop> loops = List.of(aLoopAt("for", "i", "for {{global.tenants}}", "2"));

        String path = GlobalLoopSource.withLoopValues("[i].id", loops);

        assertThat(path).isEqualTo("[2].id");
    }

    @Test
    void withLoopValuesPutsQuotedKeyWhenLoopValueIsKey() {
        List<Loop> loops = List.of(aLoopAt("forin", "j", "forin {{global.regions}}", "eu-west"));

        String path = GlobalLoopSource.withLoopValues("['j'].url", loops);

        assertThat(path).isEqualTo("['eu-west'].url");
    }

    @Test
    @DisplayName("withLoopValues — a key that holds an apostrophe is quoted with double quotes")
    void withLoopValuesUsesDoubleQuotesWhenKeyHoldsApostrophe() {
        List<Loop> loops = List.of(aLoopAt("forin", "j", "forin {{global.owners}}", "o'brien"));

        String path = GlobalLoopSource.withLoopValues("['j'].mail", loops);

        assertThat(path).isEqualTo("[\"o'brien\"].mail");
    }

    @Test
    void withLoopValuesReplacesBothIteratorsWhenTwoLoopsRun() {
        List<Loop> loops = List.of(
                aLoopAt("for", "i", "for {{global.tenants}}", "1"),
                aLoopAt("forin", "j", "forin {{global.tenants[i].regions}}", "eu-west"));

        String path = GlobalLoopSource.withLoopValues("[i].regions['j'].url", loops);

        assertThat(path).isEqualTo("[1].regions['eu-west'].url");
    }

    @Test
    @DisplayName("withLoopValues — a one-letter key is a key unless a running loop has that iterator")
    void withLoopValuesKeepsLetterWhenNoLoopHasThatIterator() {
        List<Loop> loops = List.of(aLoopAt("for", "i", "for {{global.tenants}}", "2"));

        String path = GlobalLoopSource.withLoopValues("['x'].items[i]", loops);

        assertThat(path).isEqualTo("['x'].items[2]");
    }

    @Test
    void splitTokenReturnsCurrentPartWhenPathEndsWithIterator() {
        List<Loop> loops = List.of(aLoopAt("SplitString", "k", "{{global.csv}} SplitString ','", "globex"));

        Optional<String> token = GlobalLoopSource.splitToken("[k]~", loops);

        assertThat(token).contains("globex");
    }

    @Test
    void splitTokenReturnsEmptyWhenLoopIsNotSplitString() {
        List<Loop> loops = List.of(aLoopAt("for", "k", "for {{global.tenants}}", "1"));

        Optional<String> token = GlobalLoopSource.splitToken("[k]~", loops);

        assertThat(token).isEmpty();
    }

    @Test
    @DisplayName("splitToken — without the closing '~' the iterator is an index, not the part of a split")
    void splitTokenReturnsEmptyWhenPathDoesNotEndWithToken() {
        List<Loop> loops = List.of(aLoopAt("SplitString", "k", "{{global.csv}} SplitString ','", "globex"));

        Optional<String> token = GlobalLoopSource.splitToken("[k].id", loops);

        assertThat(token).isEmpty();
    }

    @Test
    void namesIteratorReturnsTrueWhenPathHasBareIterator() {
        boolean names = GlobalLoopSource.namesIterator("[i].id");

        assertThat(names).isTrue();
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @ValueSource(strings = {"['k'].url", "regions[\"k\"].url"})
    @DisplayName("namesIterator — a quoted single letter counts, since the loops around the reference are unknown")
    void namesIteratorReturnsTrueWhenPathHasQuotedSingleLetter(String path) {
        boolean names = GlobalLoopSource.namesIterator(path);

        assertThat(names).isTrue();
    }

    @Test
    void namesIteratorReturnsTrueWhenPathEndsWithSplitToken() {
        boolean names = GlobalLoopSource.namesIterator("[k]~");

        assertThat(names).isTrue();
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @ValueSource(strings = {"[0].id", "regions['eu-west'].url", "limits.maxPerPage"})
    void namesIteratorReturnsFalseWhenPathHasNumericIndexOrLongKey(String path) {
        boolean names = GlobalLoopSource.namesIterator(path);

        assertThat(names).isFalse();
    }

    @Test
    void namesIteratorReturnsFalseWhenPathIsNull() {
        boolean names = GlobalLoopSource.namesIterator(null);

        assertThat(names).isFalse();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static Loop aLoop(String type, String iterator, String expression) {
        OperatorEx operator = new OperatorEx();
        operator.setType(type);
        operator.setIterator(iterator);
        operator.setExpression(expression);

        return Loop.fromOperator(operator);
    }

    /** A loop that is running, with {@code value} as the current value of its iterator. */
    private static Loop aLoopAt(String type, String iterator, String expression, String value) {
        Loop loop = aLoop(type, iterator, expression);
        loop.setValue(value);
        return loop;
    }
}
