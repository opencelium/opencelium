package com.becon.opencelium.backend.utility;

import org.mariadb.jdbc.type.LineString;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Stack;


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

    public static String getColor(String ref){
        return ref.substring(ref.indexOf('#'), ref.indexOf('.'));
    }

    public static String getExchangeType(String ref){
        // #ffffff.(response | request). ...
        return ref.substring(ref.indexOf('(') + 1, ref.indexOf(')'));
    }

    public static String getResult(String ref) {
        String exchange = getExchangeType(ref);
        String res = "";

        if (exchange.equals("response")){
            res = ref.split("\\.")[2];
        }

        return res;
    }

    public static String[] getReferenceParts(String ref) {
        if (ref.isEmpty()) {
            return new String[]{""};
        }

        String[] refParts = ref.split("\\.");
        // remove method color and exchange type
        ref = ref.replace(refParts[0] + ".", "")
                .replace(refParts[1] + ".", "");

        if (getExchangeType(ref).equals("response")) {
            // remove 'fail' or 'success' for 'response' type
            ref = ref.replace(refParts[2] + ".", "");
        }

        ref += ".";

        List<String> parts = new ArrayList<>();
        StringBuilder holder = new StringBuilder();
        Stack<Character> braces = new Stack<>();

        for (char current : ref.toCharArray()) {
            if (current == '.' && braces.isEmpty()) {
                parts.add(holder.toString());

                holder = new StringBuilder();
            } else if (current == '[') {
                braces.push(current);
            } else if (current == ']') {
                char top = braces.peek();
                if (top == '[') {
                    braces.pop();
                } else {
                    throw new RuntimeException("Wrong value is supplied to reference");
                }
            } else {
                holder.append(current);
            }
        }

        String[] result = new String[parts.size()];

        for (int i = 0; i < parts.size(); i++) {
            result[i] = parts.get(i);
        }

        return result;
    }

    public static String getPointerToBody(String ref, int partCount, String remove) {
        String[] refParts = getReferenceParts(ref);
        partCount = partCount + (getExchangeType(ref).equals("response") ? 2 : 1);

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
