package com.becon.opencelium.backend.database.mongodb.entity;

import org.springframework.data.mongodb.core.mapping.Field;

import java.util.List;

public class FieldBindingMng {
    private String id;
    @Field(name = "enhancement_id")
    private Integer enhancementId;
    private List<LinkedFieldMng> from;
    private EnhancementMng enhancement;
    private List<LinkedFieldMng> to;

    public FieldBindingMng() {
    }

    public List<LinkedFieldMng> getFrom() {
        return from;
    }

    public void setFrom(List<LinkedFieldMng> from) {
        this.from = from;
    }

    public EnhancementMng getEnhancement() {
        return enhancement;
    }

    public void setEnhancement(EnhancementMng enhancement) {
        this.enhancement = enhancement;
    }

    public List<LinkedFieldMng> getTo() {
        return to;
    }

    public void setTo(List<LinkedFieldMng> to) {
        this.to = to;
    }

    public Integer getEnhancementId() {
        return enhancementId;
    }

    public void setEnhancementId(Integer enhancementId) {
        this.enhancementId = enhancementId;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
