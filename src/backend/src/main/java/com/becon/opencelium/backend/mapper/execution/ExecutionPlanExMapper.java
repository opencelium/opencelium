package com.becon.opencelium.backend.mapper.execution;

import com.becon.opencelium.backend.database.mongodb.entity.ExecutionPlanMng;
import com.becon.opencelium.backend.database.mongodb.entity.OnErrorMng;
import com.becon.opencelium.backend.database.mongodb.entity.RetryOnErrorMng;
import com.becon.opencelium.backend.resource.execution.ExecutionPlanEx;
import com.becon.opencelium.backend.resource.execution.OnErrorEx;
import com.becon.opencelium.backend.resource.execution.RetryEx;
import org.springframework.stereotype.Component;

@Component
public class ExecutionPlanExMapper {
    public ExecutionPlanEx toExecutionPlanEx(ExecutionPlanMng executionPlan) {
        if (executionPlan == null) {
            return null;
        }

        ExecutionPlanEx executionPlanEx = new ExecutionPlanEx();
        executionPlanEx.setMode(executionPlan.getMode());
        executionPlanEx.setSteps(executionPlan.getSteps());
        executionPlanEx.setOnError(toOnErrorEx(executionPlan.getOnError()));

        return executionPlanEx;
    }

    private OnErrorEx toOnErrorEx(OnErrorMng onError) {
        if (onError == null) {
            return null;
        }

        OnErrorEx onErrorEx = new OnErrorEx();
        onErrorEx.setStrategy(onError.getStrategy());
        onErrorEx.setRetry(toRetryEx(onError.getRetry()));

        return onErrorEx;
    }

    private RetryEx toRetryEx(RetryOnErrorMng retry) {
        if (retry == null) {
            return null;
        }

        RetryEx retryEx = new RetryEx();
        retryEx.setBackOffMs(retry.getBackoffMs());
        retryEx.setMaxAttempts(retry.getMaxAttempts());

        return retryEx;
    }
}
