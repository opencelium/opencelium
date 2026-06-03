package com.becon.opencelium.backend.unit.database.mysql.service;

import com.becon.opencelium.backend.database.mysql.entity.ActivationRequest;
import com.becon.opencelium.backend.database.mysql.repository.ActivationRequestRepository;
import com.becon.opencelium.backend.database.mysql.service.ActivationRequestServiceImp;
import com.becon.opencelium.backend.enums.ActivReqStatus;
import com.becon.opencelium.backend.testutil.fixture.ActivationRequestFixture;
import com.becon.opencelium.backend.utility.MachineUtility;
import com.becon.opencelium.backend.utility.crypto.HmacUtility;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Base64;
import java.util.Optional;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link ActivationRequestServiceImp}.
 *
 * No Spring context is loaded. Repository and scheduler interactions are
 * mocked with Mockito.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ActivationRequestServiceImp — unit")
class ActivationRequestServiceImpTest {

    @Mock
    private ActivationRequestRepository repository;

    @Mock
    private ScheduledExecutorService scheduler;

    @InjectMocks
    private ActivationRequestServiceImp service;

    // ── save ─────────────────────────────────────────────────────────────────

    @Test
    void saveReturnsPersistedActivationRequestWhenRepositorySucceeds() {
        // GIVEN
        ActivationRequest request = ActivationRequestFixture.aPendingActivationRequest();

        when(repository.save(request))
                .thenReturn(request);

        // WHEN
        ActivationRequest result = service.save(request);

        // THEN
        assertThat(result).isSameAs(request);
        verify(repository).save(request);
    }

    // ── verify ───────────────────────────────────────────────────────────────

    @Test
    void verifyReturnsTrueWhenActivationRequestHmacMatches() {
        // GIVEN
        ActivationRequest request = ActivationRequestFixture.aPendingActivationRequest();
        String hmac = request.getHmac();

        // WHEN-THEN
        assertThat(service.verify(request, hmac)).isTrue();
    }

    @Test
    void verifyReturnsFalseWhenActivationRequestHmacDoesNotMatch() {
        // GIVEN
        ActivationRequest request = ActivationRequestFixture.aPendingActivationRequest();

        // WHEN-THEN
        assertThat(service.verify(request, "wrong-hmac")).isFalse();
    }

    @Test
    void verifyReturnsFalseWhenActivationRequestIsExpired() {
        // GIVEN
        ActivationRequest request = ActivationRequestFixture.aExpiredActivationRequest();
        String hmac = request.getHmac();

        // WHEN-THEN
        assertThat(service.verify(request, hmac)).isFalse();
    }

    @Test
    void verifyReturnsFalseWhenActivationRequestIdIsNull() {
        // GIVEN
        ActivationRequest request = ActivationRequestFixture.aPendingActivationRequest();
        request.setId(null);
        String hmac = request.getHmac();

        // WHEN-THEN
        assertThat(service.verify(request, hmac)).isFalse();
    }

    // ── generateActivReq ─────────────────────────────────────────────────────

    @Test
    void generateActivReqReturnsPendingActivationRequestWithEncodedHmac() {
        try (
                MockedStatic<MachineUtility> machineUtility = mockStatic(MachineUtility.class);
                MockedStatic<HmacUtility> hmacUtility = mockStatic(HmacUtility.class)
        ) {
            // GIVEN
            String machineId = "machine-id";
            String hmac = "Aymga2vvpFZQm0JzWqV8K7zP0K0mTQ5l0V7i4S3n8XQ=";

            machineUtility.when(MachineUtility::getStringForHmacEncode)
                    .thenReturn(machineId);

            hmacUtility.when(() -> HmacUtility.encode(anyString()))
                    .thenReturn(hmac);

            // WHEN
            ActivationRequest result = service.generateActivReq();

            // THEN
            assertThat(result.getId()).isNotBlank();
            assertThat(result.getCreatedAt()).isNotNull();
            assertThat(result.getStatus()).isEqualTo(ActivReqStatus.PENDING);
            assertThat(result.getTtl()).isEqualTo(3600);
            assertThat(result.isActive()).isFalse();
            assertThat(result.getHmac()).isEqualTo(hmac);

            hmacUtility.verify(() -> HmacUtility.encode(result.getId() + machineId));
        }
    }

    // ── activateTTL ──────────────────────────────────────────────────────────

    @Test
    void activateTTLSchedulesExpirationUpdateWhenActivationRequestTtlElapses() {
        ReflectionTestUtils.setField(service, "scheduler", scheduler);

        // GIVEN
        ActivationRequest request = ActivationRequestFixture.aPendingActivationRequest();
        String id = request.getId();
        long ttl = request.getTtl();

        // WHEN
        service.activateTTL(request);

        // THEN
        ArgumentCaptor<Runnable> runnableCaptor = ArgumentCaptor.forClass(Runnable.class);
        verify(scheduler).schedule(runnableCaptor.capture(), eq(ttl), eq(TimeUnit.SECONDS));

        runnableCaptor.getValue().run();

        verify(repository).updateStatusIfNotProcessed(
                id,
                ActivReqStatus.EXPIRED,
                ActivReqStatus.PROCESSED
        );
    }

    // ── deactivateAll ────────────────────────────────────────────────────────

    @Test
    void deactivateAllExpiresAndDeactivatesAllActivationRequests() {
        // WHEN
        service.deactivateAll();

        // THEN
        verify(repository).expireAllActivationRequests();
        verify(repository).deactivateAll();
    }

    // ── getActiveAR ──────────────────────────────────────────────────────────

    @Test
    void getActiveARReturnsActivationRequestWhenRepositoryContainsActiveEntry() {
        // GIVEN
        ActivationRequest request = ActivationRequestFixture.aProcessedActivationRequest();

        when(repository.findActiveAR())
                .thenReturn(Optional.of(request));

        // WHEN
        ActivationRequest result = service.getActiveAR();

        // THEN
        assertThat(result).isSameAs(request);
    }

    @Test
    void getActiveARReturnsNullWhenRepositoryDoesNotContainActiveEntry() {
        // GIVEN
        when(repository.findActiveAR())
                .thenReturn(Optional.empty());

        // WHEN-THEN
        assertThat(service.getActiveAR()).isNull();
    }

    // ── createFile ───────────────────────────────────────────────────────────

    @Test
    void createFileWritesActivationRequestContentToTempFile() throws Exception {
        // WHEN
        File file = service.createFile("activation-request-content", "activation-request");

        try {
            // THEN
            assertThat(file).exists().isFile();
            assertThat(Files.readString(file.toPath())).isEqualTo("activation-request-content");
        } finally {
            Files.deleteIfExists(file.toPath());
        }
    }

    // ── findByHmac ───────────────────────────────────────────────────────────

    @Test
    void findByHmacReturnsActivationRequestWhenRepositoryContainsMatch() {
        // GIVEN
        ActivationRequest request = ActivationRequestFixture.aPendingActivationRequest();
        String hmac = request.getHmac();

        when(repository.findFirstByHmac(hmac))
                .thenReturn(Optional.of(request));

        // WHEN
        ActivationRequest result = service.findByHmac(hmac);

        // THEN
        assertThat(result).isSameAs(request);
    }

    @Test
    void findByHmacThrowsRuntimeExceptionWhenRepositoryDoesNotContainMatch() {
        // GIVEN
        String hmac = "hmac-nonexisting";

        when(repository.findFirstByHmac(hmac))
                .thenReturn(Optional.empty());

        // WHEN-THEN
        assertThatThrownBy(() -> service.findByHmac(hmac))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Activation Request not found by hmac: " + hmac);
    }

    // ── readFreeAR ───────────────────────────────────────────────────────────

    @Test
    void readFreeARReturnsDecodedActivationRequestWhenDefaultPayloadIsValid() {
        // WHEN
        Optional<ActivationRequest> result = service.readFreeAR();

        // THEN
        assertThat(result).isPresent();

        ActivationRequest request = result.get();

        assertThat(request.getId()).isNotBlank();
        assertThat(request.getHmac()).isNotBlank();
        assertThat(request.getTtl()).isEqualTo(3600);
        assertThat(request.getStatus()).isEqualTo(ActivReqStatus.PENDING);

        assertThat(request.getMachineUuid()).isNotBlank();
        assertThat(request.getMacAddress()).isNotBlank();
        assertThat(request.getSystemUUID()).isNotBlank();
        assertThat(request.getComputerName()).isNotBlank();
    }

    // ── findById ─────────────────────────────────────────────────────────────

    @Test
    void findByIdReturnsActivationRequestWhenRepositoryContainsId() {
        // GIVEN
        ActivationRequest request = ActivationRequestFixture.aPendingActivationRequest();
        String id = request.getId();

        when(repository.findById(id))
                .thenReturn(Optional.of(request));

        // WHEN-THEN
        assertThat(service.findById(id)).containsSame(request);
    }

    @Test
    void findByIdReturnsEmptyWhenRepositoryDoesNotContainId() {
        // GIVEN
        String id = "nonexisting-id";

        when(repository.findById(id))
                .thenReturn(Optional.empty());

        // WHEN-THEN
        assertThat(service.findById(id)).isEmpty();
    }

    // ── decodeBase64AR ───────────────────────────────────────────────────────

    @Test
    void decodeBase64ARReturnsActivationRequestWhenPayloadIsValid() throws Exception {
        // GIVEN
        ActivationRequest request = ActivationRequestFixture.aPendingActivationRequest();

        String id = request.getId();
        String hmac = request.getHmac();
        String machineUUID = "machine-uuid";
        String macAddress = "mac-address";
        String systemUUID = "system-uuid";
        String computerName = "computer-name";

        request.setMachineUuid(machineUUID);
        request.setMacAddress(macAddress);
        request.setSystemUUID(systemUUID);
        request.setComputerName(computerName);

        byte[] json = new ObjectMapper().writeValueAsBytes(request);
        String encoded = Base64.getEncoder().encodeToString(json);

        // WHEN
        ActivationRequest result = service.decodeBase64AR(encoded);

        // THEN
        assertThat(result.getId()).isEqualTo(id);
        assertThat(result.getHmac()).isEqualTo(hmac);
        assertThat(result.getTtl()).isEqualTo(3600);
        assertThat(result.getStatus()).isEqualTo(ActivReqStatus.PENDING);
        assertThat(result.getMachineUuid()).isEqualTo(machineUUID);
        assertThat(result.getMacAddress()).isEqualTo(macAddress);
        assertThat(result.getSystemUUID()).isEqualTo(systemUUID);
        assertThat(result.getComputerName()).isEqualTo(computerName);
    }

    @Test
    void decodeBase64ARThrowsIllegalArgumentExceptionWhenPayloadIsNotBase64() {
        // GIVEN
        String payload = "not-base64";

        // WHEN-THEN
        assertThatThrownBy(() -> service.decodeBase64AR(payload))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void decodeBase64ARThrowsIOExceptionWhenDecodedPayloadIsNotJson() {
        // GIVEN
        String encoded = Base64.getEncoder()
                .encodeToString("not-json".getBytes(StandardCharsets.UTF_8));

        // WHEN-THEN
        assertThatThrownBy(() -> service.decodeBase64AR(encoded))
                .isInstanceOf(Exception.class);
    }
}
