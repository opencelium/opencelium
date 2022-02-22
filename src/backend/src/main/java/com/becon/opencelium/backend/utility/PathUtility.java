package com.becon.opencelium.backend.utility;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class PathUtility {

    //(request.success).f1.f2.f3[]
    public static String getExchange(String path) {
        return path.substring(1, path.indexOf(')')).split("\\.")[0];
    }

    public static String getStatus(String path) {
        // request.success
        String[] status = path.substring(1, path.indexOf(')')).split("\\.");
        return status.length == 2 ? status[1] : "";
    }

    public static String getFields(String path) {
        return path.substring(path.indexOf(')') + 2);
    }

    //(request.success).f1.f2.f3[]
    public static String getFieldsAsXpath(String path) {
        String[] str = path.split("\\.");
        if (str.length == 0) {
            return "field[@name='" + path + "']";
        }
        return Stream.of(str).map(s -> s.replace("[]", ""))
                             .map(s -> "field[@name='" + s + "']")
                             .collect(Collectors.joining("/"));
    }

    public static String getXPathTillBody(String path, String method) {
        String exchange = PathUtility.getExchange(path);
        String status = PathUtility.getStatus(path);
        status = status.isEmpty() ? "" : status + "/";
        return "/invoker/operations/operation[@name='" + method + "']/" + exchange + "/" + status  + "body";
    }

    public static String getXPathTillMethod(String method) {
        return "/invoker/operations/operation[@name='" + method + "']";
    }

    public static String convertToXpath(String path, String method) {
        return getXPathTillBody(path, method) + "/" + getFieldsAsXpath(getFields(path));
    }
}
