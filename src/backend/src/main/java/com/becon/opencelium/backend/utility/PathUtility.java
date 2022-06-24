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
        if (path.indexOf(')') == path.length() - 1) {
            return "";
        }
        return path.substring(path.indexOf(')') + 2);
    }

    //(request.success).f1.f2.f3[]
    public static String getFieldsAsXpath(String path) {
        if (path.length() == 0) {
            return "";
        }
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
        String fieldXpath = getFieldsAsXpath(getFields(path));
        String bodyPath = getXPathTillBody(path, method);
        if (fieldXpath.length() == 0) {
            return bodyPath;
        }
        return bodyPath + "/" + fieldXpath;
    }

    public static String convretToXField(String field) {
        return "field[@name='" + field + "']";
    }
}
