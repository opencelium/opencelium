package com.becon.opencelium.backend.unit.execution.service;

import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.PRIVATE;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.PUBLIC;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aConnector;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aRequiredField;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aResolvedConnector;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.aStoredField;
import static com.becon.opencelium.backend.testutil.fixture.ConnectorFixture.anInvokerRequiring;
import static com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture.aSnapshotOf;
import static com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture.anOpenEntry;
import static com.becon.opencelium.backend.testutil.fixture.OperationDTOFixture.aConnectorOperation;
import static com.becon.opencelium.backend.testutil.fixture.OperationDTOFixture.aMethodDto;
import static com.becon.opencelium.backend.testutil.fixture.OperationDTOFixture.anHttpOperation;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.constant.ConnectionConstants;
import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.database.mongodb.entity.MethodConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.GlobalVariable;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableService;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.execution.globalvariable.GlobalVariableSnapshot;
import com.becon.opencelium.backend.execution.service.GlobalVariableSnapshotService;
import com.becon.opencelium.backend.execution.service.MethodTestServiceImp;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.execution.ConnectorExMapper;
import com.becon.opencelium.backend.mapper.execution.OperationExMapper;
import com.becon.opencelium.backend.mapper.execution.OperatorExMapper;
import com.becon.opencelium.backend.mapper.mongo.MethodMngMapper;
import com.becon.opencelium.backend.reference.enums.ReferenceType;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodCurlRequestDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodCurlResultDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestReferencesDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestReferencesDTO.ConnectorReference;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestReferencesDTO.GlobalVariableReference;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestReferencesDTO.StaticReference;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestRequestDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestResultDTO;
import com.becon.opencelium.backend.resource.connection.methodtest.MethodTestResultDTO.ConnectorError;
import com.becon.opencelium.backend.resource.execution.MethodConnectorEx;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.testutil.fake.FakeHttpServer;
import com.becon.opencelium.backend.testutil.fake.FakeHttpServer.RecordedRequest;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.IntNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.TextNode;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.env.MockEnvironment;

/**
 * Unit tests for {@link MethodTestServiceImp}.
 *
 * <p>Mappers and services are mocked; the external API is a {@link FakeHttpServer}, so the
 * request really goes over HTTP the way a test from the editor does. One test reads the connector
 * with the real {@link ConnectorExMapper}, to see an unknown global variable found in its field.
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
    private static final long WORKFLOW_ID = 42L;
    private static final int CATEGORY_ID = 7;
    private static final String PAGE_SIZE_REF = "{{global.pageSize}}";
    private static final String TENANT_IN_LOOP_REF = "{{global.tenants[i].id}}";

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

    @Mock
    GlobalVariableSnapshotService globalVariableSnapshotService;

    @Mock
    GlobalVariableService globalVariableService;

    @Mock
    OperatorExMapper operatorExMapper;

    @Captor
    ArgumentCaptor<Supplier<GlobalVariableSnapshot>> globalsGivenToMapper;

    private FakeHttpServer api;
    private MethodTestServiceImp service;

    @BeforeEach
    void setUp() {
        api = FakeHttpServer.start();
        service = new MethodTestServiceImp(
                new MockEnvironment(), methodMngMapper, operationExMapper, connectorExMapper,
                connectorService, invokerService, globalVariableSnapshotService, globalVariableService);
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

        MethodTestReferencesDTO references = service.findReferences(method, null, null);

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

        MethodTestReferencesDTO references = service.findReferences(method, null, null);

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

        MethodTestReferencesDTO references = service.findReferences(method, null, null);

        assertThat(references.connectorReferences())
                .containsExactly(new ConnectorReference("{region}", SHOP_ID, "region", false));
    }

    @Test
    void findReferencesMarksReferenceUnavailableWhenConnectorDoesNotExist() {
        MethodDTO method = givenMethodMappedTo(
                aConnectorOperation(SHOP_ID, "GET", "http://api.test/contacts", Map.of("X-Key", "{#12.apiKey}")));
        when(connectorService.findById(CRM_ID)).thenReturn(Optional.empty());

        MethodTestReferencesDTO references = service.findReferences(method, null, null);

        assertThat(references.connectorReferences())
                .containsExactly(new ConnectorReference("{#12.apiKey}", CRM_ID, "apiKey", false));
    }

    @Test
    @DisplayName("findReferences — without a connector, {key} cannot be read and needs a static value")
    void findReferencesTreatsRequestDataAsStaticWhenMethodHasNoConnector() {
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", "http://api.test/orders", BEARER, null));

        MethodTestReferencesDTO references = service.findReferences(method, null, null);

        assertThat(references.connectorReferences()).isEmpty();
        assertThat(references.staticReferences())
                .containsExactly(new StaticReference("{token}", ReferenceType.REQUEST_DATA));
        verifyNoInteractions(connectorService);
    }

    @Test
    void findReferencesThrowsGeneralServiceExceptionWhenMethodHasNoRequest() {
        assertThatThrownBy(() -> service.findReferences(new MethodDTO(), null, null))
                .isInstanceOfSatisfying(GeneralServiceException.class, e -> {
                    assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(e.getError()).isEqualTo(ExceptionConstant.METHOD_TEST_METHOD_INVALID);
                })
                .hasMessageContaining("HTTP method");
        verifyNoInteractions(methodMngMapper);
    }

    // ── findReferences: global variables of the method ────────────────────────

    @Test
    @DisplayName("findReferences — a variable the user may use in the workflow needs no static value")
    void findReferencesListsGlobalReferenceWhenUserMayUseVariable() {
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", "http://api.test/orders?limit=" + PAGE_SIZE_REF,
                Map.of(), null));
        givenUsableVariables(WORKFLOW_ID, null, aPageSizeOf(50));

        MethodTestReferencesDTO references = service.findReferences(method, WORKFLOW_ID, null);

        assertThat(references.globalReferences())
                .containsExactly(new GlobalVariableReference(PAGE_SIZE_REF, "pageSize"));
        assertThat(references.staticReferences()).isEmpty();
    }

    @Test
    @DisplayName("findReferences — a variable unknown, out of scope or not usable by the user needs a static value")
    void findReferencesKeepsGlobalStaticWhenVariableIsNotUsable() {
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", "http://api.test/orders?limit=" + PAGE_SIZE_REF,
                Map.of(), null));
        givenUsableVariables(WORKFLOW_ID, null);

        MethodTestReferencesDTO references = service.findReferences(method, WORKFLOW_ID, null);

        assertThat(references.staticReferences())
                .containsExactly(new StaticReference(PAGE_SIZE_REF, ReferenceType.GLOBAL));
        assertThat(references.globalReferences()).isEmpty();
    }

    @Test
    @DisplayName("findReferences — no loop runs in a test, so a loop iterator in the path needs a static value")
    void findReferencesKeepsGlobalStaticWhenPathNamesLoopIterator() {
        MethodDTO method = givenMethodMappedTo(anHttpOperation(
                "GET", "http://api.test/tenants?id=" + TENANT_IN_LOOP_REF + "&limit=" + PAGE_SIZE_REF, Map.of(), null));
        givenUsableVariables(WORKFLOW_ID, null, aPageSizeOf(50), someTenants());

        MethodTestReferencesDTO references = service.findReferences(method, WORKFLOW_ID, null);

        assertThat(references.staticReferences())
                .containsExactly(new StaticReference(TENANT_IN_LOOP_REF, ReferenceType.GLOBAL));
    }

    @Test
    @DisplayName("findReferences — a method without global variables reads none, so no store and no user is needed")
    void findReferencesReadsNoVariableWhenMethodHasNoGlobalReference() {
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", "http://api.test/orders?status=${status}",
                Map.of(), null));

        MethodTestReferencesDTO references = service.findReferences(method, WORKFLOW_ID, null);

        assertThat(references.globalReferences()).isEmpty();
        verifyNoInteractions(globalVariableService, globalVariableSnapshotService);
    }

    @Test
    @DisplayName("findReferences — a workflow that is not saved yet reads the variables its category reaches")
    void findReferencesLooksUpVariablesOfCategoryWhenWorkflowIsNotSaved() {
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", "http://api.test/orders?limit=" + PAGE_SIZE_REF,
                Map.of(), null));
        givenUsableVariables(null, CATEGORY_ID, aPageSizeOf(50));

        MethodTestReferencesDTO references = service.findReferences(method, null, CATEGORY_ID);

        assertThat(references.globalReferences())
                .extracting(GlobalVariableReference::name)
                .containsExactly("pageSize");
    }

    @Test
    void findReferencesThrowsGeneralServiceExceptionWhenWorkflowIsAmbiguous() {
        MethodDTO method = aMethodDto("GET");

        assertThatThrownBy(() -> service.findReferences(method, WORKFLOW_ID, CATEGORY_ID))
                .isInstanceOfSatisfying(GeneralServiceException.class, e -> {
                    assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(e.getError()).isEqualTo(ExceptionConstant.METHOD_TEST_WORKFLOW_AMBIGUOUS);
                })
                .hasMessageContaining("not both");
        verifyNoInteractions(globalVariableService);
    }

    // ── test: rejected before anything is sent ────────────────────────────────

    @Test
    void testThrowsGeneralServiceExceptionWhenMethodHasNoHttpMethod() {
        MethodTestRequestDTO request = new MethodTestRequestDTO(aMethodDto(" "), Map.of(), false);

        assertThatThrownBy(() -> service.test(request, null, null))
                .isInstanceOfSatisfying(GeneralServiceException.class, e ->
                        assertThat(e.getError()).isEqualTo(ExceptionConstant.METHOD_TEST_METHOD_INVALID))
                .hasMessageContaining("HTTP method");
    }

    @Test
    @DisplayName("test — an unconfirmed write is rejected before any connector is read")
    void testThrowsGeneralServiceExceptionWhenWriteIsNotConfirmed() {
        MethodDTO method = givenMethodMappedTo(aConnectorOperation(SHOP_ID, "POST", "{url}/orders", BEARER));

        assertThatThrownBy(() -> service.test(new MethodTestRequestDTO(method, Map.of(), false), null, null))
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

        assertThatThrownBy(() -> service.test(new MethodTestRequestDTO(method, Map.of(), false), null, null))
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

        assertThatThrownBy(() -> service.test(new MethodTestRequestDTO(method, Map.of(), false), null, null))
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
        when(connectorExMapper.toMethodConnector(eq(shop), any()))
                .thenThrow(new IllegalStateException("Path $.access_token not found"));

        MethodTestResultDTO result = service.test(new MethodTestRequestDTO(method, Map.of(), false), null, null);

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

        service.test(new MethodTestRequestDTO(method, Map.of("{#12.apiKey}", "static-key"), false), null, null);

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

        service.test(new MethodTestRequestDTO(method, Map.of(), false), null, null);

        assertThat(methodMng.getConnector()).isNull();
        verifyNoInteractions(connectorService);
    }

    // ── test: global variables in connector fields ────────────────────────────

    @Test
    @DisplayName("test — no workflow runs in a test, so a connector is read with the variables open to all "
            + "workflows as they are now")
    void testReadsConnectorWithOpenVariablesWhenConnectorIsRead() {
        MethodDTO method = givenMethodMappedTo(aShopOrdersGet());
        givenShopConnector();
        GlobalVariableSnapshot openVariables = aSnapshotOf(anOpenEntry("shopUrl", api.baseUrl()));
        when(globalVariableSnapshotService.takeOpenToAll()).thenReturn(openVariables);

        service.test(new MethodTestRequestDTO(method, Map.of("${status}", "open"), false), null, null);

        verify(connectorExMapper).toMethodConnector(any(Connector.class), globalsGivenToMapper.capture());
        assertThat(globalsGivenToMapper.getValue().get()).isSameAs(openVariables);
    }

    @Test
    @DisplayName("test — an unknown variable in a connector field is the error of that connector and nothing is "
            + "sent; the connector is read by the real mapper here")
    void testReturnsConnectorErrorWhenConnectorFieldUsesUnknownVariable() {
        MethodDTO method = givenMethodMappedTo(aConnectorOperation(SHOP_ID, "GET", "{url}/orders", BEARER));
        Connector shop = aConnector(SHOP_ID, SHOP,
                aStoredField("url", "{{global.shopUrl}}", PUBLIC),
                aStoredField("token", TOKEN, PRIVATE));
        when(connectorService.getById(SHOP_ID)).thenReturn(shop);
        when(invokerService.findByName(SHOP)).thenReturn(shopInvoker());
        when(globalVariableSnapshotService.takeOpenToAll()).thenReturn(GlobalVariableSnapshot.empty());
        MethodTestServiceImp serviceReadingConnectors = new MethodTestServiceImp(
                new MockEnvironment(), methodMngMapper, operationExMapper,
                new ConnectorExMapper(connectorService, operationExMapper, operatorExMapper, invokerService),
                connectorService, invokerService, globalVariableSnapshotService, globalVariableService);

        MethodTestResultDTO result =
                serviceReadingConnectors.test(new MethodTestRequestDTO(method, Map.of(), false), null, null);

        assertThat(result.connectorErrors()).singleElement().satisfies(error -> {
            assertThat(error.connectorId()).isEqualTo(SHOP_ID);
            assertThat(error.message()).contains("'shopUrl'");
        });
        assertThat(api.requests()).isEmpty();
    }

    @Test
    @DisplayName("test — a connector field reads the variables open to all, whatever workflow the method belongs to")
    void testReadsConnectorWithOpenVariablesWhenWorkflowIsGiven() {
        MethodDTO method = givenMethodMappedTo(aShopOrdersGet());
        givenShopConnector();
        GlobalVariableSnapshot openVariables = aSnapshotOf(anOpenEntry("shopUrl", api.baseUrl()));
        when(globalVariableSnapshotService.takeOpenToAll()).thenReturn(openVariables);

        service.test(new MethodTestRequestDTO(method, Map.of("${status}", "open"), false), WORKFLOW_ID, null);

        verify(connectorExMapper).toMethodConnector(any(Connector.class), globalsGivenToMapper.capture());
        assertThat(globalsGivenToMapper.getValue().get()).isSameAs(openVariables);
    }

    // ── test: global variables of the method ──────────────────────────────────

    @Test
    @DisplayName("test — a variable the user may use is sent with its current value")
    void testSendsCurrentGlobalValueWhenVariableIsUsable() {
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", api.baseUrl() + "/orders?limit=" + PAGE_SIZE_REF,
                Map.of(), null));
        givenUsableVariables(WORKFLOW_ID, null, aPageSizeOf(50));

        service.test(new MethodTestRequestDTO(method, Map.of(), false), WORKFLOW_ID, null);

        assertThat(api.requests()).extracting(RecordedRequest::uri).containsExactly("/orders?limit=50");
    }

    @Test
    @DisplayName("test — a body field that holds only the reference keeps the JSON type, as in a run")
    void testKeepsGlobalJsonTypeWhenBodyFieldIsOnlyReference() throws Exception {
        MethodDTO method = givenMethodMappedTo(anHttpOperation("POST", api.baseUrl() + "/orders", Map.of(),
                Map.of("limits", "{{global.limits}}")));
        givenUsableVariables(WORKFLOW_ID, null, someLimits());

        service.test(new MethodTestRequestDTO(method, Map.of(), true), WORKFLOW_ID, null);

        assertThat(new ObjectMapper().readTree(api.requests().get(0).body()))
                .isEqualTo(new ObjectMapper().readTree("{\"limits\":{\"maxPerPage\":50}}"));
    }

    @Test
    @DisplayName("test — a static value given for a variable wins, and then no variable is read")
    void testSendsStaticValueWhenGlobalReferenceHasOne() {
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", api.baseUrl() + "/orders?limit=" + PAGE_SIZE_REF,
                Map.of(), null));

        service.test(new MethodTestRequestDTO(method, Map.of(PAGE_SIZE_REF, 10), false), WORKFLOW_ID, null);

        assertThat(api.requests()).extracting(RecordedRequest::uri).containsExactly("/orders?limit=10");
        verifyNoInteractions(globalVariableService);
    }

    @Test
    @DisplayName("test — a variable the user may not use is never sent, empty or as written: it needs a static value")
    void testThrowsGeneralServiceExceptionWhenGlobalIsNotUsable() {
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", api.baseUrl() + "/orders?limit=" + PAGE_SIZE_REF,
                Map.of(), null));
        givenUsableVariables(WORKFLOW_ID, null);

        assertThatThrownBy(() -> service.test(new MethodTestRequestDTO(method, Map.of(), false), WORKFLOW_ID, null))
                .isInstanceOfSatisfying(GeneralServiceException.class, e ->
                        assertThat(e.getError()).isEqualTo(ExceptionConstant.METHOD_TEST_STATIC_VALUES_MISSING))
                .hasMessageContaining(PAGE_SIZE_REF);
        assertThat(api.requests()).isEmpty();
    }

    @Test
    @DisplayName("test — a loop iterator in the path needs a static value, even when the variable is usable")
    void testThrowsGeneralServiceExceptionWhenGlobalPathNamesLoopIterator() {
        String endpoint = api.baseUrl() + "/tenants?id=" + TENANT_IN_LOOP_REF + "&limit=" + PAGE_SIZE_REF;
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", endpoint, Map.of(), null));
        givenUsableVariables(WORKFLOW_ID, null, aPageSizeOf(50), someTenants());

        assertThatThrownBy(() -> service.test(new MethodTestRequestDTO(method, Map.of(), false), WORKFLOW_ID, null))
                .isInstanceOfSatisfying(GeneralServiceException.class, e ->
                        assertThat(e.getError()).isEqualTo(ExceptionConstant.METHOD_TEST_STATIC_VALUES_MISSING))
                .hasMessageContaining(TENANT_IN_LOOP_REF)
                .hasMessageNotContaining(PAGE_SIZE_REF);
        assertThat(api.requests()).isEmpty();
    }

    // ── test: sending ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("test — the API receives static values and the connector's real data")
    void testSendsResolvedValuesWhenRequestIsSent() {
        MethodDTO method = givenMethodMappedTo(aShopOrdersGet());
        givenShopConnector();

        service.test(new MethodTestRequestDTO(method, Map.of("${status}", "open"), false), null, null);

        assertThat(api.requests())
                .extracting(RecordedRequest::uri, sent -> sent.header("Authorization"))
                .containsExactly(tuple("/orders?status=open", "Bearer " + TOKEN));
    }

    @Test
    void testReturnsApiResponseWhenRequestIsSent() {
        api.respondWith(201, "application/json", "{\"id\":7}");
        MethodDTO method = givenMethodMappedTo(aShopOrdersGet());
        givenShopConnector();

        MethodTestResultDTO result =
                service.test(new MethodTestRequestDTO(method, Map.of("${status}", "open"), false), null, null);

        assertThat(result.response().status()).isEqualTo(201);
        assertThat(result.response().body()).isEqualTo(Map.of("id", 7));
        assertThat(result.connectorErrors()).isEmpty();
    }

    @Test
    @DisplayName("test — the returned request hides private connector values and keeps public ones")
    void testMasksHiddenConnectorValuesWhenTheyAppearInRequest() {
        MethodDTO method = givenMethodMappedTo(aShopOrdersGet());
        givenShopConnector();

        MethodTestResultDTO result =
                service.test(new MethodTestRequestDTO(method, Map.of("${status}", "open"), false), null, null);

        assertThat(result.request().headers().get("Authorization")).containsExactly("Bearer ****");
        assertThat(result.request().url()).isEqualTo(api.baseUrl() + "/orders?status=open");
    }

    @Test
    void testSendsWriteRequestWhenWriteIsConfirmed() {
        MethodDTO method = givenMethodMappedTo(
                anHttpOperation("POST", api.baseUrl() + "/orders", Map.of(), Map.of("name", "box")));

        service.test(new MethodTestRequestDTO(method, Map.of(), true), null, null);

        assertThat(api.requests()).extracting(RecordedRequest::method).containsExactly("POST");
    }

    @Test
    @DisplayName("test — an error answer of the API is a result, not an exception")
    void testReturnsErrorStatusWhenApiAnswersWithError() {
        api.respondWith(500, "text/plain", "down");
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", api.baseUrl() + "/orders", Map.of(), null));

        MethodTestResultDTO result = service.test(new MethodTestRequestDTO(method, Map.of(), false), null, null);

        assertThat(result.response().status()).isEqualTo(500);
        assertThat(result.response().body()).isEqualTo("down");
    }

    @Test
    void testReturnsBase64BodyWhenResponseIsBinary() {
        api.respondWith(200, "application/octet-stream", new byte[] {1, 2, 3});
        MethodDTO method = givenMethodMappedTo(anHttpOperation(
                "GET", api.baseUrl() + "/files/1", Map.of("Content-Type", "application/octet-stream"), null));

        MethodTestResultDTO result = service.test(new MethodTestRequestDTO(method, Map.of(), false), null, null);

        assertThat(result.response().body()).isEqualTo("AQID");
    }

    // ── toCurl ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("toCurl — the command holds static values and the connector's real, unmasked data")
    void toCurlReturnsUnmaskedConnectorValuesWhenRequestIsBuilt() {
        MethodDTO method = givenMethodMappedTo(aShopOrdersGet());
        givenShopConnector();

        MethodCurlResultDTO result =
                service.toCurl(new MethodCurlRequestDTO(method, Map.of("${status}", "open")), null, null);

        assertThat(result.curl())
                .startsWith("curl '" + api.baseUrl() + "/orders?status=open'")
                .contains("-H 'Authorization: Bearer " + TOKEN + "'")
                .doesNotContain("****");
        assertThat(result.connectorErrors()).isEmpty();
    }

    @Test
    void toCurlSendsNoRequestWhenCommandIsBuilt() {
        MethodDTO method = givenMethodMappedTo(aShopOrdersGet());
        givenShopConnector();

        service.toCurl(new MethodCurlRequestDTO(method, Map.of("${status}", "open")), null, null);

        assertThat(api.requests()).isEmpty();
    }

    @Test
    @DisplayName("toCurl — a write needs no confirmation, because nothing is sent")
    void toCurlBuildsWriteRequestWithoutConfirmation() {
        MethodDTO method = givenMethodMappedTo(
                anHttpOperation("DELETE", api.baseUrl() + "/orders/7", Map.of(), null));

        MethodCurlResultDTO result = service.toCurl(new MethodCurlRequestDTO(method, Map.of()), null, null);

        assertThat(result.curl()).startsWith("curl -X DELETE '" + api.baseUrl() + "/orders/7'");
        verifyNoInteractions(connectorService);
    }

    @Test
    void toCurlAddsConnectorTransportOptionsWhenConnectorSetsThem() {
        MethodDTO method = givenMethodMappedTo(aConnectorOperation(SHOP_ID, "GET", "{url}/orders", Map.of()));
        Connector shop = aConnector(SHOP_ID, SHOP, aStoredField("url", api.baseUrl(), PUBLIC));
        MethodConnectorEx resolved = aResolvedConnector(SHOP_ID, Map.of("url", api.baseUrl()));
        resolved.setSslCert(true);
        resolved.setTimeout(2500);
        when(connectorService.getById(SHOP_ID)).thenReturn(shop);
        when(invokerService.findByName(SHOP)).thenReturn(shopInvoker());
        when(connectorExMapper.toMethodConnector(eq(shop), any())).thenReturn(resolved);

        MethodCurlResultDTO result = service.toCurl(new MethodCurlRequestDTO(method, Map.of()), null, null);

        assertThat(result.curl()).contains("--insecure", "--connect-timeout 2.5");
    }

    @Test
    void toCurlReturnsConnectorErrorsWhenConnectorDataFails() {
        MethodDTO method = givenMethodMappedTo(aConnectorOperation(SHOP_ID, "GET", "{url}/orders", BEARER));
        Connector shop = aConnector(SHOP_ID, SHOP);
        when(connectorService.getById(SHOP_ID)).thenReturn(shop);
        when(invokerService.findByName(SHOP)).thenReturn(shopInvoker());
        when(connectorExMapper.toMethodConnector(eq(shop), any()))
                .thenThrow(new IllegalStateException("Path $.access_token not found"));

        MethodCurlResultDTO result = service.toCurl(new MethodCurlRequestDTO(method, Map.of()), null, null);

        assertThat(result.curl()).isNull();
        assertThat(result.connectorErrors())
                .containsExactly(new ConnectorError(SHOP_ID, "Path $.access_token not found"));
    }

    @Test
    void toCurlThrowsGeneralServiceExceptionWhenStaticValueIsMissing() {
        MethodDTO method = givenMethodMappedTo(aShopOrdersGet());

        assertThatThrownBy(() -> service.toCurl(new MethodCurlRequestDTO(method, Map.of()), null, null))
                .isInstanceOfSatisfying(GeneralServiceException.class, e ->
                        assertThat(e.getError()).isEqualTo(ExceptionConstant.METHOD_TEST_STATIC_VALUES_MISSING))
                .hasMessageContaining("${status}");
        verifyNoInteractions(connectorExMapper);
    }

    @Test
    void toCurlThrowsGeneralServiceExceptionWhenMethodHasNoHttpMethod() {
        assertThatThrownBy(() -> service.toCurl(new MethodCurlRequestDTO(aMethodDto(" "), Map.of()), null, null))
                .isInstanceOfSatisfying(GeneralServiceException.class, e ->
                        assertThat(e.getError()).isEqualTo(ExceptionConstant.METHOD_TEST_METHOD_INVALID));
    }

    // ── toCurl: global variables of the method ────────────────────────────────

    @Test
    void toCurlContainsCurrentGlobalValueWhenVariableIsUsable() {
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", api.baseUrl() + "/orders?limit=" + PAGE_SIZE_REF,
                Map.of(), null));
        givenUsableVariables(null, CATEGORY_ID, aPageSizeOf(50));

        MethodCurlResultDTO result = service.toCurl(new MethodCurlRequestDTO(method, Map.of()), null, CATEGORY_ID);

        assertThat(result.curl()).startsWith("curl '" + api.baseUrl() + "/orders?limit=50'");
    }

    @Test
    void toCurlThrowsGeneralServiceExceptionWhenGlobalIsNotUsable() {
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", api.baseUrl() + "/orders?limit=" + PAGE_SIZE_REF,
                Map.of(), null));
        givenUsableVariables(null, CATEGORY_ID);

        assertThatThrownBy(() -> service.toCurl(new MethodCurlRequestDTO(method, Map.of()), null, CATEGORY_ID))
                .isInstanceOfSatisfying(GeneralServiceException.class, e ->
                        assertThat(e.getError()).isEqualTo(ExceptionConstant.METHOD_TEST_STATIC_VALUES_MISSING))
                .hasMessageContaining(PAGE_SIZE_REF);
    }

    // ── secret global variables ───────────────────────────────────────────────

    @Test
    @DisplayName("test — the API receives the secret, the returned request shows it masked")
    void testMasksSecretGlobalInSentRequestWhenMethodReferencesIt() {
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", api.baseUrl() + "/orders?key={{global.apiKey}}",
                Map.of("X-Api-Key", "{{global.apiKey}}"), null));
        givenUsableVariables(WORKFLOW_ID, null, anApiKeyOf("s3cr3t-key"));

        MethodTestResultDTO result = service.test(new MethodTestRequestDTO(method, Map.of(), false), WORKFLOW_ID, null);

        assertThat(api.requests()).extracting(RecordedRequest::uri).containsExactly("/orders?key=s3cr3t-key");
        assertThat(result.request().url()).isEqualTo(api.baseUrl() + "/orders?key=****");
        assertThat(result.request().headers().get("X-Api-Key")).containsExactly("****");
    }

    @Test
    @DisplayName("test — a secret that a public connector field brings in is masked like a private field")
    void testMasksSecretGlobalInSentRequestWhenConnectorFieldHoldsIt() {
        MethodDTO method = givenMethodMappedTo(aConnectorOperation(SHOP_ID, "GET", "{url}/orders?tenant={tenant}",
                Map.of()));
        Connector shop = aConnector(SHOP_ID, SHOP,
                aStoredField("url", api.baseUrl(), PUBLIC),
                aStoredField("tenant", "{{global.tenantKey}}", PUBLIC));
        when(connectorService.getById(SHOP_ID)).thenReturn(shop);
        when(invokerService.findByName(SHOP)).thenReturn(shopInvoker());
        when(globalVariableSnapshotService.takeOpenToAll()).thenReturn(
                aSnapshotOf(GlobalVariableSnapshot.Entry.ofSecret("tenantKey", 1, new TextNode("t3nant-key"), true)));
        when(connectorExMapper.toMethodConnector(eq(shop), any())).thenAnswer(invocation -> {
            // a field holds a reference, so the mapper asks for the variables, as the real one does
            Supplier<GlobalVariableSnapshot> globals = invocation.getArgument(1);
            globals.get();
            return aResolvedConnector(SHOP_ID, Map.of("url", api.baseUrl(), "tenant", "t3nant-key"));
        });

        MethodTestResultDTO result = service.test(new MethodTestRequestDTO(method, Map.of(), false), null, null);

        assertThat(result.request().url()).isEqualTo(api.baseUrl() + "/orders?tenant=****");
    }

    @Test
    void testKeepsNonSecretGlobalInSentRequest() {
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", api.baseUrl() + "/orders?key={{global.apiKey}}",
                Map.of(), null));
        givenUsableVariables(WORKFLOW_ID, null,
                new GlobalVariableSnapshot.Entry("apiKey", 1, new TextNode("visible-key"), false));

        MethodTestResultDTO result = service.test(new MethodTestRequestDTO(method, Map.of(), false), WORKFLOW_ID, null);

        assertThat(result.request().url()).isEqualTo(api.baseUrl() + "/orders?key=visible-key");
    }

    @Test
    @DisplayName("toCurl — the command must run, so it holds a secret in clear, like a private connector value")
    void toCurlKeepsSecretGlobalValueWhenMethodReferencesIt() {
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", api.baseUrl() + "/orders?key={{global.apiKey}}",
                Map.of(), null));
        givenUsableVariables(null, CATEGORY_ID, anApiKeyOf("s3cr3t-key"));

        MethodCurlResultDTO result = service.toCurl(new MethodCurlRequestDTO(method, Map.of()), null, CATEGORY_ID);

        assertThat(result.curl()).startsWith("curl '" + api.baseUrl() + "/orders?key=s3cr3t-key'");
    }

    @Test
    @DisplayName("test — a secret that cannot be decrypted stops the request, and nothing is sent")
    void testThrowsGeneralServiceExceptionWhenSecretCannotBeDecrypted() {
        MethodDTO method = givenMethodMappedTo(anHttpOperation("GET", api.baseUrl() + "/orders?key={{global.apiKey}}",
                Map.of(), null));
        List<GlobalVariable> usable = List.of(GlobalVariableFixture.aConstant(1L, "apiKey", "encrypted"));
        when(globalVariableService.findUsable(WORKFLOW_ID, null)).thenReturn(usable);
        when(globalVariableSnapshotService.takeOf(usable)).thenReturn(aSnapshotOf(
                GlobalVariableSnapshot.Entry.ofUnreadableSecret("apiKey", 1, false, "no key is configured")));

        assertThatThrownBy(() -> service.test(new MethodTestRequestDTO(method, Map.of(), false), WORKFLOW_ID, null))
                .isInstanceOfSatisfying(GeneralServiceException.class, e ->
                        assertThat(e.getError()).isEqualTo(ExceptionConstant.METHOD_TEST_REQUEST_NOT_BUILT))
                .hasMessageContaining("'apiKey'")
                .hasMessageContaining("no key is configured");
        assertThat(api.requests()).isEmpty();
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
        when(connectorExMapper.toMethodConnector(eq(shop), any()))
                .thenReturn(aResolvedConnector(SHOP_ID, Map.of("url", api.baseUrl(), "token", TOKEN)));
    }

    /**
     * The caller may use the variables of {@code entries} in the given workflow, and no other one:
     * the snapshot of the test holds exactly these.
     */
    private void givenUsableVariables(Long connectionId, Integer categoryId, GlobalVariableSnapshot.Entry... entries) {
        List<GlobalVariable> usable = Stream.of(entries)
                .map(entry -> GlobalVariableFixture.aConstant(1L, entry.name(), entry.value().toString()))
                .toList();
        when(globalVariableService.findUsable(connectionId, categoryId)).thenReturn(usable);
        when(globalVariableSnapshotService.takeOf(usable)).thenReturn(aSnapshotOf(entries));
    }

    /** The secret {@code apiKey} of a workflow, a string. */
    private static GlobalVariableSnapshot.Entry anApiKeyOf(String value) {
        return GlobalVariableSnapshot.Entry.ofSecret("apiKey", 1, new TextNode(value), false);
    }

    /** The variable {@code pageSize} of a workflow, a number. */
    private static GlobalVariableSnapshot.Entry aPageSizeOf(int value) {
        return new GlobalVariableSnapshot.Entry("pageSize", 1, IntNode.valueOf(value), false);
    }

    /** The variable {@code limits} of a workflow, a map: {@code {"maxPerPage":50}}. */
    private static GlobalVariableSnapshot.Entry someLimits() {
        return new GlobalVariableSnapshot.Entry(
                "limits", 1, JsonNodeFactory.instance.objectNode().put("maxPerPage", 50), false);
    }

    /** The variable {@code tenants} of a workflow, an array a loop can walk. */
    private static GlobalVariableSnapshot.Entry someTenants() {
        return new GlobalVariableSnapshot.Entry("tenants", 1,
                JsonNodeFactory.instance.arrayNode().add(JsonNodeFactory.instance.objectNode().put("id", "acme")),
                false);
    }

    private static Invoker shopInvoker() {
        return anInvokerRequiring(SHOP,
                aRequiredField("url", null, PUBLIC),
                aRequiredField("token", null, PRIVATE));
    }
}
