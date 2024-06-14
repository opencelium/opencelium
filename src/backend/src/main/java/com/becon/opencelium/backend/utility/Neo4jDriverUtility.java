package com.becon.opencelium.backend.utility;

import com.becon.opencelium.backend.database.mongodb.entity.*;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.neo4j.driver.types.Node;
import org.neo4j.driver.types.Path;
import org.neo4j.driver.types.Relationship;

import java.util.*;


public class Neo4jDriverUtility {

    public static void convertResultToConnection(final Result result, ConnectionMng connectionMng) {
        //Each records' structure : 0 - Connection, 1 - Connector, 2 - Method or Statement, ...
        List<Record> recordsForFromConnector = new ArrayList<>();
        List<Record> recordsForToConnector = new ArrayList<>();

        while (result.hasNext()) {
            Record record = result.next();

            Path connectionPath = record.get("p").asPath();
            List<Relationship> relationships = (List<Relationship>) connectionPath.relationships();
            if (relationships.size() < 2 || relationships.get(relationships.size() - 1).hasType("linked")) {
                continue;
            }
            if (relationships.get(0).hasType("from_connector")) {//is it from connector?
                recordsForFromConnector.add(record);
            } else {
                recordsForToConnector.add(record);
            }
        }
        setMethodAndOperators(recordsForFromConnector, connectionMng.getFromConnector());
        setMethodAndOperators(recordsForToConnector, connectionMng.getToConnector());
    }

    private static void setMethodAndOperators(List<Record> records, ConnectorMng connectorMng) {
        connectorMng.setMethods(new ArrayList<>());
        connectorMng.setOperators(new ArrayList<>());

        //adds all methods and operators to the methods and the operators lists
        crawlMethodAndOperators(connectorMng.getMethods(), connectorMng.getOperators(), 0, records);
    }

    private static int crawlMethodAndOperators(List<MethodMng> methods, List<OperatorMng> operators, int y, List<Record> records) {
        for (int i = y; i < records.size(); i++) {
            Path path = records.get(i).get("p").asPath();

            Node node = path.end(); //target node
            if (node.hasLabel("Method")) {
                MethodMng method = mapMethod(node.asMap());
                methods.add(method);

                if (i + 1 >= records.size()) {
                    return i;
                }
                Path nextPath = records.get(i + 1).get("p").asPath();
                Node lastNodeOfNextRecord = nextPath.end();
                if (lastNodeOfNextRecord.hasLabel("Method") || lastNodeOfNextRecord.hasLabel("Statement")) {
                    i = crawlMethodAndOperators(methods, operators, i + 1, records);
                } else if (lastNodeOfNextRecord.hasLabel("Request")) {
                    MethodMng prevMethod = findPrevMethod(methods, nextPath);
                    i = getRequest(prevMethod, i + 1, records);
                    i = getResponse(prevMethod, i + 1, records);
                } else if (lastNodeOfNextRecord.hasLabel("Response")) {
                    MethodMng prevMethod = findPrevMethod(methods, nextPath);
                    i = getResponse(prevMethod, i + 1, records);
                    i = getRequest(prevMethod, i + 1, records);
                }
            } else if (node.hasLabel("Statement")) { //exception-free
                OperatorMng operator = mapStatement(node.asMap());
                operators.add(operator);

                if (i + 1 >= records.size()) {
                    return i;
                }
                Path nextPath = records.get(i + 1).get("p").asPath();
                Node lastNodeOfNextRecord = nextPath.end();

                if (lastNodeOfNextRecord.hasLabel("Method") || lastNodeOfNextRecord.hasLabel("Statement")) {
                    i = crawlMethodAndOperators(methods, operators, i + 1, records);
                } else if (lastNodeOfNextRecord.hasLabel("Variable")) {
                    var nextRelationships = (List<Relationship>) nextPath.relationships();
                    if (nextRelationships.get(nextRelationships.size() - 1).hasType("left")) {
                        completeOperator(operator.getCondition(), records.get(i + 1), "left");
                    } else {
                        completeOperator(operator.getCondition(), records.get(i + 1), "right");
                    }
                    i++;
                }
            } else if (node.hasLabel("Request")) {
                MethodMng method = findPrevMethod(methods, path);
                i = getRequest(method, i, records);
//                i = getResponse(method, i, records, method.getName());
            } else if (node.hasLabel("Response")) {
                MethodMng method = findPrevMethod(methods, path);
                i = getResponse(method, i, records);
//                i = getRequest(method, i, records, method.getName());
            } else if (node.hasLabel("Variable")) {
                var relationships = (List<Relationship>) path.relationships();
                if (relationships.get(relationships.size() - 1).hasType("left")) {
                    OperatorMng prevOperator = findPrevOperator(operators, path);
                    completeOperator(prevOperator.getCondition(), records.get(i), "left");
                } else {
                    OperatorMng prevOperator = findPrevOperator(operators, path);
                    completeOperator(prevOperator.getCondition(), records.get(i), "right");
                }
            }
            y = i;
        }
        return y;
    }

    private static OperatorMng findPrevOperator(List<OperatorMng> operators, Path path) {
        Node a = null;
        Node b = null;
        for (Node node : path.nodes()) {
            a = b;
            b = node;
        }
        var map = a.asMap();
        String index = (String) map.get("index");
        String type = (String) map.get("type");
        return operators.stream()
                .filter(o -> o.getIndex().equals(index) && o.getType().equals(type))
                .findAny()
                .orElseThrow(() -> new RuntimeException("Operator[index: " + index + ", type: " + type + "] not found"));
    }

    private static MethodMng findPrevMethod(List<MethodMng> methods, Path path) {
        Node a = null;
        Node b = null;
        for (Node node : path.nodes()) {
            a = b;
            b = node;
        }
        var map = a.asMap();
        String color = (String) map.get("color");
        String index = (String) map.get("index");
        String name = (String) map.get("name");
        return methods.stream()
                .filter(m -> m.getColor().equals(color) && m.getName().equals(name) && m.getIndex().equals(index))
                .findAny()
                .orElseThrow(() -> new RuntimeException("Method not found with color: " + color));
    }

    private static int getResponse(MethodMng method, int y, List<Record> records) {
        if (y >= records.size()) {
            return records.size() - 1;
        }
        if (!records.get(y).get("p").asPath().end().hasLabel("Response")) {
            return y - 1;
        }
        ResponseMng responseMng = new ResponseMng();
        method.setResponse(responseMng);
        y = getResult(responseMng, y + 1, records);
        return y;
    }

    private static int getRequest(MethodMng methodMng, int y, List<Record> records) {
        if (y >= records.size()) {
            return records.size() - 1;
        }
        Record record = records.get(y);
        Path path = record.get("p").asPath();
        Node node = path.end();
        if (!node.hasLabel("Request")) {
            return y - 1;
        }
        String method = ((String) node.asMap().get("method"));
        String endpoint = ((String) node.asMap().get("endpoint"));
        RequestMng requestMng = new RequestMng();
        requestMng.setMethod(method);
        requestMng.setEndpoint(endpoint);
        requestMng.setBody(new BodyMng());
        requestMng.setHeader(new HashMap<>());
        methodMng.setRequest(requestMng);
        if (y + 1 >= records.size()) {
            return y;
        }
        Node nextNode = records.get(y + 1).get("p").asPath().end();
        if (nextNode.hasLabel("Header")) {
            y = getHeader(requestMng.getHeader(), y + 1, records);
            y = getBody(requestMng.getBody(), y + 1, records);
        } else if (nextNode.hasLabel("Body")) {
            y = getBody(requestMng.getBody(), y + 1, records);
            y = getHeader(requestMng.getHeader(), y + 1, records);
        }
        return y;
    }

    private static int getResult(ResponseMng responseMng, int y, List<Record> records) {
        if (y >= records.size())
            return records.size() - 1;
        Path path = records.get(y).get("p").asPath();
        Node node = path.end();
        if (!node.hasLabel("Result")) {
            return y - 1;
        }
        String status = node.asMap().getOrDefault("status", "200").toString();
        String name = node.asMap().getOrDefault("name", "success").toString();
        ResultMng resultMng = new ResultMng();
        resultMng.setStatus(status);
        resultMng.setBody(new BodyMng());
        if (name.equals("success")) {
            responseMng.setSuccess(resultMng);
        } else {
            responseMng.setFail(resultMng);
        }
        y = getBody(resultMng.getBody(), y + 1, records);
        return getResult(responseMng, y + 1, records);
    }

    private static int getHeader(Map<String, String> header, int y, List<Record> records) {
        if (y >= records.size()) {
            return records.size() - 1;
        }
        if (!records.get(y).get("p").asPath().end().hasLabel("Header")) {
            return y - 1;
        }
        //skip y-th node
        for (int i = y + 1; i < records.size(); i++) {
            Node node = records.get(i).get("p").asPath().end();
            if (node.hasLabel("Item")) {
                String name = (String) node.asMap().get("name");
                String value = (String) node.asMap().get("value");
                header.put(name, value);
            } else {
                return i - 1;
            }
        }
        return records.size() - 1;
    }

    private static int getBody(BodyMng bodyMng, int y, List<Record> records) {
        if (y >= records.size()) {
            return records.size() - 1;
        }
        Path path = records.get(y).get("p").asPath();
        Node node = path.end();
        if (!node.hasLabel("Body")) {
            return y - 1;
        }
        String data = ((String) node.asMap().get("data"));
        String type = ((String) node.asMap().get("type"));
        String format = ((String) node.asMap().get("format"));
        bodyMng.setData(data);
        bodyMng.setType(type);
        bodyMng.setFormat(format);
        bodyMng.setFields(new HashMap<>());
        y = getFields(bodyMng.getFields(), records, y + 1, 1);
        return y;
    }

    private static final String OC_ATTRIBUTES = "__oc__attributes";

    private static int getFields(Map<String, Object> fields, List<Record> records, int y, int level) {
        for (int i = y; i < records.size(); i++) {
            Path path = records.get(i).get("p").asPath();
            Node node = path.end();
            int currLevel = findLevelOfField(path);
            int nextLevel;
            if (i + 1 >= records.size()) {
                nextLevel = -1;
            } else {
                nextLevel = findLevelOfField(records.get(i + 1).get("p").asPath());
            }
            if (level == 0 || !node.hasLabel("Field") || currLevel != level) {
                return i - 1;
            }
            String name = (String) node.asMap().get("name");
            String type = (String) node.asMap().get("type");
            Object value = node.asMap().get("value");
            switch (type) {
                case "object" -> {
                    if (name.equals(OC_ATTRIBUTES) && value != null && value.equals("")) {
                        fields.put(name, "");
                        if (nextLevel < currLevel) {
                            return i;
                        }
                        i = getFields(fields, records, i + 1, nextLevel);
                    } else if (value instanceof String str) {
                        fields.put(name, str);
                        i = getFields(fields, records, i + 1, nextLevel);
                    } else {
                        Map<String, Object> map = new HashMap<>();
                        fields.put(name, map);
                        i = getFields(map, records, i + 1, nextLevel);
                    }
                }
                case "array" -> {
                    if (value != null) {
                        if (value instanceof String str) {
                            if (str.isEmpty()) {
                                fields.put(name, new ArrayList<>());
                            } else if (str.charAt(0) == '[' && str.charAt(str.length() - 1) == ']') {
                                List<Object> list = new ArrayList<>();
                                str = str.substring(1, str.length() - 1);
                                String[] elements = str.split(",");
                                for (String element : elements) {
                                    list.add(element.trim());
                                }
                                fields.put(name, list);
                            } else {
                                fields.put(name, value);
                            }
                            if (nextLevel < currLevel) {
                                return i;
                            }
                            i = getFields(fields, records, i + 1, nextLevel);
                        }
                    } else {
                        List<Map<String, Object>> list = new ArrayList<>();
                        list.add(new HashMap<>());
                        fields.put(name, list);
                        i = getFields(list.get(0), records, i + 1, nextLevel);
                    }
                }
                default -> { //string, integer, boolean
                    if (value instanceof String str) {
                        if(!str.isEmpty()) {
                            fields.put(name, str);
                        }
                    } else if (value instanceof Boolean b) {
                        fields.put(name, b);
                    } else if (value instanceof Integer in) {
                        fields.put(name, in);
                    } else {
                        fields.put(name, value);
                    }
                    if (nextLevel < currLevel) {
                        return i;
                    }
                    i = getFields(fields, records, i + 1, nextLevel);
                }
            }
            if (nextLevel == -1) {
                return i - 1;
            }
            y = i;
        }
        return y;
    }

    private static int findLevelOfField(Path path) {
        Iterable<Relationship> relationships = path.relationships();
        int count = 0;
        for (Relationship r : relationships) {
            if (r.hasType("has_field")) {
                count++;
            }
        }
        return count;
    }

    private static void completeOperator(ConditionMng conditionMng, Record record, String side) {
        Node node = record.get("p").asPath().end();
        if (side.equals("left")) {
            conditionMng.setLeftStatement(mapSV(node.asMap()));
        } else {
            conditionMng.setRightStatement(mapSV(node.asMap()));
        }
    }

    private static OperatorMng mapStatement(Map<String, Object> fields) {
        String index = (String) fields.get("index");
        String type = (String) fields.get("type");
        String iterator = (String) fields.get("iterator");
        String operand = (String) fields.get("operand");
        OperatorMng operatorMng = new OperatorMng();
        operatorMng.setIndex(index);
        operatorMng.setType(type);
        operatorMng.setIterator(iterator);
        ConditionMng conditionMng = new ConditionMng();
        conditionMng.setRelationalOperator(operand);
        operatorMng.setCondition(conditionMng);
        return operatorMng;
    }

    private static MethodMng mapMethod(Map<String, Object> fields) {
        String color = (String) fields.get("color");
        String name = (String) fields.get("name");
        String index = (String) fields.get("index");
        String label = (String) fields.get("label");
        long aggregatorId = (Long) fields.getOrDefault("aggregatorId", 0);
        MethodMng methodMng = new MethodMng();
        methodMng.setColor(color);
        methodMng.setName(name);
        methodMng.setIndex(index);
        methodMng.setLabel(label);
        methodMng.setDataAggregator((int) aggregatorId);
        return methodMng;
    }

    private static StatementMng mapSV(Map<String, Object> sv) {
        StatementMng statementMng = new StatementMng();
        String color = (String) sv.get("color");
        String filed = (String) sv.get("filed");
        String type = (String) sv.get("type");
        String rightPropertyValue = (String) sv.get("rightPropertyValue");
        statementMng.setColor(color);
        statementMng.setField(filed);
        statementMng.setType(type);
        statementMng.setRightPropertyValue(rightPropertyValue);
        return statementMng;
    }
}