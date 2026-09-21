package io.opencelium.common.invoker.operation;

import io.opencelium.common.http.Header;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ResponseTest {

    private final Response created = new Response(ResponseStatus.of(201), null,
            List.of(Header.of("Location", null), Header.of("location", "second")), null);

    @Test
    void headerFindsHeaderIgnoringCase() {
        assertThat(created.header("LOCATION")).map(Header::name).contains("Location");
    }

    @Test
    void headerReturnsTheFirstWhenNameIsDeclaredTwice() {
        assertThat(created.header("location")).map(Header::value).isEmpty();
    }

    @Test
    void headerReturnsEmptyWhenNoHeaderHasTheName() {
        assertThat(created.header("ETag")).isEmpty();
    }
}
