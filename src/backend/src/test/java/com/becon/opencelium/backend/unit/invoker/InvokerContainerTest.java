package com.becon.opencelium.backend.unit.invoker;

import com.becon.opencelium.backend.invoker.InvokerContainer;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.HashMap;
import java.util.Map;

import static com.becon.opencelium.backend.testutil.fixture.InvokerFixture.DELL_WARRANTY;
import static com.becon.opencelium.backend.testutil.fixture.InvokerFixture.aDellWarrantyInvoker;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("InvokerContainer — unit")
class InvokerContainerTest {

    private InvokerContainer container;

    @BeforeEach
    void setUp() {
        Map<String, Invoker> invokers = new HashMap<>();
        invokers.put(DELL_WARRANTY, aDellWarrantyInvoker());
        container = new InvokerContainer(invokers);
    }

    // ── getByName ─────────────────────────────────────────────────────────────

    @Test
    void getByNameReturnsTheInvokerForTheExactName() {
        assertThat(container.getByName(DELL_WARRANTY).getName()).isEqualTo(DELL_WARRANTY);
    }

    @ParameterizedTest
    @ValueSource(strings = {"dell warranty", "DELL WARRANTY", "Dell   Warranty", "  Dell Warranty  "})
    void getByNameReturnsTheInvokerWhenTheStoredNameDiffersOnlyInCaseOrWhitespace(String name) {
        // a connector in the database may refer to the invoker with a name a case-insensitive
        // file system handed back in a different spelling
        assertThat(container.getByName(name).getName()).isEqualTo(DELL_WARRANTY);
    }

    @Test
    void getByNameFailsForAnUnknownInvoker() {
        assertThatThrownBy(() -> container.getByName("Jira"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Jira");
    }

    // ── existsByName ──────────────────────────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {"Dell Warranty", "dell warranty", "DELL warranty", " Dell  Warranty "})
    void existsByNameReportsTheInvokerRegardlessOfCaseAndWhitespace(String name) {
        assertThat(container.existsByName(name)).isTrue();
    }

    @Test
    void existsByNameReturnsFalseForAnUnknownInvoker() {
        assertThat(container.existsByName("Dell Warranties")).isFalse();
        assertThat(container.existsByName(null)).isFalse();
    }

    @Test
    void existsByNameFindsAnInvokerWhoseContainerKeyDoesNotMatchItsDeclaredName() {
        Map<String, Invoker> invokers = new HashMap<>();
        invokers.put("dellwarranty.xml", aDellWarrantyInvoker());

        assertThat(new InvokerContainer(invokers).existsByName("dell warranty")).isTrue();
    }

    // ── remove ────────────────────────────────────────────────────────────────

    @Test
    void removeDropsTheInvokerWhenTheNameDiffersOnlyInCase() {
        container.remove("DELL WARRANTY");

        assertThat(container.getInvokers()).isEmpty();
        assertThat(container.existsByName("Dell Warranty")).isFalse();
    }

    @Test
    void removeKeepsUnrelatedInvokers() {
        container.remove("Jira");
        container.remove(null);

        assertThat(container.getInvokers()).containsOnlyKeys("Dell Warranty");
    }
}
