package com.becon.opencelium.backend.unit.versionmanager.base;

import com.becon.opencelium.backend.versionmanager.base.FlowIndexUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link FlowIndexUtils}.
 * <p>
 * Pure static helpers — no Spring context, no mocks.
 */
@DisplayName("FlowIndexUtils — unit")
class FlowIndexUtilsTest {

    //-----------------------------------------------------------
    //                        rootOf
    //-----------------------------------------------------------

    @ParameterizedTest(name = "rootOf(\"{0}\") = {1}")
    @CsvSource({
            "0, 0",
            "7, 7",
            "10, 10",
            "0_0, 0",
            "1_0, 1",
            "2_3_4, 2",
            "12_5_9, 12",
    })
    void rootOfReturnsFirstComponent(String index, int expected) {
        assertThat(FlowIndexUtils.rootOf(index)).isEqualTo(expected);
    }

    @Test
    void rootOfParsesLeadingZeroComponentNumerically() {
        assertThat(FlowIndexUtils.rootOf("02_1")).isEqualTo(2);
    }

    @Test
    void rootOfThrowsNullPointerExceptionWhenIndexIsNull() {
        assertThatThrownBy(() -> FlowIndexUtils.rootOf(null))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    void rootOfThrowsNumberFormatExceptionWhenRootIsNotNumeric() {
        assertThatThrownBy(() -> FlowIndexUtils.rootOf("a_1"))
                .isInstanceOf(NumberFormatException.class);
    }

    //-----------------------------------------------------------
    //                       rootOffset
    //-----------------------------------------------------------

    @Test
    void rootOffsetReturnsZeroWhenIterableIsEmpty() {
        assertThat(FlowIndexUtils.rootOffset(Collections.emptyList())).isZero();
    }

    @Test
    @DisplayName("rootOffset returns max(root) + 1 for contiguous roots")
    void rootOffsetReturnsMaxRootPlusOneWhenRootsAreContiguous() {
        // roots 0,1,2 -> next free root is 3
        assertThat(FlowIndexUtils.rootOffset(List.of("0", "1", "2"))).isEqualTo(3);
    }

    @Test
    void rootOffsetCountsOnlyRootComponentWhenIndexesAreNested() {
        // 1_0 / 1_5 still live at root 1 -> roots are 0,1 -> offset 2
        assertThat(FlowIndexUtils.rootOffset(List.of("0", "1", "1_0", "1_5"))).isEqualTo(2);
    }

    @Test
    @DisplayName("rootOffset uses max(root) + 1 even when roots have gaps")
    void rootOffsetReturnsMaxRootPlusOneWhenRootsHaveGaps() {
        // roots 0,1,3 (gap at 2) -> max+1 = 4 guarantees no collision
        assertThat(FlowIndexUtils.rootOffset(List.of("0", "1", "3"))).isEqualTo(4);
    }

    @Test
    void rootOffsetIsIndependentOfOrdering() {
        assertThat(FlowIndexUtils.rootOffset(List.of("3_0", "1", "0", "2"))).isEqualTo(4);
    }

    @Test
    void rootOffsetSkipsNullAndEmptyIndexes() {
        assertThat(FlowIndexUtils.rootOffset(Arrays.asList("0", null, "", "1"))).isEqualTo(2);
    }

    @Test
    void rootOffsetReturnsZeroWhenAllIndexesAreNullOrEmpty() {
        assertThat(FlowIndexUtils.rootOffset(Arrays.asList(null, "", ""))).isZero();
    }

    //-----------------------------------------------------------
    //                        shiftRoot
    //-----------------------------------------------------------

    @ParameterizedTest(name = "shiftRoot(\"{0}\", {1}) = \"{2}\"")
    @CsvSource({
            "0,     2, 2",
            "1,     2, 3",
            "2_0,   3, 5_0",
            "1_4,   2, 3_4",
            "2_1_3, 5, 7_1_3",
            "10,    5, 15",
    })
    void shiftRootShiftsOnlyRootComponent(String index, int offset, String expected) {
        assertThat(FlowIndexUtils.shiftRoot(index, offset)).isEqualTo(expected);
    }

    @ParameterizedTest(name = "shiftRoot(\"{0}\", 0) = \"{0}\"")
    @ValueSource(strings = {"0", "5", "2_0", "1_3_7"})
    void shiftRootReturnsIndexUnchangedWhenOffsetIsZero(String index) {
        assertThat(FlowIndexUtils.shiftRoot(index, 0)).isEqualTo(index);
    }

    @Test
    void shiftRootReturnsNullWhenIndexIsNull() {
        assertThat(FlowIndexUtils.shiftRoot(null, 3)).isNull();
    }

    @Test
    void shiftRootReturnsEmptyWhenIndexIsEmpty() {
        assertThat(FlowIndexUtils.shiftRoot("", 3)).isEmpty();
    }

    @Test
    void shiftRootPreservesNestingDepthWhenShiftingRoot() {
        assertThat(FlowIndexUtils.shiftRoot("4_0_2_9", 1)).isEqualTo("5_0_2_9");
    }

    //-----------------------------------------------------------
    //          scenario: merging a to-side after a from-side
    //-----------------------------------------------------------

    @Test
    @DisplayName("shiftRoot continues the from-side flow when merging the to-side")
    void shiftRootContinuesFromSideFlowWhenMergingToSide() {
        // from-side: method "0", loop "1", method "1_0" inside the loop
        int offset = FlowIndexUtils.rootOffset(List.of("0", "1", "1_0"));
        assertThat(offset).isEqualTo(2);

        // to-side: methods "0","1", loop "2", method "2_0" inside it
        assertThat(FlowIndexUtils.shiftRoot("0", offset)).isEqualTo("2");
        assertThat(FlowIndexUtils.shiftRoot("1", offset)).isEqualTo("3");
        assertThat(FlowIndexUtils.shiftRoot("2", offset)).isEqualTo("4");
        assertThat(FlowIndexUtils.shiftRoot("2_0", offset)).isEqualTo("4_0");
    }

    @Test
    void shiftRootLeavesToSideUntouchedWhenFromSideIsEmpty() {
        int offset = FlowIndexUtils.rootOffset(Collections.emptyList());
        assertThat(offset).isZero();
        assertThat(FlowIndexUtils.shiftRoot("0", offset)).isEqualTo("0");
        assertThat(FlowIndexUtils.shiftRoot("1_0", offset)).isEqualTo("1_0");
    }
}
