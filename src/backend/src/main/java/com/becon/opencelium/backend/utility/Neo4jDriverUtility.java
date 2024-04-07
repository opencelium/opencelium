package com.becon.opencelium.backend.utility;

import com.becon.opencelium.backend.resource.update_assistant.migrate.neo4j.ConnectionNode;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.neo4j.driver.types.Node;
import org.neo4j.driver.types.Path;

import java.util.List;

public class Neo4jDriverUtility {
    public static ConnectionNode convertResultToConnectionNode(final Result result) {
        String lastLabel = null;
        while (result.hasNext()) {
            Record record = result.next();
            Path connectionPath = record.get("p").asPath();
            for (Node node : connectionPath.nodes()) {
                String currLabel = ((List<String>) node.labels()).get(0);
            }
        }
        return null;
    }

    private static class Tree {
        private String label;
        private Node node;
        private List<Tree> children;

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public Node getNode() {
            return node;
        }

        public void setNode(Node node) {
            this.node = node;
        }

        public List<Tree> getChildren() {
            return children;
        }

        public void setChildren(List<Tree> children) {
            this.children = children;
        }
    }
//    private enum Label{
//        CONNECTION("Connection", 0),
//        CONNECTOR("Connector", 1),
//        METHOD("Method", 2),
//        CONNECTION("Connection", 0),
//        CONNECTION("Connection", 0),
//        CONNECTION("Connection", 0),
//        CONNECTION("Connection", 0),
//        CONNECTION("Connection", 0),
//        CONNECTION("Connection", 0),
//        CONNECTION("Connection", 0),
//        CONNECTION("Connection", 0),
//        CONNECTION("Connection", 0),
//        private final String name;
//        private final int depth;
//
//        Label(String name, int depth) {
//            this.name = name;
//            this.depth = depth;
//        }
//
//        public String getName() {
//            return name;
//        }
//        public int getDepth() {
//            return depth;
//        }
//
//    }
}
