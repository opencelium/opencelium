package com.becon.opencelium.backend.flowchart;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.database.mongodb.entity.MapperMng;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.utility.ReferenceUtility;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public class MapperUtils {
    private MapperUtils() {
    }

    public static List<Edge<String, PairWeight<String, String>>> convertToEdges(List<MapperMng> mappers, Map<String, String> colorMap, List<String> nodes) {
        List<Edge<String, PairWeight<String, String>>> response = new ArrayList<>();

        for (MapperMng mapper : mappers) {
            List<Edge<String, PairWeight<String, String>>> edges = convertToEdges(mapper, colorMap, nodes);
            response.addAll(edges);
        }

        return response;
    }

    public static List<Edge<String, PairWeight<String, String>>> convertToEdges(MapperMng mapper, Map<String, String> colorMap, List<String> nodes) {
        Map<String, String> args = mapper.getArgs();
        if (args == null) {
            throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, "ARGS_NULL");
        }

        String resultVar = args.get("RESULT_VAR");
        if (resultVar == null) {
            throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, "MISSING_RESULT_VAR");
        }

        String targetColor = ReferenceUtility.extractColor(resultVar);
        String targetFlowchart = colorMap.get(targetColor);

        if (targetFlowchart == null) {
            throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, "METHOD_NOT_FOUND");
        }

        List<Edge<String, PairWeight<String, String>>> edges = new ArrayList<>();
        for (Map.Entry<String, String> entry : args.entrySet()) {
            if (entry.getKey().equals("RESULT_VAR")) {
                continue;
            }

            String exchange = ReferenceUtility.extractExchangeType(entry.getValue());

            if ("response".equals(exchange)) {
                String color = ReferenceUtility.extractColor(entry.getValue());
                String sourceFlowchart = colorMap.get(color);

                if (sourceFlowchart == null) {
                    throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, "METHOD_NOT_FOUND");
                }

                if (Objects.equals(sourceFlowchart, targetFlowchart)) {
                    continue;
                }

                Edge<String, PairWeight<String, String>> edge = new Edge<>(sourceFlowchart, targetFlowchart, PairWeight.of(entry.getValue(), resultVar));
                edges.add(edge);
            }
        }
        return edges;
    }
}
