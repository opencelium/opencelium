package com.becon.opencelium.backend.invoker.entity;

import java.util.List;

public class Pagination {

    public Pagination(List<PageParamRule> pageParamRules) {
        this.pageParamRules = pageParamRules;
    }

    private List<PageParamRule> pageParamRules;

    public List<PageParamRule> getPageParams() {
        return pageParamRules;
    }

    public void setPageParams(List<PageParamRule> pageParamRules) {
        this.pageParamRules = pageParamRules;
    }
}
