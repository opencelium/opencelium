package com.becon.opencelium.backend.utility;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.database.mongodb.entity.BodyMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.entity.LinkedFieldMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;

import java.util.*;

import static com.becon.opencelium.backend.utility.PathAndReferenceUtility.rebuildReference;

public class BindingUtility {

//---------------------------------------------- detach --------------------------------------------------//

    public static void detach(List<MethodMng> methods, List<FieldBindingMng> fbs) {
        for (MethodMng method : methods) {
            if (method != null) {
                if (method.getRequest() != null && method.getRequest().getBody() != null) {
                    Map<String, Object> fields = method.getRequest().getBody().getFields();
                    if (fields != null) {
                        for (Map.Entry<String, Object> entry : fields.entrySet()) {
                            entry.setValue(findRefAndReplace(entry.getValue(), fbs));
                        }
                    }
                }
                if (method.getResponse() != null) {
                    if (method.getResponse().getFail() != null && method.getResponse().getFail().getBody() != null) {
                        Map<String, Object> fields = method.getResponse().getFail().getBody().getFields();
                        if (fields != null) {
                            for (Map.Entry<String, Object> entry : fields.entrySet()) {
                                entry.setValue(findRefAndReplace(entry.getValue(), fbs));
                            }
                        }
                    }
                    if (method.getResponse().getSuccess() != null && method.getResponse().getSuccess().getBody() != null) {
                        Map<String, Object> fields = method.getResponse().getSuccess().getBody().getFields();
                        if (fields != null) {
                            for (Map.Entry<String, Object> entry : fields.entrySet()) {
                                entry.setValue(findRefAndReplace(entry.getValue(), fbs));
                            }
                        }
                    }
                }

                for (FieldBindingMng fb : fbs) {
                    if (method.getRequest().getEndpoint().contains("{%" + fb.getId() + "%}")) {
                        method.getRequest().setEndpoint(method.getRequest().getEndpoint().replace("{%" + fb.getId() + "%}", getRefOfFBForPath(fb.getFrom())));
                    }
                    if (method.getRequest().getHeader() != null) {
                        for (Map.Entry<String, String> entry : method.getRequest().getHeader().entrySet()) {
                            if (entry.getValue().equals("#{%" + fb.getId() + "%}")) {
                                entry.setValue(getRefOfFBForHeader(fb.getFrom()));
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    private static Object findRefAndReplace(Object obj, List<FieldBindingMng> fieldBinding) {
        if (obj instanceof String str) {
            if (str.matches(RegExpression.enhancement)) {
                String id = str.replace("#{%", "")
                        .replace("%}", "");

                obj = getRefOfFB(id, fieldBinding);
            }
        } else if (obj instanceof List<?> list) {
            List<Object> objects = new ArrayList<>();
            for (Object o : list) {
                objects.add(findRefAndReplace(o, fieldBinding));
            }
            obj = objects;
        } else if (obj instanceof Map<?, ?> map) {
            Map<String, Object> res = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                res.put((String) entry.getKey(), findRefAndReplace(entry.getValue(), fieldBinding));
            }
            obj = res;
        }
        return obj;
    }

    private static String getRefOfFB(String id, List<FieldBindingMng> fieldBinding) {
        for (FieldBindingMng fb : fieldBinding) {
            if (fb.getId().equals(id)) {
                StringBuilder sb = new StringBuilder();
                for (LinkedFieldMng from : fb.getFrom()) {
                    sb.append(rebuildReference(from.getColor(), from.getType(), from.getField())).append(";");
                }
                sb.deleteCharAt(sb.length() - 1);
                return sb.toString();
            }
        }
        throw new RuntimeException("ENHANCEMENT_NOT_FOUND");
    }

    private static String getRefOfFBForPath(List<LinkedFieldMng> froms) {
        StringBuilder sb = new StringBuilder();
        for (LinkedFieldMng from : froms) {
            sb.append(rebuildReference(from.getColor(), from.getType(), from.getField())).append(";");
        }
        sb.deleteCharAt(sb.length() - 1);
        return "{%" + sb + "%}";
    }

    private static String getRefOfFBForHeader(List<LinkedFieldMng> froms) {
        StringBuilder sb = new StringBuilder();
        for (LinkedFieldMng from : froms) {
            sb.append(rebuildReference(from.getColor(), from.getType(), from.getField())).append(";");
        }
        sb.deleteCharAt(sb.length() - 1);
        return sb.toString();
    }

//--------------------------------------------------------------------------------------------------------//
//---------------------------------------------- bind ----------------------------------------------------//

    public static String doWithPath(String endpoint, String id, List<LinkedFieldMng> from) {
        List<String> refs = from.stream().map(x -> rebuildReference(x.getColor(), x.getType(), x.getField())).toList();
        int indexOfQuestionSign = PathAndReferenceUtility.findIndexOfQuesSign(endpoint);
        String query = null;
        if (indexOfQuestionSign != -1) {
            query = endpoint.substring(indexOfQuestionSign + 1);
            List<String[]> variables = PathAndReferenceUtility.getQueryVariables(query);
            out:
            for (String[] p : variables) {
                if (p[1].matches(".*" + RegExpression.wrappedDirectRef + ".*")) {
                    // p[1] can be:
                    // pure ref - '{%#ffffff.(response).body.$.a.b%}'
                    // one enhancement having several references - '{%#ffffff.(response).body.$.a.b;#ffffff.(response).a.c%}'
                    // more than one enhancement - 'userId_{%#ffffff.(response).body.$.user.id%}, username_{%#ffffff.(response).body.$.user.name%}'
                    for (String ref : refs) {
                        if (!p[1].contains(ref)) {
                            continue out;
                        }
                    }
                    p[1] = PathAndReferenceUtility.bindExactlyPlace(p[1], refs, id);
                }
            }
            StringJoiner sj = new StringJoiner("&");
            for (String[] p : variables) {
                sj.add(p[0] + "=" + p[1]);
            }
            query = sj.toString();
        }
        String path;
        if (indexOfQuestionSign == -1) {
            path = endpoint;
        } else {
            path = endpoint.substring(0, indexOfQuestionSign);
        }

        List<String> subPaths = PathAndReferenceUtility.splitByDelimiter(path, '/');
        out:
        for (int i = 0; i < subPaths.size(); i++) {
            if (subPaths.get(i).matches(".*" + RegExpression.wrappedDirectRef + ".*")) {
                for (String ref : refs) {
                    if (!subPaths.get(i).contains(ref)) {
                        continue out;
                    }
                }
                subPaths.set(i, PathAndReferenceUtility.bindExactlyPlace(subPaths.get(i), refs, id));
            }
        }
        StringJoiner sj = new StringJoiner("/");
        for (String p : subPaths) {
            sj.add(p);
        }
        path = sj.toString();

        return (query == null)
                ? path
                : path + "?" + query;
    }

    public static void doWithHeader(Map<String, String> header, String fieldName, String id, List<LinkedFieldMng> from) {
        List<String> refs = from.stream().map(x -> rebuildReference(x.getColor(), x.getType(), x.getField())).toList();
        header.entrySet()
                .stream()
                .filter(entry -> entry.getKey().equals(fieldName))
                .findFirst()
                .ifPresent(entry -> entry.setValue("#{%" + id + "%}"));
//                .ifPresent(entry -> entry.setValue(PathAndReferenceUtility.bindExactlyPlace(entry.getValue(), refs, id)));
    }

    public static Map<String, Object> doWithBody(BodyMng body, List<String> fieldPaths, String id, String format) {
        if (format.equals("xml")) {
            return doWithXMLBody(body.getFields(), body.getType(), fieldPaths, id);
        } else {
            return doWithJsonBody(body.getFields(), body.getType(), fieldPaths, id);
        }
    }

//--------------------------------------------------------------------------------------------------------//
//---------------------------------------------JSON(bind)-------------------------------------------------//

    private static Map<String, Object> doWithJsonBody(Map<String, Object> fields, String type, List<String> fieldPaths, String id) {
        String name = fieldPaths.get(0);
        if (type.equals("array") && fieldPaths.size() > 1 && (name.matches("\\d+") || name.matches("\\[.*]"))) {
            fieldPaths.remove(0);
            name = fieldPaths.get(0);
        }
        Map<String, Object> resultMap = new HashMap<>();
        for (Map.Entry<String, Object> entry : fields.entrySet()) {
            if (name.equals(entry.getKey()) && fieldPaths.size() == 1) {// the last field
                resultMap.put(entry.getKey(), putIdToBody(entry.getValue(), id));
            } else if (name.equals(entry.getKey())) { // object or primitive
                fieldPaths.remove(0);
                resultMap.put(entry.getKey(), processJSON(entry.getValue(), fieldPaths, id, null));
            } else if (name.matches(entry.getKey() + "\\[.*]")) { //array
                if (fieldPaths.size() == 1 && name.endsWith("[*]")) {
                    resultMap.put(entry.getKey(), putIdToBody(entry.getValue(), id));
                    continue;
                }
                fieldPaths.remove(0);
                String index = name.substring(name.lastIndexOf('[') + 1, name.lastIndexOf(']'));
                resultMap.put(entry.getKey(), processJSON(entry.getValue(), fieldPaths, id, index));
            } else {
                resultMap.put(entry.getKey(), entry.getValue());
            }
        }
        return resultMap;
    }

    @SuppressWarnings("unchecked")
    private static Object processJSON(Object value, List<String> fieldPaths, String id, String index) {
        if (index == null) {
            if (fieldPaths.isEmpty()) { // primitive type
                return putIdToBody(value, id);
            } else { // object
                Map<String, Object> map = (Map<String, Object>) value;
                return doWithJsonBody(map, "object", fieldPaths, id);
            }
        } else { // array
            if (index.isEmpty() || index.equals("*")) {
                //ex. param[] or param[*];
                //if a field to be bound is whole array then we needn't process it. Just bind id.
                return putIdToBody(value, id);
            } else if (index.matches("[0-9]+")) {
                //ex. param[1]
                //it means that this field's type is array. We just need to look through 1st element of an array
                int idx = Integer.parseInt(index);
                List<Object> list = (List<Object>) value;
                if (list.get(idx) instanceof Map<?, ?>) { //array of objects
                    List<Map<String, Object>> mapList = (List<Map<String, Object>>) value;
                    mapList.set(idx, doWithJsonBody(mapList.get(idx), "object", fieldPaths, id));
                    return mapList;
                } else { // array of primitives
                    list.set(idx, putIdToBody(list.get(idx), id));
                    return list;
                }
            } else {
                //ex. param[i]
                //it means that this field's type is array. We need to look through every element of an array
                List<Object> list = (List<Object>) value;
                if (list.get(0) instanceof Map<?, ?>) { // array of objects
                    List<Map<String, Object>> mapList = (List<Map<String, Object>>) value;
                    return mapList.stream()
                            .map(f -> doWithJsonBody(f, "object", fieldPaths, id));
                } else { // array of primitives
                    return list.stream()
                            .map(f -> putIdToBody(f, id))
                            .toList();
                }
            }
        }
    }

//--------------------------------------------------------------------------------------------------------//
//---------------------------------------------XML(bind)-------------------------------------------------//

    private static final String ocValue = "__oc__value";
    private static final String ocAttributes = "__oc__attributes";

    private static Map<String, Object> doWithXMLBody(Map<String, Object> fields, String type, List<String> fieldPaths, String id) {
        String name = fieldPaths.get(0);
        if (type.equals("array") && fieldPaths.size() > 1 && (name.matches("\\d+") || name.matches("\\[.*]"))) {
            fieldPaths.remove(0);
            name = fieldPaths.get(0);
        }
        Map<String, Object> resultMap = new HashMap<>();
        for (Map.Entry<String, Object> entry : fields.entrySet()) {
            if (name.equals(entry.getKey())) { // object or primitive
                fieldPaths.remove(0);
                resultMap.put(entry.getKey(), processXML(entry.getValue(), fieldPaths, id, null));
            } else if (name.matches(entry.getKey() + "\\[.*]")) { //array
                fieldPaths.remove(0);
                String index = name.substring(name.lastIndexOf('[') + 1, name.lastIndexOf(']'));
                resultMap.put(entry.getKey(), processXML(entry.getValue(), fieldPaths, id, index));
            } else {
                resultMap.put(entry.getKey(), entry.getValue());
            }
        }
        return resultMap;
    }

    @SuppressWarnings("unchecked")
    private static Object processXML(Object value, List<String> fieldPaths, String id, String index) {
        if (index == null) {
            if (fieldPaths.isEmpty() || fieldPaths.size() == 1 && PathAndReferenceUtility.startsWith(fieldPaths.get(0), "@")) { // primitive type
                if (value instanceof Map<?, ?>) {
                    Map<String, Object> map = (Map<String, Object>) value;
                    if (map.size() == 2 && map.containsKey(ocValue) && map.containsKey(ocAttributes)) {
                        if (fieldPaths.isEmpty()) {
                            map.put(ocValue, putIdToBody(map.get(ocValue), id));
                        } else {
                            if (map.get(ocAttributes) instanceof Map<?, ?>) {
                                Map<String, Object> ocAttrObj = (Map<String, Object>) map.get(ocAttributes);
                                String attrName = fieldPaths.get(0).substring(1);
                                ocAttrObj.put(attrName, putIdToBody(ocAttrObj.get(attrName), id));
                                map.put(ocAttributes, ocAttrObj);
                            }
                        }
                        return map;
                    } else {
                        throw new RuntimeException("UNABLE_TO_BIND : INCORRECT_PATH_OR_FIELD_NOT_FOUND");
                    }
                }
                return putIdToBody(value, id);
            } else { // object
                Map<String, Object> map = (Map<String, Object>) value;
                return doWithXMLBody(map, "object", fieldPaths, id);
            }
        } else { // array
            if (index.isEmpty()) {
                //ex. param[];
                //if a field to be bound is whole array then we needn't process it. Just bind id.
                return putIdToBody(value, id);
            } else if (index.matches("[0-9]+")) {
                //ex. param[1]
                //it means that this field's type is array. We just need to look through 1st element of an array
                int idx = Integer.parseInt(index);
                List<Object> list = (List<Object>) value;
                if (list.get(idx) instanceof Map<?, ?>) { //array of objects
                    List<Map<String, Object>> mapList = (List<Map<String, Object>>) value;
                    mapList.set(idx, doWithXMLBody(mapList.get(idx), "object", fieldPaths, id));
                    return mapList;
                } else { // array of primitives
                    list.set(idx, putIdToBody(list.get(idx), id));
                    return list;
                }
            } else {
                //ex. param[i]
                //it means that this field's type is array. We need to look through every element of an array
                List<Object> list = (List<Object>) value;
                if (list.get(0) instanceof Map<?, ?>) { // array of objects
                    List<Map<String, Object>> mapList = (List<Map<String, Object>>) value;
                    return mapList.stream()
                            .map(f -> doWithXMLBody(f, "object", fieldPaths, id));
                } else { // array of primitives
                    return list.stream()
                            .map(f -> putIdToBody(f, id))
                            .toList();
                }
            }
        }
    }


    //-----------------------------------------------Replace Id-----------------------------------------------------//
    public static void findAndReplaceId(MethodMng method, String reference, String id, String newId) {
        String location = ReferenceUtility.extractLocationType(reference);
        String path = ReferenceUtility.extractPath(reference);

        if ("path".equals(location)) {
            String replaced = method.getRequest().getEndpoint().replace("{%" + id + "%}", "{%" + newId + "%}");
            method.getRequest().setEndpoint(replaced);
        } else if ("header".equals(location)) {
            Map<String, String> header = method.getRequest().getHeader();
            if (header != null) {
                for (Map.Entry<String, String> entry : header.entrySet()) {
                    entry.setValue(entry.getValue().replace("{%" + id + "%}", "{%" + newId + "%}"));
                }
            }
        } else if ("body".equals(location)) {
            BodyMng body = method.getRequest().getBody();
            if (body != null) {
                List<String> subPaths = PathAndReferenceUtility.splitByDelimiter(path, '.');

                doWithBody(body, subPaths, newId, method.getRequest().getBody().getFormat());
            }
        }
    }

//--------------------------------------------------------------------------------------------------------//
//-----------------------------------------------Others-----------------------------------------------------//

    private static String putIdToBody(Object value, String id) {
        //just returns 'wrapped' id. Might be changed!
        return "#{%" + id + "%}";
    }
}
