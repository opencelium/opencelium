package com.becon.opencelium.backend.validation.connection;

import com.becon.opencelium.backend.validation.connection.entity.ErrorMessageData;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class ValidationContext {

    private Map<String, ErrorMessageData> dataMap = new HashMap<>();

    public void put(String connection, ErrorMessageData data){
        dataMap.put(connection, data);
    }

    public void remove(String connection) {
        dataMap.remove(connection);
    }

    public ErrorMessageData get(String connection) {
        return dataMap.get(connection);
    }
}
