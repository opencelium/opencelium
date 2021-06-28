package com.becon.opencelium.backend.constant;

public interface Constant {
    String CONN_FROM = "CONN1";
    String CONN_TO = "CONN2";

    String SOAP_HEADER = "<soap:Envelope xmlns:soap=\"http://www.w3.org/2003/05/soap-envelope\" " +
            "xmlns:urn=\"urn:sap-com:document:sap:soap:functions:mc-style\">\n" +
            "<soap:Header/>\n" + "<soap:Body>";

    String SOAP_FOOTER = "</soap:Body>\n" + "</soap:Envelope>";
}
