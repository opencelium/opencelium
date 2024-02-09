package com.becon.opencelium.backend.execution.rdata.extractor;

import com.becon.opencelium.backend.constant.DataRef;

public class ExtractorFactory {

    public static Extractor getInstance(DataRef type) {
        switch (type) {
//            case HEADER:
//                return new HeaderExtractor();
            case BODY:
                return new BodyExtractor();
            case BASIC:
                return new BasicExtractor();
            case REQ_DATA:
                return new ReqDataExtractor();
            default:
                throw new RuntimeException("Couldn't determine type of Extractor");
        }
    }
}
