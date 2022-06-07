package com.becon.opencelium.backend.invoker.service;

import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;

import java.util.List;

public class OperationServiceImp implements OperationService{
    private final List<FunctionInvoker> operations;

    public OperationServiceImp(List<FunctionInvoker> operations) {
        this.operations = operations;
    }
}
