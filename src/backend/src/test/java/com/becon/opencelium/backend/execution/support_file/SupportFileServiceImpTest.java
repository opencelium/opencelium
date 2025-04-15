package com.becon.opencelium.backend.execution.support_file;

import com.becon.opencelium.backend.utility.LogFileUtility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.DirectoryStream;
import java.nio.file.FileSystem;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.spi.FileSystemProvider;
import java.util.Iterator;

import static org.mockito.Mockito.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SupportFileServiceImpTest {

    @InjectMocks
    private SupportFileServiceImp supportFileService;


    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(supportFileService, "successFileLimit", 2);
        ReflectionTestUtils.setField(supportFileService, "failFileLimit", 3);
    }

    @Test
    void enforceLimit_shouldDeleteOldestFileBasedOnName() throws Exception {
        // Create mock Path files for failed execution:
        Path path1 = mock(Path.class, RETURNS_DEEP_STUBS);
        Path path2 = mock(Path.class, RETURNS_DEEP_STUBS);
        Path path3 = mock(Path.class, RETURNS_DEEP_STUBS);
        Path path4 = mock(Path.class, RETURNS_DEEP_STUBS);


        // mock getting files list of a path in SupportFileServiceImp::enforceLimit:
        Path mockBasePath = mock(Path.class);

        FileSystem mockFileSystem = mock(FileSystem.class);
        FileSystemProvider mockFileSystemProvider = mock(FileSystemProvider.class);
        when(mockBasePath.getFileSystem()).thenReturn(mockFileSystem);
        when(mockFileSystem.provider()).thenReturn(mockFileSystemProvider);

        DirectoryStream<Path> mockDirectoryStream = mock(DirectoryStream.class);
        Iterator<Path> mockIterator = mock(Iterator.class);

        when(mockDirectoryStream.iterator()).thenReturn(mockIterator);
        when(mockIterator.hasNext()).thenReturn(true, true, true, true, false);
        when(mockIterator.next()).thenReturn(path1, path2, path3, path4);

        when(Files.newDirectoryStream(mockBasePath)).thenReturn(mockDirectoryStream);


        // set return type to be used in SupportFileServiceImp::enforceLimit:
        when(Files.isRegularFile(path1)).thenReturn(true);
        when(path1.getFileName()).thenReturn(Path.of("9_e_support_1741014001.zip")); // Oldest - should be deleted

        when(Files.isRegularFile(path2)).thenReturn(true);
        when(path2.getFileName()).thenReturn(Path.of("9_e_support_1741014002.zip"));

        when(Files.isRegularFile(path3)).thenReturn(true);
        when(path3.getFileName()).thenReturn(Path.of("9_e_support_1741014003.zip"));

        when(Files.isRegularFile(path4)).thenReturn(true);
        when(path4.getFileName()).thenReturn(Path.of("9_e_support_1741014004.zip")); // Newest


        // LogFileUtility::delete method should be called only once on path1:
        try (MockedStatic<LogFileUtility> utility = mockStatic(LogFileUtility.class)) {
            ReflectionTestUtils.invokeMethod(supportFileService, "enforceLimit", mockBasePath, "9_e_support", 3);

            utility.verify(() -> LogFileUtility.delete(path1), times(1)); // Oldest file is deleted
            utility.verify(() -> LogFileUtility.delete(path2), times(0));
            utility.verify(() -> LogFileUtility.delete(path3), times(0));
            utility.verify(() -> LogFileUtility.delete(path4), times(0));
        }
    }
}
