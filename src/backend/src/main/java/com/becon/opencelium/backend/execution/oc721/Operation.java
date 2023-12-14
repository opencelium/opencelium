package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.utility.ConditionUtility;
import com.jayway.jsonpath.JsonPath;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;
import java.io.StringReader;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Operation {
    private String id;
    private String color;
    private Integer aggregatorId;
    private final Map<String, RequestEntity<?>> requests = new HashMap<>();
    private final Map<String, ResponseEntity<?>> responses = new HashMap<>();

    public static Operation fromDTO(OperationDTO operationDTO) {
        Operation operation = new Operation();

        // TODO: correct DTO mapping
        operation.setId(operationDTO.getName());
        operation.setColor(operationDTO.getOperationId());

        return operation;
    }

    // 'ref' is a direct reference, and is in form 'color.(exchangeType).field':
    // 1) #98BEC7.(request).ConfigItemID[*]
    // 2) #6477AB.(response).success.ConfigItemIDs[*]
    public Object getValue(String ref, LinkedHashMap<String, String> loops) {
        String exchangeType = getExchangeType(ref);
        String key = generateKey(loops);

        String entityBody = "";
        MediaType mediaType = MediaType.TEXT_PLAIN;

        if (exchangeType.equals("response")) {
            ResponseEntity<?> responseEntity = responses.get(key);

            mediaType = responseEntity.getHeaders().getContentType();
            entityBody = Objects.requireNonNull(responseEntity.getBody()).toString();
        } else {
            RequestEntity<?> requestEntity = requests.get(key);

            mediaType = requestEntity.getHeaders().getContentType();
            entityBody = Objects.requireNonNull(requestEntity.getBody()).toString();
        }

        Object result;

        if (mediaType == MediaType.APPLICATION_JSON) {
            result = getFromJSON(entityBody, ref, loops);
        } else if (mediaType == MediaType.APPLICATION_XML) {
            result = getFromXML(entityBody, ref, loops);
        } else {
            result = entityBody;
        }

        return result;
    }

    private Object getFromXML(String xmlString, String ref, LinkedHashMap<String, String> loops) {
        ref = ref.replaceFirst("\\$", "");

        String xpathQuery = "//";
        String refValue = ConditionUtility.getRefValue(ref);
        String[] conditionParts = refValue.split("\\.");

        boolean hasLoop = !loops.isEmpty();

        for (String part : conditionParts) {
            if (part.isEmpty()) {
                continue;
            }

            part = part.contains(":") ? part.split(":")[1] : part;

            // increment and set current value of iterators: e.g. if i=3 -> ...field[i]... -> ...field[4]...
            Pattern pattern = Pattern.compile(RegExpression.arrayWithLetterIndex);
            Matcher m = pattern.matcher(part);
            boolean hasIndex = false;
            String iterator = "";

            while (m.find()) {
                hasIndex = true;
                iterator = m.group(1);
            }

            int xmlIndex = Integer.parseInt(loops.get(iterator)) + 1;
            if ((part.contains("[]") || hasIndex) && hasLoop) {
                part = part.replace("[]", ""); // removed [index] and put []
                if (hasIndex) {
                    part = part.replace("[" + iterator + "]", "");
                }

                part = part + "[" + xmlIndex + "]";
            } else if ((part.contains("[]") || part.contains("[*]")) && !hasLoop) {
                part = part.contains("[*]") ? part : part.replace("[]", "") + "[*]";
            }

            xpathQuery = xpathQuery + part + "/";
        }

        // remove the last slash (/)
        xpathQuery = Optional.of(xpathQuery)
                .filter(str -> !str.isEmpty())
                .map(str -> str.substring(0, str.length() - 1))
                .orElse(xpathQuery);

        xpathQuery = xpathQuery.replace("/__oc__value", "");
        xpathQuery = xpathQuery.replace("/__oc__attributes", "");

        try {
            XPath xpath = XPathFactory.newInstance().newXPath();

            List<String> cpart = Arrays.asList(xpathQuery.split("/"));

            String lastElem = cpart.get(cpart.size() - 1);
            if (!lastElem.contains("@") && !(lastElem.contains("[*]") || lastElem.contains("[]"))) {
                xpathQuery = xpathQuery + "/text()";
            }

            // convert 'xmlString' to XML Document
            DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
            Document xmlDocument = builder.parse(new InputSource(new StringReader(xmlString)));

            NodeList nodeList = (NodeList) xpath.compile(xpathQuery).evaluate(xmlDocument, XPathConstants.NODESET);
            ArrayList<Object> result = new ArrayList<>();
            for (int j = 0; j < nodeList.getLength(); j++) {
                Node node = nodeList.item(j);
                // TODO currently it works if target is primitive type, otherwise we get only null
                result.add(node.getNodeValue());
            }

            if (result.size() == 1) {
                return result.get(0);
            } else {
                return result;
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private Object getFromJSON(String jsonString, String ref, LinkedHashMap<String, String> loops) {
        String jsonPath = "$";
        String refValue = getRefValue(ref);
        String[] conditionParts = refValue.split("\\.");

        boolean hasLoop = !loops.isEmpty();

        // creating json path query
        for (String part : conditionParts) {
            if (part.isEmpty()) {
                continue;
            }

            part = part.replace("[]", "[*]");

            // set current value of iterators: e.g. if i=3 -> ...field[i]... -> ...field[3]...
            Pattern pattern = Pattern.compile(RegExpression.arrayWithLetterIndex);
            Matcher m = pattern.matcher(part);
            boolean hasIndex = false;
            String iterator = "";

            while (m.find()) {
                hasIndex = true;
                iterator = m.group(1);
            }

            if ((part.contains("[]") || hasIndex) && hasLoop && !part.contains("[*]")) {
                part = part.replace("[]", ""); // remove [index] and put []
                if (hasIndex) {
                    part = part.replace("[" + iterator + "]", "");
                }

                part = part + "[" + loops.get(iterator) + "]";
            } else if ((part.contains("[]") || part.contains("[*]")) && !hasLoop) {
                if (part.contains("[]")) {
                    part = part.replace("[]", "");
                    part = part + "[*]";
                }
            }

            jsonPath = jsonPath + "." + part;
        }

        return JsonPath.read(jsonString, jsonPath);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Integer getAggregatorId() {
        return aggregatorId;
    }

    public void setAggregatorId(Integer aggregatorId) {
        this.aggregatorId = aggregatorId;
    }

    public void putRequest(String key, RequestEntity<?> requestEntity) {
        requests.put(key, requestEntity);
    }

    public void putResponse(String key, ResponseEntity<?> responseEntity) {
        responses.put(key, responseEntity);
    }

    public Map<String, RequestEntity<?>> getRequests() {
        return requests;
    }

    public Map<String, ResponseEntity<?>> getResponses() {
        return responses;
    }

    public static String generateKey(LinkedHashMap<String, String> loops) {
        if (loops.isEmpty()) {
            return "#";
        }

        return String.join(", ", loops.values());
    }

    private static String getExchangeType(String ref){
        // extracts type from direct reference: #ffffff.(response | request). ...
        return ref.substring(ref.indexOf('(') + 1, ref.indexOf(')'));
    }

    private static String getRefValue(String ref) {
        if (ref.isEmpty()) {
            return "";
        }

        String[] refParts = ref.split("\\.");

        String result = ref.replace(refParts[0] + ".", "")
                .replace(refParts[1] + ".", "");

        if (getExchangeType(ref).equals("response")) {
            result = result.replace(refParts[2] + ".", "")
                    .replace(refParts[0], "")
                    .replace(refParts[1], "")
                    .replace(refParts[2], "");
        }

        return result;
    }
}
