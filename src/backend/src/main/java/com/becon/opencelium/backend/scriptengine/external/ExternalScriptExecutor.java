package com.becon.opencelium.backend.scriptengine.external;

public interface ExternalScriptExecutor<T> {
    Object execute(T input);

    boolean isUp();
}