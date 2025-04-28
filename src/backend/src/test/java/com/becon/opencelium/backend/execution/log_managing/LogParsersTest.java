package com.becon.opencelium.backend.execution.log_managing;

import com.becon.opencelium.backend.execution.log_managing.commons.LogConstants;
import com.becon.opencelium.backend.execution.log_managing.commons.LogEntryType;
import com.becon.opencelium.backend.execution.log_managing.commons.LogProcessingException;
import com.becon.opencelium.backend.execution.log_managing.core.LogLineParser;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;
import com.becon.opencelium.backend.execution.log_managing.parsers.*;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class LogParsersTest {
    private final LogLineParser executionStartParser = new ExecutionStartParser();
    private final LogLineParser executionEndParser = new ExecutionEndParser();
    private final LogLineParser ifStartParser = new IfStartParser();
    private final LogLineParser ifResultParser = new IfResultParser();
    private final LogLineParser ifEndParser = new IfEndParser();
    private final LogLineParser loopStartParser = new LoopStartParser();
    private final LogLineParser loopEndParser = new LoopEndParser();
    private final LogLineParser methodStartParser = new MethodStartParser();
    private final LogLineParser methodEndParser = new MethodEndParser();
    private final LogLineParser requestParser = new RequestParser();
    private final LogLineParser requestHeaderParser = new RequestHeaderParser();
    private final LogLineParser requestPayloadParser = new RequestPayloadParser();
    private final LogLineParser responseParser = new ResponseParser();
    private final LogLineParser responseHeaderParser = new ResponseHeaderParser();
    private final LogLineParser responsePayloadParser = new ResponsePayloadParser();

    @Test
    public void testExecutionStartParserOnSuccess() {
        String line = "2025-04-11T10:42:31.123Z scope=EXECUTION_START id=exec-001 connectionId=12 flowchartId=flow-001";
        assertEquals(Boolean.TRUE, executionStartParser.supports(line));

        ParsedLogLine parsed = assertDoesNotThrow(() -> executionStartParser.parse(line));

        assertEquals(LogEntryType.EXECUTION_START, parsed.getEntryType());
        assertEquals(line.getBytes().length, parsed.getSize());
        assertNotNull(parsed.getProperties().get(LogConstants.FLOWCHART_ID));
        assertNotNull(parsed.getProperties().get(LogConstants.CONNECTION_ID));

        assertEquals("flow-001", parsed.getProperties().get(LogConstants.FLOWCHART_ID));
        assertEquals("12", parsed.getProperties().get(LogConstants.CONNECTION_ID));
    }

    @Test
    public void testExecutionStartParserOnFailure() {
        assertEquals(Boolean.FALSE, executionStartParser.supports("2025-04-11T10:42:31.123Z scope=EXECUTION_END"));

        assertThrows(LogProcessingException.class, () -> executionStartParser.parse("scope=EXECUTION_START connectionId=12 flowchartId=flow-001"));
        assertThrows(LogProcessingException.class, () -> executionStartParser.parse("scope=EXECUTION_START id=exec-001 flowchartId=flow-001"));
        assertThrows(LogProcessingException.class, () -> executionStartParser.parse("scope=EXECUTION_START id=exec-001 connectionId=12"));
    }

    @Test
    public void testExecutionEndParserOnSuccess() {
        String line = "2025-04-11T10:42:31.123Z scope=EXECUTION_END id=exec-001";
        assertEquals(Boolean.TRUE, executionEndParser.supports(line));

        ParsedLogLine parsed = assertDoesNotThrow(() -> executionEndParser.parse(line));

        assertEquals(LogEntryType.EXECUTION_END, parsed.getEntryType());
    }

    @Test
    public void testExecutionEndParserOnFailure() {
        assertEquals(Boolean.FALSE, executionEndParser.supports("2025-04-11T10:42:31.123Z scope=EXECUTION_START"));

        assertThrows(LogProcessingException.class, () -> executionEndParser.parse("scope=EXECUTION_END connectionId=12"));
    }

    @Test
    public void testIfStartParserOnSuccess() {
        String line = "2025-04-11T10:42:31.123Z scope=IF_START indexPath=1 expression=\"{x} == 'x'\"";
        assertEquals(Boolean.TRUE, ifStartParser.supports(line));

        ParsedLogLine parsed = assertDoesNotThrow(() -> ifStartParser.parse(line));

        assertEquals(LogEntryType.IF_START, parsed.getEntryType());
        assertEquals("1", parsed.getIndexPath());

        assertNotNull(parsed.getProperties().get(LogConstants.EXPRESSION));
        assertEquals("{x} == 'x'", parsed.getProperties().get(LogConstants.EXPRESSION));
    }

    @Test
    public void testIfStartParserOnFailure() {
        assertEquals(Boolean.FALSE, ifStartParser.supports("2025-04-11T10:42:31.123Z scope=IF_END"));

        assertThrows(LogProcessingException.class, () -> ifStartParser.parse("scope=IF_START expression=\"$.a == 'x'\""));
        assertThrows(LogProcessingException.class, () -> ifStartParser.parse("scope=IF_START indexPath=1"));
    }

    @Test
    public void testIfResultParserOnSuccess() {
        String line = "2025-04-11T10:42:31.123Z section=IF_RESULT expression=\"$.a == 'x'\" result=true";
        assertEquals(Boolean.TRUE, ifResultParser.supports(line));

        ParsedLogLine parsed = assertDoesNotThrow(() -> ifResultParser.parse(line));

        assertEquals(LogEntryType.IF_RESULT, parsed.getEntryType());
        assertEquals(line.getBytes().length, parsed.getSize());
        assertNotNull(parsed.getProperties().get(LogConstants.EXPRESSION));
        assertNotNull(parsed.getProperties().get(LogConstants.RESULT));
        assertEquals("$.a == 'x'", parsed.getProperties().get(LogConstants.EXPRESSION));
        assertEquals("true", parsed.getProperties().get(LogConstants.RESULT));
    }

    @Test
    public void testIfResultParserOnFailure() {
        assertEquals(Boolean.FALSE, ifResultParser.supports("2025-04-11T10:42:31.123Z scope=IF_START"));

        assertThrows(LogProcessingException.class, () -> ifResultParser.parse("section=IF_RESULT expression=$.a == 'x'"));
        assertThrows(LogProcessingException.class, () -> ifResultParser.parse("section=IF_RESULT result=true"));
    }

    @Test
    public void testIfEndParserOnSuccess() {
        String line = "2025-04-11T10:42:31.123Z scope=IF_END indexPath=1";
        assertEquals(Boolean.TRUE, ifEndParser.supports(line));

        ParsedLogLine parsed = assertDoesNotThrow(() -> ifEndParser.parse(line));

        assertEquals(LogEntryType.IF_END, parsed.getEntryType());
        assertEquals(line.getBytes().length, parsed.getSize());
        assertEquals("1", parsed.getIndexPath());
    }

    @Test
    public void testIfEndParserOnFailure() {
        assertEquals(Boolean.FALSE, ifEndParser.supports("2025-04-11T10:42:31.123Z scope=IF_START"));

        assertThrows(LogProcessingException.class, () -> ifEndParser.parse("scope=IF_END"));
    }

    @Test
    public void testLoopStartParserOnSuccess() {
        String line = "2025-04-11T10:42:31.123Z scope=LOOP_START indexPath=0 type=loop loopIterator=i expression=\"$.arr[*]\"";
        assertEquals(Boolean.TRUE, loopStartParser.supports(line));

        ParsedLogLine parsed = assertDoesNotThrow(() -> loopStartParser.parse(line));

        assertEquals(LogEntryType.LOOP_START, parsed.getEntryType());

        assertNotNull(parsed.getProperties().get(LogConstants.TYPE));
        assertNotNull(parsed.getProperties().get(LogConstants.EXPRESSION));

        assertEquals("0", parsed.getIndexPath());
        assertEquals("loop", parsed.getProperties().get(LogConstants.TYPE));
        assertEquals("$.arr[*]", parsed.getProperties().get(LogConstants.EXPRESSION));
        assertEquals("i", parsed.getProperties().get(LogConstants.LOOP_ITERATOR));
    }

    @Test
    public void testLoopStartParserOnFailure() {
        assertEquals(Boolean.FALSE, loopStartParser.supports("2025-04-11T10:42:31.123Z scope=LOOP_END"));

        assertThrows(LogProcessingException.class, () -> loopStartParser.parse("scope=LOOP_START loopIterator=i type=loop expression=\"$.arr[*]\""));
        assertThrows(LogProcessingException.class, () -> loopStartParser.parse("scope=LOOP_START loopIterator=i indexPath=0 expression=\"$.arr[*]\""));
        assertThrows(LogProcessingException.class, () -> loopStartParser.parse("scope=LOOP_START loopIterator=i indexPath=0 type=loop"));
        assertThrows(LogProcessingException.class, () -> loopStartParser.parse("scope=LOOP_START indexPath=0 type=loop expression=\"$.arr[*]\""));
    }

    @Test
    public void testLoopEndParserOnSuccess() {
        String line = "2025-04-11T10:42:31.123Z scope=LOOP_END indexPath=0";
        assertEquals(Boolean.TRUE, loopEndParser.supports(line));

        ParsedLogLine parsed = assertDoesNotThrow(() -> loopEndParser.parse(line));

        assertEquals(LogEntryType.LOOP_END, parsed.getEntryType());
        assertEquals("0", parsed.getIndexPath());
    }

    @Test
    public void testLoopEndParserOnFailure() {
        assertEquals(Boolean.FALSE, loopEndParser.supports("2025-04-11T10:42:31.123Z scope=LOOP_START"));

        assertThrows(LogProcessingException.class, () -> loopEndParser.parse("scope=LOOP_END"));
    }

    @Test
    public void testMethodStartParserOnSuccess() {
        String line = "2025-04-11T10:42:31.123Z scope=METHOD_START indexPath=0_0 function=GetUser loopIndex=0";
        assertEquals(Boolean.TRUE, methodStartParser.supports(line));

        ParsedLogLine parsed = assertDoesNotThrow(() -> methodStartParser.parse(line));

        assertEquals(LogEntryType.METHOD_START, parsed.getEntryType());
        assertEquals(line.getBytes().length, parsed.getSize());
        assertNotNull(parsed.getProperties().get(LogConstants.FUNCTION));
        assertNotNull(parsed.getProperties().get(LogConstants.LOOP_INDEX));
        assertEquals("0_0", parsed.getIndexPath());
        assertEquals("GetUser", parsed.getProperties().get(LogConstants.FUNCTION));
        assertEquals(0, parsed.getProperties().get(LogConstants.LOOP_INDEX));
    }

    @Test
    public void testMethodStartParserOnFailure() {
        assertEquals(Boolean.FALSE, methodStartParser.supports("2025-04-11T10:42:31.123Z scope=METHOD_END"));

        assertThrows(LogProcessingException.class, () -> methodStartParser.parse("scope=METHOD_START function=GetUser"));
        assertThrows(LogProcessingException.class, () -> methodStartParser.parse("scope=METHOD_START indexPath=0_0"));
    }

    @Test
    public void testMethodEndParserOnSuccess() {
        String line = "2025-04-11T10:42:31.123Z scope=METHOD_END indexPath=0_0";
        assertEquals(Boolean.TRUE, methodEndParser.supports(line));

        ParsedLogLine parsed = assertDoesNotThrow(() -> methodEndParser.parse(line));

        assertEquals(LogEntryType.METHOD_END, parsed.getEntryType());
        assertEquals("0_0", parsed.getIndexPath());
    }

    @Test
    public void testMethodEndParserOnFailure() {
        assertEquals(Boolean.FALSE, methodEndParser.supports("2025-04-11T10:42:31.123Z scope=METHOD_START"));

        assertThrows(LogProcessingException.class, () -> methodEndParser.parse("scope=METHOD_END"));
    }

    @Test
    public void testRequestParserOnSuccess() {
        String line = "2025-04-11T10:42:31.123Z section=REQUEST url=http://localhost:9090 httpMethod=GET";
        assertEquals(Boolean.TRUE, requestParser.supports(line));

        ParsedLogLine parsed = assertDoesNotThrow(() -> requestParser.parse(line));

        assertEquals(LogEntryType.REQUEST, parsed.getEntryType());
        assertNotNull(parsed.getProperties().get(LogConstants.URL));
        assertNotNull(parsed.getProperties().get(LogConstants.HTTP_METHOD));
        assertEquals("http://localhost:9090", parsed.getProperties().get(LogConstants.URL));
        assertEquals("GET", parsed.getProperties().get(LogConstants.HTTP_METHOD));
    }

    @Test
    public void testRequestParserOnFailure() {
        assertEquals(Boolean.FALSE, requestParser.supports("2025-04-11T10:42:31.123Z section=RESPONSE"));

        assertThrows(LogProcessingException.class, () -> requestParser.parse("section=REQUEST httpMethod=GET"));
        assertThrows(LogProcessingException.class, () -> requestParser.parse("section=REQUEST url=http://localhost:9090"));
    }

    @Test
    public void testRequestHeaderParserOnSuccess() {
        String line = "2025-04-11T10:42:31.123Z section=REQUEST_HEADER data={\"Content-Type\":\"application/json\"}";
        assertEquals(Boolean.TRUE, requestHeaderParser.supports(line));

        ParsedLogLine parsed = assertDoesNotThrow(() -> requestHeaderParser.parse(line));

        assertEquals(LogEntryType.REQUEST_HEADER, parsed.getEntryType());
    }

    @Test
    public void testRequestHeaderParserOnFailure() {
        assertEquals(Boolean.FALSE, requestHeaderParser.supports("2025-04-11T10:42:31.123Z section=REQUEST"));

        assertThrows(LogProcessingException.class, () -> requestHeaderParser.parse("section=REQUEST_HEADER"));
    }

    @Test
    public void testRequestPayloadParserOnSuccess() {
        String line = "2025-04-11T10:42:31.123Z section=REQUEST_PAYLOAD data={\"user\":\"john\",\"age\":30}";
        assertEquals(Boolean.TRUE, requestPayloadParser.supports(line));

        ParsedLogLine parsed = assertDoesNotThrow(() -> requestPayloadParser.parse(line));

        assertEquals(LogEntryType.REQUEST_PAYLOAD, parsed.getEntryType());
    }

    @Test
    public void testRequestPayloadParserOnFailure() {
        assertEquals(Boolean.FALSE, requestPayloadParser.supports("2025-04-11T10:42:31.123Z section=REQUEST"));

        assertThrows(LogProcessingException.class, () -> requestPayloadParser.parse("section=REQUEST_PAYLOAD"));
    }

    @Test
    public void testResponseParserOnSuccess() {
        String line = "2025-04-11T10:42:31.123Z section=RESPONSE status=200 responseTime=20ms";
        assertEquals(Boolean.TRUE, responseParser.supports(line));

        ParsedLogLine parsed = assertDoesNotThrow(() -> responseParser.parse(line));

        assertEquals(LogEntryType.RESPONSE, parsed.getEntryType());
        assertNotNull(parsed.getProperties().get(LogConstants.STATUS));
        assertNotNull(parsed.getProperties().get(LogConstants.RESPONSE_TIME));
        assertEquals("200", parsed.getProperties().get(LogConstants.STATUS));
        assertEquals("20ms", parsed.getProperties().get(LogConstants.RESPONSE_TIME));
    }

    @Test
    public void testResponseParserOnFailure() {
        assertEquals(Boolean.FALSE, responseParser.supports("2025-04-11T10:42:31.123Z section=REQUEST"));

        assertThrows(LogProcessingException.class, () -> responseParser.parse("section=RESPONSE responseTime=20ms"));
        assertThrows(LogProcessingException.class, () -> responseParser.parse("section=RESPONSE status=200"));
    }

    @Test
    public void testResponseHeaderParserOnSuccess() {
        String line = "2025-04-11T10:42:31.123Z section=RESPONSE_HEADER data={\"Content-Type\":\"application/json\"}";
        assertEquals(Boolean.TRUE, responseHeaderParser.supports(line));

        ParsedLogLine parsed = assertDoesNotThrow(() -> responseHeaderParser.parse(line));

        assertEquals(LogEntryType.RESPONSE_HEADER, parsed.getEntryType());
    }

    @Test
    public void testResponseHeaderParserOnFailure() {
        assertEquals(Boolean.FALSE, responseHeaderParser.supports("2025-04-11T10:42:31.123Z section=RESPONSE"));

        assertThrows(LogProcessingException.class, () -> responseHeaderParser.parse("section=RESPONSE_HEADER"));
    }

    @Test
    public void testResponsePayloadParserWithJsonOnSuccess() {
        String line = "2025-04-11T10:42:31.123Z section=RESPONSE_PAYLOAD data={\"name\":\"John Doe\",\"id\":123}";
        assertEquals(Boolean.TRUE, responsePayloadParser.supports(line));

        ParsedLogLine parsed = assertDoesNotThrow(() -> responsePayloadParser.parse(line));

        assertEquals(LogEntryType.RESPONSE_PAYLOAD, parsed.getEntryType());
    }

    @Test
    public void testResponsePayloadParserOnFailure() {
        assertEquals(Boolean.FALSE, responsePayloadParser.supports("2025-04-11T10:42:31.123Z section=RESPONSE"));

        assertThrows(LogProcessingException.class, () -> responsePayloadParser.parse("section=RESPONSE_PAYLOAD"));
    }
}