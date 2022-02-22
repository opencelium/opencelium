/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.invoker.parser;

import com.becon.opencelium.backend.factory.InvokerParserFactory;
import com.becon.opencelium.backend.invoker.entity.*;
import com.sun.xml.messaging.saaj.soap.ver1_1.BodyElement1_1Impl;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import java.util.*;

public class InvokerParserImp {

    private Document document;

    public InvokerParserImp(Document document){
        this.document = document;
    }

    public Invoker parse(){
        return getInvoker(document.getChildNodes());
    }

    private Invoker getInvoker(NodeList nodeList){
        Invoker invoker = new Invoker();
        InvokerParserFactory<Invoker> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, Invoker> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction("invoker", node -> {
            NodeList childNode = node.getChildNodes();
            invoker.setName(getName(childNode));
            invoker.setDescription(getDescription(childNode));
            invoker.setHint(getHint(childNode));
            invoker.setIcon(getIcon(childNode));
            invoker.setAuthType(getAuthType(childNode));
            invoker.setRequiredData(getRequired(childNode));
            invoker.setOperations(getOperation(childNode));
            return invoker;
        });
    }

    private String getName(NodeList nodeList){
        InvokerParserFactory<String> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, String> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction("name", Node::getTextContent);
    }

    private String getDescription(NodeList nodeList){
        InvokerParserFactory<String> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, String> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction("description", Node::getTextContent);
    }

    private String getIcon(NodeList nodeList){
        InvokerParserFactory<String> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, String> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction("icon", Node::getTextContent);
    }

    private String getHint(NodeList nodeList){
        InvokerParserFactory<String> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, String> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction("hint", Node::getTextContent);
    }

    private List<RequiredData> getRequired(NodeList nodeList){
        InvokerParserFactory< List<RequiredData>> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node,  List<RequiredData>> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction("requiredData", node -> getRequestDataItems(node.getChildNodes()));
    }

    private String getAuthType(NodeList nodeList){
        InvokerParserFactory<String> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, String> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction("authType", Node::getTextContent);
    }

    private List<FunctionInvoker> getOperation(NodeList nodeList){
        List<FunctionInvoker> functionInvokers = new ArrayList<>();
        InvokerParserFactory<List<FunctionInvoker>> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, List<FunctionInvoker>> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction("operations", node -> getFunctions(node.getChildNodes()));
    }

    public List<FunctionInvoker> getFunctions(NodeList nodeList){
        List<FunctionInvoker> functions = new ArrayList<>();
        InvokerParserFactory<List<FunctionInvoker>> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, List<FunctionInvoker>> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction("operation", node -> {
            FunctionInvoker function = new FunctionInvoker();
            String name = node.getAttributes().getNamedItem("name").getNodeValue();
            String type = node.getAttributes().getNamedItem("type").getNodeValue();
            function.setName(name);
            function.setType(type);
            function.setRequest(getRequest(node.getChildNodes()));
            function.setResponse(getResponse(node.getChildNodes()));
            functions.add(function);
            return functions;
        });
    }

    private RequestInv getRequest(NodeList nodeList){
        RequestInv request = new RequestInv();
        InvokerParserFactory<RequestInv> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, RequestInv> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction("request", node -> {
            String method = getMethod(node.getChildNodes());
            String endpoint = getEndpoint(node.getChildNodes());
            Map<String, String> header = getHeader(node.getChildNodes());
            Body body = getBody(node.getChildNodes());

            request.setMethod(method);
            request.setEndpoint(endpoint);
            request.setHeader(header);
            request.setBody(body);

            return request;
        });
    }

    private String getMethod(NodeList nodeList){
        InvokerParserFactory<String> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, String> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction("method", Node::getTextContent);
    }

    private String getEndpoint(NodeList nodeList){
        InvokerParserFactory<String> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, String> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction("endpoint", Node::getTextContent);
    }

    private ResponseInv getResponse(NodeList nodeList){
        ResponseInv response = new ResponseInv();
        InvokerParserFactory<ResponseInv> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, ResponseInv> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction("response", node -> {

            response.setFail(getResult("fail", node.getChildNodes()));
            response.setSuccess(getResult("success",node.getChildNodes()));
            return response;
        });
    }

    private Map<String, String> getHeader(NodeList nodeList){
        InvokerParserFactory<Map<String, String>> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, Map<String, String>> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction("header", node -> getItem(node.getChildNodes()));
    }

    private Body getBody(NodeList nodeList){
        InvokerParserFactory<Body> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, Body> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction("body", node -> {
            if (!node.hasAttributes() && !node.hasChildNodes()) {
                return null;
            }
            Body body = new Body();

            String format = "";
            String type = "";
            String data = "";
            if (node.hasAttributes()) {
                 format= node.getAttributes().getNamedItem("format").getNodeValue();
                 type = node.getAttributes().getNamedItem("type").getNodeValue();
                 data = node.getAttributes().getNamedItem("data").getNodeValue();
            }

            Map<String, Object> fields = getFields(node.getChildNodes());
            body.setFields(fields);
            body.setData(data);
            body.setFormat(format);
            body.setType(type);
            return body;
        });
    }

    private Map<String, Object> getFields(NodeList nodeList){
        Map<String, Object> fields = new HashMap<>();
        InvokerParserFactory<Map<String, Object>> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, Map<String, Object>> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction("field", node -> {
            String name = node.getAttributes().getNamedItem("name").getNodeValue();
            String type = node.getAttributes().getNamedItem("type").getNodeValue();
            if (node.hasChildNodes() && (type.equals("object") || type.equals("array"))){
                if (type.equals("array")){
                    ArrayList<Object> array = new ArrayList<>();
                    String nodeValue = node.getTextContent()
                            .replace("\n", "")
                            .replace("\r", "")
                            .trim();//.replace(" ", "");
                    if (nodeValue.length() == 0){ // if length equal to 0 it means context has child not string
                        array.add(getFields(node.getChildNodes()));
                    } else {
                        String[] elements = nodeValue.split(",");
                        array.addAll(Arrays.asList(elements));
                    }
                    fields.put(name, array);
                }
                else {
                    fields.put(name, getFields(node.getChildNodes()));
                }
                return fields;
            } else if (!node.hasChildNodes() && type.equals("array")) {
                fields.put(name, new ArrayList<>());
                return fields;
            } else {
                String value = node.getTextContent();
                value = value.replace("\n", "")
                        .replace("\r", "")
                        .trim();//.replace(" ", "");
                if (node.getTextContent().isEmpty()){
                    value = "";
                }
                if (value.equals("null")){
                    value = null;
                }

                fields.put(name, value);
                return fields;
            }
        });
    }

    private ResultInv getResult(String resultType, NodeList nodeList){
        ResultInv resultInv = new ResultInv();
        InvokerParserFactory<ResultInv> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, ResultInv> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        return xmlDomParser.doAction(resultType, node -> {
            Map<String, String> header = getHeader(node.getChildNodes());
            Body body = getBody(node.getChildNodes());
            resultInv.setBody(body);
            resultInv.setHeader(header);
            resultInv.setStatus(node.getAttributes().getNamedItem("status").getNodeValue());
            return resultInv;
        });
    }

    private List<RequiredData> getRequestDataItems(NodeList nodeList){
        InvokerParserFactory<List<RequiredData>> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, List<RequiredData>> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        List<RequiredData> items = new ArrayList<>();
        return xmlDomParser.doAction("item", node -> {
            RequiredData requiredData = new RequiredData();
            String name = node.getAttributes().getNamedItem("name").getNodeValue();
            String visibility = node.getAttributes().getNamedItem("visibility").getNodeValue();
            String type = node.getAttributes().getNamedItem("type").getNodeValue();
            String value = node.getTextContent();

            requiredData.setName(name);
            requiredData.setType(type);
            requiredData.setVisibility(visibility);
            requiredData.setValue(value);

            items.add(requiredData);
            return items;
        });
    }

    private Map<String, String> getItem(NodeList nodeList){
        InvokerParserFactory<Map<String, String>> invokerParserFactory = new InvokerParserFactory<>();
        XMLParser<Node, Map<String, String>> xmlDomParser = invokerParserFactory.getXmlDomParser(nodeList);
        Map<String, String> items = new HashMap<>();
        return xmlDomParser.doAction("item", node -> {
            String key = node.getAttributes().getNamedItem("name").getNodeValue();
            String value = node.getTextContent();
            items.put(key,value);
            return items;
        });
    }
}
