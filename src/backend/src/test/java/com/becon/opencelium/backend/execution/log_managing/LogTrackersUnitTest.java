package com.becon.opencelium.backend.execution.log_managing;

import com.becon.opencelium.backend.database.mongodb.entity.LogMetaData;
import com.becon.opencelium.backend.execution.log_managing.commons.LogConstants;
import com.becon.opencelium.backend.execution.log_managing.core.LogElementTracker;
import com.becon.opencelium.backend.execution.log_managing.core.LogLineParser;
import com.becon.opencelium.backend.execution.log_managing.parsers.*;
import com.becon.opencelium.backend.execution.log_managing.trackers.IfTracker;
import com.becon.opencelium.backend.execution.log_managing.trackers.LoopTracker;
import com.becon.opencelium.backend.execution.log_managing.trackers.MethodTracker;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class LogTrackersUnitTest {

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
    public void testMethodOnSuccess() {
        LogElementTracker methodTracker = new MethodTracker();
        long startOffset = 0;

        methodTracker.onStart(methodStartParser.parse("2025-04-11T10:42:31.123Z scope=METHOD_START indexPath=0_0 function=GetUser loopIndex=0"), startOffset);

        methodTracker.onContent(requestParser.parse("2025-04-11T10:42:31.123Z section=REQUEST url=http://localhost:9090 httpMethod=GET"));
        methodTracker.onContent(requestHeaderParser.parse("2025-04-11T10:42:31.123Z section=REQUEST_HEADER data={\"Content-Type\":\"application/json\"}"));
        methodTracker.onContent(requestPayloadParser.parse("2025-04-11T10:42:31.123Z section=REQUEST_PAYLOAD data={\"user\":\"john\",\"age\":30}"));
        methodTracker.onContent(responseParser.parse("2025-04-11T10:42:31.123Z section=RESPONSE status=200 responseTime=20"));
        methodTracker.onContent(responseHeaderParser.parse("2025-04-11T10:42:31.123Z section=RESPONSE_HEADER data={\"Content-Type\":\"application/json\"}"));
        methodTracker.onContent(responsePayloadParser.parse("2025-04-11T10:42:31.123Z section=RESPONSE_PAYLOAD data={\"name\":\"John Doe\",\"id\":123}"));

        LogMetaData metaData = methodTracker.onEnd(methodEndParser.parse("2025-04-11T10:42:31.123Z scope=METHOD_END indexPath=0_0"));

        assertNotNull(metaData);
        assertEquals("0_0", metaData.getIndexPath());
        assertEquals("method", metaData.getType());
        assertEquals(startOffset, metaData.getStartOffset());

        Map<String, Object> meta = metaData.getMeta();
        assertNotNull(meta);

        assertEquals("GetUser", meta.get(LogConstants.FUNCTION));
        assertEquals(0, meta.get(LogConstants.LOOP_INDEX));

        assertEquals("http://localhost:9090", meta.get(LogConstants.URL));
        assertEquals("GET", meta.get(LogConstants.HTTP_METHOD));

        assertEquals(200, meta.get(LogConstants.STATUS));
        assertEquals(20, meta.get(LogConstants.RESPONSE_TIME));
    }

    @Test
    public void testLoopOnSuccess() {
        LogElementTracker loopTracker = new LoopTracker();
        long startOffset = 0;

        loopTracker.onStart(loopStartParser.parse("2025-04-11T10:42:31.123Z scope=LOOP_START indexPath=0 type=loop loopIterator=i expression=\"$.arr[*]\" loopCount=3"), startOffset);
        LogMetaData metaData = loopTracker.onEnd(loopEndParser.parse("2025-04-11T10:42:31.123Z scope=LOOP_END indexPath=0"));

        assertNotNull(metaData);
        assertEquals("0", metaData.getIndexPath());
        assertEquals("loop", metaData.getType());
        assertEquals(startOffset, metaData.getStartOffset());

        Map<String, Object> meta = metaData.getMeta();
        assertNotNull(meta);

        assertEquals("loop", meta.get(LogConstants.TYPE));
        assertEquals("i", meta.get(LogConstants.LOOP_ITERATOR));
        assertEquals("$.arr[*]", meta.get(LogConstants.EXPRESSION));
        assertEquals(3, meta.get(LogConstants.LOOP_COUNT));
    }

    @Test
    public void testIfOnSuccess() {
        LogElementTracker ifTracker = new IfTracker();
        long startOffset = 0;

        ifTracker.onStart(ifStartParser.parse("2025-04-11T10:42:31.123Z scope=IF_START indexPath=1 expression=\"{x} == 'x'\""), startOffset);

        ifTracker.onContent(ifResultParser.parse("2025-04-11T10:42:31.123Z section=IF_RESULT result=true"));
        LogMetaData metaData = ifTracker.onEnd(ifEndParser.parse("2025-04-11T10:42:31.123Z scope=IF_END indexPath=1"));

        assertNotNull(metaData);
        assertEquals("1", metaData.getIndexPath());
        assertEquals("if", metaData.getType());
        assertEquals(startOffset, metaData.getStartOffset());

        Map<String, Object> meta = metaData.getMeta();
        assertNotNull(meta);

        assertEquals("{x} == 'x'", meta.get(LogConstants.EXPRESSION));
        assertEquals(true, meta.get(LogConstants.RESULT));
    }
}
