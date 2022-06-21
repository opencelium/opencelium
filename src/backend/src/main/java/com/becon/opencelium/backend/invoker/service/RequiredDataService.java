package com.becon.opencelium.backend.invoker.service;

import com.becon.opencelium.backend.invoker.entity.RequiredData;
import com.becon.opencelium.backend.mysql.entity.RequestData;

import java.util.List;

public interface RequiredDataService {

    List<String> extractRefsFromValue(String value);

    String replaceRefValue(String exp);

    RequestData convertToRequestData(RequiredData requiredData);
}
