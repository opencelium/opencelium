package com.becon.opencelium.backend.execution.rdata;

import com.becon.opencelium.backend.mysql.entity.RequestData;

import java.util.Optional;

public interface RequiredDataService {

    Optional<String> getValue(RequestData requestData);
}
