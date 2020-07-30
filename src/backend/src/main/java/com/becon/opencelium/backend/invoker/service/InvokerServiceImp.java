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

package com.becon.opencelium.backend.invoker.service;

import com.becon.opencelium.backend.exception.StorageException;
import com.becon.opencelium.backend.invoker.InvokerContainer;
import com.becon.opencelium.backend.invoker.entity.Body;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.neo4j.entity.BodyNode;
import com.becon.opencelium.backend.resource.connector.InvokerResource;
import com.becon.opencelium.backend.storage.StorageService;
import com.becon.opencelium.backend.utility.ConditionUtility;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

import static java.nio.file.Files.exists;

@Service
public class InvokerServiceImp implements InvokerService{

    @Autowired
    private InvokerContainer invokerContainer;

    @Autowired
    private StorageService storageService;

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

    @Override
    public void delete(String name) {
        invokerContainer.remove(name);
        if(name.equals("")){
            throw new RuntimeException("INVOKER_NOT_FOUND");
        }
        String location = "src/backend/src/main/resources/invoker/";
        Path rootLocation = Paths.get(location);
        try {

            Path file = rootLocation.resolve(name + ".xml");
            if(exists(file)){
                Files.delete(file);
            }
        }
        catch (IOException e){
            throw new StorageException("Failed to delete stored file", e);
        }
    }

    private boolean exists(Path file) {
        File tempFile = new File(file.toString());
        return tempFile.exists();
    }

    //TODO: need to add path of field
    @Override
    public String findFieldType(String invokerName, String methodName, String exchangeType, String result, String fieldName) {
        Body body = null;

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

        Object type = findField(fieldName, body.getFields());

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
        Map<String, Object> fields;
        if (exchangeType.equals("response") && result.equals("success")){
            fields = functionInvoker.getResponse().getSuccess().getBody().getFields();
        } else if (exchangeType.equals("response") && result.equals("fail")){
            fields = functionInvoker.getResponse().getFail().getBody().getFields();
        } else {
            fields = functionInvoker.getRequest().getBody().getFields();
        }

        String[] valueParts = ConditionUtility.getRefValue(path).split("\\.");

        Object value = new Object();
        for (String part : valueParts) {
             value = fields.get(part);
             if (value instanceof Map){
                 fields = ( Map<String, Object>) value;
             }

            if (value instanceof ArrayList){
                fields = (( ArrayList<Map<String, Object>>) value).get(0);
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

        if (body == null) {
            return null;
        }
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