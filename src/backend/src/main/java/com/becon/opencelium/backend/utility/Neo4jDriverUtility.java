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
            List<Relationship> relationships = (List<Relationship>) path.relationships();

            Node node = path.end(); //target node
            if (node.hasLabel("Method")) {
                MethodMng method = mapMethod(node.asMap());
                methods.add(method);

                if (i + 1 >= records.size()) {
                    return i;
                }
                Node lastNodeOfNextRecord = records.get(i + 1).get("p").asPath().end();

                if (lastNodeOfNextRecord.hasLabel("Method") || lastNodeOfNextRecord.hasLabel("Statement")) {
                    i = crawlMethodAndOperators(methods, operators, i + 1, records);
                    //i - an index of the last visited record
                } else if (lastNodeOfNextRecord.hasLabel("Request")) {
                    i = getRequest(method, i + 1, records);
                    //i - an index of the last visited record
                    i = getResponse(method, i + 1, records);
                    //i - an index of the last visited record
                } else if (lastNodeOfNextRecord.hasLabel("Response")) {
                    i = getResponse(method, i + 1, records);
                    //i - an index of the last visited record
                    i = getRequest(method, i + 1, records);
                    //i - an index of the last visited record
                }
            } else if (node.hasLabel("Statement")) {
                OperatorMng operator = mapStatement(node.asMap());
                operators.add(operator);

                if (i + 1 >= records.size()) {
                    return i;
                }
                Node lastNodeOfNextRecord = records.get(i + 1).get("p").asPath().end();

                if (lastNodeOfNextRecord.hasLabel("Method") || lastNodeOfNextRecord.hasLabel("Statement")) {
                    i = crawlMethodAndOperators(methods, operators, i + 1, records);
                    //i - an index of the last visited record
                } else if (lastNodeOfNextRecord.hasLabel("Variable")) {
                    if (relationships.get(relationships.size() - 1).hasType("left")) {
                        completeOperator(operator.getCondition(), records.get(i + 1), "left");
                    } else {
                        completeOperator(operator.getCondition(), records.get(i + 1), "right");
                    }
                    //Variable records will be only in one record. So the last visited index is i+1
                    i++;
                }
            }
            y = i;
        }
        return y;
    }

    private static int getResponse(MethodMng method, int y, List<Record> records) {
        if (!records.get(y).get("p").asPath().end().hasLabel("Response")) {
            return y - 1;
        }
        ResponseMng responseMng = new ResponseMng();
        method.setResponse(responseMng);
        return getResult(responseMng, y + 1, records);
    }

    private static int getRequest(MethodMng methodMng, int y, List<Record> records) {
        Record record = records.get(y);
        Path path = record.get("p").asPath();
        List<Relationship> relationships = (List<Relationship>) path.relationships();
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
        if (relationships.get(relationships.size() - 1).hasType("has_header")) {
            y = getHeader(requestMng.getHeader(), y + 1, records);
            return getBody(requestMng.getBody(), y + 1, records);
        } else {
            y = getBody(requestMng.getBody(), y + 1, records);
            return getHeader(requestMng.getHeader(), y + 1, records);
        }
    }

    private static int getResult(ResponseMng responseMng, int y, List<Record> records) {
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
        return getFields(bodyMng.getFields(), records, y + 1, 1);
    }

    private static int getFields(Map<String, Object> fields, List<Record> records, int y, int level) {
        for (int i = y; i < records.size(); i++) {
            Path path = records.get(i).get("p").asPath();
            Node node = path.end();
            int currLevel = findLevelOfField(path);
            int nextLevel = findLevelOfField(records.get(i + 1).get("p").asPath());
            if (level == 0 || !node.hasLabel("Field") || currLevel != level) {
                return i - 1;
            }
            String name = (String) node.asMap().get("name");
            String type = (String) node.asMap().get("type");
            switch (type) {
                case "object" -> {
                    Map<String, Object> map = new HashMap<>();
                    fields.put(name, map);
                    i = getFields(map, records, i + 1, nextLevel);
                }
                case "array" -> {
                    Object value = node.asMap().getOrDefault("value", null);
                    if (value != null && value.equals("")) {
                        fields.put(name, new ArrayList<>());
                        i = getFields(fields, records, i + 1, nextLevel);
                    } else {
                        List<Map<String, Object>> list = new ArrayList<>();
                        list.add(new HashMap<>());
                        fields.put(name, list);
                        i = getFields(list.get(0), records, i + 1, nextLevel);
                    }
                }
                default -> { //string, integer, boolean
                    Object value = node.asMap().get("value");
                    if (value instanceof String str) {
                        fields.put(name, str);
                    } else if (value instanceof Boolean b) {
                        fields.put(name, b);
                    } else if (value instanceof Integer in) {
                        fields.put(name, in);
                    } else {
                        fields.put(name, value);
                    }
                    i = getFields(fields, records, i + 1, nextLevel);
                }
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
        int aggregatorId = (Integer) fields.getOrDefault("aggregatorId", 0);
        MethodMng methodMng = new MethodMng();
        methodMng.setColor(color);
        methodMng.setName(name);
        methodMng.setIndex(index);
        methodMng.setLabel(label);
        methodMng.setDataAggregator(aggregatorId);
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