package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.InvokerMng;
import com.becon.opencelium.backend.resource.connector.InvokerDTO;
import org.springframework.stereotype.Service;

public interface InvokerMngService {

    InvokerMng toEntity(InvokerDTO invokerDTO);
}
