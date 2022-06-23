package com.becon.opencelium.backend.utility;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.invoker.resource.FieldResource;
import com.becon.opencelium.backend.invoker.resource.OperationResource;
import org.apache.commons.io.FilenameUtils;
import org.springframework.security.core.parameters.P;
import org.w3c.dom.*;

import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.StringWriter;
import java.util.*;
import java.util.stream.Collectors;

public class Xml {

    private Document document;
    private XPathFactory xPathfactory = XPathFactory.newInstance();
    private XPath xpath = xPathfactory.newXPath();
    private String fileName;
    private String format;

    public Xml(Document document) {
        this.document = document;
    }

    public Xml(Document document, String fileName) {
        this.document = document;
        this.format = document.getElementsByTagName("invoker").item(0)
                .getAttributes().getNamedItem("type").getNodeValue();
        this.fileName = FilenameUtils.getExtension(fileName)
                .equalsIgnoreCase("xml") ? fileName : fileName + ".xml";
    }

    public String toString(Object xmlMap){
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

    public List<Element> createFields(List<FieldResource> fields) {
        return fields.stream().map(this::createField).collect(Collectors.toList());
    }

    public List<Element> createXmlFields(List<FieldResource> fields) {
        return fields.stream().map(this::createXmlField).collect(Collectors.toList());
    }

    public Element createField(FieldResource field) {
        Element element = document.createElement("field");
        element.setAttribute("name", field.getName());
        element.setAttribute("type", field.getType());
        if (field.getValue() != null) {
            element.setTextContent(field.getValue().toString());
        }
        return element;
    }

    public Element createXmlField(FieldResource field) {
        Element element = document.createElement("field");
        element.setAttribute("name", field.getName());
        element.setAttribute("type", "object");

        Element attr = document.createElement("field");
        attr.setAttribute("name", "__oc__attributes");
        attr.setAttribute("type", "object");

        Element value = document.createElement("field");
        value.setAttribute("name", "__oc__value");
        value.setAttribute("type", "string");

        if (field.getValue() != null) {
            value.setTextContent(field.getValue().toString());
        }
        element.appendChild(attr);
        element.appendChild(value);
        return element;
    }

    public NodeList getNodeListByXpath(String xPath) throws XPathExpressionException{

        return (NodeList) xpath.compile(xPath).evaluate(document, XPathConstants.NODESET);
    }

    public void addFields(String xPath, OperationResource operationResource) throws XPathExpressionException {
        NodeList nl = getNodeListByXpath(xPath);
        if (!pathExists(xPath)) {
            nl = addNewFieldFromPath(operationResource);
        }
        List<Element> fields = format.equalsIgnoreCase("restful")
                                    ? createFields(operationResource.getFields())
                                    : createXmlFields(operationResource.getFields());
        if (pathExists(xPath)) {
            for (Element e : fields) {
                String field = xPath + "/field[@name='" + e.getAttributeNode("name").getValue() + "']";
                try {
                    if(pathExists(field)) {
                        Node oldField = getNodeListByXpath(field).item(0);
                        nl.item(0).replaceChild(e, oldField);
                        return;
                    }
                    assert nl != null;
                    nl.item(0).appendChild(e);
                } catch (Exception ex) {
                    throw new RuntimeException(ex);
                }
            }
        }
    }

    private NodeList addNewFieldFromPath(OperationResource operationResource) throws XPathExpressionException {
        String xBody = PathUtility.getXPathTillBody(operationResource.getPath(), operationResource.getMethod());
        NodeList node = getNodeListByXpath(xBody);
        String[] fields = PathUtility.getFields(operationResource.getPath()).split("\\.");
        boolean hasNewField = false;
        for (String f : fields) {
            FieldResource fr = createFieldResource(f);
            String xField = PathUtility.convretToXField(fr.getName());
            xBody = xBody + "/" + xField;
            if (!hasNewField && pathExists(xBody)) {
                node = getNodeListByXpath(xBody);
                hasNewField = false;
                continue;
            }

            Element field = format.equalsIgnoreCase("restfull") ? createField(fr) : createXmlField(fr);
            node.item(0).appendChild(field);
            node = node.item(0).getChildNodes();
            hasNewField = true;

        }
        return node;
    }

    private FieldResource createFieldResource(String field) {
        String type = field.contains("[]") ? "array" : "object";
        String name = field.replace("[]", "");
        FieldResource fieldResource = new FieldResource();
        fieldResource.setName(name);
        fieldResource.setType(type);
        return fieldResource;
    }

//    public boolean pathExists(String xPath, NodeList nodeList) throws XPathExpressionException {
//        return ((NodeList) xpath.compile(xPath).evaluate(nodeList, XPathConstants.NODESET)).item(0) != null;
//    }

    public NodeList findElementInNodeList(NodeList nodeList, String xPath) throws XPathExpressionException {
        return (NodeList) xpath.compile(xPath).evaluate(nodeList, XPathConstants.NODESET);
    }

    // If result != null it means that xPath exists in xml and we don't need to create new element
    public boolean pathExists(String xPath) throws XPathExpressionException {
        return getNodeListByXpath(xPath).item(0) != null;
    }

    public void save() throws FileNotFoundException, TransformerException {
        TransformerFactory transformerFactory = TransformerFactory
                .newInstance();
        Transformer transformer = transformerFactory.newTransformer();
        DOMSource source = new DOMSource(document);

        String f = PathConstant.INVOKER + fileName;
        FileOutputStream output = new FileOutputStream(f);
        StreamResult result = new StreamResult(output);
        transformer.transform(source, result);
    }

    private List<Element> mapToNode(Map<String, Object> map) {
        ArrayList<Element> elements = new ArrayList<>();
        for (Map.Entry<String, Object> tag : map.entrySet()) {
            if (tag.getKey().equals("__oc__attributes") || tag.getKey().equals("__oc__value")) {
                continue;
            }
            Element element = document.createElement(tag.getKey());

            if (tag.getValue() instanceof List) {
                List<Map<String, Object>> arrayItems = (List) tag.getValue();

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

            String ocValue = getOcValue(tag.getValue());
//            if (tag.getValue() instanceof String) {
//                ocValue = getOcValue(tag.getValue());
//            }

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

        if (!tag.containsKey("__oc__value") || tag.get("__oc__value") == null || tag.get("__oc__value") instanceof Map) {
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

        Map<String, Object> attrsMap = null;
        if (tag.get("__oc__attributes") instanceof Map) {
            attrsMap = (Map<String, Object>) tag.get("__oc__attributes");
        }

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
