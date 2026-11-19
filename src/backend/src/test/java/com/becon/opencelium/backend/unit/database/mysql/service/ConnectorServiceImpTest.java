package com.becon.opencelium.backend.unit.database.mysql.service;

import static com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture.aSnapshotOf;
import static com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture.anOpenEntry;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.assertj.core.api.Assertions.entry;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.becon.opencelium.backend.constant.props.ConnectorProps;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.RequestData;
import com.becon.opencelium.backend.database.mysql.repository.ConnectorRepository;
import com.becon.opencelium.backend.database.mysql.service.ConnectorHealthService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.database.mysql.service.GlobalVariableUsageService;
import com.becon.opencelium.backend.database.mysql.service.RequestDataServiceImp;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException.Code;
import com.becon.opencelium.backend.exception.GlobalReferenceValidationException.Violation;
import com.becon.opencelium.backend.exception.GlobalVariableNotFoundException;
import com.becon.opencelium.backend.execution.service.GlobalVariableSnapshotService;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.security.SecurityAuditorAware;
import com.becon.opencelium.backend.storage.StorageService;
import com.becon.opencelium.backend.testutil.fixture.ConnectorFixture;
import com.becon.opencelium.backend.utility.crypto.Encoder;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

/**
 * Unit tests for what {@link ConnectorServiceImp} does about the global variable references of
 * a connector's request data: a save checks them as the user wrote them and records them as
 * usages, a delete removes the usages, and preparing the connector for a request puts the values
 * of the variables in their place.
 *
 * <p>No Spring context: the repository, the encoder, the usage service and the snapshot service
 * are mocked. The mocked encoder wraps a value in {@code enc(…)}, so an encrypted value can be
 * told from the plain one. The step that computes the fields ({@code RequiredDataServiceImp}) is
 * the real one, because the service creates it itself.
 *
 * <p>Run with: ./gradlew test --tests "*.ConnectorServiceImpTest"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConnectorServiceImp — global variable references")
class ConnectorServiceImpTest {

    private static final int CONNECTOR_ID = 7;
    private static final String INVOKER = "idoit";
    private static final String URL = "{{global.idoitUrl}}/api";
    private static final String TOKEN = "s3cr3t";

    @Mock
    ConnectorProps connectorProps;

    @Mock
    ConnectorRepository connectorRepository;

    @Mock
    InvokerService invokerService;

    @Mock
    RequestDataServiceImp requestDataService;

    @Mock
    Encoder encoder;

    @Mock
    Environment env;

    @Mock
    StorageService storageService;

    @Mock
    ConnectorHealthService connectorHealthService;

    @Mock
    SecurityAuditorAware securityAuditorAware;

    @Mock
    EntityManager entityManager;

    @Mock
    GlobalVariableUsageService globalVariableUsageService;

    @Mock
    GlobalVariableSnapshotService globalVariableSnapshotService;

    @Captor
    ArgumentCaptor<Map<String, String>> checkedValues;

    @Captor
    ArgumentCaptor<List<RequestData>> storedRequestData;

    private ConnectorServiceImp service;

    @BeforeEach
    void setUp() {
        service = new ConnectorServiceImp(
                connectorProps, connectorRepository, invokerService,
                requestDataService, encoder, env, storageService, connectorHealthService,
                securityAuditorAware, entityManager, globalVariableUsageService,
                globalVariableSnapshotService);
    }

    // ── save ──────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("save — a reference cannot be found in a cipher text, so the check reads the values as written")
    void saveChecksValuesAsWrittenWhenConnectorHoldsRequestData() {
        givenConnectorIsStoredAs(CONNECTOR_ID);

        service.save(aNewConnector());

        verify(globalVariableUsageService).checkConnector(checkedValues.capture());
        assertThat(checkedValues.getValue()).containsExactly(entry("url", URL), entry("token", TOKEN));
    }

    @Test
    void saveStoresNothingWhenReferenceIsRejected() {
        Connector connector = aNewConnector();
        GlobalReferenceValidationException rejection = aRejection();
        doThrow(rejection).when(globalVariableUsageService).checkConnector(any());

        GlobalReferenceValidationException thrown =
                catchThrowableOfType(() -> service.save(connector), GlobalReferenceValidationException.class);

        assertThat(thrown).isSameAs(rejection);
        assertThat(thrown.getViolations()).extracting(Violation::code).containsExactly(Code.SCOPE_NOT_ALL);
        assertThat(connector.getRequestData()).extracting(RequestData::getValue).containsExactly(URL, TOKEN);
        verifyNoInteractions(connectorRepository, requestDataService, encoder);
        verify(globalVariableUsageService, never()).rebuildForConnector(anyLong(), any());
    }

    @Test
    @DisplayName("save — the usages are written for the stored connector, from the values as written")
    void saveRebuildsUsagesWhenConnectorIsStored() {
        givenConnectorIsStoredAs(CONNECTOR_ID);
        Connector connector = aNewConnector();

        Connector saved = service.save(connector);

        assertThat(saved.getId()).isEqualTo(CONNECTOR_ID);
        InOrder order = inOrder(connectorRepository, globalVariableUsageService);
        order.verify(connectorRepository).save(connector);
        order.verify(globalVariableUsageService).rebuildForConnector(CONNECTOR_ID, Map.of("url", URL, "token", TOKEN));
    }

    // ── updateRequestData ─────────────────────────────────────────────────────

    @Test
    void updateRequestDataStoresNothingWhenReferenceIsRejected() {
        Map<String, String> changed = Map.of("url", URL);
        GlobalReferenceValidationException rejection = aRejection();
        doThrow(rejection).when(globalVariableUsageService).checkConnector(changed);

        GlobalReferenceValidationException thrown = catchThrowableOfType(
                () -> service.updateRequestData(CONNECTOR_ID, changed), GlobalReferenceValidationException.class);

        assertThat(thrown).isSameAs(rejection);
        assertThat(thrown.getViolations()).extracting(Violation::code).containsExactly(Code.SCOPE_NOT_ALL);
        verifyNoInteractions(connectorRepository, requestDataService, encoder);
        verify(globalVariableUsageService, never()).rebuildForConnectorFields(anyLong(), any());
    }

    @Test
    @DisplayName("updateRequestData — the value is stored encrypted, its usages are read from it as written")
    void updateRequestDataRebuildsUsagesOfGivenFieldsWhenValuesAreStored() {
        Connector stored = ConnectorFixture.aConnector(CONNECTOR_ID, INVOKER,
                ConnectorFixture.aStoredField("url", "enc(https://cmdb.example/api)", ConnectorFixture.PUBLIC),
                ConnectorFixture.aStoredField("token", "enc(" + TOKEN + ")", ConnectorFixture.PRIVATE));
        when(connectorRepository.findById(CONNECTOR_ID)).thenReturn(Optional.of(stored));
        when(invokerService.findByName(INVOKER)).thenReturn(ConnectorFixture.anInvokerRequiring(INVOKER,
                ConnectorFixture.aRequiredField("url", null, ConnectorFixture.PUBLIC),
                ConnectorFixture.aRequiredField("token", null, ConnectorFixture.PRIVATE)));
        when(encoder.encrypt(anyString())).thenAnswer(invocation -> "enc(" + invocation.getArgument(0) + ")");
        Map<String, String> changed = Map.of("url", URL);

        service.updateRequestData(CONNECTOR_ID, changed);

        InOrder order = inOrder(requestDataService, globalVariableUsageService);
        order.verify(requestDataService).saveAll(storedRequestData.capture());
        order.verify(globalVariableUsageService).rebuildForConnectorFields(CONNECTOR_ID, changed);
        assertThat(storedRequestData.getValue()).extracting(RequestData::getField, RequestData::getValue)
                .containsExactly(tuple("url", "enc(" + URL + ")"));
    }

    // ── buildRequestData ──────────────────────────────────────────────────────

    @Test
    @DisplayName("buildRequestData — a field that holds a global variable gets the value the variable has now, "
            + "it is not taken for a reference to another field")
    void buildRequestDataResolvesGlobalWhenFieldHoldsOne() {
        Connector connector = aConnectorWithUrl(URL);
        givenInvokerRequiresUrlAndToken();
        when(globalVariableSnapshotService.takeOpenToAll())
                .thenReturn(aSnapshotOf(anOpenEntry("idoitUrl", "https://cmdb.example.test")));

        List<RequestData> requestData = service.buildRequestData(connector);

        assertThat(requestData).extracting(RequestData::getField, RequestData::getValue)
                .containsExactly(tuple("url", "https://cmdb.example.test/api"), tuple("token", TOKEN));
    }

    @Test
    @DisplayName("buildRequestData — reading the variables costs a query, so it is left out where no field "
            + "needs them")
    void buildRequestDataReadsNoVariablesWhenNoFieldHoldsReference() {
        Connector connector = aConnectorWithUrl("https://cmdb.example.test/api");
        givenInvokerRequiresUrlAndToken();

        List<RequestData> requestData = service.buildRequestData(connector);

        assertThat(requestData).extracting(RequestData::getValue)
                .containsExactly("https://cmdb.example.test/api", TOKEN);
        verifyNoInteractions(globalVariableSnapshotService);
    }

    @Test
    @DisplayName("buildRequestData — only the variables open to all workflows are read, so a scoped one is not "
            + "found")
    void buildRequestDataThrowsGlobalVariableNotFoundExceptionWhenVariableIsNotOpen() {
        Connector connector = aConnectorWithUrl(URL);
        givenInvokerRequiresUrlAndToken();
        when(globalVariableSnapshotService.takeOpenToAll())
                .thenReturn(aSnapshotOf(anOpenEntry("otherUrl", "https://other.example.test")));

        GlobalVariableNotFoundException notFound = catchThrowableOfType(
                () -> service.buildRequestData(connector), GlobalVariableNotFoundException.class);

        assertThat(notFound).hasMessageContaining("'idoitUrl'");
        assertThat(notFound.getName()).isEqualTo("idoitUrl");
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    void deleteByIdRemovesUsagesWhenConnectorIsDeleted() {
        service.deleteById(CONNECTOR_ID);

        verify(connectorRepository).deleteById(CONNECTOR_ID);
        verify(globalVariableUsageService).deleteForConnector(CONNECTOR_ID);
    }

    @Test
    void deleteByInvokerRemovesUsagesWhenConnectorsAreDeleted() {
        when(connectorRepository.findAllByInvoker(INVOKER)).thenReturn(List.of(
                ConnectorFixture.aConnector(7, INVOKER),
                ConnectorFixture.aConnector(8, INVOKER)));

        service.deleteByInvoker(INVOKER);

        verify(connectorRepository).deleteByInvoker(INVOKER);
        verify(globalVariableUsageService).deleteForConnector(7L);
        verify(globalVariableUsageService).deleteForConnector(8L);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /** A connector that is not stored yet, with a reference in its URL and a plain token. */
    private static Connector aNewConnector() {
        return ConnectorFixture.aConnector(0, INVOKER,
                ConnectorFixture.aStoredField("url", URL, ConnectorFixture.PUBLIC),
                ConnectorFixture.aStoredField("token", TOKEN, ConnectorFixture.PRIVATE));
    }

    /** A stored connector, read with its values in plain text: the given url and a plain token. */
    private static Connector aConnectorWithUrl(String url) {
        return ConnectorFixture.aConnector(CONNECTOR_ID, INVOKER,
                ConnectorFixture.aStoredField("url", url, ConnectorFixture.PUBLIC),
                ConnectorFixture.aStoredField("token", TOKEN, ConnectorFixture.PRIVATE));
    }

    /** The invoker of the connector requires a url and a token and has no function. */
    private void givenInvokerRequiresUrlAndToken() {
        when(invokerService.findByName(INVOKER)).thenReturn(ConnectorFixture.anInvokerRequiring(INVOKER,
                ConnectorFixture.aRequiredField("url", null, ConnectorFixture.PUBLIC),
                ConnectorFixture.aRequiredField("token", null, ConnectorFixture.PRIVATE)));
    }

    /**
     * The repository gives a stored connector the id and keeps its request data as given; the
     * encoder wraps a value in {@code enc(…)} and unwraps it again.
     */
    private void givenConnectorIsStoredAs(int id) {
        when(encoder.encrypt(anyString())).thenAnswer(invocation -> "enc(" + invocation.getArgument(0) + ")");
        when(encoder.decrypt(anyString())).thenAnswer(invocation -> {
            String encrypted = invocation.getArgument(0);
            return encrypted.substring("enc(".length(), encrypted.length() - 1);
        });
        when(connectorRepository.save(any(Connector.class))).thenAnswer(invocation -> {
            Connector connector = invocation.getArgument(0);
            connector.setId(id);
            return connector;
        });
        when(requestDataService.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    /** What the reference check throws for a connector that reads a variable not open to all workflows. */
    private static GlobalReferenceValidationException aRejection() {
        return new GlobalReferenceValidationException(List.of(new Violation(
                Code.SCOPE_NOT_ALL,
                "A connector may only use global variables that are open to all workflows, and 'idoitUrl' is not",
                "idoitUrl", "{{global.idoitUrl}}", null, null, "url")));
    }
}
