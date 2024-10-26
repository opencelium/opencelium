package com.becon.opencelium.backend.ocel.utils;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class DateUtils {

    public static boolean isDate(String dateStr) {
        try {
            LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
            return true;
        } catch (DateTimeParseException e) {
            return false;
        }
    }

    public static long compareTo(String d1, String d2) {
        LocalDate date1 = LocalDate.parse(d1, DateTimeFormatter.ISO_LOCAL_DATE);
        LocalDate date2 = LocalDate.parse(d2, DateTimeFormatter.ISO_LOCAL_DATE);

        return date1.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
                -
                date2.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }
}
