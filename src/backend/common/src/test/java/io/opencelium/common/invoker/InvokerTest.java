package io.opencelium.common.invoker;

import io.opencelium.common.invoker.operation.Operation;
import io.opencelium.common.invoker.operation.OperationId;
import io.opencelium.common.invoker.operation.OperationRole;
import io.opencelium.common.invoker.setting.ConnectorSetting;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.LinkedHashSet;
import java.util.List;

import static io.opencelium.common.testutil.fixture.InvokerFixture.aServiceDeskInvoker;
import static io.opencelium.common.testutil.fixture.InvokerFixture.anInvoker;
import static io.opencelium.common.testutil.fixture.OperationFixture.anOperation;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InvokerTest {

    // ── whole model ───────────────────────────────────────

    @Test
    void constructorAcceptsAnInvokerUsingEveryConstruct() {
        Invoker invoker = aServiceDeskInvoker();

        assertThat(invoker.operations()).hasSize(8);
        assertThat(invoker.operation(OperationId.of("cmdb.objects.search"))).isPresent();
        assertThat(invoker.setting("sessionToken")).map(ConnectorSetting::isPrompted).contains(false);
    }

    // ── uniqueness ────────────────────────────────────────

    @Test
    void constructorThrowsWhenOperationIdIsDeclaredTwice() {
        assertThatThrownBy(() -> anInvoker(List.of(), List.of(anOperation("list"), anOperation("list"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("invoker 'test-invoker' declares operation 'list' more than once");
    }

    @Test
    void constructorThrowsWhenSettingIsDeclaredTwice() {
        List<ConnectorSetting> settings = List.of(ConnectorSetting.ofPublic("url"), ConnectorSetting.ofProtected("url"));

        assertThatThrownBy(() -> anInvoker(settings, List.of(anOperation("list"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("invoker 'test-invoker' declares setting 'url' more than once");
    }

    @Test
    void constructorThrowsWhenThereAreNoOperations() {
        assertThatThrownBy(() -> anInvoker(List.of(), List.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("invoker 'test-invoker' must offer at least one operation");
    }

    // ── collections ───────────────────────────────────────

    @Test
    void categoryTagsDropDuplicatesAndKeepDeclarationOrder() {
        Invoker invoker = new Invoker(InvokerId.of("desk"), "Desk", null, null, null, null,
                new LinkedHashSet<>(List.of("Ticketing", "CMDB", "Ticketing")), List.of(), List.of(anOperation("list")));

        assertThat(invoker.categoryTags()).containsExactly("Ticketing", "CMDB");
    }

    @Test
    void operationsCannotBeModifiedThroughTheAccessor() {
        Invoker invoker = aServiceDeskInvoker();

        assertThatThrownBy(() -> invoker.operations().add(anOperation("extra")))
                .isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void operationsWithRoleReturnsOnlyOperationsServingThatRole() {
        Invoker invoker = aServiceDeskInvoker();

        assertThat(invoker.operationsWithRole(OperationRole.TEST)).extracting(Operation::name).containsExactly("login");
    }

    // ── InvokerId ─────────────────────────────────────────

    @Test
    void invokerIdAcceptsUuidWhenIdsAreGenerated() {
        assertThat(InvokerId.of("550e8400-e29b-41d4-a716-446655440000")).isNotNull();
    }

    @ParameterizedTest
    @ValueSource(strings = {"Service-Desk", "service--desk", "-desk", "desk-", "service_desk", "service desk"})
    void invokerIdThrowsWhenFormatIsNotLowerCaseHyphenated(String id) {
        assertThatThrownBy(() -> InvokerId.of(id))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageStartingWith("'" + id + "' is not a valid invoker id");
    }

    // ── builder ───────────────────────────────────────────

    @Test
    void builderKeepsEveryPartInTheOrderItWasAdded() {
        Invoker invoker = Invoker.builder(InvokerId.of("desk"), "Desk")
                .hint("Enter the URL")
                .categoryTag("Ticketing")
                .categoryTag("CMDB")
                .setting(ConnectorSetting.ofPublic("url"))
                .operation(anOperation("list"))
                .operation(anOperation("get"))
                .build();

        assertThat(invoker.hint()).isEqualTo("Enter the URL");
        assertThat(invoker.description()).isNull();
        assertThat(invoker.categoryTags()).containsExactly("Ticketing", "CMDB");
        assertThat(invoker.operations()).extracting(Operation::name).containsExactly("list", "get");
    }

    @Test
    void builderAppliesTheSameRulesAsTheConstructor() {
        Invoker.Builder withoutOperations = Invoker.builder(InvokerId.of("desk"), "Desk");

        assertThatThrownBy(withoutOperations::build)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("invoker 'desk' must offer at least one operation");
    }
}
