package io.opencelium.common.invoker.operation;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ResponseStatusTest {

    // ── parse ─────────────────────────────────────────────

    @Test
    void parseReturnsExactStatusWhenTextIsThreeDigits() {
        assertThat(ResponseStatus.parse("404")).isEqualTo(new ResponseStatus.Exact(404));
    }

    @Test
    void parseNormalisesWildcardWhenItIsLowerCase() {
        ResponseStatus status = ResponseStatus.parse("4xx");

        assertThat(status).isEqualTo(new ResponseStatus.Range(4));
        assertThat(status.value()).isEqualTo("4XX");
    }

    @Test
    void parseReturnsDefaultIgnoringCase() {
        assertThat(ResponseStatus.parse(" DEFAULT ")).isSameAs(ResponseStatus.DEFAULT);
    }

    @ParameterizedTest
    @ValueSource(strings = {"20X", "2X0", "abc", "20", "2000", "4XXX", ""})
    void parseThrowsWhenTextIsNoneOfTheThreeForms(String text) {
        assertThatThrownBy(() -> ResponseStatus.parse(text))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("'" + text + "' is not a response status; "
                        + "expected a code such as 404, a class such as 4XX, or default");
    }

    @Test
    void parseThrowsWhenStatusClassDoesNotExist() {
        assertThatThrownBy(() -> ResponseStatus.parse("6XX"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("status class 6XX is outside 1XX-5XX");
    }

    @Test
    void exactThrowsWhenCodeIsOutsideTheHttpRange() {
        assertThatThrownBy(() -> ResponseStatus.of(99))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("status code 99 is outside 100-599");
    }

    // ── matches ───────────────────────────────────────────

    @Test
    void rangeMatchesEveryCodeInItsHundred() {
        ResponseStatus clientError = ResponseStatus.parse("4XX");

        assertThat(clientError.matches(400)).isTrue();
        assertThat(clientError.matches(499)).isTrue();
        assertThat(clientError.matches(500)).isFalse();
        assertThat(clientError.matches(399)).isFalse();
    }
}
