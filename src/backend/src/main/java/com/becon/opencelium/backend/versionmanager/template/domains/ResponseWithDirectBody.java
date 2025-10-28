package com.becon.opencelium.backend.versionmanager.template.domains;

public class ResponseWithDirectBody {
    private String name = "response";
    private ResultWithDirectBody success;
    private ResultWithDirectBody fail;

    public String getName() {
        return name;
    }

    public ResultWithDirectBody getSuccess() {
        return success;
    }

    public void setSuccess(ResultWithDirectBody success) {
        this.success = success;
    }

    public ResultWithDirectBody getFail() {
        return fail;
    }

    public void setFail(ResultWithDirectBody fail) {
        this.fail = fail;
    }
}
