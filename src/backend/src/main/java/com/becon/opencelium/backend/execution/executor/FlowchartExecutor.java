package com.becon.opencelium.backend.execution.executor;

import com.becon.opencelium.backend.enums.LogType;
import com.becon.opencelium.backend.enums.RelationalOperator;
import com.becon.opencelium.backend.execution.logger.msg.ConnectorLog;
import com.becon.opencelium.backend.execution.logger.msg.ExecutionLog;
import com.becon.opencelium.backend.execution.logger.msg.MethodData;
import com.becon.opencelium.backend.execution.executor.model.Loop;
import com.becon.opencelium.backend.execution.masking.MaskingService;
import com.becon.opencelium.backend.execution.logger.OcLogger;
import com.becon.opencelium.backend.ocel.ExpressionProcessor;
import com.becon.opencelium.backend.ocel.ExpressionProcessorFactory;
import com.becon.opencelium.backend.ocel.ProcessorType;
import com.becon.opencelium.backend.resource.execution.FlowchartEx;
import com.becon.opencelium.backend.resource.execution.OnErrorEx;
import com.becon.opencelium.backend.resource.execution.OperationDTO;
import com.becon.opencelium.backend.resource.execution.OperatorEx;
import com.becon.opencelium.backend.resource.execution.ProxyEx;
import org.springframework.util.ObjectUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Stack;
import java.util.stream.Collectors;

public class FlowchartExecutor {
    private final ExecutionManager executionManager;
    private final OperationExecutor operationExecutor;
    private final List<Object> executables;
    private final ExpressionProcessor expressionProcessor;
    private final OcLogger<ExecutionLog> logger;
    private final MaskingService masking;

    // log related variables:
    private final String flowId;
    private final int connectorId;
    private final String connectorName;
    private final Stack<String> endPhases = new Stack<>();


    public FlowchartExecutor(
            FlowchartEx flowchart, ExecutionManager executionManager,
            OcLogger<ExecutionLog> logger, MaskingService masking, ProxyEx proxy, OnErrorEx onError
    ) {
        this.executionManager = executionManager;
        this.expressionProcessor = ExpressionProcessorFactory.get(ProcessorType.POSTFIX);
        this.logger = logger;
        this.masking = masking;

        this.operationExecutor = new OperationExecutor(flowchart, executionManager, logger, masking, onError, proxy);

        this.executables = new ArrayList<>();
        if (Objects.nonNull(flowchart.getMethods())) {
            flowchart.getMethods().forEach(o -> {
                o.setInvoker(flowchart.getInvoker().getName());
                executables.add(o);
            });
        }
        this.executables.addAll(Optional.ofNullable(flowchart.getOperators()).orElse(Collections.emptyList()));
        this.executables.sort(getComparator());

        // initialize log related variables:
        this.flowId = flowchart.getFlowId();
        this.connectorId = flowchart.getCtorId();
        this.connectorName = flowchart.getName();
    }

    public void start() {
        logger.getLogEntity().setType(LogType.INFO);
        logger.getLogEntity().setConnector(new ConnectorLog(connectorName, flowId));
        logger.logAndSend(String.format("phase=FLOWCHART_START flowId=%s connectorId=%d connectorName=%s direction=%s", flowId, connectorId, connectorName, flowId));
        endPhases.push(String.format("phase=FLOWCHART_END flowId=%s connectorId=%d connectorName=%s direction=%s", flowId, connectorId, connectorName, flowId));

        try {
            executionManager.setCurrentCtorId(connectorId);

            int headPointer = 0;
            while (headPointer < executables.size()) {
                int tailPointer = getTailPointer(headPointer);

                execute(headPointer, tailPointer);

                headPointer = tailPointer + 1;
            }
        } catch (RuntimeException e) {
            logger.logAndSend(e);
            throw e;
        } finally {
            while (!endPhases.isEmpty()) {
                logger.logAndSend(endPhases.pop());
            }
        }
    }

    private void execute(int headPointer, int tailPointer) {
        if (headPointer > tailPointer) {
            return;
        }

        // points to the end of the operator body
        int tail = getTailPointer(headPointer);
        String index = getIndex(executables.get(headPointer));

        if (executables.get(headPointer) instanceof OperationDTO operation) {
            logger.getLogEntity().setMethodData(new MethodData(operation.getOperationId()));
            logger.logAndSend(String.format("phase=OPERATION_START indexPath=%s name=\"%s\" %s", index, operation.getName(), getLoopData()));
            endPhases.push(String.format("phase=OPERATION_END indexPath=%s name=\"%s\" %s", index, operation.getName(), getLoopData()));

            operationExecutor.execute(operation);

            logger.logAndSend(endPhases.pop());
            logger.getLogEntity().setMethodData(null);
        } else if (executables.get(headPointer) instanceof OperatorEx operator) {
            if (Objects.equals(operator.getType(), "if")) {
                logger.logAndSend(String.format("phase=IF_START indexPath=%s expression=(%s) %s", index, operator.getExpression(), getLoopData()));
                endPhases.push(String.format("phase=IF_END indexPath=%s %s", index, getLoopData()));

                boolean result;
                try {
                    result = (Boolean) expressionProcessor.evaluate(
                            operator.getExpression(),
                            executionManager::getValue,
                            logger,
                            masking
                    );

                    logger.logAndSend("segment=IF_RESULT data=" + result);
                } catch (RuntimeException e) {
                    logger.logAndSend("segment=IF_RESULT data=unknown");
                    throw e;
                }

                if (result) {
                    // if result is true, then execute if operators' body
                    execute(headPointer + 1, tail);
                }
                logger.logAndSend(endPhases.pop());
            } else {
                Loop loop = Loop.fromEx(operator);
                Object referencedList = executionManager.getValue(loop.getRef());
                List<String> list = new ArrayList<>();

                if (ObjectUtils.isEmpty(referencedList)) {
                    // if list empty just do nothing
                } else if (loop.getOperator() == RelationalOperator.FOR) {
                    int length = ((List<Object>) referencedList).size();

                    for (int i = 0; i < length; i++) {
                        list.add(String.valueOf(i));
                    }

                } else if (loop.getOperator() == RelationalOperator.FOR_IN) {
                    list = (List<String>) referencedList;
                } else {
                    String[] strs = ((String) referencedList).split(loop.getDelimiter());

                    Collections.addAll(list, strs);
                }

                int length = list.size();

                logger.logAndSend(String.format("phase=LOOP_START indexPath=%s expression=(%s) size=%d iterator=\"%s\" %s", index, loop.getRef(), length, loop.getIterator(), getLoopData()));
                logger.logAndSend(String.format("segment=LOOP_REF ref=(%s) data=%s", loop.getRef(), list.stream().collect(Collectors.joining(", ", "[", "]"))));
                endPhases.push(String.format("phase=LOOP_END indexPath=%s %s", index, getLoopData()));

                executionManager.getLoops().add(loop);
                for (int i = 0; i < length; i++) {
                    // update currently executing loops' data
                    loop.setIndex(i);
                    loop.setValue(list.get(i));

                    // if length !=0, then execute loop operators' body
                    execute(headPointer + 1, tail);
                }

                // remove executed loops' data
                executionManager.getLoops().remove(loop);
                logger.logAndSend(endPhases.pop());
            }
        } else {
            throw new IllegalArgumentException("Unsupported type: " + executables.get(headPointer).getClass());
        }

        // we already executed operations'/operators' body, now start executing next body
        execute(tail + 1, tailPointer);
    }

    private int getTailPointer(int headPointer) {
        String index = getIndex(executables.get(headPointer)) + "_";

        for (headPointer++; headPointer < executables.size(); headPointer++) {
            if (!getIndex(executables.get(headPointer)).startsWith(index)) {
                break;
            }
        }

        return headPointer - 1;
    }

    public String getLoopData() {
        List<Loop> loops = executionManager.getLoops();
        if (loops.isEmpty()) {
            return "";
        }

        // loopIterator="i,j" loopIndex="0,1"
        String loopIterator = loops.stream()
                .map(Loop::getIterator)
                .collect(Collectors.joining(","));

        String loopIndex = loops.stream()
                .map(loop -> String.valueOf(loop.getIndex()))
                .collect(Collectors.joining(","));

        return String.format("loopIterator=\"%s\" loopIndex=\"%s\"", loopIterator, loopIndex);
    }

    private static Comparator<Object> getComparator() {
        return (o1, o2) -> {
            String[] arr1 = getIndex(o1).split("_");
            String[] arr2 = getIndex(o2).split("_");

            for (int i = 0; i < arr1.length && i < arr2.length; i++) {
                // skip equal elements until there is a difference found
                if (Objects.equals(arr1[i], arr2[i])) continue;

                // if there is an unequal elements then return their difference
                return Integer.parseInt(arr1[i]) - Integer.parseInt(arr2[i]);
            }

            // at this point one array contains the other one
            // so array with greater length is greater
            return arr1.length - arr2.length;
        };
    }

    private static String getIndex(Object o) {
        if (o instanceof OperationDTO) {
            return ((OperationDTO) o).getExecOrder();
        } else if (o instanceof OperatorEx) {
            return ((OperatorEx) o).getIndex();
        } else {
            throw new RuntimeException("getIndex() is only applicable to OperationDTO and OperatorEX");
        }
    }
}
