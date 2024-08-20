package com.becon.opencelium.backend.enums;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public enum DataRef {
//    String BASIC = "\\{(.*?):(.*?)\\}";
//    String BODY_REF = "%\\{(.*?)\\}";
//    String BODY_REF = "%\\{(.*?)\\}";
    BASIC("\\{(.*?):(.*?)\\}"), BODY("%\\{(.*?)\\}"), REQ_DATA("\\{(.*?)\\}");

    private final String regex;

    DataRef(String regex) {
        this.regex = regex;
    }

    @Override
    public String toString() {
        return regex;
    }

    public static DataRef getType(String expression) {
        for (DataRef ref : values()) {
            Pattern pattern = Pattern.compile(ref.toString());
            Matcher matcher = pattern.matcher(expression);
            if (matcher.find()) {
                return ref;
            }
        }
        return null;
    }
}
