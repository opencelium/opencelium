/*
 * // Copyright (C) <2019> <becon GmbH>
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

package com.becon.opencelium.backend.invoker.service;

import com.becon.opencelium.backend.invoker.InvokerContainer;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.resource.connector.InvokerResource;
import com.becon.opencelium.backend.utility.ConditionUtility;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class InvokerServiceImp implements InvokerService{

    @Autowired
    private InvokerContainer invokerContainer;

    @Override
    public Invoker toEntity(InvokerResource resource) {
//        return new Invoker(resource);
        return null;
    }

    @Override
    public InvokerResource toResource(Invoker entity) {
        return new InvokerResource(entity);
    }

    @Override
    public FunctionInvoker getTestFunction(String invokerName) {
        return invokerContainer.getByName(invokerName).getOperations()
                .stream().filter(f -> f.getType().equals("test"))
                .findFirst().orElse(null);
    }

    @Override
    public Invoker findByName(String name) {
        return invokerContainer.getByName(name);
    }

    @Override
    public boolean existsByName(String name) {
        return invokerContainer.existsByName(name);
    }

    @Override
    public List<Invoker> findAll() {
        return new ArrayList<>(invokerContainer.getInvokers().values());
    }

    //TODO: need to add path of field
    @Override
    public String findFieldType(String invokerName, String methodName, String exchangeType, String result, String fieldName) {
        Map<String, Object> body = new HashMap<>();

        if (exchangeType.equals("response") && result.equals("success")){
            body = invokerContainer.getByName(invokerName).getOperations().stream()
                    .filter(o -> o.getName().equals(methodName))
                    .map(o -> o.getResponse().getSuccess().getBody()).findFirst().get();
        } else if (exchangeType.equals("response") && result.equals("fail")){
            body = invokerContainer.getByName(invokerName).getOperations().stream()
                    .filter(o -> o.getName().equals(methodName))
                    .map(o -> o.getResponse().getFail().getBody()).findFirst().get();
        } else if (exchangeType.equals("request")) {
            Invoker invoker = invokerContainer.getByName(invokerName);
            FunctionInvoker functionInvoker = invoker.getOperations().stream()
                    .filter(o -> o.getName().equals(methodName)).findFirst().get();
            body = functionInvoker.getRequest().getBody();
        }

        Object type = findField(fieldName, body);

        if(type instanceof HashMap){
            return "object";
        } else if (type instanceof ArrayList){
            return "array";
        }
        return "string";
    }

    @Override
    public String findFieldByPath(String invokerName, String methodName, String path)  {
        String exchangeType = ConditionUtility.getExchangeType(path);
        String result = ConditionUtility.getResult(path);

        Invoker invoker = findByName(invokerName);
        FunctionInvoker functionInvoker = invoker.getOperations().stream().filter(o -> o.getName().equals(methodName))
                .findFirst().orElseThrow(() -> new RuntimeException("Method not found in invoker"));
        Map<String, Object> body;
        if (exchangeType.equals("response") && result.equals("success")){
            body = functionInvoker.getResponse().getSuccess().getBody();
        } else if (exchangeType.equals("response") && result.equals("fail")){
            body = functionInvoker.getResponse().getFail().getBody();
        } else {
            body = functionInvoker.getRequest().getBody();
        }

        String[] valueParts = ConditionUtility.getRefValue(path).split("\\.");

        Object value = new Object();
        for (String part : valueParts) {
             value = body.get(part);
             if (value instanceof Map){
                 body = ( Map<String, Object>) value;
             }

            if (value instanceof ArrayList){
                body = (( ArrayList<Map<String, Object>>) value).get(0);
            }
        }

        ObjectMapper objectMapper = new ObjectMapper();
        String fieldValue;
        try {
            fieldValue = objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        return fieldValue;
    }

    private Object findField(String field, Map<String, Object> body){
        Map<String, Object> fields = new HashMap<>();

        for (Map.Entry<String, Object> entry : body.entrySet()) {
            String k = entry.getKey();
            Object object = entry.getValue();

            if (k.equals(field)){
                return object;
            }

            if((object instanceof HashMap)){
               return findField(field, (Map<String, Object>) object);
            } else if (object instanceof ArrayList){
               if(!((ArrayList) object).isEmpty() && ((ArrayList) object).get(0) instanceof HashMap){
                    Map<String, Object> subFields = ((ArrayList<Map<String, Object>>) object).get(0);
                    return findField(field, subFields);
                }
            }
        }

        return null;
    }
}