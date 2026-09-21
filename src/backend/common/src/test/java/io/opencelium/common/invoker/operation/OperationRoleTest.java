package io.opencelium.common.invoker.operation;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OperationRoleTest {

    // ── fromValue ─────────────────────────────────────────

    @Test
    void fromValueIgnoresCase() {
        assertThat(OperationRole.fromValue("AUTH")).isEqualTo(OperationRole.AUTH);
    }

    @Test
    void fromValueThrowsWhenNameIsNotARole() {
        assertThatThrownBy(() -> OperationRole.fromValue("page"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("'page' is not an operation role; expected [test, auth]");
    }

    // ── parseAll ──────────────────────────────────────────

    @Test
    void parseAllReadsASpaceSeparatedList() {
        assertThat(OperationRole.parseAll("  test \t auth ")).containsExactlyInAnyOrder(
                OperationRole.TEST, OperationRole.AUTH);
    }

    @Test
    void parseAllReturnsEmptySetWhenTextIsBlank() {
        assertThat(OperationRole.parseAll("   ")).isEmpty();
    }

    @Test
    void parseAllCollapsesARoleGivenTwice() {
        assertThat(OperationRole.parseAll("test test")).containsExactly(OperationRole.TEST);
    }

    @Test
    void parseAllThrowsWhenAnyRoleIsUnknown() {
        assertThatThrownBy(() -> OperationRole.parseAll("test admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageStartingWith("'admin' is not an operation role");
    }
}
