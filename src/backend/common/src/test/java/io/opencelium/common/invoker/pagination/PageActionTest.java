package io.opencelium.common.invoker.pagination;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PageActionTest {

    @Test
    void fromValueIgnoresCaseAndSurroundingWhitespace() {
        assertThat(PageAction.fromValue(" Increment ")).isEqualTo(PageAction.INCREMENT);
    }

    @Test
    void fromValueThrowsWhenNameIsNotAnAction() {
        assertThatThrownBy(() -> PageAction.fromValue(""))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("'' is not a pagination action; expected one of [read, write, increment, collect, fetch]");
    }
}
