package com.becon.opencelium.backend.resource.subs;

import com.becon.opencelium.backend.database.mysql.entity.OperationUsageHistoryDetail;

import java.time.ZoneId;

public class OperationUsageDetailsDto {

    private long id;
    private long startDate;
    private long operationUsage;

    public OperationUsageDetailsDto(OperationUsageHistoryDetail usageHistoryDetail) {
        this.id = usageHistoryDetail.getId();
        this.startDate = usageHistoryDetail.getStartDate().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        this.operationUsage = usageHistoryDetail.getOperationUsage();
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public long getStartDate() {
        return startDate;
    }

    public void setStartDate(long startDate) {
        this.startDate = startDate;
    }

    public long getOperationUsage() {
        return operationUsage;
    }

    public void setOperationUsage(long operationUsage) {
        this.operationUsage = operationUsage;
    }
}
