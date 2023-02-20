package com.becon.opencelium.backend.execution.socket.msg;

import java.util.List;

public class SocketLogMessage {
    private String message;
    private String type;
    private String index; // order of execution
    private String connectorDir; // data flow direction from connector or to connector;
    private MethodData methodData;
    private OperatorData operatorData;
    private List<String> stackTrace; // exception stacktrace

    public SocketLogMessage() {
    }

    public SocketLogMessage(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<String> getStackTrace() {
        return stackTrace;
    }

    public void setStackTrace(List<String> stackTrace) {
        this.stackTrace = stackTrace;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getIndex() {
        return index;
    }

    public void setIndex(String index) {
        this.index = index;
    }

    public String getConnectorDir() {
        return connectorDir;
    }

    public void setConnectorDir(String connectorDir) {
        this.connectorDir = connectorDir;
    }

    public MethodData getMethodData() {
        return methodData;
    }

    public void setMethodData(MethodData methodData) {
        this.methodData = methodData;
    }

    public OperatorData getOperatorData() {
        return operatorData;
    }

    public void setOperatorData(OperatorData operatorData) {
        this.operatorData = operatorData;
    }
}
