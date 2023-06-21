package com.becon.opencelium.backend.execution.log.msg;

import com.becon.opencelium.backend.enums.LogType;

import java.util.List;
import java.util.stream.Stream;

public class ExecutionLog implements LogMessage {
    private String message;
    private LogType type = LogType.INFO; // error, info, warning
    private List<String> stackTrace; // exception stacktrace
    private MethodData methodData;
//    private String index; // order of execution
    private ConnectorLog connector; // data flow direction from connector or to connector;
//    private OperatorData operatorData;


    public ExecutionLog() {
    }

    public ExecutionLog(String message) {
        this.message = message;
    }

    public ExecutionLog(Exception e) {
        this.message = e.getMessage();
        this.stackTrace = Stream.of(e.getStackTrace()).map(StackTraceElement::toString).toList();
    }

    public String getMessage() {
        return message;
    }

    @Override
    public <M> void setMessage(M m) {
        if (m instanceof Exception) {
            this.message = ((Exception) m).getMessage();
            this.stackTrace = Stream.of(((Exception) m).getStackTrace()).map(StackTraceElement::toString).toList();
        } else if(m == null) {
            this.message = "";
        } else {
            this.message = m.toString();
        }
    }

    @Override
    public <M, T extends LogType> void setMessage(M m, T type) {
        this.type = type;
        setMessage(m);
    }

    public List<String> getStackTrace() {
        return stackTrace;
    }

    public void setStackTrace(List<String> stackTrace) {
        this.stackTrace = stackTrace;
    }

    public LogType getType() {
        return type;
    }

    @Override
    public <T extends LogType> void setType(T type) {
        this.type = type;
    }

    public MethodData getMethodData() {
        return methodData;
    }

    public void setMethodData(MethodData methodData) {
        this.methodData = methodData;
    }
//
//    public String getIndex() {
//        return index;
//    }
//
//    public void setIndex(String index) {
//        this.index = index;
//    }

    public ConnectorLog getConnector() {
        return connector;
    }

    public void setConnector(ConnectorLog connector) {
        this.connector = connector;
    }
//
//
//    public OperatorData getOperatorData() {
//        return operatorData;
//    }
//
//    public void setOperatorData(OperatorData operatorData) {
//        this.operatorData = operatorData;
//    }
}
