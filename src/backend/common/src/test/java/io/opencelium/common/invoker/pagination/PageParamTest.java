package io.opencelium.common.invoker.pagination;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PageParamTest {

    @Test
    void fromValueResolvesTheElementNameIgnoringCase() {
        assertThat(PageParam.fromValue("HAS_MORE")).isEqualTo(PageParam.HAS_MORE);
    }

    @Test
    void fromValueThrowsWhenNameIsNotAPaginationParameter() {
        assertThatThrownBy(() -> PageParam.fromValue("bogus"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageStartingWith("'bogus' is not a pagination parameter; expected one of [limit, offset");
    }
}
