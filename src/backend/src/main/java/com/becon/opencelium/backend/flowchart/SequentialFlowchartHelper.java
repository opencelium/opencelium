package com.becon.opencelium.backend.flowchart;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.exception.GeneralServiceException;

import java.util.*;

/**
 * Helper class for sequential flowcharts.
 * Provides methods to sort nodes topologically and detect cycles in directed graphs.
 */
public class SequentialFlowchartHelper implements FlowchartHelper {

    private static final FlowchartHelper INSTANCE = new SequentialFlowchartHelper();

    public static FlowchartHelper getInstance() {
        return INSTANCE;
    }

    /**
     * Performs topological sort on a directed graph.
     * If a cycle exists, throws an exception with JSON describing the smallest cycle.
     *
     * @param nodes the list of nodes in the graph
     * @param edges the list of edges connecting the nodes
     * @param <W>   type of the edge weight
     * @return list of nodes in topologically sorted order
     * @throws GeneralServiceException if a cycle is detected
     */
    @Override
    public <W extends Weight> List<String> sortTopologically(List<String> nodes, List<Edge<String, W>> edges) {
        Map<String, List<Edge<String, W>>> adj = buildAdjacencyList(nodes, edges);
        Map<String, Integer> inDegree = computeInDegrees(nodes, edges);

        Queue<String> zeroInDeg = new ArrayDeque<>();
        inDegree.forEach((node, deg) -> {
            if (deg == 0) zeroInDeg.add(node);
        });

        List<String> sortedNodes = new ArrayList<>();
        Set<String> remainingNodes = new HashSet<>(nodes);

        // Kahn's algorithm
        while (!zeroInDeg.isEmpty()) {
            String node = zeroInDeg.poll();
            sortedNodes.add(node);
            remainingNodes.remove(node);

            for (Edge<String, W> e : adj.get(node)) {
                String to = e.to;
                inDegree.put(to, inDegree.get(to) - 1);
                if (inDegree.get(to) == 0) zeroInDeg.add(to);
            }
        }

        // If remainingNodes is not empty, those nodes are in cycles
        if (!remainingNodes.isEmpty()) {
            W lastEdgeWeight = findSmallestCycle(new ArrayList<>(remainingNodes), adj);
            if (lastEdgeWeight != null) {
                throw new GeneralServiceException(ExceptionConstant.CYCLE_DETECTED, "'%s' causes a cycle between flowcharts".formatted(lastEdgeWeight.serialize()));
            }
        }

        return sortedNodes;
    }

    /**
     * Builds adjacency list from nodes and edges.
     */
    private <W> Map<String, List<Edge<String, W>>> buildAdjacencyList(List<String> nodes, List<Edge<String, W>> edges) {
        Map<String, List<Edge<String, W>>> adj = new HashMap<>();
        for (String node : nodes) adj.put(node, new ArrayList<>());
        for (Edge<String, W> e : edges) adj.get(e.from).add(e);
        return adj;
    }

    /**
     * Computes in-degree count for each node.
     */
    private <W> Map<String, Integer> computeInDegrees(List<String> nodes, List<Edge<String, W>> edges) {
        Map<String, Integer> inDegree = new HashMap<>();
        for (String node : nodes) inDegree.put(node, 0);
        for (Edge<String, W> e : edges) inDegree.put(e.to, inDegree.get(e.to) + 1);
        return inDegree;
    }

    /**
     * Finds a cycle among the given nodes using DFS.
     */
    private <W> W findSmallestCycle(List<String> nodes,
                                    Map<String, List<Edge<String, W>>> adj) {
        Set<String> visited = new HashSet<>();
        Set<String> recStack = new HashSet<>();
        List<String> path = new ArrayList<>();

        for (String node : nodes) {
            W cycleWeight = dfsCycle(node, adj, visited, recStack, path);
            if (cycleWeight != null) {
                return cycleWeight;
            }
        }

        return null; // no cycle
    }


    private <W> W dfsCycle(String node,
                           Map<String, List<Edge<String, W>>> adj,
                           Set<String> visited,
                           Set<String> recStack,
                           List<String> path) {

        if (recStack.contains(node)) {
            // cycle closed: the last edge is (path.last -> node)
            String from = path.get(path.size() - 1);

            for (Edge<String, W> e : adj.get(from)) {
                if (e.to.equals(node)) {
                    return e.weight;
                }
            }
            return null;
        }

        if (visited.contains(node)) return null;

        visited.add(node);
        recStack.add(node);
        path.add(node);

        for (Edge<String, W> e : adj.get(node)) {
            W result = dfsCycle(e.to, adj, visited, recStack, path);
            if (result != null) return result;
        }

        recStack.remove(node);
        path.remove(path.size() - 1);
        return null;
    }

}
