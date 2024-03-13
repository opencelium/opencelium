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
import org.springframework.http.ResponseEntity;
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

import static com.becon.opencelium.backend.execution.ExecutionContainer.buildSeqIndexes;

public class MethodResponse {

    private String methodKey;
    private String exchangeType;
    private String result;
    private String responseFormat;
    private Integer aggregatorId;
    // contains all responses <indexes, response>
    // where indexes are from loop statement represented as i, j, k -> 0, 3, 1
    private int loopDepth; // indicates how many nested loops are used to execute this method
    private HashMap<String, String> data;
    private List<ResponseEntity<String>> responseEntities = new LinkedList<ResponseEntity<String>>();

    public MethodResponse() {
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

    public HashMap<String, String> getData() {
        return data;
    }

    public void setData(HashMap<String, String> data) {
        this.data = data;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public int getLoopDepth() {
        return loopDepth;
    }

    public void setLoopDepth(int loopDepth) {
        this.loopDepth = loopDepth;
    }

    public String getResponseFormat() {
        return responseFormat;
    }

    public void setResponseFormat(String responseFormat) {
        this.responseFormat = responseFormat;
    }

    public Integer getAggregatorId() {
        return aggregatorId;
    }

    public void setAggregatorId(Integer aggregatorId) {
        this.aggregatorId = aggregatorId;
    }

    public List<ResponseEntity<String>> getResponseEntities() {
        return responseEntities;
    }

    public void setResponseEntities(List<ResponseEntity<String>> responseEntities) {
        this.responseEntities = responseEntities;
    }

    //#ffffff.(response).id
    //#ffffff.(response).result[]
    //#ffffff.(response).result[index].id
    //#ffffff.(response).result[index] - get data from result where index = to current arr.index
    //#ffffff.(response).arr0[index].arr1[]
    public Object getValue(String ref, Map<String, Integer> loopStack){

        if (responseFormat.equals("xml")) {
            return xmlPathFinder(ref, loopStack);
        } else if (responseFormat.equals("text")) {
            return textPathFinder(ref, loopStack);
        } else {
            return jsonPathFinder(ref, loopStack);
        }
    }

    private Object textPathFinder(String value, Map<String, Integer> loopStack) {
        String message = "";
        if (loopStack == null || loopStack.isEmpty()){
            message = data.get("0");
        } else {
            String indexes = buildSeqIndexes(loopStack, this.loopDepth);
            message = data.get(indexes);
        }
        return message;
    }

    private Object xmlPathFinder(String value, Map<String, Integer> loopIterator){
        String ref = value.replaceFirst("\\$", "");
        String xpathQuery = "//";
        String condition = ConditionUtility.getPathToValue(ref);
        String refValue = ConditionUtility.getRefValue(ref);
        String[] conditionParts = refValue.split("\\.");

        String message = "";
        String indexes = "null";
        if (loopIterator != null && !loopIterator.isEmpty()){
            indexes = buildSeqIndexes(loopIterator, this.loopDepth);
        }
        message = data.get(indexes);
        for (String part : conditionParts){
            if(part.isEmpty()){
                continue;
            }
            condition = condition + "." + part;
            part = part.contains(":") ? part.split(":")[1] : part;
            boolean hasLoop = false;
            if (!loopIterator.isEmpty()){
                hasLoop = true;
            }

            Pattern pattern = Pattern.compile(RegExpression.arrayWithLetterIndex);
            Matcher m = pattern.matcher(part);
            boolean hasIndex = false;
            String condIndexArr = "";
            while (m.find()) {
                hasIndex = true;
                condIndexArr = m.group(1);
            }
            if ((part.contains("[]") || hasIndex) && hasLoop){
                part = part.replace("[]", ""); // removed [index] and put []
                if (hasIndex) {
                    part = part.replace("[" + condIndexArr + "]", "");
                }
                int xmlIndex = loopIterator.get(condIndexArr) + 1;
                part = part + "[" + xmlIndex + "]";
            } else if((part.contains("[]") || part.contains("[*]")) && !hasLoop){
                part = part.contains("[*]") ? part : part.replace("[]", "") + "[*]";
            }
            xpathQuery = xpathQuery + part + "/";
        }

        xpathQuery = removeLastCharOptional(xpathQuery);
        xpathQuery = xpathQuery.replace("/__oc__value", "");
        xpathQuery = xpathQuery.replace("/__oc__attributes", "");

        try {
            XPathFactory xpathfactory = XPathFactory.newInstance();
            XPath xpath = xpathfactory.newXPath();
            List<String> cpart =  Arrays.asList(xpathQuery.split("/"));
            String lastElem = cpart.get(cpart.size() - 1);
            if (!lastElem.contains("@") && !(lastElem.contains("[*]") || lastElem.contains("[]"))){
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
                if (result instanceof List && ((List) result).isEmpty()) {
                    return "";
                }
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

    private Object jsonPathFinder( String ref, Map<String, Integer> loopIterator) {
        String jsonPath = "$";
        String condition = ConditionUtility.getPathToValue(ref);
        String refValue = ConditionUtility.getRefValue(ref);
        String[] conditionParts = refValue.split("\\.");

        String indexes = "null";
        String message = "";
        if (loopIterator != null && !loopIterator.isEmpty() && !data.containsKey("null")){
            indexes = buildSeqIndexes(loopIterator, this.loopDepth);
        }

        message = data.get(indexes);
        // creating json path query
        for (String part : conditionParts){
            if(part.isEmpty()){
                continue;
            }
            part = part.replace("[]", "[*]");
            condition = condition + "." + part;
            // Getting current index of current loop
            boolean hasLoop = false;
            if (!loopIterator.isEmpty()){
                hasLoop = true;
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
                part = part.replace("[]", ""); // remove [index] and put []
                if (hasIndex) {
                    part = part.replace("[" + condIndexArr + "]", "");
                }
                part = part + "[" + loopIterator.get(condIndexArr) + "]";
            } else if((part.contains("[]") || part.contains("[*]")) && !hasLoop){
                if (part.contains("[]")){
                    part = part.replace("[]", "");
                    part = part + "[*]";
                }
            }
            jsonPath = jsonPath + "." + part;
        }
        return JsonPath.read(message, jsonPath);
    }
}
