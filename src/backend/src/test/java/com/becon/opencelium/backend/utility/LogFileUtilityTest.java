package com.becon.opencelium.backend.utility;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.test.context.SpringBootTest;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

@SpringBootTest
class LogFileUtilityTest {

    @Test
    void enforceLimit_shouldDeleteOldestFileBasedOnName() throws Exception {
        // create mock Path files for failed execution:
        Path basePath = mock(Path.class);
        Path path1 = mock(Path.class);
        Path path2 = mock(Path.class);
        Path path3 = mock(Path.class);

        try (
                MockedStatic<Files> filesMock = mockStatic(Files.class);
        ) {
            filesMock.when(() -> Files.list(any())).thenReturn(Stream.of(path1, path2, path3));
            filesMock.when(() -> Files.isRegularFile(any())).thenReturn(true);
            filesMock.when(() -> Files.exists(any())).thenReturn(true);
            filesMock.when(() -> Files.walkFileTree(any(), any())).thenReturn(null);

            // mock all files related method call:
            when(path1.getFileName()).thenReturn(Path.of("2025-01-01_10-00_1_f_1.log"));
            when(path2.getFileName()).thenReturn(Path.of("2025-02-01_10-00_1_f_2.log"));
            when(path3.getFileName()).thenReturn(Path.of("2025-03-01_10-00_1_f_3.log"));

            // call the method under test
            LogFileUtility.enforceLimit("base", 1L, "f", 2);

            // do verifications
            // oldest file should be deleted
            filesMock.verify(() -> Files.walkFileTree(eq(path1), any()), times(1));

            // newest files should remain
            filesMock.verify(() -> Files.walkFileTree(eq(path2), any()), never());
            filesMock.verify(() -> Files.walkFileTree(eq(path3), any()), never());
        }
    }
}