package com.becon.opencelium.backend.utility;


import com.becon.opencelium.backend.execution.oc721.Loop;

import java.util.Arrays;


public class DirectRefUtility {

    public static final String IS_FOR_IN_KEY_TYPE = "\\['(.*?)\\']~";
    public static final String IS_FOR_IN_VALUE_TYPE = "\\['(.*?)\\']";
    public static final String IS_SPLIT_STRING_TYPE = "\\[([a-z0-9*]+)\\]~";
    public static final String ARRAY_LETTER_INDEX = "\\[([a-z])\\]";


    public static String extractRef(String ref) {
        // '{%#ababab.(response).success.field[*]%}'
        if (ref.startsWith("{%") && ref.endsWith("%}")) {
            ref = ref.substring(2, ref.length() - 2);
        }

        // '#ababab.(response).success.field[*]
        // '#ababab.(request).field[*]
        return ref;
    }

    public static String getExchangeType(String ref){
        // #ffffff.(response | request). ...
        return ref.substring(ref.indexOf('(') + 1, ref.indexOf(')'));
    }

    public static String[] getReferenceParts(String ref) {
        if (ref.isEmpty()) {
            return new String[]{""};
        }

        String[] refParts = ref.split("\\.");
        int from = 2;

        if (getExchangeType(ref).equals("response")) {
            from++;
        }

        return Arrays.copyOfRange(refParts, from, refParts.length);
    }

    public static String getPointerToBody(String ref, int partCount, String remove) {
        partCount += 1;

        if (getExchangeType(ref).equals("response")) {
            partCount++;
        }

        String[] refParts = ref.split("\\.");
        String result = "";
        for (int i = 0; i < partCount; i++) {
            result += refParts[i] + ".";
        }

        result += refParts[partCount].replace(remove, "");

        return result;
    }

    public static boolean equals(String ref1, String ref2) {
        String[] actualRefParts = ref1.split("\\.");
        String[] potentialRefParts = ref2.split("\\.");

        // 'reference' should contain 'ref' as it is a specific part of it:
        if (actualRefParts.length > potentialRefParts.length) {
            return false;
        }

        String part;
        for (int i = 0; i < actualRefParts.length; i++) {
            // if 'part' contains index then remove it, otherwise take whole part
            if (actualRefParts[i].contains("[")) {
                part = actualRefParts[i].substring(0, actualRefParts[i].indexOf('['));
            } else {
                part = actualRefParts[i];
            }

            // 'potentialRefParts[i]' should contain part
            if (!potentialRefParts[i].contains(part)) {
                return false;
            }
        }

        return true;
    }
}
