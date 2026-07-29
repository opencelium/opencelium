package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.constant.props.ConnectorProps;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.repository.ConnectorRepository;
import com.becon.opencelium.backend.database.mysql.service.ConnectorHealthService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.database.mysql.service.RequestDataServiceImp;
import com.becon.opencelium.backend.exception.ConnectorNotFoundException;
import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.storage.StorageService;
import com.becon.opencelium.backend.utility.crypto.Encoder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

/**
 * Unit tests for the connector icon management added to {@link ConnectorServiceImp}
 * ({@code storeIcon} / {@code deleteIcon}).
 *
 * No Spring context: repository, storage and the encryption collaborators are mocked.
 * Connectors are built with the default (empty) requestData list so the service's
 * encrypt/decrypt round-trip inside findById/save is a no-op and stays out of the way.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConnectorServiceImp — icon management")
class ConnectorServiceImpIconTest {

    @Mock private ConnectorProps connectorProps;
    @Mock private ConnectorRepository connectorRepository;
    @Mock private InvokerService invokerService;
    @Mock private RequestDataServiceImp requestDataService;
    @Mock private Encoder encoder;
    @Mock private Environment env;
    @Mock private StorageService storageService;
    @Mock private ConnectorHealthService connectorHealthService;

    private ConnectorServiceImp service;

    private ConnectorServiceImp newService() {
        return new ConnectorServiceImp(
                connectorProps, connectorRepository, invokerService,
                requestDataService, encoder, env, storageService, connectorHealthService);
    }

    private Connector aConnector(int id, String icon) {
        Connector connector = new Connector();
        connector.setId(id);
        connector.setIcon(icon);
        return connector;
    }

    private MultipartFile anImage(String filename, byte[] content) {
        return new MockMultipartFile("file", filename, "image/png", content);
    }

    // ── storeIcon ─────────────────────────────────────────────────────────────

    @Test
    void storeIconStoresUuidFilenameAndSetsItOnConnectorWhenImageIsValid() {
        service = newService();
        Connector connector = aConnector(1, null);
        given(connectorRepository.findById(1)).willReturn(Optional.of(connector));
        given(connectorRepository.save(any(Connector.class))).willAnswer(inv -> inv.getArgument(0));
        given(requestDataService.saveAll(any())).willReturn(new ArrayList<>());
        MultipartFile file = anImage("logo.png", new byte[]{1, 2, 3});

        Connector result = service.storeIcon(1, file);

        assertThat(result.getIcon()).matches("[0-9a-fA-F\\-]{36}\\.png");
        ArgumentCaptor<String> stored = ArgumentCaptor.forClass(String.class);
        verify(storageService).store(eq(file), stored.capture());
        assertThat(stored.getValue()).isEqualTo(result.getIcon());
        verify(storageService, never()).delete(any());
    }

    @Test
    void storeIconDeletesPreviousIconWhenConnectorAlreadyHasOne() {
        service = newService();
        Connector connector = aConnector(1, "/storage/files/old.png");
        given(connectorRepository.findById(1)).willReturn(Optional.of(connector));
        given(connectorRepository.save(any(Connector.class))).willAnswer(inv -> inv.getArgument(0));
        given(requestDataService.saveAll(any())).willReturn(new ArrayList<>());

        service.storeIcon(1, anImage("logo.png", new byte[]{1}));

        verify(storageService).delete("old.png");
    }

    @Test
    void storeIconThrowsStorageExceptionWhenExtensionIsNotAnImage() {
        service = newService();
        given(connectorRepository.findById(1)).willReturn(Optional.of(aConnector(1, null)));
        MultipartFile gif = anImage("logo.gif", new byte[]{1});

        assertThatThrownBy(() -> service.storeIcon(1, gif))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("jpg");

        verify(storageService, never()).store(any(), any());
    }

    @Test
    void storeIconThrowsStorageExceptionWhenFileIsEmpty() {
        service = newService();
        given(connectorRepository.findById(1)).willReturn(Optional.of(aConnector(1, null)));
        MultipartFile empty = anImage("logo.png", new byte[0]);

        assertThatThrownBy(() -> service.storeIcon(1, empty))
                .isInstanceOf(StorageException.class)
                .hasMessageContaining("empty");

        verify(storageService, never()).store(any(), any());
    }

    @Test
    void storeIconThrowsConnectorNotFoundExceptionWhenConnectorDoesNotExist() {
        service = newService();
        given(connectorRepository.findById(99)).willReturn(Optional.empty());

        ConnectorNotFoundException ex = catchThrowableOfType(
                () -> service.storeIcon(99, anImage("logo.png", new byte[]{1})),
                ConnectorNotFoundException.class);

        assertThat(ex).isNotNull();
        assertThat(ex.getId()).isEqualTo(99);
        verifyNoInteractions(storageService);
    }

    // ── deleteIcon ────────────────────────────────────────────────────────────

    @Test
    void deleteIconRemovesStoredFileAndClearsIconWhenIconIsSet() {
        service = newService();
        Connector connector = aConnector(1, "/storage/files/old.png");
        given(connectorRepository.findById(1)).willReturn(Optional.of(connector));
        given(connectorRepository.save(any(Connector.class))).willAnswer(inv -> inv.getArgument(0));
        given(requestDataService.saveAll(any())).willReturn(new ArrayList<>());

        service.deleteIcon(1);

        verify(storageService).delete("old.png");
        assertThat(connector.getIcon()).isNull();
    }

    @Test
    void deleteIconDoesNotTouchStorageWhenConnectorHasNoIcon() {
        service = newService();
        Connector connector = aConnector(1, null);
        given(connectorRepository.findById(1)).willReturn(Optional.of(connector));
        given(connectorRepository.save(any(Connector.class))).willAnswer(inv -> inv.getArgument(0));
        given(requestDataService.saveAll(any())).willReturn(new ArrayList<>());

        service.deleteIcon(1);

        verify(storageService, never()).delete(any());
        assertThat(connector.getIcon()).isNull();
    }

    @Test
    void deleteIconThrowsConnectorNotFoundExceptionWhenConnectorDoesNotExist() {
        service = newService();
        given(connectorRepository.findById(99)).willReturn(Optional.empty());

        ConnectorNotFoundException ex = catchThrowableOfType(
                () -> service.deleteIcon(99), ConnectorNotFoundException.class);

        assertThat(ex).isNotNull();
        assertThat(ex.getId()).isEqualTo(99);
        verifyNoInteractions(storageService);
    }
}
