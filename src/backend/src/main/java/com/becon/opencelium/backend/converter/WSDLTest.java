package com.becon.opencelium.backend.converter;

import org.springframework.ws.wsdl.wsdl11.DefaultWsdl11Definition;
import org.springframework.ws.wsdl.wsdl11.SimpleWsdl11Definition;
import org.springframework.xml.xsd.SimpleXsdSchema;
import org.springframework.xml.xsd.XsdSchema;

import javax.wsdl.factory.WSDLFactory;
import javax.wsdl.xml.WSDLReader;

public class WSDLTest {
    public void test() {
        try {
            WSDLReader wsdlReader = WSDLFactory.newInstance().newWSDLReader();
        } catch (Exception e) {

        }

    }
}
