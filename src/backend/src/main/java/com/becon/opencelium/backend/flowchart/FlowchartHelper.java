package com.becon.opencelium.backend.flowchart;

import java.util.List;

public interface FlowchartHelper {
    <W extends Weight> List<String> sortTopologically(List<String> nodes, List<Edge<String, W>> adjacent);
}
