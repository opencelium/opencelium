package com.becon.opencelium.backend.utility;

import org.w3c.dom.Attr;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;

import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class XmlTransformer {

    Document document;

    public XmlTransformer(Document document) {
        this.document = document;
    }

    public String xmlToString(Object xmlMap){
        Map<String, Object> map = (Map<String, Object>) xmlMap;
        Map.Entry<String,Object> entry = map.entrySet().iterator().next();

        Element element = document.createElement(entry.getKey());
        document.appendChild(element);
        if (! (entry.getValue() instanceof  Map)) {
            throw new RuntimeException("Couldn't find root element");
        }

        Map<String, Object> a1 = (Map) entry.getValue();
        List<Attr> attrs = getAttributes(a1);
        mapToNode(a1).forEach(element::appendChild);
        if (attrs != null) {
            attrs.forEach(element::setAttributeNode);
        }
        return nodeToString(element);
    }

    private List<Element> mapToNode(Map<String, Object> map) {
        ArrayList<Element> elements = new ArrayList<>();
        for (Map.Entry<String, Object> tag : map.entrySet()) {
            if (tag.getKey().equals("__oc__attributes") || tag.getKey().equals("__oc__value")) {
                continue;
            }
            Element element = document.createElement(tag.getKey());

            if (tag.getValue() instanceof ArrayList) {
                ArrayList<Map<String, Object>> arrayItems = (ArrayList) tag.getValue();

                for (Map<String, Object> item : arrayItems) {
                    element = document.createElement(tag.getKey());
                    List<Attr> attrs = getAttributes(item);
                    if (attrs != null) {
                        attrs.forEach(element::setAttributeNode);
                    }


                    String ocValue = getOcValue(item);
                    if(ocValue != null && !ocValue.isEmpty()) {
                        element.appendChild(document.createTextNode(ocValue));
                        elements.add(element);
                        continue;
                    }

                    List<Element> childElem = mapToNode(item);
                    childElem.forEach(element::appendChild);
                    elements.add(element);
                }

                continue;
            }

            List<Attr> attrs = null;
            if(tag.getValue() instanceof Map) {
                attrs = getAttributes(tag.getValue());
            }

            if (attrs != null) {
                attrs.forEach(element::setAttributeNode);
            }

            String ocValue = null;
            if (tag.getValue() instanceof String) {
                ocValue = getOcValue(tag.getValue());
            }

            if(ocValue != null) {
                element.appendChild(document.createTextNode(ocValue));
                elements.add(element);
                continue;
            }
            List<Element> childElem = mapToNode((Map<String, Object>) tag.getValue());
            childElem.forEach(element::appendChild);

            elements.add(element);
        }

        return elements;
    }

    private boolean isArray(Object object) {
        return object instanceof ArrayList;
    }

    private String getOcValue(Object object){
        if (!(object instanceof Map)){
            return "";
        }

        Map<String, Object> tag = (Map<String, Object>) object;

        if (tag.get("__oc__value") == null) {
            return null;
        }

        Object v = tag.get("__oc__value");

        if (v instanceof Integer) {
            return Integer.toString((Integer)v);
        } else if(v instanceof Double) {
            return Double.toString((Double) v);
        } else if(v instanceof Float) {
            return Float.toString((Float) v);
        }
        return (String) tag.get("__oc__value");
    }

    private List<Attr> getAttributes(Object object) {
        if (!(object instanceof Map)){
            throw new RuntimeException("Attributes is not an object");
        }
        Map<String, Object> tag = (Map<String, Object>) object;
        Map<String, Object> attrsMap = (Map<String, Object>) tag.get("__oc__attributes");
        //TODO
        if (attrsMap == null) {
            return null;
        }
        ArrayList<Attr> attrs = new ArrayList<>();
        for (Map.Entry<String, Object> attr : attrsMap.entrySet()) {
            String key = attr.getKey();
            String value = (String) attr.getValue();
            Attr attribute = document.createAttribute(key);
            attribute.setValue(value);
            attrs.add(attribute);
        }

        return attrs;
    }


    private String nodeToString(Node node) {
        StringWriter sw = new StringWriter();
        try {
            Transformer t = TransformerFactory.newInstance().newTransformer();
            t.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
            t.setOutputProperty(OutputKeys.INDENT, "yes");
            t.transform(new DOMSource(node), new StreamResult(sw));
        } catch (TransformerException te) {
            System.out.println("nodeToString Transformer Exception");
        }
        return sw.toString();
    }
}
