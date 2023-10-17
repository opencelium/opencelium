package com.becon.opencelium.backend.database.mongodb.service.converter;

import java.util.ArrayList;
import java.util.List;

public
class Tree {
    private final List<Node> nodes;

    public Tree() {
        nodes = new ArrayList<>();
    }

    public void insert(String rawKey, String value) {
        String key = rawKey.substring(0, rawKey.indexOf("["));
        if (keyExists(key)) {
            Node node = find(key);
            add(node, rawKey, value);
        } else {
            Node node = new Node(key);
            nodes.add(node);
            add(node, rawKey, value);
        }
    }

    private Node find(String key) {
        for (Node node : nodes) {
            if (node.getKey().equals(key)) return node;
        }
        return new Node(key);
    }

    private boolean keyExists(String key) {
        for (Node node : nodes) {
            if (node.getKey().equals(key)) return true;
        }
        return false;
    }

    private void add(Node node, String rawKey, String value) {
        if (!rawKey.contains("[")) {
            node.setKey(rawKey);
            node.setValue(value);
        } else {
            rawKey = rawKey.substring(rawKey.indexOf("[") + 1);
            rawKey = rawKey.replaceFirst("]", "");
            if (!rawKey.contains("[")) {
                Node field = new Node(rawKey, value);
                node.getFields().add(field);
            }
            else {
                String newKey = rawKey.substring(0, rawKey.indexOf("["));
                Node field;
                if (node.isField(newKey)) {
                    field = node.find(newKey);
                } else {
                    field = new Node(newKey);
                    node.getFields().add(field);
                }
                add(field, rawKey, value);
            }
        }
    }

    public List<Node> getNodes() {
        return nodes;
    }
}

class Node {
    private String key;
    private String value;
    private List<Node> fields;

    public Node() {
        fields = new ArrayList<>();
    }

    public Node(String key, String value) {
        this.key = key;
        this.value = value;
        fields = new ArrayList<>();
    }

    public Node(String key) {
        this(key, null);
    }

    public boolean isField(String key) {
        for (Node g : fields) {
            if (g.key.equals(key)) return true;
        }
        return false;
    }

    public Node find(String key) {
        for (Node g : fields) {
            if (g.key.equals(key)) return g;
        }
        return null;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public List<Node> getFields() {
        return fields;
    }

    public void setFields(List<Node> fields) {
        this.fields = fields;
    }
}
