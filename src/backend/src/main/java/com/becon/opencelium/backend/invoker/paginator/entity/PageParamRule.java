package com.becon.opencelium.backend.invoker.paginator.entity;

import com.becon.opencelium.backend.invoker.paginator.enums.PageParam;
import com.becon.opencelium.backend.invoker.paginator.enums.PageParamAction;

import java.util.function.Function;

public class PageParamRule implements Cloneable {
    private String value;
    private String ref;
    private PageParam param;
    private PageParamAction action;

    public PageParamRule() {
    }

    public PageParamRule(String value, String ref, PageParam param, PageParamAction action) {
        this.value = value;
        this.ref = ref;
        this.param = param;
        this.action = action;
    }

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

    public String getRefSuffix() {
        return parseRef(index -> ref.substring(index + 3));
    }

    public String getRefPath() {
        return parseRef(index -> ref.substring(index + 1));
    }

    public String getRefPrefix() {
        return parseRef(index -> ref.substring(0, index));
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

    @Override
    public PageParamRule clone() {
        PageParamRule clone;
        try {
            clone = (PageParamRule) super.clone();
        } catch (CloneNotSupportedException e) {
            clone = new PageParamRule(this.getValue(), this.getRef(), this.getParam(), this.getAction());
        }
        return clone;
    }

    private String parseRef(Function<Integer, String> function){
        if (ref == null || ref.isEmpty()) {
            return "";
        }
        int index = ref.indexOf(".$");
        if (index != -1) {
            return function.apply(index);
        } else {
            return "";
        }
    }
}
