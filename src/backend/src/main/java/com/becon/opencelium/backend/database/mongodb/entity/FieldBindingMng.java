package com.becon.opencelium.backend.database.mongodb.entity;

import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.util.List;

@Document(collection = "field_binding")
public class FieldBindingMng {
    @MongoId(targetType = FieldType.OBJECT_ID)
    private String id;
    @Indexed
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
