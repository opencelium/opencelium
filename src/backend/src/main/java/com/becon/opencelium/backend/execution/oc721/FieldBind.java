package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.resource.execution.FieldBindEx;

public class FieldBind {
    private String bindId;
    private Enhancement enhance;

    public static FieldBind fromEx(FieldBindEx fieldBindEx) {
        FieldBind result = new FieldBind();

        result.setBindId(fieldBindEx.getBindId());
        result.setEnhance(Enhancement.fromEx(fieldBindEx.getEnhance()));

        return result;
    }

    public String getBindId() {
        return bindId;
    }

    public void setBindId(String bindId) {
        this.bindId = bindId;
    }

    public Enhancement getEnhance() {
        return enhance;
    }

    public void setEnhance(Enhancement enhance) {
        this.enhance = enhance;
    }
}
