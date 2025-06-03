package com.becon.opencelium.backend.execution.logger.parser;

import com.becon.opencelium.backend.execution.logger.service.LogStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FlexiblePatternLogParserTest {

    @Mock
    private LogStorageService logStorageService;
    @InjectMocks
    private FlexiblePatternLogParser parser;


    private static final String LINE_1 = "03-06-2025 12:37:44.744 - phase=EXECUTION_START id=238 connectionId=88";
    private static final String LINE_2 = "03-06-2025 12:37:44.745 - phase=FLOWCHART_START fchartId=e68e9658-2fc0-4370-8d6d-0d57bbebc0af connectorId=1";
    private static final String LINE_3 = "03-06-2025 12:37:44.746 - phase=OPERATION_START indexPath=0 name=\"GetAllUser\"";
    private static final String LINE_4 = "03-06-2025 12:37:44.766 - segment=REQUEST url=\"http://localhost:8081/api/json/user/all\" http_method=GET";
    private static final String LINE_5_1 = "03-06-2025 12:37:44.775 - segment=REQUEST_HEADER data={";
    private static final String LINE_5_2 = "\"Authorization\" : [ \"Basic YWRtaW46MTIzNA==\" ]";
    private static final String LINE_5_3 = "}";
    private static final String LINE_6 = "03-06-2025 12:37:44.913 - segment=RESPONSE status=200 duration=137ms";
    private static final String LINE_7_1 = "03-06-2025 12:37:44.915 - segment=RESPONSE_HEADER data={";
    private static final String LINE_7_2 = "\"Cache-Control\" : [ \"no-cache, no-store, max-age=0, must-revalidate\" ],";
    private static final String LINE_7_3 = "}";

    static Stream<Arguments> lines() {
        return Stream.of(
                Arguments.of(LINE_1, true),
                Arguments.of(LINE_2, true),
                Arguments.of(LINE_3, true),
                Arguments.of(LINE_4, true),
                Arguments.of(LINE_5_1, true),
                Arguments.of(LINE_5_2, false),
                Arguments.of(LINE_5_3, false),
                Arguments.of(LINE_6, true),
                Arguments.of(LINE_7_1, true),
                Arguments.of(LINE_7_2, false),
                Arguments.of(LINE_7_3, false)
        );
    }


    // public boolean supports(String line)
    @ParameterizedTest
    @MethodSource("lines")
    void readSingleLines(String line, boolean expected) {
        boolean result = parser.supports(line);

        assertEquals(expected, result);
    }


    // public List<String> readLines(String executionId, long startOffset, long endOffset)
    @Test
    void readSingleLines() {
        List<String> block = List.of(
                LINE_1,
                LINE_2,
                LINE_3,
                LINE_4
        );

        when(logStorageService.readBlock("executionId", 0, 4)).thenReturn(block);

        // read single lines
        List<String> result = parser.readLines("executionId", 0, 4);

        // assert there are 4 lines
        assertEquals(4, result.size());

        // assert content of each line
        assertEquals(LINE_1, result.get(0));
        assertEquals(LINE_2, result.get(1));
        assertEquals(LINE_3, result.get(2));
        assertEquals(LINE_4, result.get(3));
    }

    @Test
    void readSingleAndMultiLines() {
        List<String> block = List.of(
                LINE_4,
                LINE_5_1, LINE_5_2, LINE_5_3,
                LINE_6,
                LINE_7_1, LINE_7_2, LINE_7_3
        );

        when(logStorageService.readBlock("executionId", 0, 4)).thenReturn(block);

        // read single lines
        List<String> result = parser.readLines("executionId", 0, 4);

        // assert there are 4 lines
        assertEquals(4, result.size());

        // assert content of each line
        assertEquals(LINE_4, result.get(0));

        assertTrue(result.get(1).contains(LINE_5_1));
        assertTrue(result.get(1).contains(LINE_5_2));
        assertTrue(result.get(1).contains(LINE_5_3));

        assertEquals(LINE_6, result.get(2));

        assertTrue(result.get(3).contains(LINE_7_1));
        assertTrue(result.get(3).contains(LINE_7_2));
        assertTrue(result.get(3).contains(LINE_7_3));
    }

    @Test
    void readSingleAndPartialLines() {
        List<String> block = List.of(
                LINE_5_3,
                LINE_6,
                LINE_7_1
        );

        when(logStorageService.readBlock("executionId", 0, 4)).thenReturn(block);

        // read single lines
        List<String> result = parser.readLines("executionId", 0, 4);

        // assert there are 4 lines
        assertEquals(3, result.size());

        // assert content of each line
        assertEquals(LINE_5_3, result.get(0));
        assertEquals(LINE_6, result.get(1));
        assertEquals(LINE_7_1, result.get(2));
    }

    @Test
    void readPartialLines() {
        List<String> block = List.of(
                LINE_5_2, LINE_5_3
        );

        when(logStorageService.readBlock("executionId", 0, 4)).thenReturn(block);

        // read single lines
        List<String> result = parser.readLines("executionId", 0, 4);

        // assert there are 4 lines
        assertEquals(1, result.size());

        // assert content of each line
        assertTrue(result.get(0).contains(LINE_5_2));
        assertTrue(result.get(0).contains(LINE_5_3));
    }

    @Test
    void readEmptyFile() {
        List<String> block = new ArrayList<>();

        when(logStorageService.readBlock("executionId", 0, 4)).thenReturn(block);

        // read single lines
        List<String> result = parser.readLines("executionId", 0, 4);

        // assert there are 4 lines
        assertEquals(0, result.size());
    }
}