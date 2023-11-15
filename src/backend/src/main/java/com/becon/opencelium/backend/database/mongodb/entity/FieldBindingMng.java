package com.becon.opencelium.backend.database.mongodb.entity;

import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.util.List;

@Document(collection = "field_binding")
public class FieldBindingMng {
    @MongoId(targetType = FieldType.OBJECT_ID)
    @Field(name = "field_binding_id")
    private String fieldBindingId;
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

    public String getFieldBindingId() {
        return fieldBindingId;
    }

    public void setFieldBindingId(String fieldBindingId) {
        this.fieldBindingId = fieldBindingId;
    }
}
