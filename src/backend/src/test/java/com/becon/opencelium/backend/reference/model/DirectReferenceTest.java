package com.becon.opencelium.backend.reference.model;

import com.becon.opencelium.backend.reference.enums.ExchangeType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class DirectReferenceTest {
    /*
     * Test-only delegate for DirectReference.parse(..).
     * Used to reduce noise in "find usages" results from test code.
     */
    private static DirectReference parse(String rawReference) {
        return DirectReference.parse(rawReference);
    }


    // -------  POSITIVE cases  -------

    @Test
    void colorAndExchangeTypeAreCorrect() {
        // response
        DirectReference ref1 = parse("#a1a2a3.(response).[*]");

        assertEquals("#a1a2a3", ref1.getColor());
        assertEquals(ExchangeType.RESPONSE, ref1.getExchangeType());

        // request
        DirectReference ref2 = parse("#1b2b3b.(request).header.$.Content-Type");

        assertEquals("#1b2b3b", ref2.getColor());
        assertEquals(ExchangeType.REQUEST, ref2.getExchangeType());
    }

    @Test
    void partIsCorrectForResponses() {
        // [*]
        DirectReference all = parse("#ababab.(response).[*]");

        assertEquals(DirectReference.Part.ALL, all.getPart());

        // status
        DirectReference status = parse("#ababab.(response).status");

        assertEquals(DirectReference.Part.STATUS, status.getPart());

        // header
        DirectReference header = parse("#ababab.(response).header");

        assertEquals(DirectReference.Part.HEADER, header.getPart());

        // body
        DirectReference body = parse("#ababab.(response).body");

        assertEquals(DirectReference.Part.BODY, body.getPart());
    }

    @Test
    void partIsCorrectForRequests() {
        // [*]
        DirectReference all = parse("#ababab.(request).[*]");

        assertEquals(DirectReference.Part.ALL, all.getPart());

        // status
        DirectReference status = parse("#ababab.(request).status");

        assertEquals(DirectReference.Part.STATUS, status.getPart());

        // header
        DirectReference header = parse("#ababab.(request).header");

        assertEquals(DirectReference.Part.HEADER, header.getPart());

        // body
        DirectReference body = parse("#ababab.(request).body");

        assertEquals(DirectReference.Part.BODY, body.getPart());
    }

    @Test
    void pathIsCorrectForResponseAllPathCases() {
        // path for '[*]'
        DirectReference all = parse("#ababab.(response).[*].header");

        assertEquals(DirectReference.Part.ALL, all.getPart());
        assertEquals("header", all.getPath());

        // path for 'header'
        DirectReference header = parse("#ababab.(response).header.$.Content-Type");

        assertEquals(DirectReference.Part.HEADER, header.getPart());
        assertEquals("Content-Type", header.getPath());

        // path for 'status' - does not need path
        DirectReference status = parse("#ababab.(response).status");

        assertEquals(DirectReference.Part.STATUS, status.getPart());
        assertNull(status.getPath());

        // path for 'body'
        DirectReference body = parse("#ababab.(response).body.$.field1.['field2_with_special_symbol'].field3");

        assertEquals(DirectReference.Part.BODY, body.getPart());
        assertEquals("field1.['field2_with_special_symbol'].field3", body.getPath());
    }

    @Test
    void pathIsCorrectForRequestAllPathCases() {
        // path for '[*]'
        DirectReference all = parse("#ababab.(request).[*].header");

        assertEquals(DirectReference.Part.ALL, all.getPart());
        assertEquals("header", all.getPath());

        // path for 'header'
        DirectReference header = parse("#ababab.(request).header.$.Content-Type");

        assertEquals(DirectReference.Part.HEADER, header.getPart());
        assertEquals("Content-Type", header.getPath());

        // path for 'status' - does not need path
        DirectReference status = parse("#ababab.(request).status");

        assertEquals(DirectReference.Part.STATUS, status.getPart());
        assertNull(status.getPath());

        // path for 'body'
        DirectReference body = parse("#ababab.(request).body.$.field1.['field2_with_special_symbol'].field3");

        assertEquals(DirectReference.Part.BODY, body.getPart());
        assertEquals("field1.['field2_with_special_symbol'].field3", body.getPath());
    }
}
