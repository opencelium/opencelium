package com.becon.opencelium.backend.execution.log_managing;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.log_managing.core.ExecutionContextManager;
import com.becon.opencelium.backend.execution.log_managing.core.LogLineParser;
import com.becon.opencelium.backend.execution.log_managing.parsers.*;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

public class LogFullLifeCycleUnitTest {
    private final String EXECUTION_START_LOG = "scope=EXECUTION_START id=exec-001 connectionId=12 flowchartId=flow-001";

    private final String IF_START_LOG = "scope=IF_START indexPath=0 expression=\"{x} == 'x'\"";
    private final String IF_RESULT_LOG = "section=IF_RESULT result=true";

    private final String LOOP_START_LOG = "scope=LOOP_START indexPath=1 type=loop loopIterator=i expression=\"$.arr[*]\" loopCount=3";

    private final String METHOD_START_LOG1 = "scope=METHOD_START indexPath=2 function=GetUser loopIndex=0";
    private final String REQUEST_LOG1 = "section=REQUEST url=http://localhost:9090 httpMethod=GET";
    private final String REQUEST_HEADER_LOG1 = "section=REQUEST_HEADER data={\"Content-Type\":\"application/json\"}";
    private final String REQUEST_PAYLOAD_LOG1 = "section=REQUEST_PAYLOAD data={\"user\":\"john\",\"age\":30}";
    private final String RESPONSE_LOG1 = "section=RESPONSE status=200 responseTime=20";
    private final String RESPONSE_HEADER_LOG1 = "section=RESPONSE_HEADER data={\"Content-Type\":\"application/json\"}";
    private final String RESPONSE_PAYLOAD_LOG1 = "section=RESPONSE_PAYLOAD data={\"name\":\"John Doe\",\"id\":123}";
    private final String METHOD_END_LOG1 = "scope=METHOD_END indexPath=2";

    private final String METHOD_START_LOG2 = "scope=METHOD_START indexPath=2 function=GetUser loopIndex=1";
    private final String REQUEST_LOG2 = "section=REQUEST url=http://localhost:9090 httpMethod=GET";
    private final String REQUEST_HEADER_LOG2 = "section=REQUEST_HEADER data={\"Content-Type\":\"application/json\"}";
    private final String REQUEST_PAYLOAD_LOG2 = "section=REQUEST_PAYLOAD data={\"user\":\"john\",\"age\":30}";
    private final String RESPONSE_LOG2 = "section=RESPONSE status=200 responseTime=20";
    private final String RESPONSE_HEADER_LOG2 = "section=RESPONSE_HEADER data={\"Content-Type\":\"application/json\"}";
    private final String RESPONSE_PAYLOAD_LOG2 = "section=RESPONSE_PAYLOAD data={\"name\":\"John Doe\",\"id\":123}";
    private final String METHOD_END_LOG2 = "scope=METHOD_END indexPath=2";

    private final String METHOD_START_LOG3 = "scope=METHOD_START indexPath=2 function=GetUser loopIndex=2";
    private final String REQUEST_LOG3 = "section=REQUEST url=http://localhost:9090 httpMethod=GET";
    private final String REQUEST_HEADER_LOG3 = "section=REQUEST_HEADER data={\"Content-Type\":\"application/json\"}";
    private final String REQUEST_PAYLOAD_LOG3 = "section=REQUEST_PAYLOAD data={\"user\":\"john\",\"age\":30}";
    private final String RESPONSE_LOG3 = "section=RESPONSE status=200 responseTime=20";
    private final String RESPONSE_HEADER_LOG3 = "section=RESPONSE_HEADER data={\"Content-Type\":\"application/json\"}";
    private final String RESPONSE_PAYLOAD_LOG3 = "section=RESPONSE_PAYLOAD data={\"name\":\"John Doe\",\"id\":123}";
    private final String METHOD_END_LOG3 = "scope=METHOD_END indexPath=2";

    private final String LOOP_END_LOG = "scope=LOOP_END indexPath=1";

    private final String IF_END_LOG = "scope=IF_END indexPath=0";

    private final String EXECUTION_END_LOG = "scope=EXECUTION_END id=exec-001";

    private final ExecutionContextManager executionContextManager = new SimpleExecutionContextManager();

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
    public void testFullLifeCycle() {
        executionContextManager.track("exec-001", executionStartParser.parse(EXECUTION_START_LOG));

        executionContextManager.track("exec-001", ifStartParser.parse(IF_START_LOG));
        executionContextManager.track("exec-001", ifResultParser.parse(IF_RESULT_LOG));

        executionContextManager.track("exec-001", loopStartParser.parse(LOOP_START_LOG));

        executionContextManager.track("exec-001", methodStartParser.parse(METHOD_START_LOG1));
        executionContextManager.track("exec-001", requestParser.parse(REQUEST_LOG1));
        executionContextManager.track("exec-001", requestHeaderParser.parse(REQUEST_HEADER_LOG1));
        executionContextManager.track("exec-001", requestPayloadParser.parse(REQUEST_PAYLOAD_LOG1));
        executionContextManager.track("exec-001", responseParser.parse(RESPONSE_LOG1));
        executionContextManager.track("exec-001", responseHeaderParser.parse(RESPONSE_HEADER_LOG1));
        executionContextManager.track("exec-001", responsePayloadParser.parse(RESPONSE_PAYLOAD_LOG1));
        LogMetaData methodMeta1 = executionContextManager.track("exec-001", methodEndParser.parse(METHOD_END_LOG1)).get();

        executionContextManager.track("exec-001", methodStartParser.parse(METHOD_START_LOG2));
        executionContextManager.track("exec-001", requestParser.parse(REQUEST_LOG2));
        executionContextManager.track("exec-001", requestHeaderParser.parse(REQUEST_HEADER_LOG2));
        executionContextManager.track("exec-001", requestPayloadParser.parse(REQUEST_PAYLOAD_LOG2));
        executionContextManager.track("exec-001", responseParser.parse(RESPONSE_LOG2));
        executionContextManager.track("exec-001", responseHeaderParser.parse(RESPONSE_HEADER_LOG2));
        executionContextManager.track("exec-001", responsePayloadParser.parse(RESPONSE_PAYLOAD_LOG2));
        LogMetaData methodMeta2 = executionContextManager.track("exec-001", methodEndParser.parse(METHOD_END_LOG2)).get();

        executionContextManager.track("exec-001", methodStartParser.parse(METHOD_START_LOG3));
        executionContextManager.track("exec-001", requestParser.parse(REQUEST_LOG3));
        executionContextManager.track("exec-001", requestHeaderParser.parse(REQUEST_HEADER_LOG3));
        executionContextManager.track("exec-001", requestPayloadParser.parse(REQUEST_PAYLOAD_LOG3));
        executionContextManager.track("exec-001", responseParser.parse(RESPONSE_LOG3));
        executionContextManager.track("exec-001", responseHeaderParser.parse(RESPONSE_HEADER_LOG3));
        executionContextManager.track("exec-001", responsePayloadParser.parse(RESPONSE_PAYLOAD_LOG3));
        LogMetaData methodMeta3 = executionContextManager.track("exec-001", methodEndParser.parse(METHOD_END_LOG3)).get();

        LogMetaData loopMeta = executionContextManager.track("exec-001", loopEndParser.parse(LOOP_END_LOG)).get();

        LogMetaData ifMeta = executionContextManager.track("exec-001", ifEndParser.parse(IF_END_LOG)).get();

        executionContextManager.track("exec-001", executionEndParser.parse(EXECUTION_END_LOG));

        // ========== ASSERT methodMeta1 ==========
        assertNull(methodMeta1.getId());
        assertEquals("exec-001", methodMeta1.getExecutionId());
        assertEquals("12", methodMeta1.getConnectionId());
        assertEquals("flow-001", methodMeta1.getFlowchartId());
        assertEquals("method", methodMeta1.getType());
        assertEquals("2", methodMeta1.getIndexPath());
        assertEquals("1", methodMeta1.getParentPath());
        assertEquals("GET", methodMeta1.getMeta().get("httpMethod"));
        assertEquals(0, methodMeta1.getMeta().get("loopIndex"));
        assertEquals("http://localhost:9090", methodMeta1.getMeta().get("url"));
        assertEquals(20, methodMeta1.getMeta().get("responseTime"));
        assertEquals("GetUser", methodMeta1.getMeta().get("function"));
        assertEquals(200, methodMeta1.getMeta().get("status"));

        // ========== ASSERT methodMeta2 ==========
        assertNull(methodMeta2.getId());
        assertEquals("exec-001", methodMeta2.getExecutionId());
        assertEquals("12", methodMeta2.getConnectionId());
        assertEquals("flow-001", methodMeta2.getFlowchartId());
        assertEquals("method", methodMeta2.getType());
        assertEquals("2", methodMeta2.getIndexPath());
        assertEquals("1", methodMeta2.getParentPath());
        assertEquals("GET", methodMeta2.getMeta().get("httpMethod"));
        assertEquals(1, methodMeta2.getMeta().get("loopIndex"));
        assertEquals("http://localhost:9090", methodMeta2.getMeta().get("url"));
        assertEquals(20, methodMeta2.getMeta().get("responseTime"));
        assertEquals("GetUser", methodMeta2.getMeta().get("function"));
        assertEquals(200, methodMeta2.getMeta().get("status"));

        // ========== ASSERT methodMeta3 ==========
        assertNull(methodMeta3.getId());
        assertEquals("exec-001", methodMeta3.getExecutionId());
        assertEquals("12", methodMeta3.getConnectionId());
        assertEquals("flow-001", methodMeta3.getFlowchartId());
        assertEquals("method", methodMeta3.getType());
        assertEquals("2", methodMeta3.getIndexPath());
        assertEquals("1", methodMeta3.getParentPath());
        assertEquals("GET", methodMeta3.getMeta().get("httpMethod"));
        assertEquals(2, methodMeta3.getMeta().get("loopIndex"));
        assertEquals("http://localhost:9090", methodMeta3.getMeta().get("url"));
        assertEquals(20, methodMeta3.getMeta().get("responseTime"));
        assertEquals("GetUser", methodMeta3.getMeta().get("function"));
        assertEquals(200, methodMeta3.getMeta().get("status"));

        // ========== ASSERT loopMeta ==========
        assertNull(loopMeta.getId());
        assertEquals("exec-001", loopMeta.getExecutionId());
        assertEquals("12", loopMeta.getConnectionId());
        assertEquals("flow-001", loopMeta.getFlowchartId());
        assertEquals("loop", loopMeta.getType());
        assertEquals("1", loopMeta.getIndexPath());
        assertEquals("0", loopMeta.getParentPath());
        assertEquals("i", loopMeta.getMeta().get("loopIterator"));
        assertEquals("$.arr[*]", loopMeta.getMeta().get("expression"));
        assertEquals(3, loopMeta.getMeta().get("loopCount"));
        assertEquals("loop", loopMeta.getMeta().get("type"));

        // ========== ASSERT ifMeta ==========
        assertNull(ifMeta.getId());
        assertEquals("exec-001", ifMeta.getExecutionId());
        assertEquals("12", ifMeta.getConnectionId());
        assertEquals("flow-001", ifMeta.getFlowchartId());
        assertEquals("if", ifMeta.getType());
        assertEquals("0", ifMeta.getIndexPath());
        assertNull(ifMeta.getParentPath());
        assertEquals(true, ifMeta.getMeta().get("result"));
        assertEquals("{x} == 'x'", ifMeta.getMeta().get("expression"));
    }

}
