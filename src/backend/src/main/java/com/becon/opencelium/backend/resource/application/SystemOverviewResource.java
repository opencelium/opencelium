package com.becon.opencelium.backend.resource.application;

import com.fasterxml.jackson.annotation.JsonInclude;

import javax.annotation.Resource;

@Resource
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SystemOverviewResource {
    private String java;
    private String oc;
    private String neo4j;
    private String kibana;
    private String elasticSearch;
    private String mariadb;

    public String getJava() {
        return java;
    }

    public void setJava(String java) {
        this.java = java;
    }

    public String getOc() {
        return oc;
    }

    public void setOc(String oc) {
        this.oc = oc;
    }

    public String getNeo4j() {
        return neo4j;
    }

    public void setNeo4j(String neo4j) {
        this.neo4j = neo4j;
    }

    public String getKibana() {
        return kibana;
    }

    public void setKibana(String kibana) {
        this.kibana = kibana;
    }

    public String getElasticSearch() {
        return elasticSearch;
    }

    public void setElasticSearch(String elasticSearch) {
        this.elasticSearch = elasticSearch;
    }

    public String getMariadb() {
        return mariadb;
    }

    public void setMariadb(String mariadb) {
        this.mariadb = mariadb;
    }
}
