package com.becon.opencelium.backend.execution.executor;

import com.becon.opencelium.backend.resource.execution.ExecutionPlanEx;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import java.util.List;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;

class ExecutorServiceTest {
    @Test
    void sequentialExecutionTest() {
        // create execution plan
        ExecutionPlanEx plan = new ExecutionPlanEx();
        plan.setMode("SEQUENTIAL");
        plan.setSteps(List.of("2", "1", "3"));
        plan.setOnError(null);

        FlowchartExecutor exec1 = mock(FlowchartExecutor.class);
        FlowchartExecutor exec2 = mock(FlowchartExecutor.class);
        FlowchartExecutor exec3 = mock(FlowchartExecutor.class);

        // create and submit executors
        ExecutorService service = new ExecutorService(plan);
        service.submit("1", exec1);
        service.submit("2", exec2);
        service.submit("3", exec3);

        // action
        service.execute();

        // verification
        InOrder inOrder = inOrder(exec2, exec1, exec3);
        inOrder.verify(exec2).start();
        inOrder.verify(exec1).start();
        inOrder.verify(exec3).start();
    }
}