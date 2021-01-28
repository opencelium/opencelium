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

package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.utility.ConditionUtility;
import com.jayway.jsonpath.JsonPath;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathFactory;
import java.io.StringReader;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MessageContainer {

    private String methodKey;
    private String exchangeType;
    private String result;
    private String responseFormat;
    private List<String> loopingArrays; // level of loops
    private HashMap<Integer, String> data; // data from last loop if loop is nested
    private String currentLoopArr;

    public MessageContainer() {
    }

    public String getMethodKey() {
        return methodKey;
    }

    public void setMethodKey(String methodKey) {
        this.methodKey = methodKey;
    }

    public String getExchangeType() {
        return exchangeType;
    }

    public void setExchangeType(String exchangeType) {
        this.exchangeType = exchangeType;
    }

    public HashMap<Integer, String> getData() {
        return data;
    }

    public void setData(HashMap<Integer, String> data) {
        this.data = data;
    }

    public List<String> getLoopingArrays() {
        return loopingArrays;
    }

    public void setLoopingArrays(List<String> loopingArrays) {
        this.loopingArrays = loopingArrays;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public String getCurrentLoopArr() {
        return currentLoopArr;
    }

    public void setCurrentLoopArr(String currentLoopArr) {
        this.currentLoopArr = currentLoopArr;
    }

    public String getResponseFormat() {
        return responseFormat;
    }

    public void setResponseFormat(String responseFormat) {
        this.responseFormat = responseFormat;
    }

    //#ffffff.(response).id
    //#ffffff.(response).result[]
    //#ffffff.(response).result[index].id
    //#ffffff.(response).result[index] - get data from result where index = to current arr.index
    //#ffffff.(response).arr0[index].arr1[]
    public Object getValue(String value, Map<String, Integer> loopStack){

        if (responseFormat.equals("xml")) {
            return xmlPathFinder(value, loopStack);
        } else {
            return jsonPathFinder(value, loopStack);
        }
    }

    private Object xmlPathFinder(String value, Map<String, Integer> loopStack){
        String ref = value.replaceFirst("\\$", "");
        String xpathQuery = "//";
        String condition = ConditionUtility.getPathToValue(ref);
        String refValue = ConditionUtility.getRefValue(ref);

        List<String> conditionParts =  Arrays.asList(refValue.split("\\."));
        int loopIndex = 0;

        String message = "";
//        if (loopingArrays == null || loopingArrays.isEmpty()){
//            message = data.get(loopIndex);
//        } else {
//            String arr = loopingArrays.stream().reduce((f,s)->s).get();
//            loopIndex = loopStack.get(arr);
//            message = data.get(loopIndex);
//        }

        if (loopingArrays == null || loopingArrays.isEmpty()){
            message = data.get(loopIndex);
        } else {
//            if (currentLoopArr == null) {
//                currentLoopArr = loopingArrays.stream().reduce((f,s)->s).get();
//            }
//            String arr = currentLoopArr.replaceAll("\\[([a-z,*]+)\\]", "[]");
//            loopIndex = loopStack.containsKey(arr) ? loopStack.get(arr) : 0;
//            message = data.get(loopIndex);

            String arr = loopingArrays.stream().reduce((f,s)->s).get();
            loopIndex = loopStack.containsKey(arr) ? loopStack.get(arr) : 0;
            message = data.get(loopIndex);
        }

        int size = conditionParts.size() - 1;
        int i = 0;
        for (String part : conditionParts){
            if(part.isEmpty()){
                continue;
            }
            condition = condition + "." + part;
            String array = ConditionUtility.getLastArray(condition);// need to find index
            int index = 0;
            boolean hasLoop = false;

            if (loopStack.containsKey(array)){
                hasLoop = true;
                index = loopStack.get(array);
            }

            Pattern pattern = Pattern.compile(RegExpression.arrayWithLetterIndex);
            Matcher m = pattern.matcher(part);
            boolean hasIndex = false;
            String condIndexArr = "";
            while (m.find()) {
                hasIndex = true;
                condIndexArr = m.group(1);
            }
            int xmlIndex = index + 1;
            if ((part.contains("[]") || hasIndex) && hasLoop){
                part = part.replace("[]", ""); // removed [index] and put []
                if (hasIndex) {
                    part = part.replace("[" + condIndexArr + "]", "");
                }
                part = part + "[" + xmlIndex + "]";
            } else if((part.contains("[]") || part.contains("[*]")) && !hasLoop){
                part = part.replace("[]", "");
                part = part + "[*]";
            }

            xpathQuery = xpathQuery + part + "/";
            i++;
        }

        xpathQuery = removeLastCharOptional(xpathQuery);
        xpathQuery = xpathQuery.replace("/__oc__value", "");
        xpathQuery = xpathQuery.replace("/__oc__attributes", "");

        try {
            XPathFactory xpathfactory = XPathFactory.newInstance();
            XPath xpath = xpathfactory.newXPath();
            List<String> cpart =  Arrays.asList(xpathQuery.split("/"));
            String lastElem = cpart.get(cpart.size() - 1);
            if (!lastElem.contains("@") && !(lastElem.contains("[") && lastElem.contains("]"))){
                xpathQuery = xpathQuery + "/text()";
            }
            XPathExpression expr = xpath.compile(xpathQuery); // //book[@year>2001]/title/text()
            Document doc = convertStringToXMLDocument(message);

            NodeList nodeList = (NodeList) expr.evaluate(doc, XPathConstants.NODESET);
            ArrayList<Object> result = new ArrayList<>();
            for (int j = 0; j < nodeList.getLength(); j++) {
               Node node = nodeList.item(j);
               result.add(node.getNodeValue());
            }

            if(result.size() == 1) {
                return result.get(0);
            } else {
                return result;
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static String removeLastCharOptional(String s) {
        return Optional.ofNullable(s)
                .filter(str -> str.length() != 0)
                .map(str -> str.substring(0, str.length() - 1))
                .orElse(s);
    }

    private static Document convertStringToXMLDocument(String xmlString)
    {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = null;
        try
        {
            builder = factory.newDocumentBuilder();
            Document doc = builder.parse(new InputSource(new StringReader(xmlString)));
            return doc;
        }
        catch (Exception e)
        {
            e.printStackTrace();
        }
        return null;
    }

    private Object jsonPathFinder( String value, Map<String, Integer> loopStack) {
        String ref = value.replaceFirst("\\$", "");
        String jsonPath = "$";
        String condition = ConditionUtility.getPathToValue(ref);
        String refValue = ConditionUtility.getRefValue(ref);

        List<String> conditionParts =  Arrays.asList(refValue.split("\\."));
        int loopIndex = 0;

        String message = "";
        if (loopingArrays == null || loopingArrays.isEmpty()){
            message = data.get(loopIndex);
        } else {
//            if (currentLoopArr == null) {
//                currentLoopArr = loopingArrays.stream().reduce((f,s)->s).get();
//            }
//            String arr = currentLoopArr.replaceAll("\\[([a-z,*]+)\\]", "[]");
            String arr = loopingArrays.stream().reduce((f,s)->s).get();
            loopIndex = loopStack.containsKey(arr) ? loopStack.get(arr) : 0;
            message = data.get(loopIndex);
        }

        int size = conditionParts.size() - 1;
        int i = 0;
        for (String part : conditionParts){
            if(part.isEmpty()){
                continue;
            }
            condition = condition + "." + part;
            String array = ConditionUtility.getLastArray(condition);// need to find index
            int index = 0;
            boolean hasLoop = false;

            if (loopStack.containsKey(array)){
                hasLoop = true;
                index = loopStack.get(array);
            }

            // TODO added size and index i. for checking is next element after an array
            Pattern pattern = Pattern.compile(RegExpression.arrayWithLetterIndex);
            Matcher m = pattern.matcher(part);
            boolean hasIndex = false;
            String condIndexArr = "";
            while (m.find()) {
                hasIndex = true;
                condIndexArr = m.group(1);
            }
            if ((part.contains("[]") || hasIndex) && hasLoop && !part.contains("[*]")){
                part = part.replace("[]", ""); // removed [index] and put []
                if (hasIndex) {
                    part = part.replace("[" + condIndexArr + "]", "");
                }
                part = part + "[" + index + "]";
            } else if((part.contains("[]") || part.contains("[*]")) && !hasLoop){
                if (part.contains("[]")){
                    part = part.replace("[]", "");
                    part = part + "[*]";
                }
            }

            jsonPath = jsonPath + "." + part;
            i++;
        }
        return JsonPath.read(message, jsonPath);
    }
}
