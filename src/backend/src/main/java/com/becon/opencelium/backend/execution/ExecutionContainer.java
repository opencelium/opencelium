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
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.mysql.entity.Enhancement;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.mysql.service.EnhancementServiceImp;
import com.becon.opencelium.backend.neo4j.entity.FieldNode;
import com.becon.opencelium.backend.neo4j.entity.MethodNode;
import com.becon.opencelium.backend.neo4j.service.FieldNodeServiceImp;
import com.becon.opencelium.backend.neo4j.service.MethodNodeServiceImp;
import com.becon.opencelium.backend.utility.ConditionUtility;
import com.becon.opencelium.backend.utility.StringUtility;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import jdk.nashorn.api.scripting.JSObject;
import jdk.nashorn.api.scripting.ScriptObjectMirror;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class ExecutionContainer {

    private Invoker invoker;
    private List<RequestData> requestData = new LinkedList<>();
    private List<RequestData> supportRequestData = new LinkedList<>();
    private ArrayList<MessageContainer> responseData = new ArrayList<>();
    private LinkedHashMap<String, Integer> loopIndex = new LinkedHashMap<>();
    private String taId;
    private String conn;
    private int order;
    private Map<String, Object> queryParams = new HashMap<>();

    private EnhancementServiceImp enhancementService;
    private FieldNodeServiceImp fieldNodeService;
    private MethodNodeServiceImp methodNodeService;

    public ExecutionContainer(EnhancementServiceImp enhancementService, FieldNodeServiceImp fieldNodeService,
                              MethodNodeServiceImp methodNodeService) {
        this.enhancementService = enhancementService;
        this.fieldNodeService = fieldNodeService;
        this.methodNodeService = methodNodeService;
    }

    // TODO: arguments should be String path
    public Object getValueFromEnhancementData(FieldNode outgoingFiled){
        Enhancement enhancement = enhancementService.findByFieldId(outgoingFiled.getId());
//        List<FieldNode> incomingFields = fieldNodeService.findIncoming(outgoingFiled.getId());

        // var_result : #456osdk.(response).success.result[];
        Map<String, String> enhVars = parseExpertVars(enhancement.getExpertVar());

        boolean isObject = outgoingFiled.getType().equals("object");
        // TODO: for array case need to make it
//            boolean isArray = fieldNode.getFieldType().equals(ActionConfig.Field.ARRAY);
        boolean isArray = outgoingFiled.getType().equals("array");

        Map<String, String> expertVarProperties = new HashMap<>();
        ObjectMapper mapperObj = new ObjectMapper();

        MethodNode outMethod = methodNodeService.getByFieldNodeId(outgoingFiled.getId())
                .orElseThrow(() -> new RuntimeException("Method not found"));
//        String outFieldPath = fieldNodeService.getPath(outMethod, outgoingFiled);
//        String outFieldPath = enhVars.entrySet().stream()
//                .filter(e -> e.getValue().equals("RESULT_VAR"))
//                .map(e -> e.getKey()).findFirst().get();
//        String outFieldValue = fieldNodeService.getFieldValue(outgoingFiled);
//        outFieldPath = outFieldPath.replace("__oc__attributes.", "@").replace(".__oc__value", "");
//        expertVarProperties.put(outFieldPath, outFieldValue);

        List<String> incomeRef = Arrays.asList(outgoingFiled.getValue().split(";"));
        String format = outMethod.getRequestNode().getBodyNode().getFormat();
        incomeRef.forEach(ref -> {
            try {
                String incRef = ref;
                if (format.equals("xml")) {
                    incRef = incrementIndexes(ref);
                }
                String methodKey = ConditionUtility.getMethodKey(incRef);
                MessageContainer messageContainer = responseData
                        .stream()
                        .filter(m -> m.getMethodKey().equals(methodKey))
                        .findFirst().orElse(null);
                Object o = messageContainer.getValue(incRef, getLoopIndex());
                String inFieldValue = o instanceof String ? o.toString() : mapperObj.writeValueAsString(o);
                inFieldValue = inFieldValue.replace("__oc__attributes.", "@").replace(".__oc__value", "");
                expertVarProperties.put(ref, inFieldValue);
            } catch (JsonProcessingException e){
                throw new RuntimeException(e);
            }
        });

        ScriptEngine engine = new ScriptEngineManager().getEngineByName("nashorn");
        expertVarProperties.forEach((k,v) -> {
            try {
                String var = enhVars.get(k);
                if(var == null) {
                    throw new RuntimeException(k + "not found in enhancement variables");
                }
                if (fieldNodeService.valueIsJSON(v)){
                    engine.put("dataModel", v);
                    JSObject obj = (JSObject)engine.eval("JSON.parse(dataModel)");
                    engine.put(var, obj);
                } else {
                    engine.put(var, v);
                }
            } catch (ScriptException e){
                throw new RuntimeException(e);
            }
        });

        try {
            engine.eval(enhancement.getExpertCode());

//            String v = enhVars.get("RESULT_VAR");
            Object o = engine.get("RESULT_VAR");
            ScriptObjectMirror JSON = (ScriptObjectMirror) engine.eval("JSON");
            Object stringified = JSON.callMember("stringify", o);
            String result = stringified.toString();

            if (isObject){
                return mapperObj.readValue(result, new TypeReference<Map<String, Object>>(){});
            } else if(isArray) {
                String arrayRegex = "\\[(.*?)\\]";
                final Pattern pattern = Pattern.compile(arrayRegex, Pattern.MULTILINE);
                final Matcher matcher = pattern.matcher(result);
                if (!matcher.matches()){
                    throw new RuntimeException("Expected an array while running enhancement.");
                }
                return convertToArray(result);
            } else {
//                result = result.replace("\"", "");
//                if(o.getClass() == Double.class) {
//                    Double dd = (Double) o;
//                    return dd.intValue();
//                }
                return o;
            }
        } catch (ScriptException | IOException e){
            throw new RuntimeException(e);
        }
    }

    private static String incrementIndexes(String path){
        String result = "";
        List<String> pathParts = Arrays.asList( path.split("\\."));

        for (String part : pathParts) {
            final Pattern pattern = Pattern.compile(RegExpression.arrayWithNumberIndex, Pattern.MULTILINE);
            final Matcher matcher = pattern.matcher(part);

            int intIndex = 0;
            while (matcher.find()) {
                String index = matcher.group(1);
                intIndex = Integer.parseInt(index) + 1;
                part = part.replaceFirst("\\[" + index + "\\]", "[" + intIndex + "]");
            }

            if (!result.isEmpty()) {
                result = result + "." + part;
            } else {
                result = result + part;
            }
        }
        return result;
    }

    public Object getValueFromResponseData(String ref){
        String color = ConditionUtility.getMethodKey(ref);

        MessageContainer messageContainer = responseData
                .stream()
                .filter(m -> m.getMethodKey().equals(color))
                .findFirst().orElse(null);
        return messageContainer.getValue(ref, getLoopIndex());
    }

    public String getValueFromQueryParams(String exp) {

        try {
            if (exp == null || exp.isEmpty()) {
                return "";
            }
//            StringBuilder result = new StringBuilder(exp);
            if (queryParams.isEmpty()) {
                return null;
            }

            String message = new ObjectMapper().writeValueAsString(queryParams);
//        JsonPath.read(message, jsonPath)

            Pattern r = Pattern.compile(RegExpression.webhook);
            Matcher m = r.matcher(exp);

            while (m.find()) {
                String s = "$." + m.group().replace("${", "").replace("}", "");
                Object val = JsonPath.read(message, s);
                exp = exp.replace(m.group(), val.toString());
            }

//            for (Map.Entry<String, Object> entry : queryParams.entrySet()) {
//                String pointer = "${" + entry.getKey() + "}";
//                if (!result.contains(pointer)){
//                    continue;
//                }
//                result = result.replace(pointer, entry.getValue().toString());
//            }
            return exp;
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }

    }

    public Object getValueWebhookParams(String exp) {
        try {
            if (exp == null || exp.isEmpty()) {
                return "";
            }
            Object result = null;
            if (queryParams.isEmpty()) {
                return null;
            }
            String type = "";
            if (exp.contains(":")) {
                type = exp.split(":")[1].replace("}", "");
                exp = exp.split(":")[0].concat("}");
            }

            String message = new ObjectMapper().writeValueAsString(queryParams);
//        JsonPath.read(message, jsonPath)

            Pattern r = Pattern.compile(RegExpression.webhook);
            Matcher m = r.matcher(exp);
            while (m.find()) {
                String s = "$." + m.group().replace("${", "").replace("}", "");
                Object val = JsonPath.read(message, s);
                result = !type.isEmpty() ? convertToType(val, type) : getProperTypeOfValue(val);
            }
//            for (Map.Entry<String, Object> entry : queryParams.entrySet()) {
//                String pointer = "${" + entry.getKey() + "}";
//                if (!exp.contains(pointer)){
//                    continue;
//                }
//                result = !type.isEmpty() ? convertToType(entry.getValue(), type) : getProperTypeOfValue(entry.getValue());
//                break;
//            }
            return result;
        } catch (JsonProcessingException ex) {
            throw new RuntimeException();
        }

    }

    private Object convertToType(Object val, String type) {
        Object result = val.toString();
        if (type.equalsIgnoreCase("string")){
            result = val.toString().replace("[","").replace("]","").replace("'","");
        } else if (type.equalsIgnoreCase("int")){
            result = Long.parseLong(val.toString());
        } else if(type.equalsIgnoreCase("double") || type.equalsIgnoreCase("float")) {
            result = Double.parseDouble(val.toString());
        } else if (type.equalsIgnoreCase("array")){
            result = val.toString().replace("[","")
                    .replace("]","")
                    .replace("\"","")
                    .replace("\'","").split(",");
        }

        return result;
    }

    private Object getProperTypeOfValue(Object val){
        if (val == null) {
            return null;
        }
        Object result = val.toString();
        final Pattern pattern = Pattern.compile(RegExpression.isNumber, Pattern.MULTILINE);
        final Matcher matcher = pattern.matcher(val.toString());

        boolean isNumber = false;
        while (matcher.find()) {
            isNumber = true;
        }

        if (isNumber && val.toString().contains(".")) {
            result = Double.parseDouble(val.toString());
        } else if (isNumber) {
            result = Long.parseLong(val.toString());
        }
        return result;
    }

    public String getValueFromRequestData(String exp) {
        if (exp == null || exp.isEmpty()) {
            return "";
        }
        List<RequestData> request = new ArrayList<>();
//        String conn = exp.substring(1, 6);
        if ((exp.contains("CONN1.") && !conn.equals("CONN1")) || (exp.contains("CONN2.") && !conn.equals("CONN1"))){
            request = supportRequestData;
        } else {
            request = requestData;
        }

        String result = exp;
        for (RequestData data : request) {
            String pointer = "{" + data.getField() + "}";
            if (exp.contains("CONN1.")){
                pointer = "{" + "CONN1." + data.getField() + "}";
            } else if (exp.contains("CONN2.")) {
                pointer = "{" + "CONN2." + data.getField() + "}";
            }
            if (!result.contains(pointer)){
                continue;
            }
            result = result.replace(pointer, data.getValue());
        }
        return result;
    }

    public Integer getIndexOfArray(String array) {
        return loopIndex.get(array);
    }

    public Invoker getInvoker() {
        return invoker;
    }

    public void setInvoker(Invoker invoker) {
        this.invoker = invoker;
    }

    public List<RequestData> getRequestData() {
        return requestData;
    }

    public void setRequestData(List<RequestData> requestData) {
        this.requestData = requestData;
    }

    public ArrayList<MessageContainer> getResponseData() {
        return responseData;
    }

    public List<RequestData> getSupportRequestData() {
        return supportRequestData;
    }

    public void setSupportRequestData(List<RequestData> supportRequestData) {
        this.supportRequestData = supportRequestData;
    }

    public Map<String, Object> getQueryParams() {
        return queryParams;
    }

    public void setQueryParams(Map<String, Object> queryParams) {
        this.queryParams = queryParams;
    }

    public String getConn() {
        return conn;
    }

    public void setConn(String conn) {
        this.conn = conn;
    }

    public void setResponseData(ArrayList<MessageContainer> responseData) {
        this.responseData = responseData;
    }

    public LinkedHashMap<String, Integer> getLoopIndex() {
        return loopIndex;
    }

    public void setLoopIndex(LinkedHashMap<String, Integer> loopIndex) {
        this.loopIndex = loopIndex;
    }

    public String getTaId() {
        return taId;
    }

    public void setTaId(String taId) {
        this.taId = taId;
    }

    public int getOrder() {
        return order++;
    }

    public void setOrder(int order) {
        this.order = order;
    }

    // ==================================== private zone ====================================================== //

    private List<?> convertToArray(String stringifiedArray){
        try {
            ObjectMapper mapper = new ObjectMapper();
            List jsonString = (List) mapper.readValue(stringifiedArray, Object.class);
            return jsonString;
        } catch (Exception e){
            throw new RuntimeException(e);
        }
    }

    private Map<String, String> parseExpertVars(String vars){
        Map<String,String> result = new HashMap<>();
        String[] line = vars.split("//");

        String key, value;
        for (String s : line){
            if (s.equals("") || !s.contains("var")){
                continue;
            }
//            int equal = s.indexOf("=");
            value = s.substring(s.indexOf('v')+3, s.indexOf('=')).replaceAll("\\s","");
            key = s.substring(s.indexOf('=') + 1)
                    .replaceAll("\\s", "")
                    .replaceAll("\\n","")
                    .replace(";","");

            result.put(key, value);
        }

        return result;
    }
}
