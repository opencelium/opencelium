package io.opencelium.common.http;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class HeaderTest {

    @Test
    void hasNameReturnsTrueWhenNameDiffersOnlyInCase() {
        assertThat(Header.of("X-Request-ID", "1").hasName("x-request-id")).isTrue();
    }

    @Test
    void hasNameReturnsFalseWhenNameIsDifferent() {
        assertThat(Header.of("Accept", null).hasName("Accept-Language")).isFalse();
    }
}
