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

package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.utility.ConditionUtility;
import com.jayway.jsonpath.JsonPath;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MessageContainer {

    private String methodKey;
    private String exchangeType;
    private String result;
    private List<String> loopingArrays; // level of loops
    private HashMap<Integer, String> data; // data from last loop if loop is nested

    public MessageContainer() {
    }

    public String getMethodKey() {
        return methodKey;
    }

    public void setMethodKey(String methodKey) {
        this.methodKey = methodKey;
    }

    public String getExchangeType() {
        return exchangeType;
    }

    public void setExchangeType(String exchangeType) {
        this.exchangeType = exchangeType;
    }

    public HashMap<Integer, String> getData() {
        return data;
    }

    public void setData(HashMap<Integer, String> data) {
        this.data = data;
    }

    public List<String> getLoopingArrays() {
        return loopingArrays;
    }

    public void setLoopingArrays(List<String> loopingArrays) {
        this.loopingArrays = loopingArrays;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    //#ffffff.(response).id
    //#ffffff.(response).result[]
    //#ffffff.(response).result[index].id
    //#ffffff.(response).result[index] - get data from result where index = to current arr.index
    //#ffffff.(response).arr0[index].arr1[]
    public Object getValue(String value, Map<String, Integer> loopStack){
        String ref = value.replaceFirst("\\$", "");
        String jsonPath = "$";
        String condition = ConditionUtility.getPathToValue(ref);
        String refValue = ConditionUtility.getRefValue(ref);

        List<String> conditionParts =  Arrays.asList(refValue.split("\\."));
        int loopIndex = 0;

        String message = "";
        if (loopingArrays == null || loopingArrays.isEmpty()){
            message = data.get(loopIndex);
        } else {
            String arr = loopingArrays.stream().reduce((f,s)->s).get();
            loopIndex = loopStack.get(arr);
            message = data.get(loopIndex);
        }

        int size = conditionParts.size() - 1;
        int i = 0;
        for (String part : conditionParts){
            if(part.isEmpty()){
                continue;
            }
            condition = condition + "." + part;
            String array = ConditionUtility.getLastArray(condition);// need to find index
            int index = 0;
            boolean hasLoop = false;

            if (loopStack.containsKey(array)){
                hasLoop = true;
                index = loopStack.get(array);
            }

            // TODO added size and index i. for checking is next element after an array
            Pattern pattern = Pattern.compile(RegExpression.arrayWithIndex);
            Matcher m = pattern.matcher(part);
            boolean hasIndex = m.find();
            if ((part.contains("[]") || hasIndex) && hasLoop){
                part = part.replace("[]", ""); // removed [index] and put []
                part = part + "[" + index + "]";
            } else if((part.contains("[]") || part.contains("[*]")) && !hasLoop){
                part = part.replace("[]", "");
                part = part + "[*]";
            }

            jsonPath = jsonPath + "." + part;
            i++;
        }
        return JsonPath.read(message, jsonPath);
    }
}
