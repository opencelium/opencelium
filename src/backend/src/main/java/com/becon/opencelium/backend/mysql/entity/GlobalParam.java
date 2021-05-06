package com.becon.opencelium.backend.mysql.entity;

import com.becon.opencelium.backend.resource.application.GlobalParamResource;
import javax.persistence.*;

@Entity
@Table(name = "global_param")
public class GlobalParam {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id")
    private Integer id;

    @Column(name = "name")
    private String name;

    @Column(name = "value")
    private String value;

    public GlobalParam() {
    }

    public GlobalParam(GlobalParamResource resource) {
        this.id = resource.getGlobalParamId();
        this.name = resource.getName();
        this.value = resource.getValue();
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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
