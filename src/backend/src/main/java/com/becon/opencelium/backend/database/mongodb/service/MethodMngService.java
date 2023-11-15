package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;

import java.util.List;

public interface MethodMngService {
    List<MethodMng> saveAll(List<MethodMng> methods);
}
