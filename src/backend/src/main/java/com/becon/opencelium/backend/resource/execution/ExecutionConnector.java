package com.becon.opencelium.backend.resource.execution;

import com.becon.opencelium.backend.invoker.entity.Pagination;

import java.util.Map;

public interface ExecutionConnector {
    Integer getId();
    boolean isSslCert();
    int getTimeout();
    String getInvoker();
    Pagination getPagination();
    Map<String, String> getRequiredData();
}
