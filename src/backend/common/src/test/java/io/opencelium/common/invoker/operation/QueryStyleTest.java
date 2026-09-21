package io.opencelium.common.invoker.operation;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class QueryStyleTest {

    @Test
    void fromValueResolvesCamelCaseNameIgnoringCase() {
        assertThat(QueryStyle.fromValue("deepobject")).isEqualTo(QueryStyle.DEEP_OBJECT);
    }

    @Test
    void fromValueThrowsWhenNameIsNotAStyle() {
        assertThatThrownBy(() -> QueryStyle.fromValue("matrix"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("'matrix' is not a query parameter style; "
                        + "expected one of [form, spaceDelimited, pipeDelimited, deepObject]");
    }
}
