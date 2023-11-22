package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;

import java.util.List;

public interface OperatorMngService {
    List<OperatorMng> saveAll(List<OperatorMng> operators);

    OperatorMng save(OperatorMng operatorMng);
}