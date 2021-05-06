package com.becon.opencelium.backend.resource.application;

import com.becon.opencelium.backend.mysql.entity.GlobalParam;

import javax.annotation.Resource;

@Resource
public class GlobalParamResource {

    private Integer globalParamId;
    private String name;
    private String value;

    public GlobalParamResource() {
    }

    public GlobalParamResource(GlobalParam globalParam) {
        this.globalParamId = globalParam.getId();
        this.name = globalParam.getName();
        this.value = globalParam.getValue();
    }

    public Integer getGlobalParamId() {
        return globalParamId;
    }

    public void setGlobalParamId(Integer globalParamId) {
        this.globalParamId = globalParamId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
