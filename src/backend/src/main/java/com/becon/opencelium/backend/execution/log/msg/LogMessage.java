package com.becon.opencelium.backend.execution.log.msg;

import com.becon.opencelium.backend.enums.LogType;

public interface LogMessage {
    <M> void setMessage(M m);
    <M, T extends LogType> void setMessage(M m, T type);
    <T extends LogType> void setType(T type);
}
