package com.becon.opencelium.backend.unit.execution.service;

import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.PRIVATE;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.PUBLIC;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aConnector;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aRequiredField;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aResolvedConnector;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aStoredField;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.anInvokerRequiring;
import static com.becon.opencelium.backend.testutil.fixture.OperationDTOFixture.aConnectorOperation;
import static com.becon.opencelium.backend.testutil.fixture.OperationDTOFixture.aMethodDto;
import static com.becon.opencelium.backend.testutil.fixture.OperationDTOFixture.anHttpOperation;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.database.mongodb.entity.MethodConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.execution.service.MethodTestServiceImp;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.execution.ConnectorExMapper;
import com.becon.opencelium.backend.mapper.execution.OperationExMapper;
import com.becon.opencelium.backend.mapper.mongo.MethodMngMapper;
import com.becon.opencelium.backend.reference.enums.ReferenceType;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestReferencesDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestReferencesDTO.ConnectorReference;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestReferencesDTO.StaticReference;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestRequestDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestResultDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestResultDTO.ConnectorError;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.testutil.fake.FakeHttpServer;
import com.becon.opencelium.backend.testutil.fake.FakeHttpServer.RecordedRequest;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.env.MockEnvironment;

/**
 * Unit tests for {@link MethodTestServiceImp}.
 *
 * <p>Mappers and services are mocked; the external API is a {@link FakeHttpServer}, so the
 * request really goes over HTTP the way a test from the editor does.
 */
@DisplayName("MethodTestServiceImp — unit")
@ExtendWith(MockitoExtension.class)
class MethodTestServiceImpTest {

    private static final int SHOP_ID = 3;
    private static final int CRM_ID = 12;
    private static final String SHOP = "Shop";
    private static final String CRM = "Crm";
    private static final String TOKEN = "s3cr3t-token";
    private static final Map<String, String> BEARER = Map.of("Authorization", "Bearer {token}");

    @Mock
    MethodMngMapper methodMngMapper;

    @Mock
    OperationExMapper operationExMapper;

    @Mock
    ConnectorExMapper connectorExMapper;

    @Mock
    ConnectorService connectorService;

    @Mock
    InvokerService invokerService;

    private FakeHttpServer api;
    private MethodTestServiceImp service;

    @BeforeEach
    void setUp() {
        api = FakeHttpServer.start();
        service = new MethodTestServiceImp(
                new MockEnvironment(), methodMngMapper, operationExMapper, connectorExMapper,
                connectorService, invokerService);
    }

    @AfterEach
    void stopApi() {
        api.close();
    }

    // ── findReferences ────────────────────────────────────────────────────────

    @Test
    void findReferencesSplitsConnectorAndStaticReferencesWhenMethodMixesThem() {
        MethodDTO method = givenMethodMappedTo(aShopOrdersGet());
        when(connectorService.findById(SHOP_ID)).thenReturn(Optional.of(aConnector(SHOP_ID, SHOP)));
        when(invokerService.existsByName(SHOP)).thenReturn(true);
        when(invokerService.findByName(SHOP)).thenReturn(shopInvoker());

        MethodTestReferencesDTO references = service.findReferences(method);

        assertThat(references.connectorReferences())
                .extracting(ConnectorReference::reference, ConnectorReference::connectorId, ConnectorReference::available)
                .containsExactlyInAnyOrder(tuple("{token}", SHOP_ID, true), tuple("{url}", SHOP_ID, true));
        assertThat(references.staticReferences())
                .containsExactly(new StaticReference("${status}", ReferenceType.WEBHOOK));
    }

    @Test
    @DisplayName("findReferences — {#12.key} reads connector 12, not the method's own connector")
    void findReferencesBindsReferenceToItsConnectorWhenIdIsGiven() {
        MethodDTO method = givenMethodMappedTo(
                aConnectorOperation(SHOP_ID, "GET", "http://api.test/contacts", Map.of("X-Key", "{#12.apiKey}")));
        when(connectorService.findById(CRM_ID))
                .thenReturn(Optional.of(aConnector(CRM_ID, CRM, aStoredField("apiKey", "k", PRIVATE))));
        when(invokerService.existsByName(CRM)).thenReturn(false);

        MethodTestReferencesDTO references = service.findReferences(method);

        assertThat(references.connectorReferences())
                .containsExactly(new ConnectorReference("{#12.apiKey}", CRM_ID, "apiKey", true));
    }

    @Test
    void findReferencesMarksReferenceUnavailableWhenFieldIsUndefined() {
        MethodDTO method = givenMethodMappedTo(
                aConnectorOperation(SHOP_ID, "GET", "http://api.test/orders", Map.of("X-Region", "{region}")));
        when(connectorService.findById(SHOP_ID)).thenReturn(Optional.of(aConnector(SHOP_ID, SHOP)));
        when(invokerService.existsByName(SHOP)).thenReturn(true);
        when(invokerService.findByName(SHOP)).thenReturn(shopInvoker());

        MethodTestReferencesDTO references = service.findReferences(method);

        assertThat(references.connectorReferences())
                .containsExactly(new ConnectorReference("{region}", SHOP_ID, "region", false));
    }

    @Test
    void findReferencesMarksReferenceUnavailableWhenConnectorDoesNotExist() {
        MethodDTO method = givenMethodMappedTo(
                aConnectorOperation(SHOP_ID, "GET", "http://api.test/contacts", Map.of("X-Key", "{#12.apiKey}")));
        when(connectorService.findById(CRM_ID)).thenReturn(Optional.empty());

        MethodTestReferencesDTO references = service.findReferences(method);

        assertThat(references.connectorReferences())
                .containsExactly(new ConnectorReference("{#12.apiKey}", CRM_ID, "apiKey", false));
    }

    @Test
    @DisplayName("findReferences — without a connector, {key} cannot be read and needs a static value")
    void findReferencesTreatsRequestDataAsStaticWhenMethodHasNoConnector() {
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", "http://api.test/orders", BEARER, null));

        MethodTestReferencesDTO references = service.findReferences(method);

        assertThat(references.connectorReferences()).isEmpty();
        assertThat(references.staticReferences())
                .containsExactly(new StaticReference("{token}", ReferenceType.REQUEST_DATA));
        verifyNoInteractions(connectorService);
    }

    @Test
    void findReferencesThrowsGeneralServiceExceptionWhenMethodHasNoRequest() {
        assertThatThrownBy(() -> service.findReferences(new MethodDTO()))
                .isInstanceOfSatisfying(GeneralServiceException.class, e -> {
                    assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(e.getError()).isEqualTo(ExceptionConstant.METHOD_TEST_METHOD_INVALID);
                })
                .hasMessageContaining("HTTP method");
        verifyNoInteractions(methodMngMapper);
    }

    // ── test: rejected before anything is sent ────────────────────────────────

    @Test
    void testThrowsGeneralServiceExceptionWhenMethodHasNoHttpMethod() {
        MethodTestRequestDTO request = new MethodTestRequestDTO(aMethodDto(" "), Map.of(), false);

        assertThatThrownBy(() -> service.test(request))
                .isInstanceOfSatisfying(GeneralServiceException.class, e ->
                        assertThat(e.getError()).isEqualTo(ExceptionConstant.METHOD_TEST_METHOD_INVALID))
                .hasMessageContaining("HTTP method");
    }

    @Test
    @DisplayName("test — an unconfirmed write is rejected before any connector is read")
    void testThrowsGeneralServiceExceptionWhenWriteIsNotConfirmed() {
        MethodDTO method = givenMethodMappedTo(aConnectorOperation(SHOP_ID, "POST", "{url}/orders", BEARER));

        assertThatThrownBy(() -> service.test(new MethodTestRequestDTO(method, Map.of(), false)))
                .isInstanceOfSatisfying(GeneralServiceException.class, e -> {
                    assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(e.getError()).isEqualTo(ExceptionConstant.METHOD_TEST_WRITE_NOT_CONFIRMED);
                })
                .hasMessageContaining("POST");
        verifyNoInteractions(connectorExMapper);
    }

    @Test
    @DisplayName("test — missing static values are listed, connector references are not, and no connector is read")
    void testThrowsGeneralServiceExceptionWhenStaticValueIsMissing() {
        MethodDTO method = givenMethodMappedTo(aShopOrdersGet());

        assertThatThrownBy(() -> service.test(new MethodTestRequestDTO(method, Map.of(), false)))
                .isInstanceOfSatisfying(GeneralServiceException.class, e ->
                        assertThat(e.getError()).isEqualTo(ExceptionConstant.METHOD_TEST_STATIC_VALUES_MISSING))
                .hasMessageContaining("${status}")
                .hasMessageNotContaining("{url}");
        verifyNoInteractions(connectorExMapper);
    }

    @Test
    void testThrowsGeneralServiceExceptionWhenRequestCannotBeBuilt() {
        // a blank endpoint cannot be built; text such as a space is encoded, so it no longer fails
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", " ", Map.of(), null));

        assertThatThrownBy(() -> service.test(new MethodTestRequestDTO(method, Map.of(), false)))
                .isInstanceOfSatisfying(GeneralServiceException.class, e ->
                        assertThat(e.getError()).isEqualTo(ExceptionConstant.METHOD_TEST_REQUEST_NOT_BUILT))
                .hasMessageContaining("could not be built");
    }

    // ── test: connector data ──────────────────────────────────────────────────

    @Test
    void testReturnsConnectorErrorsWhenConnectorDataFails() {
        MethodDTO method = givenMethodMappedTo(aConnectorOperation(SHOP_ID, "GET", "{url}/orders", BEARER));
        Connector shop = aConnector(SHOP_ID, SHOP);
        when(connectorService.getById(SHOP_ID)).thenReturn(shop);
        when(invokerService.findByName(SHOP)).thenReturn(shopInvoker());
        when(connectorExMapper.toMethodConnector(shop))
                .thenThrow(new IllegalStateException("Path $.access_token not found"));

        MethodTestResultDTO result = service.test(new MethodTestRequestDTO(method, Map.of(), false));

        assertThat(result.connectorErrors())
                .containsExactly(new ConnectorError(SHOP_ID, "Path $.access_token not found"));
        assertThat(result.response()).isNull();
        assertThat(api.requests()).isEmpty();
    }

    @Test
    @DisplayName("test — a connector whose references all have static values is never read")
    void testSkipsConnectorWhenItsReferencesHaveStaticValues() {
        MethodDTO method = givenMethodMappedTo(
                aConnectorOperation(SHOP_ID, "GET", "{url}/contacts", Map.of("X-Key", "{#12.apiKey}")));
        givenShopConnector();

        service.test(new MethodTestRequestDTO(method, Map.of("{#12.apiKey}", "static-key"), false));

        verify(connectorService, never()).getById(CRM_ID);
        assertThat(api.requests()).extracting(sent -> sent.header("X-Key")).containsExactly("static-key");
    }

    @Test
    @DisplayName("test — a default connector id means a pure HTTP request")
    void testSkipsConnectorLookupWhenMethodConnectorIsDefault() {
        MethodConnectorMng defaultConnector = new MethodConnectorMng();
        defaultConnector.setConnectorId(ConnectionConstants.DEFAULT_CONNECTOR_ID);
        MethodMng methodMng = new MethodMng();
        methodMng.setConnector(defaultConnector);
        MethodDTO method = givenMethodMappedTo(
                anHttpOperation("GET", api.baseUrl() + "/orders", Map.of(), null), methodMng);

        service.test(new MethodTestRequestDTO(method, Map.of(), false));

        assertThat(methodMng.getConnector()).isNull();
        verifyNoInteractions(connectorService);
    }

    // ── test: sending ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("test — the API receives static values and the connector's real data")
    void testSendsResolvedValuesWhenRequestIsSent() {
        MethodDTO method = givenMethodMappedTo(aShopOrdersGet());
        givenShopConnector();

        service.test(new MethodTestRequestDTO(method, Map.of("${status}", "open"), false));

        assertThat(api.requests())
                .extracting(RecordedRequest::uri, sent -> sent.header("Authorization"))
                .containsExactly(tuple("/orders?status=open", "Bearer " + TOKEN));
    }

    @Test
    void testReturnsApiResponseWhenRequestIsSent() {
        api.respondWith(201, "application/json", "{\"id\":7}");
        MethodDTO method = givenMethodMappedTo(aShopOrdersGet());
        givenShopConnector();

        MethodTestResultDTO result = service.test(new MethodTestRequestDTO(method, Map.of("${status}", "open"), false));

        assertThat(result.response().status()).isEqualTo(201);
        assertThat(result.response().body()).isEqualTo(Map.of("id", 7));
        assertThat(result.connectorErrors()).isEmpty();
    }

    @Test
    @DisplayName("test — the returned request hides private connector values and keeps public ones")
    void testMasksHiddenConnectorValuesWhenTheyAppearInRequest() {
        MethodDTO method = givenMethodMappedTo(aShopOrdersGet());
        givenShopConnector();

        MethodTestResultDTO result = service.test(new MethodTestRequestDTO(method, Map.of("${status}", "open"), false));

        assertThat(result.request().headers().get("Authorization")).containsExactly("Bearer ****");
        assertThat(result.request().url()).isEqualTo(api.baseUrl() + "/orders?status=open");
    }

    @Test
    void testSendsWriteRequestWhenWriteIsConfirmed() {
        MethodDTO method = givenMethodMappedTo(
                anHttpOperation("POST", api.baseUrl() + "/orders", Map.of(), Map.of("name", "box")));

        service.test(new MethodTestRequestDTO(method, Map.of(), true));

        assertThat(api.requests()).extracting(RecordedRequest::method).containsExactly("POST");
    }

    @Test
    @DisplayName("test — an error answer of the API is a result, not an exception")
    void testReturnsErrorStatusWhenApiAnswersWithError() {
        api.respondWith(500, "text/plain", "down");
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", api.baseUrl() + "/orders", Map.of(), null));

        MethodTestResultDTO result = service.test(new MethodTestRequestDTO(method, Map.of(), false));

        assertThat(result.response().status()).isEqualTo(500);
        assertThat(result.response().body()).isEqualTo("down");
    }

    @Test
    void testReturnsBase64BodyWhenResponseIsBinary() {
        api.respondWith(200, "application/octet-stream", new byte[] {1, 2, 3});
        MethodDTO method = givenMethodMappedTo(anHttpOperation(
                "GET", api.baseUrl() + "/files/1", Map.of("Content-Type", "application/octet-stream"), null));

        MethodTestResultDTO result = service.test(new MethodTestRequestDTO(method, Map.of(), false));

        assertThat(result.response().body()).isEqualTo("AQID");
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private MethodDTO givenMethodMappedTo(OperationDTO operation) {
        return givenMethodMappedTo(operation, new MethodMng());
    }

    /** Makes {@code operation} what the returned method maps to, through {@code methodMng}. */
    private MethodDTO givenMethodMappedTo(OperationDTO operation, MethodMng methodMng) {
        MethodDTO method = aMethodDto(operation.getHttpMethod().name());
        when(methodMngMapper.toEntity(method)).thenReturn(methodMng);
        when(operationExMapper.toOperationAll(List.of(methodMng), null)).thenReturn(List.of(operation));
        return method;
    }

    /** The shop's order list: url and token from the connector, status from the webhook. */
    private static OperationDTO aShopOrdersGet() {
        return aConnectorOperation(SHOP_ID, "GET", "{url}/orders?status=${status}", BEARER);
    }

    /** Stores the shop connector: a public url pointing at the fake API and a private token. */
    private void givenShopConnector() {
        Connector shop = aConnector(SHOP_ID, SHOP, aStoredField("url", api.baseUrl(), PUBLIC));
        when(connectorService.getById(SHOP_ID)).thenReturn(shop);
        when(invokerService.findByName(SHOP)).thenReturn(shopInvoker());
        when(connectorExMapper.toMethodConnector(shop))
                .thenReturn(aResolvedConnector(SHOP_ID, Map.of("url", api.baseUrl(), "token", TOKEN)));
    }

    private static Invoker shopInvoker() {
        return anInvokerRequiring(SHOP,
                aRequiredField("url", null, PUBLIC),
                aRequiredField("token", null, PRIVATE));
    }
}
