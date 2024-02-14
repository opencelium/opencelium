package com.becon.opencelium.backend.invoker.entity;

import com.becon.opencelium.backend.invoker.enums.PageParam;
import com.becon.opencelium.backend.invoker.enums.PageParamAction;

public class PageParamRule {
    private String value;
    private String ref;
    private PageParam param;
    private PageParamAction action;

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getRef() {
        return ref;
    }

    public void setRef(String ref) {
        this.ref = ref;
    }

    public PageParam getParam() {
        return param;
    }

    public void setParam(PageParam param) {
        this.param = param;
    }

    public PageParamAction getAction() {
        return action;
    }

    public void setAction(PageParamAction action) {
        this.action = action;
    }

    @Override
    public String toString() {
        return "PageParamRule{" +
                "value='" + value + '\'' +
                ", ref='" + ref + '\'' +
                ", param=" + param +
                ", action=" + action +
                '}';
    }
}
