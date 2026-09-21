package io.opencelium.core.invoker.xml;

import io.opencelium.core.invoker.InvokerIssue;
import org.junit.jupiter.api.Test;
import org.w3c.dom.Element;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

class XmlElementsTest {

    private static Element parse(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        return factory.newDocumentBuilder()
                .parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)))
                .getDocumentElement();
    }

    // ── children / child ─────────────────────────────────

    @Test
    void childrenReturnsOnlyElementsWithTheLocalNameInDocumentOrder() throws Exception {
        Element root = parse("<r><a n='1'/>text<b/><a n='2'/></r>");

        assertThat(XmlElements.children(root, "a")).extracting(a -> a.getAttribute("n")).containsExactly("1", "2");
        assertThat(XmlElements.children(root)).hasSize(3);
    }

    @Test
    void childrenReturnsEmptyListWhenParentIsAbsent() {
        assertThat(XmlElements.children(Optional.empty(), "item")).isEmpty();
    }

    @Test
    void childReturnsTheFirstMatchingElement() throws Exception {
        Element root = parse("<r><a n='1'/><a n='2'/></r>");

        assertThat(XmlElements.child(root, "a")).map(a -> a.getAttribute("n")).contains("1");
        assertThat(XmlElements.child(root, "missing")).isEmpty();
    }

    // ── text ─────────────────────────────────────────────

    @Test
    void textReturnsOwnTrimmedTextIgnoringChildElements() throws Exception {
        Element root = parse("<r>  head <c>child</c> tail  </r>");

        assertThat(XmlElements.text(root)).isEqualTo("head  tail");
    }

    @Test
    void textIncludesCdataSections() throws Exception {
        assertThat(XmlElements.text(parse("<r><![CDATA[a < b]]></r>"))).isEqualTo("a < b");
    }

    @Test
    void textOrNullReturnsNullWhenElementHasOnlyWhitespace() throws Exception {
        assertThat(XmlElements.textOrNull(parse("<r>   </r>"))).isNull();
    }

    // ── attribute ────────────────────────────────────────

    @Test
    void attributeDistinguishesAnAbsentAttributeFromAnEmptyOne() throws Exception {
        Element root = parse("<r empty=''/>");

        assertThat(XmlElements.attribute(root, "empty")).isEmpty();
        assertThat(XmlElements.attribute(root, "missing")).isNull();
    }

    // ── location ─────────────────────────────────────────

    @Test
    void locationPrefersOperationIdThenNameThenPosition() throws Exception {
        Element root = parse("""
                <invoker><operations>
                    <operation operationId="login" name="Log in"><request><item/><item/></request></operation>
                    <operation name="other"/>
                </operations></invoker>""");
        Element operations = XmlElements.child(root, "operations").orElseThrow();
        Element login = XmlElements.children(operations, "operation").getFirst();
        Element secondItem = XmlElements.children(XmlElements.child(login, "request").orElseThrow(), "item").get(1);

        assertThat(XmlElements.location(secondItem))
                .isEqualTo("/invoker/operations/operation[@operationId='login']/request/item[2]");
        assertThat(XmlElements.location(XmlElements.children(operations, "operation").get(1)))
                .isEqualTo("/invoker/operations/operation[@name='other']");
    }

    // ── build ────────────────────────────────────────────

    @Test
    void buildReportsARejectedRuleAgainstTheElement() throws Exception {
        Element root = parse("<invoker><name/></invoker>");
        Element name = XmlElements.child(root, "name").orElseThrow();

        XmlElements.ElementProblem problem = catchThrowableOfType(XmlElements.ElementProblem.class,
                () -> XmlElements.build(name, () -> {
                    throw new IllegalArgumentException("name must not be blank");
                }));

        assertThat(problem.toIssue()).isEqualTo(InvokerIssue.error("/invoker/name", "name must not be blank"));
    }

    @Test
    void buildLetsADeeperProblemPassThroughUnchanged() throws Exception {
        Element root = parse("<invoker><name/></invoker>");
        XmlElements.ElementProblem deeper = new XmlElements.ElementProblem("/invoker/name", "deeper");

        assertThatThrownBy(() -> XmlElements.build(root, () -> {
            throw deeper;
        })).isSameAs(deeper);
    }
}
