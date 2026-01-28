package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;

import java.util.List;

public interface OperatorMngService {
    void validate(OperatorMng operator);

    void validate(List<OperatorMng> operators);

    void deleteAll();
}