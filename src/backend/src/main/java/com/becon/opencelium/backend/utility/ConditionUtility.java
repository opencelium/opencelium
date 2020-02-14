/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.utility;

import com.becon.opencelium.backend.neo4j.entity.StatementNode;
import com.becon.opencelium.backend.resource.connection.StatementResource;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ConditionUtility {
    private static final String operators = "\\&{1,2}|<=|>=|<|>|\\!=|==|\\![A-Za-z0-9_]|\\|{1,2}";

    public static String findOperator(String condition){
        Pattern pattern = Pattern.compile(operators, Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(condition);
        boolean hasOperator = matcher.find();
        String[] params = pattern.split(condition);

        if (!hasOperator){
            throw new RuntimeException("Operator not found in condition");
        }

        return matcher.group();
    }

    public static StatementResource buildStatement(StatementNode statementNode){
        if (statementNode == null){
            return null;
        }
        return new StatementResource(statementNode);
//        StatementResource statementResource = new StatementResource();
//        String type = "";
//        String color = "";
//        String field = "";
//        String rightPropertyValue = "";
//        if (direction.equals("left")){
////            type = condition.substring(params[0].indexOf('(') + 1, params[0].indexOf(')'));
////            color = condition.substring(params[0].indexOf('#'), params[0].indexOf('.'));
////            field = params[0].replace("(" + type + ").", "").replace(color + ".","");
//            type = getExchangeType(condition);
//            color = getMethodKey(condition);
//            field = getRefValue(condition);
//        }else {
////            field = params[1];
////            if(params[1] != null && params[1].contains("#") && params[1].contains("(") && params[1].contains(")")){
////                type = condition.substring(params[1].indexOf('(') + 1, params[1].indexOf(')'));
////                color = condition.substring(params[1].indexOf('#'), params[1].indexOf('.'));
////                field = params[1].replace("(" + type + ").", "").replace(color + ".","");
////            }
//            type = null;
//            color = null;
//            field = condition;
//        }
//        statementResource.setType(type);
//        statementResource.setColor(color);
//        statementResource.setField(field);
    }

    //TODO: should be in StatementNodeService class;
    public static StatementNode buildStringStatement(StatementResource statementResource){
        if (statementResource == null){
            return null;
        }
//        String result = "";
//
//        if (statementResource.getColor() != null && !statementResource.getColor().isEmpty()){
//            result = result + statementResource.getColor() + ".(";
//        }
//
//        if (statementResource.getType() != null && !statementResource.getType().isEmpty()){
//            result = result + statementResource.getType() + ").";
//        }

        return new StatementNode(statementResource);
    }

    public static String getArray(String condition) {

        List<String> conditionParts =  Arrays.asList(condition.split("\\."));
        int size = conditionParts.size();
        String result = getRefValue(condition);
        for (int i = size - 1; i > 1; i--) {
            String part = conditionParts.get(i);
            if (i == (size - 1) && !conditionParts.get(size - 1).contains("[")){
                continue;
            }
            if (part.contains("[index]")){
                part = part.replace("index", "");
            }

            String value = part.substring(part.indexOf("[")+1,part.indexOf("]"));

            if (!value.equals("")){
                part = part.replace(value, "");
            }

            result = result + "." + part;
        }
        return result;
    }

    public static String getLastArray(String condition){
        List<String> refParts = Arrays.asList(condition.split("\\."));
        int size = refParts.size();

        String result = "";

        int currentSize = 1;
        for (String part : refParts) {
            if (!part.contains("[") && !part.contains("]") && currentSize == size){
                continue;
            }
            result = result + "." + part;
            currentSize++;
        }

        return result.replaceFirst("\\.", "");
    }

    public static String getExchangeType(String ref){
        return ref.substring(ref.indexOf('(') + 1, ref.indexOf(')'));
    }

    public static String getMethodKey(String ref){
        return ref.substring(ref.indexOf('#'), ref.indexOf('.'));
    }

    public static String getPathToValue(String ref){
        if (ref.equals("")){
            return "";
        }
        String[] refParts = ref.split("\\.");

        if(getExchangeType(ref).equals("response")){
            return refParts[0] + "." + refParts[1] + "." + refParts[2];
        }

        return refParts[0] + "." + refParts[1];
    }

    public static String getRefValue(String ref) {
        if (ref.equals("")){
            return "";
        }
        String[] refParts = ref.split("\\.");
        String result = "";
        if(getExchangeType(ref).equals("response")){
            return ref.replace(refParts[0]+".", "")
                      .replace(refParts[1] + ".", "")
                      .replace(refParts[2] + ".", "");
        }

        return ref.replace(refParts[0]+".", "")
                  .replace(refParts[1] + ".", "");
    }

    public static String getResult(String path) {
        String exchange = getExchangeType(path);

        if (exchange.equals("request")){
            return "";
        }

        String[] pathParts = path.split("\\.");

        return pathParts[2];
    }

    public static <T> double convertToDouble(T val){
        if (val instanceof Integer){
            return  (int) (Object) val;
        } else if (val instanceof  Long) {
            return  (long) (Object) val;
        } else if (val instanceof  Float) {
            return (float) (Object) val;
        } else if (val instanceof  Double) {
            return (double) (Object) val;
        } else {
            throw  new RuntimeException("Operands '>, <, >=, <=' don't work with String");
        }
    }
}
