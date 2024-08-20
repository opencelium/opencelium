package com.becon.opencelium.backend.enums;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public enum PageParamAction {
    READ("read"), WRITE("write"), INCREMENT("increment"), COLLECT("collect"), FETCH("fetch");
    private final String action;
    private static final Map<String, PageParamAction> STRING_TO_ENUM = new HashMap<>();

    PageParamAction(String action) {
        this.action = action;
    }

    static {
        for (PageParamAction p : values()) {
            STRING_TO_ENUM.put(p.toString().toLowerCase(), p);
        }
    }

    public static PageParamAction fromString(String param) {
        PageParamAction pageParam = STRING_TO_ENUM.get(param.toLowerCase());
        if (pageParam != null) {
            return pageParam;
        }
        throw new IllegalArgumentException("Unknown pagination action: " + param + "\n" +
                "Use following actions: " + Arrays.toString(PageParamAction.values()));
    }

    @Override
    public String toString() {
        return action;
    }
}
