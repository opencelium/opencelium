package com.becon.opencelium.backend.ocel.utils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;

public class DateUtils {

    private DateUtils() {
    }

    public static boolean isDate(Object obj) {
        if (!(obj instanceof String str)) {
            return false;
        }
        try {
            LocalDate.parse(str);
            return true;
        } catch (DateTimeParseException e) {
            return false;
        }
    }

    public static long compareTo(Object d1, Object d2) {
        if (d1 instanceof String s1 && d2 instanceof String s2) {
            return s1.compareTo(s2);
        }
        throw new RuntimeException("Invalid date format : " + d1 + " and|or " + d2);
    }

    public static boolean isDateTime(Object object) {
        if (!(object instanceof String str)) {
            return false;
        }
        try {
            LocalDateTime.parse(str);
            return true;
        } catch (DateTimeParseException e) {
            return false;
        }
    }
}
