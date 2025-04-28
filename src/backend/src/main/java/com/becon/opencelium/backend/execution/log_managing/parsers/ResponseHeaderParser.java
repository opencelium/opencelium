package com.becon.opencelium.backend.execution.log_managing.parsers;

import com.becon.opencelium.backend.execution.log_managing.commons.LogConstants;
import com.becon.opencelium.backend.execution.log_managing.commons.LogProcessingException;
import com.becon.opencelium.backend.execution.log_managing.commons.PropDescriptor;
import com.becon.opencelium.backend.execution.log_managing.core.LogLineParser;
import com.becon.opencelium.backend.execution.log_managing.core.ParsedLogLine;
import com.becon.opencelium.backend.execution.log_managing.commons.LogEntryType;

import java.util.Collections;
import java.util.Set;

import static com.becon.opencelium.backend.execution.log_managing.commons.LogParserUtils.extractEntryType;
import static com.becon.opencelium.backend.execution.log_managing.commons.LogParserUtils.extractKeyValuePairs;

public class ResponseHeaderParser implements LogLineParser {

    private static final LogEntryType entryType = LogEntryType.RESPONSE_HEADER;

    @Override
    public boolean supports(String line) {
        return entryType.equals(extractEntryType(line));
    }

    @Override
    public ParsedLogLine parse(String line) {
        if (!supports(line)) {
            throw LogProcessingException.unsupportedLine(line, entryType);
        }

        extractKeyValuePairs(line, Set.of(PropDescriptor.of(LogConstants.DATA)));

        ParsedLogLine pll = new ParsedLogLine();
        pll.setEntryType(entryType);
        pll.setProperties(Collections.emptyMap());
        pll.setIndexPath(null);
        pll.setSize(line.getBytes().length);
        return pll;
    }
}
