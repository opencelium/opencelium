package com.becon.opencelium.backend.ocel.utils;

public class NumberUtils {
    public static int compareTo(Number n1, Number n2) {
        double d1 = n1.doubleValue();
        double d2 = n2.doubleValue();
        return Double.compare(d1, d2);
    }
}
