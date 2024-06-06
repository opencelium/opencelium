package com.becon.opencelium.backend.invoker.enums;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public enum PageParam {
    SIZE("size"), OFFSET("offset"), LIMIT("limit"), RESULT("result"), ORDER("order"), PAGE("page"),
    SORT("sort"), CATEGORY("category"), NEXT("next"), PREV("prev"), LINK("link"), HAS_MORE("has_more"),
    CURSOR("cursor");
    private final String param;
    private static final Map<String, PageParam> STRING_TO_ENUM = new HashMap<>();

    PageParam(String param) {
        this.param = param;
    }

    static {
        for (PageParam p : values()) {
            STRING_TO_ENUM.put(p.toString().toLowerCase(), p);
        }
    }

    public static PageParam fromString(String param) {
        PageParam pageParam = STRING_TO_ENUM.get(param.toLowerCase());
        if (pageParam != null) {
            return pageParam;
        }
        throw new IllegalArgumentException("Unknown pagination param: " + param + "\n" +
                "Use following params: " + Arrays.toString(PageParam.values()));
    }

    @Override
    public String toString() {
        return param;
    }
}
