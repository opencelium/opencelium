package com.becon.opencelium.backend.unit.utility;

import com.becon.opencelium.backend.utility.MachineUtility;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.MockedStatic;

import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.CALLS_REAL_METHODS;
import static org.mockito.Mockito.mockStatic;

/**
 * Unit tests for {@link MachineUtility}.
 *
 * OS or runtime environment dependent, permissions required methods are not tests.
 *
 * No Spring context is loaded. No dependency is required to set up test class.
 * Run with: ./gradlew test
 */
@DisplayName("MachineUtility — unit")
class MachineUtilityTest {

    // ── getStringForHmacEncode ────────────────────────────────────────────────

    @Test
    void getStringForHmacEncodeReturnsConcatenatedValuesWhenAllIdentifiersPresent() {
        try (MockedStatic<MachineUtility> mocked = mockStatic(MachineUtility.class, CALLS_REAL_METHODS)) {
            // GIVEN
            String machineUuid = "UUID-1111";
            String macAddress = "AA-BB-CC-DD-EE-FF";
            String systemUUID = "SYS-2222";
            String computerName = "TestStation";

            mocked.when(MachineUtility::getMachineUUID)
                    .thenReturn(machineUuid);

            mocked.when(MachineUtility::getMacAddress)
                    .thenReturn(macAddress);

            mocked.when(MachineUtility::getSystemUuid)
                    .thenReturn(systemUUID);

            mocked.when(MachineUtility::getComputerName)
                    .thenReturn(computerName);

            // WHEN
            String result = MachineUtility.getStringForHmacEncode();

            // THEN
            assertThat(result)
                    .isEqualTo(machineUuid + macAddress + systemUUID + computerName);
        }
    }

    @ParameterizedTest
    @MethodSource("invalidIdentifierValues")
    void getStringForHmacEncodeThrowsIllegalArgumentExceptionWhenIdentifierMissing(
            String machineUuid, String macAddress, String systemUuid, String computerName, String expectedMessage
    ) {
        try (MockedStatic<MachineUtility> mocked = mockStatic(MachineUtility.class, CALLS_REAL_METHODS)) {
            // GIVEN
            mocked.when(MachineUtility::getMachineUUID)
                    .thenReturn(machineUuid);

            mocked.when(MachineUtility::getMacAddress)
                    .thenReturn(macAddress);

            mocked.when(MachineUtility::getSystemUuid)
                    .thenReturn(systemUuid);

            mocked.when(MachineUtility::getComputerName)
                    .thenReturn(computerName);

            // WHEN-THEN
            assertThatThrownBy(MachineUtility::getStringForHmacEncode)
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining(expectedMessage);
        }
    }

    private static Stream<Arguments> invalidIdentifierValues() {
        String machineUuid = "UUID-1111";
        String macAddress = "AA-BB-CC-DD-EE-FF";
        String systemUUID = "SYS-2222";
        String computerName = "TestStation";

        return Stream.of(
                Arguments.of(         "", macAddress, systemUUID, computerName, "Machine UUID is empty"),
                Arguments.of(machineUuid,       null, systemUUID, computerName, "MAC Address is empty"),
                Arguments.of(machineUuid, macAddress,         "", computerName, "System UUID is empty"),
                Arguments.of(machineUuid, macAddress, systemUUID,         null, "Computer Name is empty"));
    }
}
