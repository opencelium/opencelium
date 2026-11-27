package com.becon.opencelium.backend.unit.mapper.execution;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.execution.OperationExMapper;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.SchemaDTOUtil;
import com.becon.opencelium.backend.testutil.fixture.OperationDTOFixture;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for how {@link OperationExMapper} reads an XML body stored by the workflow editor.
 * Each test checks the XML the request sends: the body is mapped, copied and written the way
 * {@code RequestEntityBuilder} builds a request.
 *
 * <p>Run with: ./gradlew test --tests "*.OperationExMapperTest"
 */
@DisplayName("OperationExMapper — unit")
@ExtendWith(MockitoExtension.class)
class OperationExMapperTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    // a method without an invoker is mapped from the method alone: neither service is read
    @Mock
    InvokerService invokerService;

    @Mock
    ConnectorService connectorService;

    @InjectMocks
    OperationExMapper mapper;

    @ParameterizedTest(name = "{0}")
    @MethodSource("storedXmlBodies")
    @DisplayName("toOperation — the XML sent is the XML stored (cases of the OC-1696 backend report)")
    void toOperationBuildsStoredXmlWhenBodyIsXml(String name, String storedFields, String expectedXml) {
        String xml = xmlSentFor(storedFields);

        assertThat(xml).isEqualTo(expectedXml);
    }

    static Stream<Arguments> storedXmlBodies() {
        return Stream.of(
                Arguments.of("oneAttribute", """
                        {"a": {"__oc__attributes": {"id": "1"},
                               "b": {"__oc__attributes": null, "__oc__value": "x"}}}
                        """, "<a id=\"1\"><b>x</b></a>"),
                Arguments.of("twoAttributes", """
                        {"a": {"__oc__attributes": {"id": "1", "k": "2"},
                               "b": {"__oc__attributes": null, "__oc__value": "x"}}}
                        """, "<a id=\"1\" k=\"2\"><b>x</b></a>"),
                Arguments.of("defaultNamespace", """
                        {"a": {"__oc__attributes": {"xmlns": "urn:x"},
                               "b": {"__oc__attributes": null, "__oc__value": "x"}}}
                        """, "<a xmlns=\"urn:x\"><b>x</b></a>"),
                Arguments.of("leafAttribute", """
                        {"a": {"__oc__attributes": null,
                               "b": {"__oc__attributes": {"lang": "de"}, "__oc__value": "x"}}}
                        """, "<a><b lang=\"de\">x</b></a>"),
                Arguments.of("prefix", """
                        {"soap:Envelope": {"__oc__attributes": {"xmlns:soap": "urn:s"},
                          "soap:Body": {"__oc__attributes": null,
                            "m:Get": {"__oc__attributes": {"xmlns:m": "urn:m"},
                              "m:Id": {"__oc__attributes": null, "__oc__value": "5"}}}}}
                        """, "<soap:Envelope xmlns:soap=\"urn:s\"><soap:Body><m:Get xmlns:m=\"urn:m\">"
                        + "<m:Id>5</m:Id></m:Get></soap:Body></soap:Envelope>"),
                Arguments.of("rootPrefixDigit", """
                        {"s1:a": {"__oc__attributes": {"xmlns:s1": "urn:x"},
                                  "b": {"__oc__attributes": null, "__oc__value": "x"}}}
                        """, "<s1:a xmlns:s1=\"urn:x\"><b>x</b></s1:a>"),
                Arguments.of("order", """
                        {"root": {"__oc__attributes": null,
                          "first": {"__oc__attributes": null, "__oc__value": "1"},
                          "second": {"__oc__attributes": null, "__oc__value": "2"},
                          "third": {"__oc__attributes": null, "__oc__value": "3"},
                          "fourth": {"__oc__attributes": null, "__oc__value": "4"},
                          "fifth": {"__oc__attributes": null, "__oc__value": "5"}}}
                        """, "<root><first>1</first><second>2</second><third>3</third>"
                        + "<fourth>4</fourth><fifth>5</fifth></root>"),
                Arguments.of("nullValue", """
                        {"a": {"__oc__attributes": null,
                               "b": {"__oc__attributes": null, "__oc__value": null}}}
                        """, "<a><b></b></a>"),
                Arguments.of("legacyDeclaration", """
                        {"_declaration": {"_attributes": {"version": "1.0"}},
                         "a": {"__oc__attributes": null,
                               "b": {"__oc__attributes": null, "__oc__value": "x"}}}
                        """, "<a><b>x</b></a>"),
                Arguments.of("legacyKeys", """
                        {"a": {"_attributes": {"id": "1"}, "_text": "x"}}
                        """, "<a id=\"1\">x</a>"));
    }

    @Test
    @DisplayName("toOperation — the SoapUpdateUser body of the report keeps its prefixes, order and escaping")
    void toOperationBuildsSoapEnvelopeWhenBodyIsFromTemplate() {
        String storedFields = """
                {"soapenv:Envelope": {
                  "__oc__attributes": {"xmlns:soapenv": "http://schemas.xmlsoap.org/soap/envelope/"},
                  "soapenv:Body": {"__oc__attributes": null,
                    "usr:updateUserRequest": {
                      "__oc__attributes": {"xmlns:usr": "http://example.com/userservice"},
                      "usr:id": {"__oc__attributes": null, "__oc__value": "7"},
                      "usr:name": {"__oc__attributes": null, "__oc__value": "Ann & Bob"},
                      "usr:email": {"__oc__attributes": null, "__oc__value": ""},
                      "usr:role": {"__oc__attributes": null, "__oc__value": ""},
                      "usr:department": {"__oc__attributes": null, "__oc__value": "IT"}}}}}
                """;

        String xml = xmlSentFor(storedFields);

        assertThat(xml).isEqualTo("<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\">"
                + "<soapenv:Body><usr:updateUserRequest xmlns:usr=\"http://example.com/userservice\">"
                + "<usr:id>7</usr:id><usr:name>Ann &amp; Bob</usr:name><usr:email></usr:email>"
                + "<usr:role></usr:role><usr:department>IT</usr:department>"
                + "</usr:updateUserRequest></soapenv:Body></soapenv:Envelope>");
    }

    @Test
    @DisplayName("toOperation — xml-js CDATA of an older frontend is text, escaped like any other text")
    void toOperationReadsCdataAsTextWhenElementUsesXmlJsKeys() {
        String xml = xmlSentFor("""
                {"a": {"_cdata": "x < y"}}
                """);

        assertThat(xml).isEqualTo("<a>x &lt; y</a>");
    }

    @Test
    void toOperationWritesEmptyAttributeWhenAttributeValueIsNull() {
        String xml = xmlSentFor("""
                {"a": {"__oc__attributes": {"id": null}, "__oc__value": "x"}}
                """);

        assertThat(xml).isEqualTo("<a id=\"\">x</a>");
    }

    @Test
    @DisplayName("toOperation — a repeated element, stored as an array, keeps the attributes of each occurrence")
    void toOperationWritesAttributesPerItemWhenElementRepeats() {
        String xml = xmlSentFor("""
                {"list": {"__oc__attributes": null,
                  "item": [{"__oc__attributes": {"n": "1"}, "__oc__value": "a"},
                           {"__oc__attributes": {"n": "2"}, "__oc__value": "b"}]}}
                """);

        assertThat(xml).isEqualTo("<list><item n=\"1\">a</item><item n=\"2\">b</item></list>");
    }

    @Test
    void toOperationThrowsIllegalArgumentExceptionWhenAttributesAreNotObject() {
        MethodMng method = OperationDTOFixture.anXmlMethod(fields("""
                {"a": {"__oc__attributes": "id=1", "__oc__value": "x"}}
                """));

        assertThatThrownBy(() -> mapper.toOperation(method, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("__oc__attributes");
    }

    private String xmlSentFor(String storedFields) {
        MethodMng method = OperationDTOFixture.anXmlMethod(fields(storedFields));

        OperationDTO operation = mapper.toOperation(method, null);

        return SchemaDTOUtil.toXML(SchemaDTOUtil.copy(operation.getRequestBody().getSchema()));
    }

    private static Map<String, Object> fields(String json) {
        try {
            return JSON.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {});
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException(json, e);
        }
    }
}
