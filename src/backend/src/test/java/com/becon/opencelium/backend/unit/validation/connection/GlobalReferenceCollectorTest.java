package com.becon.opencelium.backend.unit.validation.connection;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.tuple;

import com.becon.opencelium.backend.database.mongodb.entity.BodyMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConditionMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.EnhancementMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.entity.LinkedFieldMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.database.mongodb.entity.StatementMng;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariableUsage.ElementType;
import com.becon.opencelium.backend.testutil.fixture.ConnectionMngFixture;
import com.becon.opencelium.backend.validation.connection.GlobalReferenceCollector;
import com.becon.opencelium.backend.validation.connection.GlobalReferenceCollector.Found;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * Unit tests for {@link GlobalReferenceCollector}: which global variable references of a
 * workflow, or of named texts outside one, are found, and how the place of each is reported.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalReferenceCollectorTest"
 */
@DisplayName("GlobalReferenceCollector — unit")
class GlobalReferenceCollectorTest {

    @Test
    void collectReturnsReferenceWhenEndpointHoldsOne() {
        MethodMng method = ConnectionMngFixture.aMethod("#ababab", "0_1", "listObjects", "{{global.idoitUrl}}/api");
        method.setLabel("List objects");

        List<Found> found = GlobalReferenceCollector.collect(ConnectionMngFixture.aWorkflowWith(method));

        assertThat(found).containsExactly(new Found(
                ElementType.METHOD, "#ababab", "0_1", "List objects", "endpoint", "idoitUrl", "{{global.idoitUrl}}"));
    }

    @Test
    void collectReturnsHeaderFieldWhenHeaderHoldsReference() {
        MethodMng method = ConnectionMngFixture.aMethod("#ababab", "0_1", "listObjects", "https://api.example.test");
        method.getRequest().setHeader(Map.of("X-Meta", "{{global.meta}}"));

        List<Found> found = GlobalReferenceCollector.collect(ConnectionMngFixture.aWorkflowWith(method));

        assertThat(found).extracting(Found::field, Found::variable)
                .containsExactly(tuple("header.X-Meta", "meta"));
    }

    @Test
    @DisplayName("collect — a reference deep in the body is reported with its path through maps and lists")
    void collectReturnsNestedBodyPathWhenBodyHoldsReference() {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("filter", Map.of("since", "{{global.lastSync}}"));
        fields.put("items", List.of(Map.of("id", "plain"), Map.of("id", "{{global.tenants[0].id}}")));
        fields.put("limit", 50);
        BodyMng body = new BodyMng();
        body.setFields(fields);
        MethodMng method = ConnectionMngFixture.aMethod("#ababab", "0_1", "sync", "https://api.example.test");
        method.getRequest().setBody(body);

        List<Found> found = GlobalReferenceCollector.collect(ConnectionMngFixture.aWorkflowWith(method));

        assertThat(found).extracting(Found::field, Found::variable, Found::reference).containsExactly(
                tuple("body.filter.since", "lastSync", "{{global.lastSync}}"),
                tuple("body.items[1].id", "tenants", "{{global.tenants[0].id}}"));
    }

    @Test
    @DisplayName("collect — an operator is read in its expression and on both sides of its condition")
    void collectReturnsOperatorFieldsWhenOperatorHoldsReferences() {
        StatementMng left = new StatementMng();
        left.setField("{{global.minimum}}");
        StatementMng right = new StatementMng();
        right.setRightPropertyValue("{{global.maximum}}");
        ConditionMng condition = new ConditionMng();
        condition.setLeftStatement(left);
        condition.setRightStatement(right);
        OperatorMng operator = ConnectionMngFixture.anOperator("0_2", "if", "{{global.limit}} > 5");
        operator.setCondition(condition);
        ConnectionMng workflow = ConnectionMngFixture.aWorkflowWith();
        workflow.getFromConnector().getOperators().add(operator);

        List<Found> found = GlobalReferenceCollector.collect(workflow);

        assertThat(found).containsExactly(
                new Found(ElementType.OPERATOR, null, "0_2", "if", "expression", "limit", "{{global.limit}}"),
                new Found(ElementType.OPERATOR, null, "0_2", "if", "condition.left.field", "minimum",
                        "{{global.minimum}}"),
                new Found(ElementType.OPERATOR, null, "0_2", "if", "condition.right.rightPropertyValue", "maximum",
                        "{{global.maximum}}"));
    }

    @Test
    void collectReturnsEveryReferenceWhenFieldHoldsSeveral() {
        MethodMng method = ConnectionMngFixture.aMethod(
                "#ababab", "0_1", "listObjects", "{{global.idoitUrl}}/{{global.tenant}}/{{global.idoitUrl}}");

        List<Found> found = GlobalReferenceCollector.collect(ConnectionMngFixture.aWorkflowWith(method));

        assertThat(found).extracting(Found::variable).containsExactly("idoitUrl", "tenant", "idoitUrl");
    }

    @Test
    @DisplayName("collect — an escaped token is literal text and is not reported")
    void collectSkipsEscapedTokenWhenBackslashPrecedesIt() {
        MethodMng method = ConnectionMngFixture.aMethod(
                "#ababab", "0_1", "listObjects", "\\{{global.literal}}/{{global.idoitUrl}}");

        List<Found> found = GlobalReferenceCollector.collect(ConnectionMngFixture.aWorkflowWith(method));

        assertThat(found).extracting(Found::variable).containsExactly("idoitUrl");
    }

    @Test
    void collectReadsBothConnectorsWhenWorkflowHasTwo() {
        ConnectionMng workflow = ConnectionMngFixture.aWorkflowWith(
                ConnectionMngFixture.aMethod("#ababab", "0_1", "read", "{{global.sourceUrl}}"));
        workflow.setToConnector(ConnectionMngFixture.aConnectorWith(
                ConnectionMngFixture.aMethod("#cdcdcd", "1_1", "write", "{{global.targetUrl}}")));

        List<Found> found = GlobalReferenceCollector.collect(workflow);

        assertThat(found).extracting(Found::color, Found::variable).containsExactly(
                tuple("#ababab", "sourceUrl"),
                tuple("#cdcdcd", "targetUrl"));
    }

    @Test
    void collectUsesNameWhenMethodHasNoLabel() {
        MethodMng method = ConnectionMngFixture.aMethod("#ababab", "0_1", "listObjects", "{{global.idoitUrl}}");

        List<Found> found = GlobalReferenceCollector.collect(ConnectionMngFixture.aWorkflowWith(method));

        assertThat(found).extracting(Found::label).containsExactly("listObjects");
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("workflowsWithoutReferences")
    void collectReturnsEmptyWhenWorkflowHoldsNoReference(String reason, ConnectionMng workflow) {
        List<Found> found = GlobalReferenceCollector.collect(workflow);

        assertThat(found).isEmpty();
    }

    static Stream<Arguments> workflowsWithoutReferences() {
        MethodMng withoutRequest = ConnectionMngFixture.aMethod("#ababab", "0_1", "noRequest", null);
        withoutRequest.setRequest(null);

        return Stream.of(
                Arguments.of("no workflow", null),
                Arguments.of("no connector", new ConnectionMng()),
                Arguments.of("a method without a request", ConnectionMngFixture.aWorkflowWith(withoutRequest)),
                Arguments.of("other reference types only", ConnectionMngFixture.aWorkflowWith(
                        ConnectionMngFixture.aMethod("#ababab", "0_1", "plain", "{url}/api/${id}/{{token}}"))),
                Arguments.of("a name that is not one", ConnectionMngFixture.aWorkflowWith(
                        ConnectionMngFixture.aMethod("#ababab", "0_1", "plain", "{{global.1st}}/{{global.}}"))));
    }

    @Test
    @DisplayName("collect — an enhancement's args and its ref() calls are reported on the method the binding fills")
    void collectReturnsEnhancementFieldsWhenFieldBindingHoldsReferences() {
        MethodMng method = ConnectionMngFixture.aMethod("#ababab", "0_1", "createObject", "https://api.example.test");
        ConnectionMng workflow = ConnectionMngFixture.aWorkflowWith(method);
        workflow.setFieldBindings(List.of(aBinding("#ababab", "Tenant id",
                "var VAR_0 = {{global.prefix}};",
                "RESULT_VAR = VAR_0 + ref(\"{{global.tenants[0].id}}\");")));

        List<Found> found = GlobalReferenceCollector.collect(workflow);

        assertThat(found).containsExactly(
                new Found(ElementType.ENHANCEMENT, "#ababab", "0_1", "Tenant id", "enhancement.args",
                        "prefix", "{{global.prefix}}"),
                new Found(ElementType.ENHANCEMENT, "#ababab", "0_1", "Tenant id", "enhancement.script",
                        "tenants", "{{global.tenants[0].id}}"));
    }

    @Test
    void collectReportsNoIndexWhenBindingTargetIsNoMethod() {
        ConnectionMng workflow = ConnectionMngFixture.aWorkflowWith();
        workflow.setFieldBindings(List.of(aBinding("#cdcdcd", null, null, "ref('{{global.a}}')")));

        List<Found> found = GlobalReferenceCollector.collect(workflow);

        assertThat(found).extracting(Found::color, Found::index, Found::variable)
                .containsExactly(tuple("#cdcdcd", null, "a"));
    }

    @Test
    void collectSkipsBindingWhenItHasNoEnhancement() {
        ConnectionMng workflow = ConnectionMngFixture.aWorkflowWith();
        workflow.setFieldBindings(Arrays.asList(new FieldBindingMng(), null));

        assertThat(GlobalReferenceCollector.collect(workflow)).isEmpty();
    }

    // ── collectFromTexts ──────────────────────────────────────────────────────

    @Test
    @DisplayName("collectFromTexts — outside a workflow only the name of the text says where a reference is")
    void collectFromTextsReturnsReferenceWithFieldWhenTextHoldsOne() {
        List<Found> found = GlobalReferenceCollector.collectFromTexts(Map.of("url", "{{global.idoitUrl}}/api"));

        assertThat(found).containsExactly(
                new Found(null, null, null, null, "url", "idoitUrl", "{{global.idoitUrl}}"));
    }

    @Test
    void collectFromTextsReturnsReferencesInOrderWhenSeveralTextsHoldThem() {
        Map<String, String> texts = new LinkedHashMap<>();
        texts.put("en.subject", "{{global.product}} failed");
        texts.put("en.body", "See {{global.supportUrl}} or call {{global.hotline}}");
        texts.put("de.subject", "no reference");
        texts.put("de.body", "Siehe {{global.supportUrl}}");

        List<Found> found = GlobalReferenceCollector.collectFromTexts(texts);

        assertThat(found).extracting(Found::field, Found::variable).containsExactly(
                tuple("en.subject", "product"),
                tuple("en.body", "supportUrl"),
                tuple("en.body", "hotline"),
                tuple("de.body", "supportUrl"));
    }

    @Test
    void collectFromTextsLeavesOutEscapedTokenWhenTextHoldsOne() {
        List<Found> found = GlobalReferenceCollector.collectFromTexts(
                Map.of("en.body", "Write \\{{global.literal}} to use {{global.idoitUrl}}"));

        assertThat(found).extracting(Found::variable).containsExactly("idoitUrl");
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("missingTexts")
    void collectFromTextsReturnsNothingWhenTextIsMissing(String reason, Map<String, String> texts) {
        List<Found> found = GlobalReferenceCollector.collectFromTexts(texts);

        assertThat(found).isEmpty();
    }

    static Stream<Arguments> missingTexts() {
        Map<String, String> withoutValue = new HashMap<>();
        withoutValue.put("token", null);

        return Stream.of(
                Arguments.of("no texts", null),
                Arguments.of("a text without a value", withoutValue));
    }

    /** Field binding into a field of the method with {@code targetColor}, with the given enhancement. */
    private static FieldBindingMng aBinding(String targetColor, String title, String args, String script) {
        LinkedFieldMng target = new LinkedFieldMng();
        target.setColor(targetColor);
        target.setType("request");
        target.setField("body.tenant");
        EnhancementMng enhancement = new EnhancementMng();
        enhancement.setTitle(title);
        enhancement.setArgs(args);
        enhancement.setScript(script);
        enhancement.setLanguage("js");
        FieldBindingMng binding = new FieldBindingMng();
        binding.setId("bind-1");
        binding.setTo(List.of(target));
        binding.setEnhancement(enhancement);
        return binding;
    }
}
